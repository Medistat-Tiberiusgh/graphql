import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class RegionalStat {
  @Field(() => Int)
  regionId!: number;

  @Field()
  regionName!: string;

  @Field(() => Float)
  per1000!: number;
}

@ObjectType()
export class TrendPoint {
  @Field(() => Int)
  year!: number;

  @Field(() => Int)
  totalPrescriptions!: number;

  @Field(() => Int)
  totalPatients!: number;

  @Field(() => Float)
  per1000!: number;
}

@ObjectType()
export class GenderSplitPoint {
  @Field(() => Int)
  year!: number;

  @Field()
  gender!: string;

  @Field(() => Float)
  per1000!: number;
}

@ObjectType()
export class AgeSplitPoint {
  @Field(() => Int)
  year!: number;

  @Field(() => Int)
  ageGroupId!: number;

  @Field()
  ageGroupName!: string;

  @Field(() => Float)
  per1000!: number;
}

@ObjectType()
export class DemographicCell {
  @Field()
  gender!: string;

  @Field(() => Int)
  ageGroupId!: number;

  @Field()
  ageGroupName!: string;

  @Field(() => Float)
  per1000!: number;
}

@ObjectType({
  description:
    'Aggregated insights for a drug. All fields are independently resolved and filtered by the arguments passed to the drugInsights query.',
})
export class DrugInsights {
  // Internal context fields — not exposed in the schema, used by ResolveField methods
  atcCode?: string;
  year?: number;
  region?: number;
  gender?: number;
  ageGroup?: number;

  @Field(() => [RegionalStat])
  regionalPopularity!: RegionalStat[];

  @Field(() => [TrendPoint])
  trend!: TrendPoint[];

  @Field(() => [GenderSplitPoint])
  genderSplit!: GenderSplitPoint[];

  @Field(() => [AgeSplitPoint])
  ageSplit!: AgeSplitPoint[];

  @Field(() => [DemographicCell])
  demographicGrid!: DemographicCell[];
}
