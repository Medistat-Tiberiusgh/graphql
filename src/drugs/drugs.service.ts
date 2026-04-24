import { Injectable, OnModuleInit } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Drug } from './drug.model';
import { AppError } from '../common/app-error';

@Injectable()
export class DrugsService implements OnModuleInit {
  private drugsCache: Drug[] = [];

  constructor(private readonly db: DatabaseService) {}

  async onModuleInit(): Promise<void> {
    this.drugsCache = await this.db.query<Drug>(
      'SELECT atc AS "atcCode", name, narcotic_class AS "narcoticClass" FROM drugs ORDER BY name',
    );
  }

  search(query: string): Drug[] {
    const q = query.toLowerCase();
    return this.drugsCache
      .filter(d => d.name.toLowerCase().includes(q) || d.atcCode.toLowerCase().includes(q))
      .slice(0, 20);
  }

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
