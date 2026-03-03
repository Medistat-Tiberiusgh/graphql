import { Module } from '@nestjs/common';
import { DrugsResolver } from './drugs.resolver';
import { DrugsService } from './drugs.service';

@Module({
  providers: [DrugsResolver, DrugsService],
})
export class DrugsModule {}
