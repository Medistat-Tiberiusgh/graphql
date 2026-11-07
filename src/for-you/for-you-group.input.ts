import { Field, InputType, Int } from '@nestjs/graphql';

@InputType({
  description:
    'A group to explore instead of the saved profile; null means "all"',
})
export class ForYouGroupInput {
  @Field(() => Int, { nullable: true })
  regionId!: number | null;

  @Field(() => Int, { nullable: true })
  genderId!: number | null;

  @Field(() => Int, { nullable: true })
  ageGroupId!: number | null;
}
