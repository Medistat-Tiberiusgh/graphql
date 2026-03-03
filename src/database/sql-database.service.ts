import { Injectable, OnModuleInit } from '@nestjs/common';
import { Pool } from 'pg';
import { DatabaseService } from './database.service';

@Injectable()
export class SqlDatabaseService
  extends DatabaseService
  implements OnModuleInit
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

  async query<T = any>(sql: string, params?: unknown[]): Promise<T[]> {
    const result = await this.pool.query(sql, params);
    return result.rows;
  }
}
