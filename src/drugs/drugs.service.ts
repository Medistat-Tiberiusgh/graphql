import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Drug } from './drug.model';
import { AppError } from '../common/app-error';

@Injectable()
export class DrugsService {
  constructor(private readonly db: DatabaseService) {}

  private validateAtcCode(atcCode: string): void {
    if (!atcCode || atcCode.length > 10) {
      throw new AppError('Invalid ATC code', 'BAD_USER_INPUT');
    }
  }

  async findAll(): Promise<Drug[]> {
    const sql =
      'SELECT atc AS "atcCode", name, narcotic_class AS "narcoticClass" FROM drugs';
    return this.db.query<Drug>(sql);
  }

  async findOne(atcCode: string): Promise<Drug> {
    this.validateAtcCode(atcCode);
    const sql =
      'SELECT atc AS "atcCode", name, narcotic_class AS "narcoticClass" FROM drugs WHERE atc = $1';
    const rows = await this.db.query<Drug>(sql, [atcCode]);
    if (!rows.length) {
      throw new AppError(
        `Drug with ATC code ${atcCode} not found`,
        'NOT_FOUND',
      );
    }
    return rows[0];
  }
}
