/**
 * Unified Database Module
 *
 * Provides a unified database interface that works with:
 * - SQLite (local development via better-sqlite3)
 * - Turso/libSQL (serverless SQLite for Vercel via @libsql/client)
 * - PostgreSQL (alternative Vercel deployment via pg)
 *
 * The interface abstracts away the differences between synchronous SQLite
 * and asynchronous database operations.
 * 
 * Environment Detection:
 * - If TURSO_DATABASE_URL is set → Use Turso (libSQL)
 * - If DATABASE_URL is set on Vercel → Use PostgreSQL
 * - Otherwise → Use local SQLite
 */

import Database from "better-sqlite3";
import type { Database as SqliteDatabase } from "better-sqlite3";
import { Pool, type PoolClient, type QueryResultRow } from "pg";
import { createClient, type Client as LibSqlClient } from "@libsql/client";
import fs from "node:fs";
import path from "node:path";
import { getConfig } from "./config";
import { isVercel } from "./utils/environment";

export interface DatabaseRow {
    [key: string]: unknown;
}

export interface QueryResult<T = DatabaseRow> {
    rows: T[];
    rowCount: number;
}

export interface UnifiedDatabase {
    /**
     * Execute a query and return all matching rows
     */
    query<T extends DatabaseRow = DatabaseRow>(
        sql: string,
        params?: unknown[]
    ): Promise<QueryResult<T>>;

    /**
     * Execute a query and return the first matching row
     */
    queryOne<T extends DatabaseRow = DatabaseRow>(
        sql: string,
        params?: unknown[]
    ): Promise<T | undefined>;

    /**
     * Execute a write query (INSERT, UPDATE, DELETE)
     * Returns the number of affected rows
     */
    execute(sql: string, params?: unknown[]): Promise<{ changes: number }>;

    /**
     * Get the underlying SQLite database (for local compatibility)
     * Returns null when running on PostgreSQL
     */
    getSqliteDb(): SqliteDatabase | null;

    /**
     * Check if using PostgreSQL
     */
    isPostgres(): boolean;

    /**
     * Close the database connection
     */
    close(): Promise<void>;
}

/**
 * Convert SQLite-style query parameters (?) to PostgreSQL ($1, $2, ...)
 */
const translateParamsToPostgres = (sql: string): string => {
    let index = 0;
    return sql.replace(/\?/g, () => `$${++index}`);
};

/**
 * SQLite implementation of UnifiedDatabase
 */
class SqliteDatabaseWrapper implements UnifiedDatabase {
    private db: SqliteDatabase;

    constructor(dbPath: string) {
        const dbDirectory = path.dirname(dbPath);
        fs.mkdirSync(dbDirectory, { recursive: true });

        this.db = new Database(dbPath);
        this.db.pragma("foreign_keys = ON");
        this.db.pragma("journal_mode = WAL");
    }

    async query<T extends DatabaseRow = DatabaseRow>(
        sql: string,
        params: unknown[] = []
    ): Promise<QueryResult<T>> {
        const stmt = this.db.prepare(sql);
        const rows = stmt.all(...params) as T[];
        return { rows, rowCount: rows.length };
    }

    async queryOne<T extends DatabaseRow = DatabaseRow>(
        sql: string,
        params: unknown[] = []
    ): Promise<T | undefined> {
        const stmt = this.db.prepare(sql);
        return stmt.get(...params) as T | undefined;
    }

    async execute(
        sql: string,
        params: unknown[] = []
    ): Promise<{ changes: number }> {
        const stmt = this.db.prepare(sql);
        const result = stmt.run(...params);
        return { changes: result.changes };
    }

    getSqliteDb(): SqliteDatabase {
        return this.db;
    }

    isPostgres(): boolean {
        return false;
    }

    async close(): Promise<void> {
        this.db.close();
    }
}

/**
 * PostgreSQL implementation of UnifiedDatabase
 */
class PostgresDatabaseWrapper implements UnifiedDatabase {
    private pool: Pool;

    constructor(connectionString: string) {
        this.pool = new Pool({
            connectionString,
            ssl: { rejectUnauthorized: false },
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000,
        });
    }

    async query<T extends DatabaseRow = DatabaseRow>(
        sql: string,
        params: unknown[] = []
    ): Promise<QueryResult<T>> {
        const pgSql = translateParamsToPostgres(sql);
        const result = await this.pool.query<T & QueryResultRow>(pgSql, params);
        return { rows: result.rows, rowCount: result.rowCount ?? 0 };
    }

    async queryOne<T extends DatabaseRow = DatabaseRow>(
        sql: string,
        params: unknown[] = []
    ): Promise<T | undefined> {
        const result = await this.query<T>(sql, params);
        return result.rows[0];
    }

    async execute(
        sql: string,
        params: unknown[] = []
    ): Promise<{ changes: number }> {
        const pgSql = translateParamsToPostgres(sql);
        const result = await this.pool.query(pgSql, params);
        return { changes: result.rowCount ?? 0 };
    }

    getSqliteDb(): null {
        return null;
    }

    isPostgres(): boolean {
        return true;
    }

    async close(): Promise<void> {
        await this.pool.end();
    }

    /**
     * Get a client for transaction support
     */
    async getClient(): Promise<PoolClient> {
        return this.pool.connect();
    }
}

/**
 * Turso/libSQL implementation of UnifiedDatabase
 * Uses the @libsql/client package which works in serverless environments
 */
class TursoDatabaseWrapper implements UnifiedDatabase {
    private client: LibSqlClient;

    constructor(url: string, authToken?: string) {
        this.client = createClient({
            url,
            authToken,
        });
    }

    async query<T extends DatabaseRow = DatabaseRow>(
        sql: string,
        params: unknown[] = []
    ): Promise<QueryResult<T>> {
        const result = await this.client.execute({
            sql,
            args: params as any[],
        });
        // Convert libsql rows to plain objects
        const rows = result.rows.map(row => {
            const obj: DatabaseRow = {};
            for (let i = 0; i < result.columns.length; i++) {
                obj[result.columns[i]] = row[i];
            }
            return obj as T;
        });
        return { rows, rowCount: result.rowsAffected };
    }

    async queryOne<T extends DatabaseRow = DatabaseRow>(
        sql: string,
        params: unknown[] = []
    ): Promise<T | undefined> {
        const result = await this.query<T>(sql, params);
        return result.rows[0];
    }

    async execute(
        sql: string,
        params: unknown[] = []
    ): Promise<{ changes: number }> {
        const result = await this.client.execute({
            sql,
            args: params as any[],
        });
        return { changes: result.rowsAffected };
    }

    getSqliteDb(): null {
        return null;
    }

    isPostgres(): boolean {
        return false;
    }

    async close(): Promise<void> {
        this.client.close();
    }
}

// Singleton instance
let databaseInstance: UnifiedDatabase | null = null;

/**
 * Initialize the database based on environment
 * 
 * Priority:
 * 1. Turso (if TURSO_DATABASE_URL is set) - preferred for Vercel
 * 2. PostgreSQL (if DATABASE_URL is set on Vercel) - alternative
 * 3. SQLite (local development) - default
 */
export const initializeDatabase = async (): Promise<UnifiedDatabase> => {
    if (databaseInstance) {
        return databaseInstance;
    }

    // Check for Turso (preferred for serverless)
    const tursoUrl = process.env.TURSO_DATABASE_URL;
    const tursoToken = process.env.TURSO_AUTH_TOKEN;
    
    if (tursoUrl) {
        console.log("✓ Initializing Turso/libSQL database");
        const tursoWrapper = new TursoDatabaseWrapper(tursoUrl, tursoToken);
        
        // Test connection
        try {
            await tursoWrapper.query("SELECT 1");
            console.log("✓ Turso connection established");
        } catch (error) {
            console.error("✗ Turso connection failed:", error);
            throw error;
        }
        
        databaseInstance = tursoWrapper;
        return databaseInstance;
    }

    // Check for PostgreSQL (alternative for Vercel)
    if (isVercel()) {
        const connectionString = process.env.DATABASE_URL;
        if (!connectionString) {
            throw new Error(
                "DATABASE_URL or TURSO_DATABASE_URL environment variable is required for Vercel deployment"
            );
        }

        console.log("✓ Initializing PostgreSQL database for Vercel");
        const pgWrapper = new PostgresDatabaseWrapper(connectionString);

        // Test connection
        try {
            await pgWrapper.query("SELECT 1");
            console.log("✓ PostgreSQL connection established");
        } catch (error) {
            console.error("✗ PostgreSQL connection failed:", error);
            throw error;
        }

        databaseInstance = pgWrapper;
    } else {
        const config = getConfig();
        console.log("✓ Initializing SQLite database for local development");
        databaseInstance = new SqliteDatabaseWrapper(config.dbPath);
    }

    return databaseInstance;
};

/**
 * Get the database instance
 * Note: Database must be initialized before calling this
 */
export const getDatabase = (): UnifiedDatabase => {
    if (!databaseInstance) {
        throw new Error(
            "Database not initialized. Call initializeDatabase() first."
        );
    }
    return databaseInstance;
};

/**
 * Get the database instance, initializing if needed
 * Async version for convenience
 */
export const getDatabaseAsync = async (): Promise<UnifiedDatabase> => {
    if (!databaseInstance) {
        return initializeDatabase();
    }
    return databaseInstance;
};

// For backward compatibility with existing code that uses the synchronous SQLite db
// This is deprecated and should be migrated to use getDatabase()
export { databaseInstance };
