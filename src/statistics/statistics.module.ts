import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { DrugsModule } from '../drugs/drugs.module';
import { StatisticsDataLoaders } from './statistics.dataloaders';
import { StatisticsResolver } from './statistics.resolver';
import { StatisticsService } from './statistics.service';

@Module({
  imports: [DatabaseModule, DrugsModule],
  providers: [StatisticsResolver, StatisticsService, StatisticsDataLoaders],
  exports: [StatisticsService],
})
export class StatisticsModule {}
