import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Drug {
  @Field()
  atcCode: string;

  @Field()
  atcName: string;

  @Field({ nullable: true })
  narcoticClass?: string;
}
