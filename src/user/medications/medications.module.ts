import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { DrugsModule } from '../../drugs/drugs.module';
import { AuthModule } from '../auth/auth.module';
import { InsightsModule } from './insights/insights.module';
import { UserMedicationsResolver, UserMedicationResolver } from './medications.resolver';
import { UserMedicationsService } from './medications.service';

@Module({
  imports: [DatabaseModule, AuthModule, InsightsModule, DrugsModule],
  providers: [UserMedicationsResolver, UserMedicationResolver, UserMedicationsService],
})
export class UserMedicationsModule {}
