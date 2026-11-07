import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../user/auth/auth.module';
import {
  ChangesResolver,
  ForYouResolver,
  MeForYouResolver,
} from './for-you.resolver';
import { ForYouService } from './for-you.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  providers: [ForYouService, ForYouResolver, MeForYouResolver, ChangesResolver],
})
export class ForYouModule {}
