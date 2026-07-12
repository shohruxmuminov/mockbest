/**
 * Database Selector
 * 
 * Provides a unified API that routes can use regardless of whether PostgreSQL
 * or Firestore is configured. Simply import this module and use the same
 * function signatures as server/db.js, and the selector will delegate to
 * the appropriate backend automatically based on config.useFirestore.
 */

import config from './config.js';
import * as pgDb from './db.js';
import * as fsDb from './firestore-db.js';

/**
 * Determine which database backend is active.
 */
function backend() {
  return config.useFirestore ? fsDb : pgDb;
}

/**
 * Execute a query against the active database backend.
 * 
 * PostgreSQL:  query(sql, params)
 * Firestore:   query(collectionName, options)
 * 
 * For cross-backend compatibility, route files should pass an options object
 * that both backends can interpret meaningfully.
 * 
 * If using PostgreSQL, pass [sql, params] as the first argument.
 * If using Firestore, pass [collectionName, { where, orderBy, ... }].
 * 
 * @param {Array} args - Arguments to forward to the backend.
 * @returns {Promise<Array>} Array of result rows/documents.
 */
export async function query(...args) {
  const db = backend();
  return db.query(...args);
}

/**
 * Get a single row/document.
 * 
 * PostgreSQL:  one(sql, params)
 * Firestore:   one(collectionName, conditions)
 * 
 * @param {Array} args - Arguments to forward.
 * @returns {Promise<object|null>} Single result or null.
 */
export async function one(...args) {
  const db = backend();
  if (config.useFirestore) {
    // Firestore: one(collectionName, conditionsObject)
    return db.one(...args);
  }
  // PostgreSQL: one(sqlText, paramsArray)
  return db.one(...args);
}

/**
 * Get many rows/documents (alias for query).
 * @param {Array} args 
 * @returns {Promise<Array>}
 */
export async function many(...args) {
  const db = backend();
  return db.many(...args);
}

/**
 * Create a new record.
 * 
 * PostgreSQL:  Uses INSERT via db.query()
 * Firestore:   create(collectionName, data, docId?)
 * 
 * @param {string} collectionOrTable - Collection/table name.
 * @param {object} data - Data to insert.
 * @param {string} [docId] - Optional document ID (Firestore only).
 * @returns {Promise<object>} Created record.
 */
export async function create(collectionOrTable, data, docId = null) {
  if (config.useFirestore) {
    return fsDb.create(collectionOrTable, data, docId);
  }
  // PostgreSQL: Build a dynamic INSERT query
  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
  const columns = keys.map(k => `"${k}"`).join(', ');
  const sql = `INSERT INTO "${collectionOrTable}" (${columns}) VALUES (${placeholders}) RETURNING *`;
  const rows = await pgDb.query(sql, values);
  return rows[0] || null;
}

/**
 * Update a record.
 * 
 * PostgreSQL:  Uses UPDATE via db.query()
 * Firestore:   update(collectionName, docId, data)
 * 
 * @param {string} collectionOrTable - Collection/table name.
 * @param {string|number} id - Document ID (Firestore) or row ID (PostgreSQL).
 * @param {object} data - Fields to update.
 * @returns {Promise<object>} Updated record.
 */
export async function update(collectionOrTable, id, data) {
  if (config.useFirestore) {
    return fsDb.update(collectionOrTable, id, data);
  }
  // PostgreSQL: Build a dynamic UPDATE query
  const keys = Object.keys(data);
  const values = Object.values(data);
  const setClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
  const sql = `UPDATE "${collectionOrTable}" SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`;
  const rows = await pgDb.query(sql, [...values, id]);
  return rows[0] || null;
}

/**
 * Delete a record.
 * 
 * PostgreSQL:  DELETE via db.query()
 * Firestore:   remove(collectionName, docId)
 * 
 * @param {string} collectionOrTable - Collection/table name.
 * @param {string|number} id - Document/row ID.
 * @returns {Promise<void>}
 */
export async function remove(collectionOrTable, id) {
  if (config.useFirestore) {
    return fsDb.remove(collectionOrTable, id);
  }
  const sql = `DELETE FROM "${collectionOrTable}" WHERE id = $1`;
  await pgDb.query(sql, [id]);
}

/**
 * Health check for the active database backend.
 * @returns {Promise<object>}
 */
export async function healthCheck() {
  const db = backend();
  return db.healthCheck();
}

/**
 * Initialize the active database backend (create schema/collections).
 * @returns {Promise<boolean>}
 */
export async function initDb() {
  const db = backend();
  return db.initDb();
}

export default {
  query,
  one,
  many,
  create,
  update,
  remove,
  healthCheck,
  initDb,
};