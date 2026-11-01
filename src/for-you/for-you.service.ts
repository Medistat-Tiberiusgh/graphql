import { Injectable } from '@nestjs/common';
import { AppError } from '../common/app-error';
import {
  TOTAL_AGE_GROUP,
  TOTAL_GENDER,
  TOTAL_REGION,
} from '../common/demographics';
import { DatabaseService } from '../database/database.service';
import { Drug } from '../drugs/drug.model';
import {
  ComparisonGroup,
  DemographicGroup,
  ForYou,
  MostDispensedItem,
  RisingItem,
  StandsOutItem,
} from './for-you.model';

// Small groups and rare drugs give unstable rates, so both floors must pass.
const MIN_PATIENTS = 50;
const MIN_PER_1000 = 2;
const TREND_YEARS = 5;
const MAX_LIMIT = 20;

interface DrugRow {
  atcCode: string;
  name: string;
  narcoticClass: string | null;
}

function toDrug(row: DrugRow): Drug {
  return {
    atcCode: row.atcCode,
    name: row.name,
    narcoticClass: row.narcoticClass ?? undefined,
  };
}

function groupFromProfile(profile: {
  region?: number;
  gender?: number;
  ageGroup?: number;
}): DemographicGroup {
  return {
    region: profile.region ?? TOTAL_REGION,
    gender: profile.gender ?? TOTAL_GENDER,
    ageGroup: profile.ageGroup ?? TOTAL_AGE_GROUP,
  };
}

// With a region, compare against the same gender/age in all of Sweden so the
// result shows what is special about the region; otherwise against everyone.
function baselineFor(group: DemographicGroup): DemographicGroup {
  if (group.region !== TOTAL_REGION) {
    return { ...group, region: TOTAL_REGION };
  }
  return {
    region: TOTAL_REGION,
    gender: TOTAL_GENDER,
    ageGroup: TOTAL_AGE_GROUP,
  };
}

function toComparisonGroup(group: DemographicGroup): ComparisonGroup {
  return {
    regionId: group.region === TOTAL_REGION ? null : group.region,
    genderId: group.gender === TOTAL_GENDER ? null : group.gender,
    ageGroupId: group.ageGroup === TOTAL_AGE_GROUP ? null : group.ageGroup,
  };
}

function assertValidLimit(limit: number): void {
  if (limit < 1 || limit > MAX_LIMIT) {
    throw new AppError(
      `limit must be between 1 and ${MAX_LIMIT}`,
      'BAD_USER_INPUT',
    );
  }
}

@Injectable()
export class ForYouService {
  constructor(private readonly db: DatabaseService) {}

  async forProfile(profile: {
    region?: number;
    gender?: number;
    ageGroup?: number;
  }): Promise<ForYou> {
    const { region, gender, ageGroup } = profile;
    if (region == null && gender == null && ageGroup == null) {
      throw new AppError(
        'Provide at least one of region, gender or ageGroup',
        'BAD_USER_INPUT',
      );
    }

    const group = groupFromProfile(profile);
    const baseline = baselineFor(group);
    const latestYear = await this.latestYear();
    return {
      group,
      baseline,
      comparedWith: toComparisonGroup(baseline),
      latestYear,
      trendStartYear: latestYear - TREND_YEARS,
    };
  }

  async standsOut(forYou: ForYou, limit: number): Promise<StandsOutItem[]> {
    assertValidLimit(limit);
    const { group, baseline, latestYear } = forYou;

    const rows = await this.db.query<
      DrugRow & { ratio: number; per1000: number }
    >(
      `SELECT drug.atc AS "atcCode", drug.name, drug.narcotic_class AS "narcoticClass",
              mine.per_1000::float AS "per1000",
              (mine.per_1000 / baseline.per_1000)::float AS ratio
       FROM prescription_data mine
       JOIN prescription_data baseline
         ON baseline.atc = mine.atc AND baseline.year = mine.year
        AND baseline.region = $5 AND baseline.gender = $6 AND baseline.age_group = $7
       JOIN drugs drug ON drug.atc = mine.atc
       WHERE mine.year = $1 AND mine.region = $2 AND mine.gender = $3 AND mine.age_group = $4
         AND mine.num_patients >= $8 AND mine.per_1000 >= $9
         AND baseline.per_1000 > 0
       ORDER BY ratio DESC
       LIMIT $10`,
      [
        latestYear,
        group.region,
        group.gender,
        group.ageGroup,
        baseline.region,
        baseline.gender,
        baseline.ageGroup,
        MIN_PATIENTS,
        MIN_PER_1000,
        limit,
      ],
    );

    return rows.map((row) => ({
      drug: toDrug(row),
      ratio: row.ratio,
      per1000: row.per1000,
    }));
  }

  async mostDispensed(
    forYou: ForYou,
    limit: number,
  ): Promise<MostDispensedItem[]> {
    assertValidLimit(limit);
    const { group, latestYear } = forYou;

    const rows = await this.db.query<DrugRow & { per1000: number }>(
      `SELECT drug.atc AS "atcCode", drug.name, drug.narcotic_class AS "narcoticClass",
              mine.per_1000::float AS "per1000"
       FROM prescription_data mine
       JOIN drugs drug ON drug.atc = mine.atc
       WHERE mine.year = $1 AND mine.region = $2 AND mine.gender = $3 AND mine.age_group = $4
         AND mine.num_patients >= $5
       ORDER BY mine.per_1000 DESC
       LIMIT $6`,
      [
        latestYear,
        group.region,
        group.gender,
        group.ageGroup,
        MIN_PATIENTS,
        limit,
      ],
    );

    return rows.map((row) => ({ drug: toDrug(row), per1000: row.per1000 }));
  }

  async rising(forYou: ForYou, limit: number): Promise<RisingItem[]> {
    assertValidLimit(limit);
    const { group, latestYear, trendStartYear } = forYou;

    const rows = await this.db.query<DrugRow & { growth: number }>(
      `SELECT drug.atc AS "atcCode", drug.name, drug.narcotic_class AS "narcoticClass",
              (latest.per_1000 / start.per_1000)::float AS growth
       FROM prescription_data latest
       JOIN prescription_data start
         ON start.atc = latest.atc AND start.year = $2
        AND start.region = latest.region AND start.gender = latest.gender
        AND start.age_group = latest.age_group
       JOIN drugs drug ON drug.atc = latest.atc
       WHERE latest.year = $1 AND latest.region = $3 AND latest.gender = $4 AND latest.age_group = $5
         AND latest.num_patients >= $6
         AND latest.per_1000 >= $7 AND start.per_1000 >= $7
       ORDER BY growth DESC
       LIMIT $8`,
      [
        latestYear,
        trendStartYear,
        group.region,
        group.gender,
        group.ageGroup,
        MIN_PATIENTS,
        MIN_PER_1000,
        limit,
      ],
    );

    const trends = await this.trendsFor(
      rows.map((row) => row.atcCode),
      forYou,
    );

    return rows.map((row) => ({
      drug: toDrug(row),
      growth: row.growth,
      trend: trends.get(row.atcCode) ?? [],
    }));
  }

  // Sparse data (no row = zero), so every year in the range gets a value.
  private async trendsFor(
    atcCodes: string[],
    forYou: ForYou,
  ): Promise<Map<string, { year: number; per1000: number }[]>> {
    const { group, latestYear, trendStartYear } = forYou;
    const rows = await this.db.query<{
      atcCode: string;
      year: number;
      per1000: number;
    }>(
      `SELECT atc AS "atcCode", year, per_1000::float AS "per1000"
       FROM prescription_data
       WHERE atc = ANY($1) AND region = $2 AND gender = $3 AND age_group = $4
         AND year BETWEEN $5 AND $6`,
      [
        atcCodes,
        group.region,
        group.gender,
        group.ageGroup,
        trendStartYear,
        latestYear,
      ],
    );

    const trends = new Map<string, { year: number; per1000: number }[]>();
    for (const atcCode of atcCodes) {
      const years = Array.from(
        { length: latestYear - trendStartYear + 1 },
        (_, index) => trendStartYear + index,
      );
      trends.set(
        atcCode,
        years.map((year) => ({
          year,
          per1000:
            rows.find((row) => row.atcCode === atcCode && row.year === year)
              ?.per1000 ?? 0,
        })),
      );
    }
    return trends;
  }

  private async latestYear(): Promise<number> {
    const rows = await this.db.query<{ year: number }>(
      'SELECT MAX(year) AS year FROM prescription_data',
    );
    return rows[0].year;
  }
}
