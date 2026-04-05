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
    const params: unknown[] = [atc];
    const conditions: string[] = [];

    if (filters.year !== undefined) {
      params.push(filters.year);
      conditions.push(`pd.year = $${params.length}`);
    } else {
      conditions.push(
        `pd.year = (SELECT MAX(year) FROM prescription_data WHERE atc = $1)`,
      );
    }

    if (filters.gender !== undefined) {
      params.push(filters.gender);
      conditions.push(`pd.gender = $${params.length}`);
    }
    if (filters.ageGroup !== undefined) {
      params.push(filters.ageGroup);
      conditions.push(`pd.age_group = $${params.length}`);
    }

    const where = conditions.join(' AND ');

    return this.db.query<RegionalStat>(
      `SELECT pd.region AS "regionId", r.name AS "regionName",
              ROUND(SUM(pd.per_1000)::numeric, 2) AS "per1000"
       FROM prescription_data pd
       JOIN regions r ON r.id = pd.region
       WHERE pd.atc = $1 AND ${where}
       GROUP BY pd.region, r.name
       ORDER BY "per1000" DESC`,
      params,
    );
  }

  async getTrend(atc: string, filters: InsightFilters): Promise<TrendPoint[]> {
    const params: unknown[] = [atc];
    const conditions: string[] = [];

    if (filters.region !== undefined) {
      params.push(filters.region);
      conditions.push(`region = $${params.length}`);
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
      conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : '';

    return this.db.query<TrendPoint>(
      `SELECT year,
              SUM(num_prescriptions) AS "totalPrescriptions",
              SUM(num_patients) AS "totalPatients"
       FROM prescription_data
       WHERE atc = $1 ${where}
       GROUP BY year
       ORDER BY year`,
      params,
    );
  }

  async getGenderSplit(
    atc: string,
    filters: InsightFilters,
  ): Promise<GenderSplitPoint[]> {
    const params: unknown[] = [atc];
    const conditions: string[] = [];

    if (filters.year !== undefined) {
      params.push(filters.year);
      conditions.push(`pd.year = $${params.length}`);
    }
    if (filters.region !== undefined) {
      params.push(filters.region);
      conditions.push(`pd.region = $${params.length}`);
    }
    if (filters.ageGroup !== undefined) {
      params.push(filters.ageGroup);
      conditions.push(`pd.age_group = $${params.length}`);
    }

    const where =
      conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : '';

    return this.db.query<GenderSplitPoint>(
      `SELECT pd.year,
              g.name AS "gender",
              ROUND(SUM(pd.per_1000)::numeric, 2) AS "per1000"
       FROM prescription_data pd
       JOIN genders g ON g.id = pd.gender
       WHERE pd.atc = $1 ${where}
       GROUP BY pd.year, g.name
       ORDER BY pd.year, g.name`,
      params,
    );
  }

  async getChronicUseRatio(
    atc: string,
    filters: InsightFilters,
  ): Promise<number> {
    const params: unknown[] = [atc];
    const conditions: string[] = [];

    if (filters.year !== undefined) {
      params.push(filters.year);
      conditions.push(`year = $${params.length}`);
    }
    if (filters.region !== undefined) {
      params.push(filters.region);
      conditions.push(`region = $${params.length}`);
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
      conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : '';

    const rows = await this.db.query<{ ratio: string }>(
      `SELECT ROUND(
         (SUM(num_prescriptions)::float / NULLIF(SUM(num_patients), 0))::numeric,
         2
       ) AS ratio
       FROM prescription_data
       WHERE atc = $1 ${where}`,
      params,
    );

    return parseFloat(rows[0]?.ratio ?? '0');
  }

  async getInsights(atc: string): Promise<DrugInsights> {
    const regionalPopularity = await this.getRegionalPopularity(atc, {});
    return { regionalPopularity } as DrugInsights;
  }
}
