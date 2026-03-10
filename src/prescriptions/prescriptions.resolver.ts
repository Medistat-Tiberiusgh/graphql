import { Args, Float, Int, Mutation, Query, ResolveField, Resolver, Parent } from '@nestjs/graphql';
import { Prescription, PrescriptionsConnection } from './prescription.model';
import { PrescriptionsService } from './prescriptions.service';
import { DrugsService } from '../drugs/drugs.service';
import { Drug } from '../drugs/drug.model';
import { RegionsService } from '../regions/regions.service';
import { Region } from '../regions/region.model';

@Resolver(() => Prescription)
export class PrescriptionsResolver {
  constructor(
    private readonly prescriptionsService: PrescriptionsService,
    private readonly drugsService: DrugsService,
    private readonly regionsService: RegionsService,
  ) {}

  @ResolveField(() => Drug, { nullable: true })
  async drug(@Parent() prescription: Prescription): Promise<Drug | undefined> {
    return this.drugsService.findOne(prescription.atcCode);
  }

  @ResolveField(() => Region, { nullable: true })
  async regionData(@Parent() prescription: Prescription): Promise<Region | undefined> {
    return this.regionsService.findOne(String(prescription.region));
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
    return this.prescriptionsService.findAll(limit, offset, { year, region, atcCode, gender, ageGroup });
  }

  @Query(() => Prescription, { nullable: true })
  async prescription(
    @Args('year', { type: () => Int }) year: number,
    @Args('region', { type: () => Int }) region: number,
    @Args('atcCode') atcCode: string,
    @Args('gender', { type: () => Int }) gender: number,
    @Args('ageGroup', { type: () => Int }) ageGroup: number,
  ): Promise<Prescription | undefined> {
    return this.prescriptionsService.findOne(year, region, atcCode, gender, ageGroup);
  }

  @Mutation(() => Prescription)
  async createPrescription(
    @Args('year', { type: () => Int }) year: number,
    @Args('region', { type: () => Int }) region: number,
    @Args('atcCode') atcCode: string,
    @Args('gender', { type: () => Int }) gender: number,
    @Args('ageGroup', { type: () => Int }) ageGroup: number,
    @Args('numberOfPrescriptions', { type: () => Int }) numberOfPrescriptions: number,
    @Args('numberOfPatients', { type: () => Int }) numberOfPatients: number,
    @Args('per1000', { type: () => Float }) per1000: number,
  ): Promise<Prescription> {
    return this.prescriptionsService.create(year, region, atcCode, gender, ageGroup, numberOfPrescriptions, numberOfPatients, per1000);
  }

  @Mutation(() => Prescription, { nullable: true })
  async updatePrescription(
    @Args('year', { type: () => Int }) year: number,
    @Args('region', { type: () => Int }) region: number,
    @Args('atcCode') atcCode: string,
    @Args('gender', { type: () => Int }) gender: number,
    @Args('ageGroup', { type: () => Int }) ageGroup: number,
    @Args('numberOfPrescriptions', { type: () => Int }) numberOfPrescriptions: number,
    @Args('numberOfPatients', { type: () => Int }) numberOfPatients: number,
    @Args('per1000', { type: () => Float }) per1000: number,
  ): Promise<Prescription | undefined> {
    return this.prescriptionsService.update(year, region, atcCode, gender, ageGroup, numberOfPrescriptions, numberOfPatients, per1000);
  }

  @Mutation(() => Boolean)
  async deletePrescription(
    @Args('year', { type: () => Int }) year: number,
    @Args('region', { type: () => Int }) region: number,
    @Args('atcCode') atcCode: string,
    @Args('gender', { type: () => Int }) gender: number,
    @Args('ageGroup', { type: () => Int }) ageGroup: number,
  ): Promise<boolean> {
    return this.prescriptionsService.delete(year, region, atcCode, gender, ageGroup);
  }
}
