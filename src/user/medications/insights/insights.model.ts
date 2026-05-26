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

  @Field(() => Int)
  genderId!: number;

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
  @Field(() => Int)
  genderId!: number;

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
    'Aggregated insights for a drug. Each field accepts its own filters; arguments are scoped to the dimensions the field does not enumerate.',
})
export class DrugInsights {
  // Carries the ATC code into ResolveField methods; not exposed in the schema.
  atcCode!: string;
}
