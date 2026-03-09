import { BadRequestException, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Prescription } from './prescription.model';

const SELECT = `
  SELECT year, region, atc AS "atcCode", gender,
         age_group AS "ageGroup", num_prescriptions AS "numberOfPrescriptions",
         num_patients AS "numberOfPatients", per_1000 AS "per1000"
  FROM prescription_data
`;

@Injectable()
export class PrescriptionsService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(limit: number, offset: number): Promise<Prescription[]> {
    const safeLimit = Math.min(limit, 500);
    const sql = `${SELECT} LIMIT $1 OFFSET $2`;
    return this.db.query<Prescription>(sql, [safeLimit, offset]);
  }

  async findOne(year: number, region: number, atcCode: string, gender: number, ageGroup: number): Promise<Prescription | undefined> {
    const sql = `${SELECT} WHERE year = $1 AND region = $2 AND atc = $3 AND gender = $4 AND age_group = $5`;
    const rows = await this.db.query<Prescription>(sql, [year, region, atcCode, gender, ageGroup]);
    return rows[0];
  }

  async create(
    year: number, region: number, atcCode: string, gender: number, ageGroup: number,
    numberOfPrescriptions: number, numberOfPatients: number, per1000: number,
  ): Promise<Prescription> {
    const currentYear = new Date().getFullYear();
    if (year < 2006 || year > currentYear) {
      throw new BadRequestException(`year must be between 2006 and ${currentYear}`);
    }

    const sql = `
      INSERT INTO prescription_data (year, region, atc, gender, age_group, num_prescriptions, num_patients, per_1000)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING year, region, atc AS "atcCode", gender, age_group AS "ageGroup",
                num_prescriptions AS "numberOfPrescriptions", num_patients AS "numberOfPatients", per_1000 AS "per1000"
    `;
    const rows = await this.db.query<Prescription>(sql, [year, region, atcCode, gender, ageGroup, numberOfPrescriptions, numberOfPatients, per1000]);
    return rows[0];
  }

  async update(
    year: number, region: number, atcCode: string, gender: number, ageGroup: number,
    numberOfPrescriptions: number, numberOfPatients: number, per1000: number,
  ): Promise<Prescription | undefined> {
    const sql = `
      UPDATE prescription_data
      SET num_prescriptions = $6, num_patients = $7, per_1000 = $8
      WHERE year = $1 AND region = $2 AND atc = $3 AND gender = $4 AND age_group = $5
      RETURNING year, region, atc AS "atcCode", gender, age_group AS "ageGroup",
                num_prescriptions AS "numberOfPrescriptions", num_patients AS "numberOfPatients", per_1000 AS "per1000"
    `;
    const rows = await this.db.query<Prescription>(sql, [year, region, atcCode, gender, ageGroup, numberOfPrescriptions, numberOfPatients, per1000]);
    return rows[0];
  }

  async delete(year: number, region: number, atcCode: string, gender: number, ageGroup: number): Promise<boolean> {
    const sql = `
      DELETE FROM prescription_data
      WHERE year = $1 AND region = $2 AND atc = $3 AND gender = $4 AND age_group = $5
      RETURNING year
    `;
    const rows = await this.db.query(sql, [year, region, atcCode, gender, ageGroup]);
    return rows.length > 0;
  }
}
