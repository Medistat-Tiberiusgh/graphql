import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Region } from './region.model';

@Injectable()
export class RegionsService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(): Promise<Region[]> {
    const sql = 'SELECT region_code AS "regionCode", region_name AS "regionName" FROM regions';
    return this.db.query<Region>(sql);
  }

  async findOne(regionCode: string): Promise<Region | undefined> {
    const sql = 'SELECT region_code AS "regionCode", region_name AS "regionName" FROM regions WHERE region_code = $1';
    const params = [regionCode];
    const rows = await this.db.query<Region>(sql, params);
    return rows[0];
  }
}
