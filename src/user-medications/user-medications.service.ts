import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AppError } from '../common/app-error';
import { UserMedication } from './user-medication.model';

@Injectable()
export class UserMedicationsService {
  constructor(private readonly db: DatabaseService) {}

  async findAllForUser(userId: number): Promise<UserMedication[]> {
    return this.db.query<UserMedication>(
      'SELECT atc, notes, added_at AS "addedAt" FROM user_medications WHERE user_id = $1 ORDER BY added_at DESC',
      [userId],
    );
  }

  async add(userId: number, atc: string, notes?: string): Promise<UserMedication> {
    const drug = await this.db.query('SELECT atc FROM drugs WHERE atc = $1', [atc]);
    if (!drug.length) {
      throw new AppError(`Drug with ATC code "${atc}" not found`, 'NOT_FOUND');
    }

    const rows = await this.db.query<UserMedication>(
      `INSERT INTO user_medications (user_id, atc, notes)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, atc) DO NOTHING
       RETURNING atc, notes, added_at AS "addedAt"`,
      [userId, atc, notes ?? null],
    );

    if (!rows.length) {
      throw new AppError('You already have this medication in your list', 'CONFLICT');
    }

    return rows[0];
  }

  async update(userId: number, atc: string, notes: string | null): Promise<UserMedication> {
    const rows = await this.db.query<UserMedication>(
      `UPDATE user_medications
       SET notes = $3
       WHERE user_id = $1 AND atc = $2
       RETURNING atc, notes, added_at AS "addedAt"`,
      [userId, atc, notes],
    );

    if (!rows.length) {
      throw new AppError('Medication not found in your list', 'NOT_FOUND');
    }

    return rows[0];
  }

  async remove(userId: number, atc: string): Promise<string> {
    const rows = await this.db.query(
      'DELETE FROM user_medications WHERE user_id = $1 AND atc = $2 RETURNING atc',
      [userId, atc],
    );

    if (!rows.length) {
      throw new AppError('Medication not found in your list', 'NOT_FOUND');
    }

    return atc;
  }
}
