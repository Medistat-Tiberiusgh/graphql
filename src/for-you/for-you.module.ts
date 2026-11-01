import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ForYouResolver } from './for-you.resolver';
import { ForYouService } from './for-you.service';

@Module({
  imports: [DatabaseModule],
  providers: [ForYouService, ForYouResolver],
})
export class ForYouModule {}
