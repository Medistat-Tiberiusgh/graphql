import {
  Args,
  ID,
  Int,
  Query,
  ResolveField,
  Resolver,
  Parent,
} from '@nestjs/graphql';
import { Prescription, PrescriptionsConnection } from './prescription.model';
import { PrescriptionsService } from './prescriptions.service';
import { PrescriptionDataLoaders } from './prescription.dataloaders';
import { Drug } from '../drugs/drug.model';
import { Region } from '../regions/region.model';

@Resolver(() => Prescription)
export class PrescriptionsResolver {
  constructor(
    private readonly prescriptionsService: PrescriptionsService,
    private readonly loaders: PrescriptionDataLoaders,
  ) {}

  @ResolveField(() => ID)
  id(@Parent() prescription: Prescription): string {
    return Buffer.from(
      `${prescription.year}:${prescription.region}:${prescription.atcCode}:${prescription.gender}:${prescription.ageGroup}`,
    ).toString('base64');
  }

  @ResolveField(() => Drug, { nullable: true })
  async drug(@Parent() prescription: Prescription): Promise<Drug | undefined> {
    return this.loaders.drugByAtcCode.load(prescription.atcCode);
  }

  @ResolveField(() => Region, { nullable: true })
  async regionData(
    @Parent() prescription: Prescription,
  ): Promise<Region | undefined> {
    return this.loaders.regionById.load(String(prescription.region));
  }

  @Query(() => PrescriptionsConnection)
  async prescriptions(
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
    @Args('year', { type: () => Int, nullable: true }) year?: number,
    @Args('region', { type: () => Int, nullable: true }) region?: number,
    @Args('atcCode', { nullable: true }) atcCode?: string,
    @Args('gender', { type: () => Int, nullable: true }) gender?: number,
    @Args('ageGroup', { type: () => Int, nullable: true }) ageGroup?: number,
  ): Promise<PrescriptionsConnection> {
    return this.prescriptionsService.findAll(limit, offset, {
      year,
      region,
      atcCode,
      gender,
      ageGroup,
    });
  }

  @Query(() => Prescription, { nullable: true })
  async prescription(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<Prescription | undefined> {
    const [year, region, atcCode, gender, ageGroup] = Buffer.from(id, 'base64')
      .toString()
      .split(':');
    return this.prescriptionsService.findOne(
      +year,
      +region,
      atcCode,
      +gender,
      +ageGroup,
    );
  }

}
