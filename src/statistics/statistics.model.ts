import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';
import { AgeGroup } from '../age-groups/age-group.model';
import { Drug } from '../drugs/drug.model';
import { Gender } from '../genders/gender.model';
import { Region } from '../regions/region.model';

@ObjectType()
export class StatisticsConnection {
  @Field(() => [Statistic])
  items: Statistic[];

  @Field(() => Int)
  totalCount: number;

  @Field()
  hasNextPage: boolean;

  @Field()
  hasPreviousPage: boolean;
}

@ObjectType()
export class Statistic {
  @Field(() => ID)
  id: string;

  @Field(() => Int)
  year: number;

  region: number;

  atcCode: string;

  gender: number;

  @Field(() => Gender, { nullable: true })
  genderData?: Gender;

  ageGroup: number;

  @Field(() => AgeGroup, { nullable: true })
  ageGroupData?: AgeGroup;

  @Field(() => Int)
  numberOfPrescriptions: number;

  @Field(() => Int)
  numberOfPatients: number;

  @Field(() => Float)
  per1000: number;

  @Field(() => Drug, { nullable: true })
  drugData?: Drug;

  @Field(() => Region, { nullable: true })
  regionData?: Region;
}
