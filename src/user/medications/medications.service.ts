import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { AppError } from 'src/common/app-error';
import { UserMedication } from './medication.model';

@Injectable()
export class UserMedicationsService {
  constructor(private readonly db: DatabaseService) {}

  async findAllForUser(userId: string): Promise<UserMedication[]> {
    return this.db.query<UserMedication>(
      'SELECT atc, notes, added_at AS "addedAt" FROM user_medications WHERE user_id = $1 ORDER BY added_at DESC',
      [userId],
    );
  }

  async add(
    userId: string,
    atc: string,
    notes?: string,
  ): Promise<UserMedication> {
    if (notes && notes.length > 1000) {
      throw new AppError(
        'Notes must not exceed 1000 characters',
        'BAD_USER_INPUT',
      );
    }

    const drug = await this.db.query('SELECT atc FROM drugs WHERE atc = $1', [
      atc,
    ]);
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
      throw new AppError(
        'You already have this medication in your list',
        'CONFLICT',
      );
    }

    return rows[0];
  }

  async update(
    userId: string,
    atc: string,
    notes: string | null,
  ): Promise<UserMedication> {
    if (notes && notes.length > 500) {
      throw new AppError(
        'Notes must not exceed 500 characters',
        'BAD_USER_INPUT',
      );
    }

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

  async remove(userId: string, atc: string): Promise<string> {
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
