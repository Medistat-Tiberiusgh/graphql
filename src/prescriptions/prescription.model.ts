import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Prescription {
  @Field(() => Int)
  year: number;

  @Field()
  region: string;

  @Field()
  atcCode: string;

  @Field()
  gender: string;

  @Field()
  ageGroup: string;

  @Field(() => Int)
  numberOfPrescriptions: number;

  @Field(() => Int)
  numberOfPatients: number;

  @Field(() => Float)
  per1000: number;
}
