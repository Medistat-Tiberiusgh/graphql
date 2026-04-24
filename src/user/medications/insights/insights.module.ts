import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../database/database.module';
import { AuthModule } from '../../auth/auth.module';
import { InsightsResolver } from './insights.resolver';
import { InsightsService } from './insights.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  providers: [InsightsService, InsightsResolver],
  exports: [InsightsService],
})
export class InsightsModule {}
