import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PrescriptionsConnection {
  @Field(() => [Prescription])
  items: Prescription[];

  @Field(() => Int)
  totalCount: number;

  @Field()
  hasNextPage: boolean;

  @Field()
  hasPreviousPage: boolean;
}

@ObjectType()
export class Prescription {
  @Field(() => Int)
  year: number;

  @Field(() => Int)
  region: number;

  @Field()
  atcCode: string;

  @Field(() => Int)
  gender: number;

  @Field(() => Int)
  ageGroup: number;

  @Field(() => Int)
  numberOfPrescriptions: number;

  @Field(() => Int)
  numberOfPatients: number;

  @Field(() => Float)
  per1000: number;
}
