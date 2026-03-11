import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface User {
  id: number;
  username: string;
  password_hash: string;
}

@Injectable()
export class UsersService {
  constructor(private readonly db: DatabaseService) {}

  async findByUsername(username: string): Promise<User | undefined> {
    const rows = await this.db.query<User>(
      'SELECT id, username, password_hash FROM users WHERE username = $1',
      [username],
    );
    return rows[0];
  }

  async create(username: string, passwordHash: string): Promise<User> {
    const rows = await this.db.query<User>(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username, password_hash',
      [username, passwordHash],
    );
    return rows[0];
  }
}
