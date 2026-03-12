import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../database/database.module';
import { InsightsService } from './insights.service';

@Module({
  imports: [DatabaseModule],
  providers: [InsightsService],
  exports: [InsightsService],
})
export class InsightsModule {}
