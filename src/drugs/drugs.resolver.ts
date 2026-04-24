import { Args, Query, Resolver } from '@nestjs/graphql';
import { Drug } from './drug.model';
import { DrugInfo } from './drug-info.model';
import { DrugsService } from './drugs.service';
import { DrugInfoService } from './drug-info.service';

@Resolver(() => Drug)
export class DrugsResolver {
  constructor(
    private readonly drugsService: DrugsService,
    private readonly drugInfoService: DrugInfoService,
  ) {}

  @Query(() => [Drug])
  async drugs(): Promise<Drug[]> {
    return this.drugsService.findAll();
  }

  @Query(() => Drug)
  async drug(@Args('atcCode') atcCode: string): Promise<Drug> {
    return this.drugsService.findOne(atcCode);
  }

  @Query(() => [Drug])
  async searchDrugs(@Args('query') query: string): Promise<Drug[]> {
    return this.drugsService.search(query);
  }

  @Query(() => DrugInfo, { nullable: true })
  async drugInfo(@Args('atcCode') atcCode: string): Promise<DrugInfo | null> {
    return this.drugInfoService.getDrugInfo(atcCode);
  }
}
