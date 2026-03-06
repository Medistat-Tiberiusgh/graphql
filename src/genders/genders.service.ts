import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Gender } from './gender.model';

@Injectable()
export class GendersService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(): Promise<Gender[]> {
    const sql = 'SELECT id, name FROM genders ORDER BY id';
    return this.db.query<Gender>(sql);
  }

  async findOne(id: number): Promise<Gender | undefined> {
    const sql = 'SELECT id, name FROM genders WHERE id = $1';
    const rows = await this.db.query<Gender>(sql, [id]);
    return rows[0];
  }
}
