import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export interface User {
  id: string;
  username: string;
  password_hash: string | null;
  region_id: number | null;
  gender_id: number | null;
  age_group_id: number | null;
  github_id: string | null;
}

@Injectable()
export class UsersService {
  constructor(private readonly db: DatabaseService) {}

  async findByUsername(username: string): Promise<User | undefined> {
    const rows = await this.db.query<User>(
      'SELECT id, username, password_hash, region_id, gender_id, age_group_id, github_id FROM users WHERE username = $1',
      [username],
    );
    return rows[0];
  }

  async findByGithubId(githubId: string): Promise<User | undefined> {
    const rows = await this.db.query<User>(
      'SELECT id, username, password_hash, region_id, gender_id, age_group_id, github_id FROM users WHERE github_id = $1',
      [githubId],
    );
    return rows[0];
  }

  async createFromGithub(githubId: string, username: string): Promise<User> {
    const rows = await this.db.query<User>(
      `INSERT INTO users (github_id, username)
       VALUES ($1, $2)
       RETURNING id, username, password_hash, region_id, gender_id, age_group_id, github_id`,
      [githubId, username],
    );
    return rows[0];
  }

  async delete(id: string): Promise<boolean> {
    const rows = await this.db.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id],
    );
    return rows.length > 0;
  }
}
