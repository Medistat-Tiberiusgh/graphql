import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import { DatabaseService } from '../database/database.service';
import { Drug } from './drug.model';

@Injectable({ scope: Scope.REQUEST })
export class DrugsDataLoaders {
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
}
