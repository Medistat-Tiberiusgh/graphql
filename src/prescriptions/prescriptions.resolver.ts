import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { Prescription } from './prescription.model';
import { PrescriptionsService } from './prescriptions.service';

@Resolver(() => Prescription)
export class PrescriptionsResolver {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Query(() => [Prescription])
  prescriptions(): Prescription[] {
    return this.prescriptionsService.findAll();
  }

  @Query(() => Prescription, { nullable: true })
  prescription(@Args('id', { type: () => Int }) id: number): Prescription | undefined {
    return this.prescriptionsService.findOne(id);
  }
}
