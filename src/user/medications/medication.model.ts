import { Field, ObjectType } from '@nestjs/graphql';
import { Drug } from '../../drugs/drug.model';

@ObjectType()
export class UserMedication {
  atc: string;

  @Field({ nullable: true })
  notes?: string;

  @Field()
  addedAt!: Date;

  @Field(() => Drug, { nullable: true })
  drugData?: Drug;
}

@ObjectType()
export class Me {
  userId!: number;

  @Field(() => [UserMedication])
  medications!: UserMedication[];
}
