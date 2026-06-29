export abstract class DatabaseService {
  abstract query<T = any>(sql: string, params?: unknown[]): Promise<T[]>;
  abstract runInTransaction(
    steps: { sql: string; params?: unknown[] }[],
  ): Promise<void>;
}
