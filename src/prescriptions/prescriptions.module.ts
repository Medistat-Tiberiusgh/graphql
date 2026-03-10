import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { DrugsModule } from '../drugs/drugs.module';
import { PrescriptionsResolver } from './prescriptions.resolver';
import { PrescriptionsService } from './prescriptions.service';

@Module({
  imports: [DatabaseModule, DrugsModule],
  providers: [PrescriptionsResolver, PrescriptionsService],
})
export class PrescriptionsModule {}
