import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Prescription } from './prescription.model';

@Injectable()
export class PrescriptionsService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(): Promise<Prescription[]> {
    const sql = `
      SELECT year, region, atc AS "atcCode", narcotic_class AS narcoticClass, gender,
             age_group AS "ageGroup", num_prescriptions AS "numberOfPrescriptions",
             num_patients AS "numberOfPatients", per_1000 AS "per1000"
      FROM prescription_data
    `;
    return this.db.query<Prescription>(sql);
  }
}
