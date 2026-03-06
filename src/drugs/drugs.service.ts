import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Drug } from './drug.model';

@Injectable()
export class DrugsService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(): Promise<Drug[]> {
    const sql =
      'SELECT atc AS "atcCode", name, narcotic_class AS "narcoticClass" FROM drugs';
    return this.db.query<Drug>(sql);
  }

  async findOne(atcCode: string): Promise<Drug | undefined> {
    const sql =
      'SELECT atc AS "atcCode", name, narcotic_class AS "narcoticClass" FROM drugs WHERE atc = $1';
    const params = [atcCode];
    const rows = await this.db.query<Drug>(sql, params);
    return rows[0];
  }
}
