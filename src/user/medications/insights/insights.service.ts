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

// IDs for the pre-aggregated "total" rows in the source data
const TOTAL_GENDER = 3;   // "Båda könen"
const TOTAL_AGE_GROUP = 99; // "Totalt"
const TOTAL_REGION = 0;   // "Riket"

interface RegionalPopularityFilters {
  year?: number;
  gender?: number;
  ageGroup?: number;
}

interface TrendFilters {
  region?: number;
  gender?: number;
  ageGroup?: number;
}

interface GenderSplitFilters {
  region?: number;
  ageGroup?: number;
}

interface AgeSplitFilters {
  region?: number;
  gender?: number;
}

interface DemographicGridFilters {
  year?: number;
  region?: number;
}

@Injectable()
export class InsightsService {
  constructor(private readonly db: DatabaseService) {}

  async validateAtc(atc: string): Promise<void> {
    const rows = await this.db.query('SELECT 1 FROM drugs WHERE atc = $1', [atc]);
    if (!rows.length) throw new AppError(`Drug with ATC code "${atc}" not found`, 'NOT_FOUND');
  }

  // `table` is hardcoded by callers — never user input — so interpolation is safe here.
  private async validateExists(table: string, id: number, label: string): Promise<void> {
    const rows = await this.db.query(`SELECT 1 FROM ${table} WHERE id = $1`, [id]);
    if (!rows.length) throw new AppError(`${label} ${id} not found`, 'NOT_FOUND');
  }

  private validateRegion(id?: number): Promise<void> | undefined {
    return id === undefined ? undefined : this.validateExists('regions', id, 'Region');
  }

  private validateGender(id?: number): Promise<void> | undefined {
    return id === undefined ? undefined : this.validateExists('genders', id, 'Gender');
  }

  private validateAgeGroup(id?: number): Promise<void> | undefined {
    return id === undefined ? undefined : this.validateExists('age_groups', id, 'Age group');
  }

  async getRegionalPopularity(
    atc: string,
    filters: RegionalPopularityFilters,
  ): Promise<RegionalStat[]> {
    await Promise.all([
      this.validateGender(filters.gender),
      this.validateAgeGroup(filters.ageGroup),
    ]);

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

  async getTrend(atc: string, filters: TrendFilters): Promise<TrendPoint[]> {
    await Promise.all([
      this.validateRegion(filters.region),
      this.validateGender(filters.gender),
      this.validateAgeGroup(filters.ageGroup),
    ]);

    const region = filters.region ?? TOTAL_REGION;
    const gender = filters.gender ?? TOTAL_GENDER;
    const ageGroup = filters.ageGroup ?? TOTAL_AGE_GROUP;

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
       ORDER BY year`,
      [atc, region, gender, ageGroup],
    );
  }

  async getGenderSplit(
    atc: string,
    filters: GenderSplitFilters,
  ): Promise<GenderSplitPoint[]> {
    await Promise.all([
      this.validateRegion(filters.region),
      this.validateAgeGroup(filters.ageGroup),
    ]);

    const region = filters.region ?? TOTAL_REGION;
    const ageGroup = filters.ageGroup ?? TOTAL_AGE_GROUP;

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
       ORDER BY pd.year, g.name`,
      [atc, region, ageGroup, TOTAL_GENDER],
    );
  }

  async getAgeSplit(
    atc: string,
    filters: AgeSplitFilters,
  ): Promise<AgeSplitPoint[]> {
    await Promise.all([
      this.validateRegion(filters.region),
      this.validateGender(filters.gender),
    ]);

    const region = filters.region ?? TOTAL_REGION;
    const gender = filters.gender ?? TOTAL_GENDER;

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
       ORDER BY pd.year, pd.age_group`,
      [atc, region, gender, TOTAL_AGE_GROUP],
    );
  }

  async getDemographicGrid(
    atc: string,
    filters: DemographicGridFilters,
  ): Promise<DemographicCell[]> {
    await this.validateRegion(filters.region);

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
