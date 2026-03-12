import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { UserMedicationsResolver } from './user-medications.resolver';
import { UserMedicationsService } from './user-medications.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  providers: [UserMedicationsResolver, UserMedicationsService],
})
export class UserMedicationsModule {}
