import {
  Args,
  Mutation,
  Parent,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/current-user.decorator';
import { Me } from '../me/me.model';
import { UserMedication } from './medication.model';
import { UserMedicationsService } from './medications.service';
import { Drug } from '../../drugs/drug.model';
import { DrugsDataLoaders } from '../../drugs/drugs.dataloaders';

@Resolver(() => Me)
@UseGuards(JwtAuthGuard)
export class UserMedicationsResolver {
  constructor(private readonly service: UserMedicationsService) {}

  @ResolveField(() => [UserMedication])
  medications(@Parent() parent: Me): Promise<UserMedication[]> {
    return this.service.findAllForUser(parent.userId);
  }

  @Mutation(() => UserMedication)
  addMedication(
    @CurrentUser() user: JwtPayload,
    @Args('atc') atc: string,
  ): Promise<UserMedication> {
    return this.service.add(user.sub, atc);
  }

  @Mutation(() => UserMedication)
  removeMedication(
    @CurrentUser() user: JwtPayload,
    @Args('atc') atc: string,
  ): Promise<UserMedication> {
    return this.service.remove(user.sub, atc);
  }
}

@Resolver(() => UserMedication)
export class UserMedicationResolver {
  constructor(private readonly loaders: DrugsDataLoaders) {}

  @ResolveField(() => Drug, { nullable: true })
  drugData(@Parent() med: UserMedication): Promise<Drug | undefined> {
    return this.loaders.drugByAtcCode.load(med.atc);
  }
}
