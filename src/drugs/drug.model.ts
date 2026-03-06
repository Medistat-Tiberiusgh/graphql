import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Drug {
  @Field()
  atcCode: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  narcoticClass?: string;
}
