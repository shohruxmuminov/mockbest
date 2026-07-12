import admin from 'firebase-admin';
import { getFirestore } from './firebase.js';

/**
 * Firestore Database Wrapper
 * 
 * Provides a similar API to server/db.js (query, one, many) but uses Firestore
 * as the backend. Collections mirror the PostgreSQL tables:
 *   - candidates
 *   - mock_tests
 *   - answer_sheets
 *   - writing_uploads
 *   - files
 *   - presence
 *   - signals
 *   - monitoring_events
 */

// ─────────────────────────────────────────────────────────────────────────────
// Low-level helpers
// ─────────────────────────────────────────────────────────────────────────────

function db() {
  return getFirestore();
}

/**
 * Convert a Firestore document snapshot to a plain object with an `id` field.
 */
function docToObj(doc) {
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

/**
 * Convert a Firestore query snapshot to an array of plain objects.
 */
function snapshotToArray(snapshot) {
  if (snapshot.empty) return [];
  return snapshot.docs.map(docToObj);
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API (mirrors server/db.js)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Execute a query against a Firestore collection.
 * 
 * @param {string} collectionName - The Firestore collection name.
 * @param {object} options - Query options.
 * @param {object} options.where - Filter conditions: { field, operator, value }.
 * @param {string} options.orderBy - Field to order by.
 * @param {'asc'|'desc'} options.orderDir - Sort direction.
 * @param {number} options.limit - Maximum number of documents to return.
 * @param {number} options.offset - Number of documents to skip.
 * @returns {Promise<Array>} Array of document objects.
 */
export async function query(collectionName, options = {}) {
  try {
    let ref = db().collection(collectionName);

    // Apply where filter
    if (options.where) {
      const { field, operator = '==', value } = options.where;
      ref = ref.where(field, operator, value);
    }

    // Apply ordering
    if (options.orderBy) {
      ref = ref.orderBy(options.orderBy, options.orderDir || 'asc');
    }

    // Apply limit
    if (options.limit) {
      ref = ref.limit(options.limit);
    }

    // Apply offset
    if (options.offset) {
      ref = ref.offset(options.offset);
    }

    const snapshot = await ref.get();
    return snapshotToArray(snapshot);
  } catch (err) {
    console.error(`Firestore query error (${collectionName}):`, err.message);
    throw err;
  }
}

/**
 * Get a single document by ID.
 * 
 * @param {string} collectionName - The Firestore collection name.
 * @param {string} docId - The document ID.
 * @returns {Promise<object|null>} Document object or null.
 */
export async function getById(collectionName, docId) {
  try {
    const doc = await db().collection(collectionName).doc(docId).get();
    return docToObj(doc);
  } catch (err) {
    console.error(`Firestore getById error (${collectionName}):`, err.message);
    throw err;
  }
}

/**
 * Find a single document matching conditions (equivalent to SQL "one").
 * 
 * @param {string} collectionName - The Firestore collection name.
 * @param {object} conditions - Key-value pairs to match (AND logic).
 * @returns {Promise<object|null>} First matching document or null.
 */
export async function one(collectionName, conditions = {}) {
  try {
    let ref = db().collection(collectionName);

    // Apply all conditions as equality filters
    const entries = Object.entries(conditions);
    for (const [field, value] of entries) {
      ref = ref.where(field, '==', value);
    }

    const snapshot = await ref.limit(1).get();
    const docs = snapshotToArray(snapshot);
    return docs[0] || null;
  } catch (err) {
    console.error(`Firestore one error (${collectionName}):`, err.message);
    throw err;
  }
}

/**
 * Get all documents from a collection (equivalent to SQL "many").
 * 
 * @param {string} collectionName - The Firestore collection name.
 * @param {object} options - Same options as query().
 * @returns {Promise<Array>} Array of document objects.
 */
export async function many(collectionName, options = {}) {
  return query(collectionName, options);
}

/**
 * Create a new document in a Firestore collection.
 * 
 * @param {string} collectionName - The Firestore collection name.
 * @param {object} data - The document data.
 * @param {string} [docId] - Optional custom document ID. If not provided, Firestore auto-generates one.
 * @returns {Promise<object>} The created document with its ID.
 */
export async function create(collectionName, data, docId = null) {
  try {
    const timestamp = admin.firestore.FieldValue.serverTimestamp();
    const docData = { ...data, createdAt: timestamp, updatedAt: timestamp };

    let docRef;
    if (docId) {
      docRef = db().collection(collectionName).doc(docId);
      await docRef.set(docData);
    } else {
      docRef = await db().collection(collectionName).add(docData);
    }

    const created = await docRef.get();
    return docToObj(created);
  } catch (err) {
    console.error(`Firestore create error (${collectionName}):`, err.message);
    throw err;
  }
}

/**
 * Update an existing document.
 * 
 * @param {string} collectionName - The Firestore collection name.
 * @param {string} docId - The document ID to update.
 * @param {object} data - The fields to update.
 * @returns {Promise<object>} The updated document.
 */
export async function update(collectionName, docId, data) {
  try {
    const docRef = db().collection(collectionName).doc(docId);
    await docRef.update({
      ...data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    const updated = await docRef.get();
    return docToObj(updated);
  } catch (err) {
    console.error(`Firestore update error (${collectionName}):`, err.message);
    throw err;
  }
}

/**
 * Delete a document.
 * 
 * @param {string} collectionName - The Firestore collection name.
 * @param {string} docId - The document ID to delete.
 * @returns {Promise<void>}
 */
export async function remove(collectionName, docId) {
  try {
    await db().collection(collectionName).doc(docId).delete();
  } catch (err) {
    console.error(`Firestore delete error (${collectionName}):`, err.message);
    throw err;
  }
}

/**
 * Run a Firestore transaction.
 * 
 * @param {Function} updateFunction - A function that performs the transaction.
 * @returns {Promise<any>} The result of the transaction.
 */
export async function runTransaction(updateFunction) {
  try {
    return await db().runTransaction(updateFunction);
  } catch (err) {
    console.error('Firestore transaction error:', err.message);
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Schema initialisation – creates Firestore collections with seed data
// ─────────────────────────────────────────────────────────────────────────────

export async function initDb() {
  try {
    console.log('Initializing Firestore collections…');

    // Firestore collections are created automatically when documents are added.
    // We just need to verify connectivity by listing collections.
    const collections = await db().listCollections();
    const collectionNames = collections.map(c => c.id);

    console.log(`✓ Firestore connected. Available collections: ${collectionNames.join(', ') || 'none (will be created on first write)'}`);
    return true;
  } catch (err) {
    console.error('Failed to initialize Firestore:', err.message);
    throw err;
  }
}

/**
 * Health check – verify Firestore connection.
 */
export async function healthCheck() {
  try {
    // Try to list collections as a connectivity check
    const collections = await db().listCollections();
    return { status: 'ok', collections: collections.map(c => c.id) };
  } catch (err) {
    console.error('Firestore health check failed:', err.message);
    throw err;
  }
}

export default {
  query,
  getById,
  one,
  many,
  create,
  update,
  remove,
  runTransaction,
  initDb,
  healthCheck,
};