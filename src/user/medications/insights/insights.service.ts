import { Injectable } from '@nestjs/common';
import { AppError } from '../../../common/app-error';
import { addParam } from '../../../common/sql-helpers';
import { DatabaseService } from '../../../database/database.service';
import {
  AgeSplitPoint,
  DemographicCell,
  GenderSplitPoint,
  RegionalStat,
  TrendPoint,
} from './insights.model';

export interface InsightFilters {
  year?: number;
  region?: number;
  gender?: number;
  ageGroup?: number;
}

// IDs for the pre-aggregated "total" rows in the source data
const TOTAL_GENDER = 3;   // "Båda könen"
const TOTAL_AGE_GROUP = 99; // "Totalt"
const TOTAL_REGION = 0;   // "Riket"

@Injectable()
export class InsightsService {
  constructor(private readonly db: DatabaseService) {}

  async validateInputs(atc: string, filters: InsightFilters): Promise<void> {
    const checks: Promise<unknown>[] = [
      this.db
        .query('SELECT 1 FROM drugs WHERE atc = $1', [atc])
        .then((r) => { if (!r.length) throw new AppError(`Drug with ATC code "${atc}" not found`, 'NOT_FOUND'); }),
    ];

    if (filters.region !== undefined)
      checks.push(this.validateExists('regions', filters.region, 'Region'));
    if (filters.gender !== undefined)
      checks.push(this.validateExists('genders', filters.gender, 'Gender'));
    if (filters.ageGroup !== undefined)
      checks.push(this.validateExists('age_groups', filters.ageGroup, 'Age group'));

    await Promise.all(checks);
  }

  // `table` is hardcoded by callers — never user input — so interpolation is safe here.
  private async validateExists(table: string, id: number, label: string): Promise<void> {
    const rows = await this.db.query(`SELECT 1 FROM ${table} WHERE id = $1`, [id]);
    if (!rows.length) throw new AppError(`${label} ${id} not found`, 'NOT_FOUND');
  }

  async getRegionalPopularity(
    atc: string,
    filters: InsightFilters,
  ): Promise<RegionalStat[]> {
    const gender = filters.gender ?? TOTAL_GENDER;
    const ageGroup = filters.ageGroup ?? TOTAL_AGE_GROUP;
    const params: unknown[] = [atc, gender, ageGroup];

    const yearCondition = filters.year !== undefined
      ? `pd.year = ${addParam(params, filters.year)}`
      : `pd.year = (SELECT MAX(year) FROM prescription_data WHERE atc = $1)`;

    return this.db.query<RegionalStat>(
      `SELECT pd.region AS "regionId", r.name AS "regionName", pd.per_1000 AS "per1000"
       FROM prescription_data pd
       JOIN regions r ON r.id = pd.region
       WHERE pd.atc = $1
         AND pd.gender = $2
         AND pd.age_group = $3
         AND ${yearCondition}
         AND pd.region <> ${TOTAL_REGION}
       ORDER BY pd.per_1000 DESC`,
      params,
    );
  }

  async getTrend(atc: string, filters: InsightFilters): Promise<TrendPoint[]> {
    const region = filters.region ?? TOTAL_REGION;
    const gender = filters.gender ?? TOTAL_GENDER;
    const ageGroup = filters.ageGroup ?? TOTAL_AGE_GROUP;

    const params: unknown[] = [atc, region, gender, ageGroup];
    const yearCondition = filters.year !== undefined
      ? `AND year = ${addParam(params, filters.year)}`
      : '';

    return this.db.query<TrendPoint>(
      `SELECT year,
              num_prescriptions AS "totalPrescriptions",
              num_patients AS "totalPatients",
              per_1000 AS "per1000"
       FROM prescription_data
       WHERE atc = $1
         AND region = $2
         AND gender = $3
         AND age_group = $4
         ${yearCondition}
       ORDER BY year`,
      params,
    );
  }

  async getGenderSplit(
    atc: string,
    filters: InsightFilters,
  ): Promise<GenderSplitPoint[]> {
    const region = filters.region ?? TOTAL_REGION;
    const ageGroup = filters.ageGroup ?? TOTAL_AGE_GROUP;
    const params: unknown[] = [atc, region, ageGroup, TOTAL_GENDER];

    const yearCondition = filters.year !== undefined
      ? `AND pd.year = ${addParam(params, filters.year)}`
      : '';

    return this.db.query<GenderSplitPoint>(
      `SELECT pd.year,
              pd.gender AS "genderId",
              g.name AS "gender",
              pd.per_1000 AS "per1000"
       FROM prescription_data pd
       JOIN genders g ON g.id = pd.gender
       WHERE pd.atc = $1
         AND pd.region = $2
         AND pd.age_group = $3
         AND pd.gender <> $4
         ${yearCondition}
       ORDER BY pd.year, g.name`,
      params,
    );
  }

  async getAgeSplit(
    atc: string,
    filters: InsightFilters,
  ): Promise<AgeSplitPoint[]> {
    const region = filters.region ?? TOTAL_REGION;
    const gender = filters.gender ?? TOTAL_GENDER;
    const params: unknown[] = [atc, region, gender, TOTAL_AGE_GROUP];

    const yearCondition = filters.year !== undefined
      ? `AND pd.year = ${addParam(params, filters.year)}`
      : '';

    return this.db.query<AgeSplitPoint>(
      `SELECT pd.year,
              pd.age_group AS "ageGroupId",
              ag.name AS "ageGroupName",
              pd.per_1000 AS "per1000"
       FROM prescription_data pd
       JOIN age_groups ag ON ag.id = pd.age_group
       WHERE pd.atc = $1
         AND pd.region = $2
         AND pd.gender = $3
         AND pd.age_group <> $4
         ${yearCondition}
       ORDER BY pd.year, pd.age_group`,
      params,
    );
  }

  async getDemographicGrid(
    atc: string,
    filters: InsightFilters,
  ): Promise<DemographicCell[]> {
    const region = filters.region ?? TOTAL_REGION;
    const params: unknown[] = [atc, region];

    // Use the requested year or fall back to the latest available year for this drug+region.
    const yearCondition = filters.year !== undefined
      ? `AND pd.year = ${addParam(params, filters.year)}`
      : `AND pd.year = (SELECT MAX(year) FROM prescription_data WHERE atc = $1 AND region = $2)`;

    return this.db.query<DemographicCell>(
      `SELECT pd.gender AS "genderId",
              g.name  AS "gender",
              pd.age_group AS "ageGroupId",
              ag.name AS "ageGroupName",
              pd.per_1000 AS "per1000"
       FROM prescription_data pd
       JOIN genders   g  ON g.id  = pd.gender
       JOIN age_groups ag ON ag.id = pd.age_group
       WHERE pd.atc    = $1
         AND pd.region = $2
         AND pd.gender    <> ${TOTAL_GENDER}
         AND pd.age_group <> ${TOTAL_AGE_GROUP}
         ${yearCondition}
       ORDER BY pd.age_group, pd.gender`,
      params,
    );
  }
}
