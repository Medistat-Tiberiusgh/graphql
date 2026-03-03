import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { RegionsResolver } from './regions.resolver';
import { RegionsService } from './regions.service';

@Module({
  imports: [DatabaseModule],
  providers: [RegionsResolver, RegionsService],
})
export class RegionsModule {}
