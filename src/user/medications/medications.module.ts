import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { UserMedicationsResolver } from './medications.resolver';
import { UserMedicationsService } from './medications.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  providers: [UserMedicationsResolver, UserMedicationsService],
})
export class UserMedicationsModule {}
