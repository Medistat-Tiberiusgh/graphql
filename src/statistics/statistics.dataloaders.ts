import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import { DatabaseService } from '../database/database.service';
import { AgeGroup } from '../age-groups/age-group.model';
import { Drug } from '../drugs/drug.model';
import { Gender } from '../genders/gender.model';
import { Region } from '../regions/region.model';

@Injectable({ scope: Scope.REQUEST })
export class StatisticsDataLoaders {
  constructor(private readonly db: DatabaseService) {}

  readonly drugByAtcCode = new DataLoader<string, Drug | undefined>(
    async (atcCodes: readonly string[]) => {
      const rows = await this.db.query<Drug>(
        'SELECT atc AS "atcCode", name, narcotic_class AS "narcoticClass" FROM drugs WHERE atc = ANY($1)',
        [[...atcCodes]],
      );
      const map = new Map(rows.map((d) => [d.atcCode, d]));
      return atcCodes.map((code) => map.get(code));
    },
  );

  readonly ageGroupById = new DataLoader<string, AgeGroup | undefined>(
    async (ageGroupIds: readonly string[]) => {
      const rows = await this.db.query<AgeGroup>(
        'SELECT id, name AS "range" FROM age_groups WHERE id = ANY($1::int[])',
        [[...ageGroupIds]],
      );
      const map = new Map(rows.map((a) => [String(a.id), a]));
      return ageGroupIds.map((id) => map.get(id));
    },
  );

  readonly genderById = new DataLoader<string, Gender | undefined>(
    async (genderIds: readonly string[]) => {
      const rows = await this.db.query<Gender>(
        'SELECT id, name FROM genders WHERE id = ANY($1::int[])',
        [[...genderIds]],
      );
      const map = new Map(rows.map((g) => [String(g.id), g]));
      return genderIds.map((id) => map.get(id));
    },
  );

  readonly regionById = new DataLoader<string, Region | undefined>(
    async (regionIds: readonly string[]) => {
      const rows = await this.db.query<Region>(
        'SELECT id AS "regionCode", name AS "regionName" FROM regions WHERE id = ANY($1)',
        [[...regionIds]],
      );
      const map = new Map(rows.map((r) => [String(r.regionCode), r]));
      return regionIds.map((id) => map.get(id));
    },
  );
}
