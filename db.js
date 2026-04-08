const { Pool } = require("pg");

const useSsl =
  String(process.env.PGSSLMODE || "").toLowerCase() === "require"
  || String(process.env.DB_SSL || "").toLowerCase() === "true";

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: useSsl ? { rejectUnauthorized: false } : false,
        max: Number(process.env.PGPOOL_MAX || 20),
        idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS || 30000),
        connectionTimeoutMillis: Number(process.env.PG_CONNECT_TIMEOUT_MS || 10000)
      }
    : {
        host: process.env.PGHOST || "localhost",
        port: Number(process.env.PGPORT || 5432),
        database: process.env.PGDATABASE || "crm_propostas",
        user: process.env.PGUSER || "postgres",
        password: process.env.PGPASSWORD || "postgres",
        ssl: useSsl ? { rejectUnauthorized: false } : false,
        max: Number(process.env.PGPOOL_MAX || 20),
        idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS || 30000),
        connectionTimeoutMillis: Number(process.env.PG_CONNECT_TIMEOUT_MS || 10000)
      }
);

async function query(text, params) {
  return pool.query(text, params);
}

async function withTransaction(work) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  query,
  withTransaction
};
