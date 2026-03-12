import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export interface User {
  id: number;
  username: string;
  password_hash: string;
  region_id: number;
  gender_id: number;
  age_group_id: number;
}

@Injectable()
export class UsersService {
  constructor(private readonly db: DatabaseService) {}

  async findByUsername(username: string): Promise<User | undefined> {
    const rows = await this.db.query<User>(
      'SELECT id, username, password_hash, region_id, gender_id, age_group_id FROM users WHERE username = $1',
      [username],
    );
    return rows[0];
  }

  async create(
    username: string,
    passwordHash: string,
    regionId: number,
    genderId: number,
    ageGroupId: number,
  ): Promise<User> {
    const rows = await this.db.query<User>(
      `INSERT INTO users (username, password_hash, region_id, gender_id, age_group_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, password_hash, region_id, gender_id, age_group_id`,
      [username, passwordHash, regionId, genderId, ageGroupId],
    );
    return rows[0];
  }
}
