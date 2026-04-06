import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Region } from './region.model';

@Injectable()
export class RegionsService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(): Promise<Region[]> {
    const sql = 'SELECT id, name AS "regionName" FROM regions';
    return this.db.query<Region>(sql);
  }

}
