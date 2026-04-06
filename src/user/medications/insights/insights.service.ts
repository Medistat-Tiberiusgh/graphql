import { Injectable } from '@nestjs/common';
import { AppError } from '../../../common/app-error';
import { DatabaseService } from '../../../database/database.service';
import { Drug } from '../../../drugs/drug.model';
import {
  DrugInsights,
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

    if (filters.region !== undefined) {
      checks.push(
        this.db
          .query('SELECT 1 FROM regions WHERE id = $1', [filters.region])
          .then((r) => { if (!r.length) throw new AppError(`Region ${filters.region} not found`, 'NOT_FOUND'); }),
      );
    }
    if (filters.gender !== undefined) {
      checks.push(
        this.db
          .query('SELECT 1 FROM genders WHERE id = $1', [filters.gender])
          .then((r) => { if (!r.length) throw new AppError(`Gender ${filters.gender} not found`, 'NOT_FOUND'); }),
      );
    }
    if (filters.ageGroup !== undefined) {
      checks.push(
        this.db
          .query('SELECT 1 FROM age_groups WHERE id = $1', [filters.ageGroup])
          .then((r) => { if (!r.length) throw new AppError(`Age group ${filters.ageGroup} not found`, 'NOT_FOUND'); }),
      );
    }

    await Promise.all(checks);
  }

  async getDrug(atc: string): Promise<Drug | undefined> {
    const rows = await this.db.query<Drug>(
      'SELECT atc AS "atcCode", name, narcotic_class AS "narcoticClass" FROM drugs WHERE atc = $1',
      [atc],
    );
    return rows[0];
  }

  async getRegionalPopularity(
    atc: string,
    filters: InsightFilters,
  ): Promise<RegionalStat[]> {
    const gender = filters.gender ?? TOTAL_GENDER;
    const ageGroup = filters.ageGroup ?? TOTAL_AGE_GROUP;
    const params: unknown[] = [atc, gender, ageGroup];

    const yearCondition = filters.year !== undefined
      ? `pd.year = $${params.push(filters.year) && params.length}`
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
      ? `AND year = $${params.push(filters.year) && params.length}`
      : '';

    return this.db.query<TrendPoint>(
      `SELECT year,
              num_prescriptions AS "totalPrescriptions",
              num_patients AS "totalPatients"
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
      ? `AND pd.year = $${params.push(filters.year) && params.length}`
      : '';

    return this.db.query<GenderSplitPoint>(
      `SELECT pd.year, g.name AS "gender", pd.per_1000 AS "per1000"
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

  async getChronicUseRatio(
    atc: string,
    filters: InsightFilters,
  ): Promise<number> {
    const region = filters.region ?? TOTAL_REGION;
    const gender = filters.gender ?? TOTAL_GENDER;
    const ageGroup = filters.ageGroup ?? TOTAL_AGE_GROUP;
    const params: unknown[] = [atc, region, gender, ageGroup];

    const yearCondition = filters.year !== undefined
      ? `AND year = $${params.push(filters.year) && params.length}`
      : '';

    const rows = await this.db.query<{ ratio: string }>(
      `SELECT ROUND(
         (SUM(num_prescriptions)::float / NULLIF(SUM(num_patients), 0))::numeric,
         2
       ) AS ratio
       FROM prescription_data
       WHERE atc = $1
         AND region = $2
         AND gender = $3
         AND age_group = $4
         ${yearCondition}`,
      params,
    );

    return parseFloat(rows[0]?.ratio ?? '0');
  }

  async getInsights(atc: string): Promise<DrugInsights> {
    const regionalPopularity = await this.getRegionalPopularity(atc, {});
    return { regionalPopularity } as DrugInsights;
  }
}
