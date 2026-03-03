import { Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { SqlDatabaseService } from './sql-database.service';

@Module({
  providers: [
    {
      provide: DatabaseService,
      useClass: SqlDatabaseService,
    },
  ],
  exports: [DatabaseService],
})
export class DatabaseModule {}
