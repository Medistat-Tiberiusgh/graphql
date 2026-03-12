import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class RegionalStat {
  @Field(() => Int)
  regionId: number;

  @Field()
  regionName: string;

  @Field(() => Float)
  per1000: number;
}

@ObjectType()
export class DrugInsights {
  @Field(() => [RegionalStat])
  regionalPopularity: RegionalStat[];
}
