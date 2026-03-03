import { Injectable } from '@nestjs/common';
import { Prescription } from './prescription.model';

@Injectable()
export class PrescriptionsService {
  private prescriptions: Prescription[] = [
    {
      id: 1,
      year: 2023,
      region: 'SE-AB',
      atcCode: 'A02BC01',
      sex: 'K',
      ageGroup: '35-44',
      numberOfDispensings: 1500,
      numberOfPatients: 800,
      per1000: 45.2,
    },
  ];

  findAll(): Prescription[] {
    return this.prescriptions;
  }

  findOne(id: number): Prescription | undefined {
    return this.prescriptions.find((p) => p.id === id);
  }
}
