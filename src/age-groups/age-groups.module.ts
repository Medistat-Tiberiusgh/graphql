import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AgeGroupsResolver } from './age-groups.resolver';
import { AgeGroupsService } from './age-groups.service';

@Module({
  imports: [DatabaseModule],
  providers: [AgeGroupsResolver, AgeGroupsService],
})
export class AgeGroupsModule {}
