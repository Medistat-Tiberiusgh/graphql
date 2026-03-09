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

  private validateNumericFields(numberOfPrescriptions: number, numberOfPatients: number, per1000: number): void {
    if (numberOfPrescriptions < 0) throw new BadRequestException('numberOfPrescriptions must be >= 0');
    if (numberOfPatients < 0) throw new BadRequestException('numberOfPatients must be >= 0');
    if (per1000 < 0) throw new BadRequestException('per1000 must be >= 0');
    if (numberOfPrescriptions < numberOfPatients) throw new BadRequestException('numberOfPrescriptions must be >= numberOfPatients');
  }

  async create(
    year: number, region: number, atcCode: string, gender: number, ageGroup: number,
    numberOfPrescriptions: number, numberOfPatients: number, per1000: number,
  ): Promise<Prescription> {
    const currentYear = new Date().getFullYear();
    if (year < 2006 || year > currentYear) {
      throw new BadRequestException(`year must be between 2006 and ${currentYear}`);
    }
    this.validateNumericFields(numberOfPrescriptions, numberOfPatients, per1000);

    const [regionRows, drugRows, genderRows, ageGroupRows] = await Promise.all([
      this.db.query('SELECT id FROM regions WHERE id = $1', [region]),
      this.db.query('SELECT atc FROM drugs WHERE atc = $1', [atcCode]),
      this.db.query('SELECT id FROM genders WHERE id = $1', [gender]),
      this.db.query('SELECT id FROM age_groups WHERE id = $1', [ageGroup]),
    ]);

    const errors: string[] = [];
    if (regionRows.length === 0) errors.push(`region with id ${region} does not exist`);
    if (drugRows.length === 0) errors.push(`drug with atcCode ${atcCode} does not exist`);
    if (genderRows.length === 0) errors.push(`gender with id ${gender} does not exist`);
    if (ageGroupRows.length === 0) errors.push(`ageGroup with id ${ageGroup} does not exist`);
    if (errors.length > 0) throw new BadRequestException(errors.join(', '));

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
    this.validateNumericFields(numberOfPrescriptions, numberOfPatients, per1000);

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
