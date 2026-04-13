import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { DrugInfo } from './drug-info.model';

const CACHE_MAX_AGE_DAYS = 30;
const USER_AGENT = 'tg222hh@student.lnu.se drug-info-service/1.0';

const RXNORM_ATC_URL = 'https://rxnav.nlm.nih.gov/REST/rxcui.json?idtype=ATC&id=';
const MEDLINEPLUS_CONNECT_URL =
  'https://connect.medlineplus.gov/application' +
  '?mainSearchCriteria.v.cs=2.16.840.1.113883.6.88' +
  '&mainSearchCriteria.v.c=';

@Injectable()
export class DrugInfoService {
  private readonly logger = new Logger(DrugInfoService.name);

  constructor(private readonly db: DatabaseService) {}

  async getDrugInfo(atcCode: string): Promise<DrugInfo | null> {
    const atc = atcCode.toUpperCase();

    const cached = await this.getCached(atc);
    if (cached) return cached;

    this.logger.log(`Cache miss for ${atc} — fetching from MedlinePlus`);
    const info = await this.fetchFromMedlinePlus(atc);
    if (info) await this.upsertCache(atc, info);
    return info;
  }

  // ---------------------------------------------------------------------------
  // Cache helpers
  // ---------------------------------------------------------------------------

  private async getCached(atc: string): Promise<DrugInfo | null> {
    const rows = await this.db.query<{ data: Record<string, string>; scraped_at: Date }>(
      `SELECT data, scraped_at FROM drug_info
       WHERE atc = $1 AND scraped_at > NOW() - INTERVAL '${CACHE_MAX_AGE_DAYS} days'`,
      [atc],
    );
    if (!rows.length) return null;
    return this.toModel(atc, rows[0].data, rows[0].scraped_at);
  }

  private async upsertCache(atc: string, info: DrugInfo): Promise<void> {
    const { atcCode, cachedAt, ...data } = info;
    await this.db.query(
      `INSERT INTO drug_info (atc, data, scraped_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (atc) DO UPDATE
         SET data = EXCLUDED.data, scraped_at = EXCLUDED.scraped_at`,
      [atc, JSON.stringify(data)],
    );
  }

  private toModel(atc: string, data: Record<string, string>, scrapedAt: Date): DrugInfo {
    const info = new DrugInfo();
    info.atcCode = atc;
    info.indication = data.indication;
    info.howToUse = data.howToUse;
    info.otherUses = data.otherUses;
    info.precautions = data.precautions;
    info.sideEffects = data.sideEffects;
    info.otherInfo = data.otherInfo;
    info.sourceUrl = data.sourceUrl;
    info.cachedAt = scrapedAt.toISOString();
    return info;
  }

  // ---------------------------------------------------------------------------
  // Fetch pipeline: ATC → rxcui → MedlinePlus URL → parse
  // ---------------------------------------------------------------------------

  private async fetchFromMedlinePlus(atc: string): Promise<DrugInfo | null> {
    const rxcui = await this.resolveRxcui(atc);
    if (!rxcui) { this.logger.warn(`No rxcui for ATC ${atc}`); return null; }

    const pageUrl = await this.resolveMedlinePlusUrl(rxcui);
    if (!pageUrl) { this.logger.warn(`No MedlinePlus page for rxcui ${rxcui}`); return null; }

    const sections = await this.parsePage(pageUrl);
    if (!sections) { this.logger.warn(`Failed to parse ${pageUrl}`); return null; }

    const info = new DrugInfo();
    info.atcCode    = atc;
    info.indication = sections.why;
    info.howToUse   = sections.how;
    info.otherUses  = sections.otherUses;
    info.precautions= sections.precautions;
    info.sideEffects= sections.sideEffects;
    info.otherInfo  = sections.otherInfo;
    info.sourceUrl  = pageUrl;
    info.cachedAt   = new Date().toISOString();
    return info;
  }

  private async resolveRxcui(atc: string): Promise<string | null> {
    const res = await fetch(RXNORM_ATC_URL + atc, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) return null;
    const json = await res.json() as { idGroup?: { rxnormId?: string[] } };
    return json.idGroup?.rxnormId?.[0] ?? null;
  }

  private async resolveMedlinePlusUrl(rxcui: string): Promise<string | null> {
    const res = await fetch(MEDLINEPLUS_CONNECT_URL + rxcui, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) return null;
    const html = await res.text();
    const match = html.match(/href="(https:\/\/medlineplus\.gov\/druginfo\/meds\/[^"?]+)/);
    return match?.[1] ?? null;
  }

  private async parsePage(url: string): Promise<{
    why?: string; how?: string; otherUses?: string;
    precautions?: string; sideEffects?: string; otherInfo?: string;
  } | null> {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) return null;
    const html = await res.text();

    return {
      why:         this.extractSection(html, 'Why is this medication prescribed?'),
      how:         this.extractSection(html, 'How should this medicine be used?'),
      otherUses:   this.extractSection(html, 'Other uses for this medicine'),
      precautions: this.extractSection(html, 'What special precautions should I follow?'),
      sideEffects: this.extractSection(html, 'What side effects can this medication cause?'),
      otherInfo:   this.extractSection(html, 'What other information should I know?'),
    };
  }

  private extractSection(html: string, heading: string): string | undefined {
    const parts = html.split(/(?=<h2[^>]*>)/);
    for (const part of parts) {
      const h2Match = part.match(/<h2[^>]*>(.*?)<\/h2>/s);
      if (!h2Match) continue;
      const h2Text = h2Match[1].replace(/<[^>]+>/g, '').trim();
      if (h2Text.startsWith(heading)) {
        const text = part
          .replace(/<h2[^>]*>.*?<\/h2>/s, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        return text || undefined;
      }
    }
    return undefined;
  }
}
