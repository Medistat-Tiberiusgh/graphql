import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Pool, types } from 'pg';
import { DatabaseService } from './database.service';

// pg returns NUMERIC/DECIMAL as strings by default, since they can exceed JS
// double precision. Our only NUMERIC column is per_1000 NUMERIC(10,2), which is
// well within a double, so parse it to a real number — keeps the `number` types
// honest and avoids string-vs-number bugs in any future arithmetic.
const NUMERIC_OID = 1700;
types.setTypeParser(NUMERIC_OID, (value) =>
  value === null ? null : parseFloat(value),
);

@Injectable()
export class SqlDatabaseService
  extends DatabaseService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT!),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  async onModuleInit() {
    const client = await this.pool.connect();
    console.log('PostgreSQL connected.');
    client.release();
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  async query<T = any>(sql: string, params?: unknown[]): Promise<T[]> {
    const result = await this.pool.query(sql, params);
    return result.rows;
  }

  async runInTransaction(
    steps: { sql: string; params?: unknown[] }[],
  ): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      for (const step of steps) {
        await client.query(step.sql, step.params);
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
