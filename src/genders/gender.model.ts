import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Gender {
  @Field(() => Int)
  id: number;

  @Field()
  name: string;
}
