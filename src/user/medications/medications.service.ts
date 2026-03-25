import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { AppError } from 'src/common/app-error';
import { UserMedication } from './medication.model';

@Injectable()
export class UserMedicationsService {
  constructor(private readonly db: DatabaseService) {}

  async findAllForUser(userId: number): Promise<UserMedication[]> {
    return this.db.query<UserMedication>(
      'SELECT atc, notes, added_at AS "addedAt" FROM user_medications WHERE user_id = $1 ORDER BY added_at DESC',
      [userId],
    );
  }

  private validateAtc(atc: string): void {
    if (!atc || atc.length > 10) {
      throw new AppError('Invalid ATC code', 'BAD_USER_INPUT');
    }
  }

  private validateNotes(notes?: string | null): void {
    if (notes && notes.length > 1000) {
      throw new AppError(
        'Notes must not exceed 1000 characters',
        'BAD_USER_INPUT',
      );
    }
  }

  async add(
    userId: number,
    atc: string,
    notes?: string,
  ): Promise<UserMedication> {
    this.validateAtc(atc);
    this.validateNotes(notes);

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
    userId: number,
    atc: string,
    notes: string | null,
  ): Promise<UserMedication> {
    this.validateAtc(atc);
    this.validateNotes(notes);

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
    this.validateAtc(atc);

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
