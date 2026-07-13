/**
 * Database Selector — Unified SQL-to-Firestore Bridge
 *
 * Provides the same `query(sql, params)` / `one(sql, params)` API that all route
 * files expect. When USE_FIRESTORE=true, incoming SQL is parsed and translated
 * into Firestore operations. When USE_FIRESTORE=false, calls are passed through
 * to the PostgreSQL backend (db.js).
 *
 * Usage (in route files):
 *   import { query, one } from '../db-selector.js';
 */

import config from './config.js';
import * as pgDb from './db.js';
import * as fsDb from './firestore-db.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function extractTable(sql) {
  const m = sql.match(/(?:FROM|INTO|UPDATE)\s+"?(\w+)"?/i);
  return m ? m[1].toLowerCase() : null;
}

function isSelect(sql)   { return /^\s*SELECT\b/i.test(sql); }
function isInsert(sql)   { return /^\s*INSERT\b/i.test(sql); }
function isUpdate(sql)   { return /^\s*UPDATE\b/i.test(sql); }
function isDelete(sql)   { return /^\s*DELETE\b/i.test(sql); }
function isUpsert(sql)   { return /\bON\s+CONFLICT\b/i.test(sql); }
function isJoin(sql)     { return /\bJOIN\b/i.test(sql); }
function isExists(sql)   { return /^\s*SELECT\s+1\b/i.test(sql); }
function isAggregate(sql){ return /COALESCE\s*\(\s*MAX\s*\(/i.test(sql); }
function hasIlike(sql)   { return /\bILIKE\b/i.test(sql); }
function hasInterval(sql){ return /\bINTERVAL\b/i.test(sql); }

function extractReturning(sql) {
  const m = sql.match(/RETURNING\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

function extractInsertCols(sql) {
  const m = sql.match(/INSERT\s+INTO\s+"?\w+"?\s*\(([^)]+)\)/i);
  if (!m) return [];
  return m[1].split(',').map(c => c.trim().replace(/"/g, '')).filter(Boolean);
}

function extractValuesParams(sql) {
  const m = sql.match(/VALUES\s*\(([^)]+)\)/i);
  if (!m) return [];
  return m[1].split(',').map(v => v.trim()).filter(v => /^\$\d+$/.test(v)).map(v => parseInt(v.slice(1), 10));
}

function extractSetClause(sql) {
  const result = {};
  const m = sql.match(/SET\s+(.+?)(?:WHERE|RETURNING|$)/i);
  if (!m) return result;
  m[1].split(',').map(a => a.trim()).forEach(a => {
    const p = a.match(/"(\w+)"\s*=\s*\$(\d+)/);
    if (p) result[p[1]] = parseInt(p[2], 10);
  });
  return result;
}

function extractWhere(sql) {
  const result = {};
  const m = sql.match(/WHERE\s+(.+?)(?:ORDER\s+BY|LIMIT|RETURNING|$)/i);
  if (!m) return result;
  m[1].split(/\s+AND\s+/i).forEach(c => {
    const p = c.match(/"(\w+)"\s*=\s*\$(\d+)/);
    if (p) result[p[1]] = parseInt(p[2], 10);
  });
  return result;
}

function extractOrderBy(sql) {
  const m = sql.match(/ORDER\s+BY\s+"?(\w+)"?(?:\s+(ASC|DESC))?/i);
  return m ? { field: m[1], dir: (m[2] && m[2].toLowerCase() === 'desc' ? 'desc' : 'asc') } : null;
}

function extractLimit(sql) {
  const m = sql.match(/LIMIT\s+(\d+)/i);
  return m ? parseInt(m[1], 10) : null;
}

function getParams(params, indices) {
  const data = {};
  for (const [col, idx] of Object.entries(indices)) {
    data[col] = params[idx - 1];
  }
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Firestore SQL executor
// ─────────────────────────────────────────────────────────────────────────────

async function firestoreQuery(sql, params = []) {
  const table = extractTable(sql);
  if (!table) throw new Error(`[db-selector] Could not extract table from SQL: ${sql}`);

  // ---------- INSERT (with optional ON CONFLICT upsert) ----------
  if (isInsert(sql)) {
    const cols = extractInsertCols(sql);
    const valParams = extractValuesParams(sql);
    const data = {};
    valParams.forEach((pIdx, i) => {
      if (cols[i]) {
        const val = params[pIdx - 1];
        // Handle SQL expressions like 'now()' passed as string literals
        data[cols[i]] = val;
      }
    });

    let result;
    if (isUpsert(sql)) {
      // UPSERT: try to find existing document by (candidate_id, mock_test_id, section)
      const candId = data.candidate_id;
      const testId = data.mock_test_id;
      const section = data.section;
      let existing = null;
      if (candId && testId && section) {
        existing = await fsDb.one(table, { candidate_id: candId, mock_test_id: testId, section });
      }
      if (existing) {
        // Update existing
        data.submitted_at = new Date().toISOString();
        result = await fsDb.update(table, existing.id, data);
      } else {
        data.submitted_at = new Date().toISOString();
        result = await fsDb.create(table, data);
      }
    } else {
      // Regular INSERT
      result = await fsDb.create(table, data);
    }

    const returning = extractReturning(sql);
    if (returning === '*') return [result];
    return [{ id: result?.id || 'new' }];
  }

  // ---------- DELETE ----------
  if (isDelete(sql)) {
    const whereCols = extractWhere(sql);
    const where = getParams(whereCols, params);
    const idVal = where.id;
    if (idVal !== undefined) {
      await fsDb.remove(table, String(idVal));
      return extractReturning(sql) ? [{ id: idVal }] : [];
    }
    // Delete by other conditions
    const docs = await fsDb.query(table);
    const toDelete = docs.filter(d => {
      return Object.entries(where).every(([k, v]) => d[k] === v);
    });
    for (const d of toDelete) {
      await fsDb.remove(table, d.id);
    }
    return toDelete;
  }

  // ---------- UPDATE ----------
  if (isUpdate(sql)) {
    const setCols = extractSetClause(sql);
    const whereCols = extractWhere(sql);
    const data = getParams(setCols, params);
    const where = getParams(whereCols, params);

    // Replace SQL expressions with real values
    for (const [key, val] of Object.entries(data)) {
      if (typeof val === 'string') {
        if (val === 'TRUE') data[key] = true;
        else if (val === 'FALSE') data[key] = false;
      }
    }

    if (where.id !== undefined) {
      const updated = await fsDb.update(table, String(where.id), data);
      return extractReturning(sql) === '*' ? [updated] : [updated];
    }

    // Multi-row update by candidate_id
    const condKey = Object.keys(where)[0];
    const condVal = Object.values(where)[0];
    if (condKey) {
      const docs = await fsDb.query(table, { where: { field: condKey, operator: '==', value: condVal } });
      const results = [];
      for (const doc of docs) {
        results.push(await fsDb.update(table, doc.id, data));
      }
      return results;
    }
    return [];
  }

  // ---------- SELECT ----------
  if (isSelect(sql)) {
    // Aggregate: COALESCE(MAX(order_index), 0)
    if (isAggregate(sql)) {
      const all = await fsDb.query(table);
      let maxVal = 0;
      for (const d of all) {
        if (typeof d.order_index === 'number' && d.order_index > maxVal) maxVal = d.order_index;
      }
      return [{ m: maxVal }];
    }

    // JOIN query
    if (isJoin(sql)) {
      return await firestoreJoin(sql, params, table);
    }

    const whereCols = extractWhere(sql);
    const where = getParams(whereCols, params);
    const orderBy = extractOrderBy(sql);
    const limit = extractLimit(sql);
    const orderField = orderBy ? orderBy.field.replace(/^s\./, '').replace(/^e\./, '').replace(/^c\./, '').replace(/^w\./, '').replace(/^m\./, '') : null;

    // ILIKE search not supported in Firestore – return all and filter in JS
    if (hasIlike(sql)) {
      const all = await fsDb.query(table);
      let filtered = all;
      const searchVal = params[0]; // Usually $1 for ILIKE
      if (searchVal && typeof searchVal === 'string') {
        const pattern = searchVal.replace(/%/g, '').toLowerCase();
        filtered = all.filter(d =>
          (d.full_name && d.full_name.toLowerCase().includes(pattern)) ||
          (d.code && d.code.toLowerCase().includes(pattern))
        );
      }
      // Sort
      if (orderField) {
        filtered.sort((a, b) => {
          const av = a[orderField], bv = b[orderField];
          if (av < bv) return orderBy.dir === 'desc' ? 1 : -1;
          if (av > bv) return orderBy.dir === 'desc' ? -1 : 1;
          return 0;
        });
      }
      if (limit) filtered = filtered.slice(0, limit);
      return filtered;
    }

    // Existence check: SELECT 1 FROM ...
    if (isExists(sql)) {
      const keys = Object.keys(where);
      if (keys.length > 0) {
        if (keys.length === 1) {
          const docs = await fsDb.query(table, { where: { field: keys[0], operator: '==', value: where[keys[0]] } });
          return docs.length > 0 ? [{ '?column?': 1 }] : [];
        }
        const doc = await fsDb.one(table, where);
        return doc ? [{ '?column?': 1 }] : [];
      }
      const all = await fsDb.query(table);
      return all.length > 0 ? [{ '?column?': 1 }] : [];
    }

    // Time-based queries (presence heartbeat, alerts)
    if (hasInterval(sql)) {
      const all = await fsDb.query(table);
      // Filter by time if we have a last_seen or created_at field
      const now = Date.now();
      const intervalMs = 15000; // 15 seconds default
      const filtered = all.filter(d => {
        if (d.last_seen) {
          const ts = typeof d.last_seen === 'string' ? new Date(d.last_seen).getTime() : d.last_seen.toMillis?.() || d.last_seen;
          return (now - ts) <= intervalMs;
        }
        if (d.created_at) {
          const ts = typeof d.created_at === 'string' ? new Date(d.created_at).getTime() : d.created_at.toMillis?.() || d.created_at;
          if (sql.includes('15 minutes')) return (now - ts) <= 15 * 60 * 1000;
          return (now - ts) <= intervalMs;
        }
        return true;
      });
      if (orderField) {
        filtered.sort((a, b) => {
          const av = a[orderField], bv = b[orderField];
          if (av < bv) return orderBy.dir === 'desc' ? 1 : -1;
          if (av > bv) return orderBy.dir === 'desc' ? -1 : 1;
          return 0;
        });
      }
      if (limit) return filtered.slice(0, limit);
      return filtered;
    }

    // Normal SELECT with WHERE
    const keys = Object.keys(where);
    if (keys.length === 1) {
      const [col] = keys;
      const val = where[col];
      const opts = { where: { field: col, operator: '==', value: val } };
      if (orderField) { opts.orderBy = orderField; opts.orderDir = orderBy.dir; }
      if (limit) opts.limit = limit;
      return await fsDb.query(table, opts);
    }

    if (keys.length > 1) {
      const doc = await fsDb.one(table, where);
      if (limit === 1) return doc ? [doc] : [];
      return doc ? [doc] : [];
    }

    // No WHERE – return all with optional order/limit
    const opts = {};
    if (orderField) { opts.orderBy = orderField; opts.orderDir = orderBy.dir; }
    if (limit) opts.limit = limit;
    return await fsDb.query(table, opts);
  }

  throw new Error(`[db-selector] Unsupported SQL: ${sql}`);
}

/**
 * Execute a JOIN query by running separate Firestore queries and merging.
 */
async function firestoreJoin(sql, params, primaryTable) {
  // Collect tables
  const tables = [];
  const tMatches = sql.matchAll(/(?:FROM|JOIN)\s+"?(\w+)"?/gi);
  for (const m of tMatches) {
    if (!tables.includes(m[1].toLowerCase())) tables.push(m[1].toLowerCase());
  }

  // Determine which table is joined
  const joinedTable = tables.find(t => t !== primaryTable);
  const where = extractWhere(sql);
  const orderBy = extractOrderBy(sql);
  const limit = extractLimit(sql);
  const orderField = orderBy ? orderBy.field.replace(/^s\./, '').replace(/^e\./, '').replace(/^c\./, '').replace(/^w\./, '').replace(/^m\./, '') : null;

  // Get primary docs
  let primaryDocs = [];
  const whereKeys = Object.keys(where);
  if (whereKeys.length > 0) {
    const [col] = whereKeys;
    const val = params[where[col] - 1];
    if (whereKeys.length === 1) {
      primaryDocs = await fsDb.query(primaryTable, { where: { field: col, operator: '==', value: val } });
    } else {
      const conds = {};
      for (const [k, idx] of Object.entries(where)) conds[k] = params[idx - 1];
      const doc = await fsDb.one(primaryTable, conds);
      primaryDocs = doc ? [doc] : [];
    }
  } else {
    const opts = {};
    if (orderField) opts.orderBy = orderField;
    if (limit) opts.limit = limit;
    primaryDocs = await fsDb.query(primaryTable, opts);
  }

  // Merge joined data
  if (joinedTable && primaryDocs.length > 0) {
    for (const doc of primaryDocs) {
      // Find the foreign key: e.g. candidate_id → candidates, mock_test_id → mock_tests
      const joinKey = Object.keys(doc).find(k => k.endsWith('_id') && k.replace('_id', '') === joinedTable.replace(/s$/, ''));
      const fkValue = doc[joinKey] || doc.id;
      if (fkValue) {
        const joinDocs = await fsDb.query(joinedTable, { where: { field: 'id', operator: '==', value: String(fkValue) } });
        if (joinDocs.length > 0) {
          for (const [key, val] of Object.entries(joinDocs[0])) {
            if (key !== 'id' && key !== 'created_at' && key !== 'updated_at') {
              doc[`${joinedTable.replace(/s$/, '')}_${key}`] = val;
            }
          }
        }
      }
    }
  }

  return primaryDocs;
}

// ─────────────────────────────────────────────────────────────────────────────
// Exported API (same shape as db.js)
// ─────────────────────────────────────────────────────────────────────────────

export async function query(sqlOrCollection, paramsOrOptions) {
  if (config.useFirestore) {
    if (typeof sqlOrCollection === 'string') {
      const p = Array.isArray(paramsOrOptions) ? paramsOrOptions : [];
      return firestoreQuery(sqlOrCollection, p);
    }
    return fsDb.query(sqlOrCollection, paramsOrOptions || {});
  }
  return pgDb.query(sqlOrCollection, paramsOrOptions);
}

export async function one(sqlOrCollection, paramsOrOptions) {
  if (config.useFirestore) {
    if (typeof sqlOrCollection === 'string') {
      const rows = await query(sqlOrCollection, paramsOrOptions);
      return rows[0] || null;
    }
    if (typeof paramsOrOptions === 'object' && !Array.isArray(paramsOrOptions)) {
      return fsDb.one(sqlOrCollection, paramsOrOptions);
    }
    return fsDb.one(sqlOrCollection, {});
  }
  return pgDb.one(sqlOrCollection, paramsOrOptions);
}

export async function many(sqlOrCollection, paramsOrOptions) {
  return query(sqlOrCollection, paramsOrOptions);
}

export async function create(collectionOrTable, data, docId = null) {
  if (config.useFirestore) return fsDb.create(collectionOrTable, data, docId);
  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
  const columns = keys.map(k => `"${k}"`).join(', ');
  const sql = `INSERT INTO "${collectionOrTable}" (${columns}) VALUES (${placeholders}) RETURNING *`;
  const rows = await pgDb.query(sql, values);
  return rows[0] || null;
}

export async function update(collectionOrTable, id, data) {
  if (config.useFirestore) return fsDb.update(collectionOrTable, id, data);
  const keys = Object.keys(data);
  const values = Object.values(data);
  const setClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
  const sql = `UPDATE "${collectionOrTable}" SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`;
  const rows = await pgDb.query(sql, [...values, id]);
  return rows[0] || null;
}

export async function remove(collectionOrTable, id) {
  if (config.useFirestore) return fsDb.remove(collectionOrTable, id);
  const sql = `DELETE FROM "${collectionOrTable}" WHERE id = $1`;
  await pgDb.query(sql, [id]);
}

export async function healthCheck() {
  if (config.useFirestore) return fsDb.healthCheck();
  return pgDb.healthCheck();
}

export async function initDb() {
  if (config.useFirestore) return fsDb.initDb();
  return pgDb.initDb();
}

export default {
  query, one, many, create, update, remove, healthCheck, initDb,
};