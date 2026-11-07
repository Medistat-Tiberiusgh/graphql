import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../user/auth/auth.module';
import { ForYouResolver, MeForYouResolver } from './for-you.resolver';
import { ForYouService } from './for-you.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  providers: [ForYouService, ForYouResolver, MeForYouResolver],
})
export class ForYouModule {}
