import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AgeGroup } from './age-group.model';

@Injectable()
export class AgeGroupsService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(): Promise<AgeGroup[]> {
    const sql = 'SELECT id, name FROM age_groups ORDER BY id';
    return this.db.query<AgeGroup>(sql);
  }

  async findOne(id: number): Promise<AgeGroup | undefined> {
    const sql = 'SELECT id, name FROM age_groups WHERE id = $1';
    const rows = await this.db.query<AgeGroup>(sql, [id]);
    return rows[0];
  }
}
