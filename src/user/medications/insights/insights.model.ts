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

@ObjectType({
  description:
    'Currently containing only regionalPopularity, but wrapped in DrugInsights to allow further insight dimensions to be added in the future.',
})
export class DrugInsights {
  @Field(() => [RegionalStat])
  regionalPopularity: RegionalStat[];
}
