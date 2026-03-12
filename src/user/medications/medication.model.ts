import { Field, ObjectType } from '@nestjs/graphql';
import { Drug } from '../../drugs/drug.model';
import { DrugInsights } from './insights/insights.model';

@ObjectType()
export class UserMedication {
  @Field()
  atc: string;

  @Field({ nullable: true })
  notes?: string;

  @Field()
  addedAt: Date;

  @Field(() => Drug, { nullable: true })
  drug?: Drug;

  @Field(() => DrugInsights, { nullable: true })
  insights?: DrugInsights;
}
