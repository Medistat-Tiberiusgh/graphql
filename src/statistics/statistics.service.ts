import { Injectable } from '@nestjs/common';
import { AppError } from '../common/app-error';
import { DatabaseService } from '../database/database.service';
import { Statistic, StatisticsConnection } from './statistics.model';

const SELECT = `
  SELECT year, region, atc AS "atcCode", gender,
         age_group AS "ageGroup", num_prescriptions AS "numberOfPrescriptions",
         num_patients AS "numberOfPatients", per_1000 AS "per1000"
  FROM prescription_data
`;

@Injectable()
export class StatisticsService {
  constructor(private readonly db: DatabaseService) {}

  private validateAtcCode(atcCode: string): void {
    if (!atcCode || atcCode.length > 10) {
      throw new AppError('Invalid ATC code', 'BAD_USER_INPUT');
    }
  }

  async findAll(
    limit: number,
    offset: number,
    filters: {
      year?: number;
      region?: number;
      atcCode?: string;
      gender?: number;
      ageGroup?: number;
    },
  ): Promise<StatisticsConnection> {
    if (limit > 500)
      throw new AppError('limit must not exceed 500', 'BAD_USER_INPUT');
    if (filters.atcCode !== undefined) this.validateAtcCode(filters.atcCode);
    const safeLimit = limit;

    // Build WHERE clause dynamically from whichever filters were provided
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filters.year !== undefined) {
      params.push(filters.year);
      conditions.push(`year = $${params.length}`);
    }
    if (filters.region !== undefined) {
      params.push(filters.region);
      conditions.push(`region = $${params.length}`);
    }
    if (filters.atcCode !== undefined) {
      params.push(filters.atcCode);
      conditions.push(`atc = $${params.length}`);
    }
    if (filters.gender !== undefined) {
      params.push(filters.gender);
      conditions.push(`gender = $${params.length}`);
    }
    if (filters.ageGroup !== undefined) {
      params.push(filters.ageGroup);
      conditions.push(`age_group = $${params.length}`);
    }

    const where =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [items, countRows] = await Promise.all([
      this.db.query<Statistic>(
        `${SELECT} ${where} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, safeLimit, offset],
      ),
      this.db.query<{ count: string }>(
        `SELECT COUNT(*) AS count FROM prescription_data ${where}`,
        params,
      ),
    ]);

    const totalCount = parseInt(countRows[0].count, 10);
    return {
      items,
      totalCount,
      hasNextPage: offset + safeLimit < totalCount,
      hasPreviousPage: offset > 0,
    };
  }

  async findOne(
    year: number,
    region: number,
    atcCode: string,
    gender: number,
    ageGroup: number,
  ): Promise<Statistic | undefined> {
    const sql = `${SELECT} WHERE year = $1 AND region = $2 AND atc = $3 AND gender = $4 AND age_group = $5`;
    const rows = await this.db.query<Statistic>(sql, [
      year,
      region,
      atcCode,
      gender,
      ageGroup,
    ]);
    return rows[0];
  }
}
