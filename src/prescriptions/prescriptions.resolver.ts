import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { Prescription } from './prescription.model';
import { PrescriptionsService } from './prescriptions.service';

@Resolver(() => Prescription)
export class PrescriptionsResolver {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Query(() => [Prescription])
  async prescriptions(
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
  ): Promise<Prescription[]> {
    return this.prescriptionsService.findAll(limit, offset);
  }
}
