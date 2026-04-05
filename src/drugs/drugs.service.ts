import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Drug } from './drug.model';
import { AppError } from '../common/app-error';

@Injectable()
export class DrugsService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(): Promise<Drug[]> {
    return this.db.query<Drug>(
      'SELECT atc AS "atcCode", name, narcotic_class AS "narcoticClass" FROM drugs ORDER BY name',
    );
  }

  async findOne(atcCode: string): Promise<Drug> {
    const sql =
      'SELECT atc AS "atcCode", name, narcotic_class AS "narcoticClass" FROM drugs WHERE atc = $1';
    const rows = await this.db.query<Drug>(sql, [atcCode]);
    if (!rows.length) {
      throw new AppError(`Drug with ATC code ${atcCode} not found`, 'NOT_FOUND');
    }
    return rows[0];
  }
}
