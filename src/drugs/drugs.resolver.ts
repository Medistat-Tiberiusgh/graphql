import { Args, Query, Resolver } from '@nestjs/graphql';
import { Drug } from './drug.model';
import { DrugsService } from './drugs.service';

@Resolver(() => Drug)
export class DrugsResolver {
  constructor(private readonly drugsService: DrugsService) {}

  @Query(() => [Drug])
  async drugs(): Promise<Drug[]> {
    return this.drugsService.findAll();
  }

  @Query(() => Drug)
  async drug(@Args('atcCode') atcCode: string): Promise<Drug> {
    return this.drugsService.findOne(atcCode);
  }
}
