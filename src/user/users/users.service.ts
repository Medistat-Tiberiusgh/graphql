import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { AppError } from '../../common/app-error';

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

  async delete(id: number): Promise<boolean> {
    const rows = await this.db.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id],
    );
    return rows.length > 0;
  }

  async create(
    username: string,
    passwordHash: string,
    regionId: number,
    genderId: number,
    ageGroupId: number,
  ): Promise<User> {
    try {
      const rows = await this.db.query<User>(
        `INSERT INTO users (username, password_hash, region_id, gender_id, age_group_id)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, username, password_hash, region_id, gender_id, age_group_id`,
        [username, passwordHash, regionId, genderId, ageGroupId],
      );
      return rows[0];
    } catch (err: any) {
      if (err.code === '23503') {
        throw new AppError(
          'One or more of the provided IDs (regionId, genderId, ageGroupId) do not exist. You can find more information at: https://cu1114.camp.lnu.se/docs/Schema/reference-data',
          'BAD_USER_INPUT',
        );
      }
      throw err;
    }
  }
}
