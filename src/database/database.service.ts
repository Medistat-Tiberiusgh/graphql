export abstract class DatabaseService {
  abstract query<T = any>(sql: string, params?: unknown[]): Promise<T[]>;
}
