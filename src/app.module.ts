import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigModule } from '@nestjs/config';
import { graphqlConfig } from './config/graphql.config';
import { DatabaseModule } from './database/database.module';
import { PrescriptionsModule } from './prescriptions/prescriptions.module';
import { DrugsModule } from './drugs/drugs.module';
import { RegionsModule } from './regions/regions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    GraphQLModule.forRoot<ApolloDriverConfig>(graphqlConfig),
    DatabaseModule,
    PrescriptionsModule,
    DrugsModule,
    RegionsModule,
  ],
})
export class AppModule {}
