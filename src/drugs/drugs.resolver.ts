import { Args, Query, Resolver } from '@nestjs/graphql';
import { Drug } from './drug.model';
import { DrugsService } from './drugs.service';

@Resolver(() => Drug)
export class DrugsResolver {
  constructor(private readonly drugsService: DrugsService) {}

  @Query(() => [Drug])
  drugs(): Drug[] {
    return this.drugsService.findAll();
  }

  @Query(() => Drug, { nullable: true })
  drug(@Args('atcCode') atcCode: string): Drug | undefined {
    return this.drugsService.findOne(atcCode);
  }
}
