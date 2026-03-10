import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import { DatabaseService } from '../database/database.service';
import { Drug } from '../drugs/drug.model';
import { Region } from '../regions/region.model';

@Injectable({ scope: Scope.REQUEST })
export class PrescriptionDataLoaders {
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

  readonly regionById = new DataLoader<string, Region | undefined>(
    async (regionIds: readonly string[]) => {
      const rows = await this.db.query<Region>(
        'SELECT id AS "regionCode", name AS "regionName" FROM regions WHERE id = ANY($1)',
        [[...regionIds]],
      );
      const map = new Map(rows.map((r) => [r.regionCode, r]));
      return regionIds.map((id) => map.get(id));
    },
  );
}
