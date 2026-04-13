import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class DrugInfo {
  @Field()
  atcCode!: string;

  @Field({ nullable: true })
  indication?: string;

  @Field({ nullable: true })
  howToUse?: string;

  @Field({ nullable: true })
  otherUses?: string;

  @Field({ nullable: true })
  precautions?: string;

  @Field({ nullable: true })
  sideEffects?: string;

  @Field({ nullable: true })
  otherInfo?: string;

  @Field({ nullable: true })
  sourceUrl?: string;

  @Field({ nullable: true })
  cachedAt?: string;
}
