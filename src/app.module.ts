import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { graphqlConfig } from './config/graphql.config';
import { DatabaseModule } from './database/database.module';
import { StatisticsModule } from './statistics/statistics.module';
import { DrugsModule } from './drugs/drugs.module';
import { RegionsModule } from './regions/regions.module';
import { AgeGroupsModule } from './age-groups/age-groups.module';
import { GendersModule } from './genders/genders.module';
import { AuthModule } from './user/auth/auth.module';
import { UserMedicationsModule } from './user/medications/medications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 1000 }]),
    GraphQLModule.forRoot<ApolloDriverConfig>(graphqlConfig),
    DatabaseModule,
    AuthModule,
    StatisticsModule,
    DrugsModule,
    RegionsModule,
    AgeGroupsModule,
    GendersModule,
    UserMedicationsModule,
  ],
})
export class AppModule {}
