import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { MeResolver } from './me.resolver';

@Module({
  imports: [AuthModule, UsersModule],
  providers: [MeResolver],
})
export class MeModule {}
