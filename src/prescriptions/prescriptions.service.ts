import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Prescription } from './prescription.model';

@Injectable()
export class PrescriptionsService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(limit: number, offset: number): Promise<Prescription[]> {
    const safeLimit = Math.min(limit, 500);
    const sql = `
      SELECT year, region, atc AS "atcCode", narcotic_class AS narcoticClass, gender,
             age_group AS "ageGroup", num_prescriptions AS "numberOfPrescriptions",
             num_patients AS "numberOfPatients", per_1000 AS "per1000"
      FROM prescription_data
      LIMIT $1 OFFSET $2
    `;
    return this.db.query<Prescription>(sql, [safeLimit, offset]);
  }
}
