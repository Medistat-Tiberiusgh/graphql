import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Region {
  @Field()
  regionCode: string;

  @Field()
  regionName: string;
}
