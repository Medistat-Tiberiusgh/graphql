import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { Drug } from '../drugs/drug.model';

export interface DemographicGroup {
  region: number;
  gender: number;
  ageGroup: number;
}

@ObjectType({
  description: 'A demographic group; null means "all" for that dimension',
})
export class ComparisonGroup {
  @Field(() => Int, { nullable: true })
  regionId!: number | null;

  @Field(() => Int, { nullable: true })
  genderId!: number | null;

  @Field(() => Int, { nullable: true })
  ageGroupId!: number | null;
}

@ObjectType()
export class ForYou {
  group!: DemographicGroup;
  baseline!: DemographicGroup;

  @Field(() => ComparisonGroup, {
    description:
      'The group moreCommon, lessCommon and mostDispensed compare against',
  })
  comparedWith!: ComparisonGroup;

  @Field(() => Int)
  latestYear!: number;

  @Field(() => Int)
  trendStartYear!: number;
}

@ObjectType()
export class ComparisonItem {
  @Field(() => Drug)
  drug!: Drug;

  @Field(() => Float)
  per1000!: number;

  @Field(() => Float, { description: 'Rate in the comparedWith group' })
  baselinePer1000!: number;

  @Field(() => Float, { description: 'per1000 divided by baselinePer1000' })
  ratio!: number;
}

@ObjectType()
export class MostDispensedItem {
  @Field(() => Drug)
  drug!: Drug;

  @Field(() => Float)
  per1000!: number;

  @Field(() => Float, {
    nullable: true,
    description: 'Rate in the comparedWith group; null when it has no data',
  })
  baselinePer1000!: number | null;
}

@ObjectType()
export class YearRate {
  @Field(() => Int)
  year!: number;

  @Field(() => Float)
  per1000!: number;
}

@ObjectType()
export class GrowthItem {
  @Field(() => Drug)
  drug!: Drug;

  @Field(() => Float, {
    description:
      'Rate in the latest year divided by the rate in trendStartYear',
  })
  growth!: number;

  @Field(() => [YearRate])
  trend!: YearRate[];
}
