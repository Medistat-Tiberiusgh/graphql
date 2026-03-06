import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { PrescriptionsResolver } from './prescriptions.resolver';
import { PrescriptionsService } from './prescriptions.service';

@Module({
  imports: [DatabaseModule],
  providers: [PrescriptionsResolver, PrescriptionsService],
})
export class PrescriptionsModule {}
