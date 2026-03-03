import { Module } from '@nestjs/common';
import { PrescriptionsResolver } from './prescriptions.resolver';
import { PrescriptionsService } from './prescriptions.service';

@Module({
  providers: [PrescriptionsResolver, PrescriptionsService],
})
export class PrescriptionsModule {}
