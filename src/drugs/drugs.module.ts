import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { DrugsResolver } from './drugs.resolver';
import { DrugsService } from './drugs.service';
import { DrugInfoService } from './drug-info.service';

@Module({
  imports: [DatabaseModule],
  providers: [DrugsResolver, DrugsService, DrugInfoService],
  exports: [DrugsService, DrugInfoService],
})
export class DrugsModule {}
