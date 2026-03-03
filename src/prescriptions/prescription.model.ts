import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Prescription {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  year: number;

  @Field()
  region: string;

  @Field()
  atcCode: string;

  @Field()
  sex: string;

  @Field()
  ageGroup: string;

  @Field(() => Int)
  numberOfDispensings: number;

  @Field(() => Int)
  numberOfPatients: number;

  @Field(() => Float)
  per1000: number;
}
