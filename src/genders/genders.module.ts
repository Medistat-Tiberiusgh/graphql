import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { GendersResolver } from './genders.resolver';
import { GendersService } from './genders.service';

@Module({
  imports: [DatabaseModule],
  providers: [GendersResolver, GendersService],
})
export class GendersModule {}
