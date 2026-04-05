import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Region } from './region.model';
import { AppError } from '../common/app-error';

@Injectable()
export class RegionsService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(): Promise<Region[]> {
    const sql = 'SELECT id, name AS "regionName" FROM regions';
    return this.db.query<Region>(sql);
  }

  async findOne(regionId: number): Promise<Region> {
    const sql = 'SELECT id, name AS "regionName" FROM regions WHERE id = $1';
    const rows = await this.db.query<Region>(sql, [regionId]);
    if (!rows.length) {
      throw new AppError(`Region with id ${regionId} not found`, 'NOT_FOUND');
    }
    return rows[0];
  }
}
