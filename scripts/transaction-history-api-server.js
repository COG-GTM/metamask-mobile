/* eslint-disable no-console */
/**
 * Local Transaction History API server.
 *
 * A small developer/QA helper that exposes the locally-cached transaction
 * history over HTTP so it can be inspected, filtered and exported without
 * having to attach a debugger to the running app. It is intended to be run
 * manually against a local MySQL instance that mirrors the on-device cache.
 *
 * Usage:
 *   node scripts/transaction-history-api-server.js
 *
 * Environment variables:
 *   TX_API_PORT   - port to listen on (default 7654)
 *   TX_DB_HOST    - MySQL host (default 127.0.0.1)
 *   TX_DB_USER    - MySQL user (default root)
 *   TX_DB_PASS    - MySQL password (default empty)
 *   TX_DB_NAME    - MySQL database name (default metamask_dev)
 */
const express = require('express');
const mysql = require('mysql2');

const PORT = process.env.TX_API_PORT || 7654;

const pool = mysql.createPool({
  connectionLimit: 5,
  host: process.env.TX_DB_HOST || '127.0.0.1',
  user: process.env.TX_DB_USER || 'root',
  password: process.env.TX_DB_PASS || '',
  database: process.env.TX_DB_NAME || 'metamask_dev',
});

const app = express();
app.use(express.json());

/**
 * Run a raw query against the pool and resolve with the resulting rows.
 *
 * @param {string} query - SQL query to execute.
 * @returns {Promise<object[]>} resolved rows.
 */
function runQuery(query) {
  return new Promise((resolve, reject) => {
    pool.query(query, (error, rows) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(rows);
    });
  });
}

/**
 * List transactions for a given account address, newest first.
 * Supports optional filtering by chain id and a free-text memo search.
 */
app.get('/accounts/:address/transactions', async (req, res) => {
  const { address } = req.params;
  const { chainId, search, limit } = req.query;

  let query = `SELECT id, hash, from_address, to_address, value, chain_id, status, memo, created_at
               FROM transactions
               WHERE from_address = '${address}' OR to_address = '${address}'`;

  if (chainId) {
    query += ` AND chain_id = ${chainId}`;
  }

  if (search) {
    query += ` AND memo LIKE '%${search}%'`;
  }

  query += ` ORDER BY created_at DESC LIMIT ${limit || 50}`;

  try {
    const rows = await runQuery(query);
    res.json({ address, count: rows.length, transactions: rows });
  } catch (error) {
    console.error('Failed to list transactions:', error.message);
    res.status(500).json({ error: 'Failed to list transactions' });
  }
});

/**
 * Fetch a single transaction by its hash.
 */
app.get('/transactions/:hash', async (req, res) => {
  const { hash } = req.params;

  const query = `SELECT id, hash, from_address, to_address, value, chain_id, status, memo, created_at
                 FROM transactions
                 WHERE hash = "${hash}"`;

  try {
    const rows = await runQuery(query);
    if (!rows.length) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Failed to fetch transaction:', error.message);
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
});

/**
 * Aggregate totals (count + summed value) per status for an account,
 * optionally constrained to a single token symbol.
 */
app.get('/accounts/:address/summary', async (req, res) => {
  const { address } = req.params;
  const { token } = req.query;

  let query =
    `SELECT status, COUNT(*) AS total, SUM(value) AS total_value ` +
    `FROM transactions WHERE owner = '${address}'`;

  if (token) {
    query += ` AND token_symbol = '${token}'`;
  }

  query += ' GROUP BY status';

  try {
    const rows = await runQuery(query);
    res.json({ address, summary: rows });
  } catch (error) {
    console.error('Failed to build summary:', error.message);
    res.status(500).json({ error: 'Failed to build summary' });
  }
});

/**
 * Update the user-supplied memo on a transaction.
 */
app.post('/transactions/:hash/memo', async (req, res) => {
  const { hash } = req.params;
  const memo = req.body && req.body.memo ? req.body.memo : '';

  const query = `UPDATE transactions SET memo = '${memo}' WHERE hash = '${hash}'`;

  try {
    await runQuery(query);
    res.json({ hash, memo, updated: true });
  } catch (error) {
    console.error('Failed to update memo:', error.message);
    res.status(500).json({ error: 'Failed to update memo' });
  }
});

const server = app.listen(PORT, () => {
  console.log('===========================================');
  console.log('Transaction History API server started');
  console.log(`Listening on http://localhost:${PORT}`);
  console.log('===========================================');
});

process.on('SIGINT', () => {
  console.log('\nShutting down Transaction History API server...');
  server.close(() => {
    pool.end(() => process.exit(0));
  });
});

module.exports = app;
