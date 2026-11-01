import { AppError } from './app-error';
import { DatabaseService } from '../database/database.service';

// IDs for the pre-aggregated "total" rows in the source data
export const TOTAL_REGION = 0; // "Riket"
export const TOTAL_GENDER = 3; // "Båda könen"
export const TOTAL_AGE_GROUP = 99; // "Totalt"

const DIMENSIONS = {
  region: { table: 'regions', label: 'Region' },
  gender: { table: 'genders', label: 'Gender' },
  ageGroup: { table: 'age_groups', label: 'Age group' },
} as const;

export async function assertDimensionExists(
  db: DatabaseService,
  dimension: keyof typeof DIMENSIONS,
  id: number | null,
  errorCode: 'NOT_FOUND' | 'BAD_USER_INPUT',
): Promise<void> {
  if (id === null) return;
  const { table, label } = DIMENSIONS[dimension];
  const rows = await db.query(`SELECT 1 FROM ${table} WHERE id = $1`, [id]);
  if (!rows.length) {
    throw new AppError(`${label} ${id} not found`, errorCode);
  }
}
