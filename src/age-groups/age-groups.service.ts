import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AgeGroup } from './age-group.model';
import { AppError } from '../common/app-error';

@Injectable()
export class AgeGroupsService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(): Promise<AgeGroup[]> {
    const sql = 'SELECT id, name AS "range" FROM age_groups ORDER BY id';
    return this.db.query<AgeGroup>(sql);
  }

  async findOne(id: number): Promise<AgeGroup> {
    const sql = 'SELECT id, name AS "range" FROM age_groups WHERE id = $1';
    const rows = await this.db.query<AgeGroup>(sql, [id]);
    if (!rows.length) {
      throw new AppError(`Age group with id ${id} not found`, 'NOT_FOUND');
    }
    return rows[0];
  }
}
