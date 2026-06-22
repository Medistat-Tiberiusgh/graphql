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
const TOTAL_GENDER = 3; // "Båda könen"
const TOTAL_AGE_GROUP = 99; // "Totalt"
const TOTAL_REGION = 0; // "Riket"

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
    const rows = await this.db.query('SELECT 1 FROM drugs WHERE atc = $1', [
      atc,
    ]);
    if (!rows.length)
      throw new AppError(`Drug with ATC code "${atc}" not found`, 'NOT_FOUND');
  }

  // `table` is hardcoded by callers — never user input — so interpolation is safe here.
  private async validateExists(
    table: string,
    id: number,
    label: string,
  ): Promise<void> {
    const rows = await this.db.query(`SELECT 1 FROM ${table} WHERE id = $1`, [
      id,
    ]);
    if (!rows.length)
      throw new AppError(`${label} ${id} not found`, 'NOT_FOUND');
  }

  private validateRegion(id?: number | null): Promise<void> | undefined {
    return id == null
      ? undefined
      : this.validateExists('regions', id, 'Region');
  }

  private validateGender(id?: number | null): Promise<void> | undefined {
    return id == null
      ? undefined
      : this.validateExists('genders', id, 'Gender');
  }

  private validateAgeGroup(id?: number | null): Promise<void> | undefined {
    return id == null
      ? undefined
      : this.validateExists('age_groups', id, 'Age group');
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

    const yearCondition =
      filters.year != null
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

    // Sparse data (no row = zero), so build the year axis and LEFT JOIN, filling gap years with 0.
    return this.db.query<TrendPoint>(
      `WITH years AS (
         SELECT generate_series(
           (SELECT MIN(year) FROM prescription_data WHERE atc = $1),
           (SELECT MAX(year) FROM prescription_data WHERE atc = $1)
         ) AS year
       )
       SELECT years.year,
              COALESCE(prescriptions.num_prescriptions, 0) AS "totalPrescriptions",
              COALESCE(prescriptions.num_patients, 0)      AS "totalPatients",
              COALESCE(prescriptions.per_1000, 0)          AS "per1000"
       FROM years
       LEFT JOIN prescription_data prescriptions
         ON prescriptions.year = years.year
        AND prescriptions.atc = $1 AND prescriptions.region = $2
        AND prescriptions.gender = $3 AND prescriptions.age_group = $4
       ORDER BY years.year`,
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

    // Sparse data, so build the full year × gender grid and LEFT JOIN, filling gaps with 0.
    return this.db.query<GenderSplitPoint>(
      `WITH years AS (
         SELECT generate_series(
           (SELECT MIN(year) FROM prescription_data WHERE atc = $1),
           (SELECT MAX(year) FROM prescription_data WHERE atc = $1)
         ) AS year
       ),
       dimensions AS (
         SELECT years.year, gender.id AS gender_id, gender.name AS gender_name
         FROM years
         CROSS JOIN genders gender
         WHERE gender.id <> $4
       )
       SELECT dimensions.year,
              dimensions.gender_id   AS "genderId",
              dimensions.gender_name AS "gender",
              COALESCE(prescriptions.per_1000, 0) AS "per1000"
       FROM dimensions
       LEFT JOIN prescription_data prescriptions
         ON prescriptions.year = dimensions.year AND prescriptions.gender = dimensions.gender_id
        AND prescriptions.atc = $1 AND prescriptions.region = $2 AND prescriptions.age_group = $3
       ORDER BY dimensions.year, dimensions.gender_name`,
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

    // Sparse data, so build the full year × age grid and LEFT JOIN, filling gaps with 0.
    return this.db.query<AgeSplitPoint>(
      `WITH years AS (
         SELECT generate_series(
           (SELECT MIN(year) FROM prescription_data WHERE atc = $1),
           (SELECT MAX(year) FROM prescription_data WHERE atc = $1)
         ) AS year
       ),
       dimensions AS (
         SELECT years.year, age_group.id AS age_group_id, age_group.name AS age_group_name
         FROM years
         CROSS JOIN age_groups age_group
         WHERE age_group.id <> $4
       )
       SELECT dimensions.year,
              dimensions.age_group_id   AS "ageGroupId",
              dimensions.age_group_name AS "ageGroupName",
              COALESCE(prescriptions.per_1000, 0) AS "per1000"
       FROM dimensions
       LEFT JOIN prescription_data prescriptions
         ON prescriptions.year = dimensions.year AND prescriptions.age_group = dimensions.age_group_id
        AND prescriptions.atc = $1 AND prescriptions.region = $2 AND prescriptions.gender = $3
       ORDER BY dimensions.year, dimensions.age_group_id`,
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
    const yearExpression =
      filters.year != null
        ? `${addParam(params, filters.year)}::int`
        : `(SELECT MAX(year) FROM prescription_data WHERE atc = $1 AND region = $2)`;

    // Sparse data, so build the full gender × age grid for the year and LEFT JOIN, filling gaps with 0.
    return this.db.query<DemographicCell>(
      `WITH target AS (SELECT ${yearExpression} AS year),
       dimensions AS (
         SELECT gender.id AS gender_id, gender.name AS gender_name,
                age_group.id AS age_group_id, age_group.name AS age_group_name
         FROM genders gender
         CROSS JOIN age_groups age_group
         WHERE gender.id <> ${TOTAL_GENDER} AND age_group.id <> ${TOTAL_AGE_GROUP}
       )
       SELECT dimensions.gender_id      AS "genderId",
              dimensions.gender_name    AS "gender",
              dimensions.age_group_id   AS "ageGroupId",
              dimensions.age_group_name AS "ageGroupName",
              COALESCE(prescriptions.per_1000, 0) AS "per1000"
       FROM dimensions
       CROSS JOIN target
       LEFT JOIN prescription_data prescriptions
         ON prescriptions.year = target.year
        AND prescriptions.gender = dimensions.gender_id
        AND prescriptions.age_group = dimensions.age_group_id
        AND prescriptions.atc = $1 AND prescriptions.region = $2
       ORDER BY dimensions.age_group_id, dimensions.gender_id`,
      params,
    );
  }
}
