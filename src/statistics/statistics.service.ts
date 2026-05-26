import { Injectable } from '@nestjs/common';
import { AppError } from '../common/app-error';
import { addParam } from '../common/sql-helpers';
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
    const safeLimit = limit;

    // Build WHERE clause dynamically from whichever filters were provided
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filters.year != null)
      conditions.push(`year = ${addParam(params, filters.year)}`);
    if (filters.region != null)
      conditions.push(`region = ${addParam(params, filters.region)}`);
    if (filters.atcCode != null)
      conditions.push(`atc = ${addParam(params, filters.atcCode)}`);
    if (filters.gender != null)
      conditions.push(`gender = ${addParam(params, filters.gender)}`);
    if (filters.ageGroup != null)
      conditions.push(`age_group = ${addParam(params, filters.ageGroup)}`);

    const where =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countParams = [...params];
    const limitPlaceholder = addParam(params, safeLimit);
    const offsetPlaceholder = addParam(params, offset);

    const [items, countRows] = await Promise.all([
      this.db.query<Statistic>(
        `${SELECT} ${where} LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}`,
        params,
      ),
      this.db.query<{ count: string }>(
        `SELECT COUNT(*) AS count FROM prescription_data ${where}`,
        countParams,
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
