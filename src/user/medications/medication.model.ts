import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class UserMedication {
  @Field()
  atc: string;

  @Field({ nullable: true })
  notes?: string;

  @Field()
  addedAt: Date;
}
