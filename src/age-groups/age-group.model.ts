import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AgeGroup {
  @Field(() => Int)
  id: number;

  @Field()
  name: string;
}
