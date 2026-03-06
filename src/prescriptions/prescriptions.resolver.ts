import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { Prescription } from './prescription.model';
import { PrescriptionsService } from './prescriptions.service';

@Resolver(() => Prescription)
export class PrescriptionsResolver {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Query(() => [Prescription])
  async prescriptions(): Promise<Prescription[]> {
    return this.prescriptionsService.findAll();
  }
}
