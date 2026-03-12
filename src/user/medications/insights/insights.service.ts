import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';
import { Drug } from '../../../drugs/drug.model';
import { DrugInsights, RegionalStat } from './insights.model';

@Injectable()
export class InsightsService {
  constructor(private readonly db: DatabaseService) {}

  async getDrug(atc: string): Promise<Drug | undefined> {
    const rows = await this.db.query<Drug>(
      'SELECT atc AS "atcCode", name, narcotic_class AS "narcoticClass" FROM drugs WHERE atc = $1',
      [atc],
    );
    return rows[0];
  }

  async getInsights(atc: string): Promise<DrugInsights> {
    const regionalPopularity = await this.db.query<RegionalStat>(
      `SELECT pd.region AS "regionId", r.name AS "regionName",
              SUM(pd.per_1000) AS "per1000"
       FROM prescription_data pd
       JOIN regions r ON r.id = pd.region
       WHERE pd.atc = $1
         AND pd.year = (SELECT MAX(year) FROM prescription_data WHERE atc = $1)
       GROUP BY pd.region, r.name
       ORDER BY "per1000" DESC`,
      [atc],
    );
    return { regionalPopularity };
  }
}
