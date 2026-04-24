import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { DrugsResolver } from './drugs.resolver';
import { DrugsService } from './drugs.service';
import { DrugInfoService } from './drug-info.service';
import { DrugsDataLoaders } from './drugs.dataloaders';

@Module({
  imports: [DatabaseModule],
  providers: [DrugsResolver, DrugsService, DrugInfoService, DrugsDataLoaders],
  exports: [DrugsService, DrugInfoService, DrugsDataLoaders],
})
export class DrugsModule {}
