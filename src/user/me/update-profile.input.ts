import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class UpdateProfileInput {
  @Field(() => Int, { nullable: true })
  regionId!: number | null;

  @Field(() => Int, { nullable: true })
  genderId!: number | null;

  @Field(() => Int, { nullable: true })
  ageGroupId!: number | null;
}
