import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { DrugsResolver } from './drugs.resolver';
import { DrugsService } from './drugs.service';

@Module({
  imports: [DatabaseModule],
  providers: [DrugsResolver, DrugsService],
  exports: [DrugsService],
})
export class DrugsModule {}
