import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Me {
  userId!: string;

  @Field(() => Int, { nullable: true })
  regionId!: number | null;

  @Field(() => Int, { nullable: true })
  genderId!: number | null;

  @Field(() => Int, { nullable: true })
  ageGroupId!: number | null;
}
