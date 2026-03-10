import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { PrescriptionDataLoaders } from './prescription.dataloaders';
import { PrescriptionsResolver } from './prescriptions.resolver';
import { PrescriptionsService } from './prescriptions.service';

@Module({
  imports: [DatabaseModule],
  providers: [
    PrescriptionsResolver,
    PrescriptionsService,
    PrescriptionDataLoaders,
  ],
})
export class PrescriptionsModule {}
