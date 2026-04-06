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

}
