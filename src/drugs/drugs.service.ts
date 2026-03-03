import { Injectable } from '@nestjs/common';
import { Drug } from './drug.model';

@Injectable()
export class DrugsService {
  private drugs: Drug[] = [
    { atcCode: 'A02BC01', atcName: 'Omeprazol', narcoticClass: undefined },
  ];

  findAll(): Drug[] {
    return this.drugs;
  }

  findOne(atcCode: string): Drug | undefined {
    return this.drugs.find((d) => d.atcCode === atcCode);
  }
}
