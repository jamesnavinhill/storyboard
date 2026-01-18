/**
 * PostgreSQL Database Support
 *
 * This module provides PostgreSQL database support for Vercel deployment.
 * It's designed to be used alongside or instead of SQLite depending on
 * the deployment environment.
 *
 * For a full PostgreSQL migration:
 * 1. Set DATABASE_URL environment variable on Vercel
 * 2. Run migrations against PostgreSQL
 * 3. Update stores to use async query methods
 *
 * Currently, this provides the foundation for future PostgreSQL support.
 */

import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from "pg";
import { isVercel } from "./utils/environment";

let pool: Pool | null = null;

/**
 * Initialize the PostgreSQL connection pool
 */
export const initializePostgres = async (): Promise<Pool | null> => {
    if (!isVercel()) {
        return null;
    }

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.warn(
            "DATABASE_URL not set - PostgreSQL features will be unavailable"
        );
        return null;
    }

    pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false },
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
    });

    // Test connection
    try {
        const client = await pool.connect();
        console.log("✓ PostgreSQL connection established");
        client.release();
    } catch (error) {
        console.error("✗ PostgreSQL connection failed:", error);
        pool = null;
    }

    return pool;
};

/**
 * Get the PostgreSQL pool (if initialized)
 */
export const getPool = (): Pool | null => pool;

/**
 * Execute a query with PostgreSQL
 */
export const query = async <T extends QueryResultRow = QueryResultRow>(
    sql: string,
    params?: unknown[]
): Promise<QueryResult<T>> => {
    if (!pool) {
        throw new Error("PostgreSQL pool not initialized");
    }
    return pool.query<T>(sql, params);
};

/**
 * Get a client from the pool for transactions
 */
export const getClient = async (): Promise<PoolClient> => {
    if (!pool) {
        throw new Error("PostgreSQL pool not initialized");
    }
    return pool.connect();
};

/**
 * Execute a transaction
 */
export const transaction = async <T>(
    callback: (client: PoolClient) => Promise<T>
): Promise<T> => {
    const client = await getClient();
    try {
        await client.query("BEGIN");
        const result = await callback(client);
        await client.query("COMMIT");
        return result;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Convert SQLite-style query parameters (?) to PostgreSQL ($1, $2, ...)
 */
export const translateParams = (sql: string): string => {
    let index = 0;
    return sql.replace(/\?/g, () => `$${++index}`);
};

/**
 * Close the PostgreSQL pool
 */
export const closePool = async (): Promise<void> => {
    if (pool) {
        await pool.end();
        pool = null;
    }
};

/**
 * Check if PostgreSQL is available
 */
export const isPostgresAvailable = (): boolean => {
    return pool !== null;
};
