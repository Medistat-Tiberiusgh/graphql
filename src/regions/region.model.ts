import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Region {
  @Field(() => Int)
  id!: number;

  @Field()
  regionName!: string;
}
