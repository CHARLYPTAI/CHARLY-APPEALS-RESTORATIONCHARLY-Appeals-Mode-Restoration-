import { MemoryCache } from '../utils/cache.js';

interface JurisdictionData {
  jurisdiction_id: string;
  name: string;
  state: string;
  appeal_window_start: string;
  appeal_window_end: string;
  deadline_rule: string;
  fee: string;
  forms: string[];
  efile_available: boolean;
  evidence_preshare_required: boolean;
  decision_standard: string;
  citations: string[];
}

export class JurisdictionService {
  private jurisdictions: Map<string, JurisdictionData> = new Map();
  private jurisdictionsByState: Map<string, JurisdictionData[]> = new Map();
  private allJurisdictionsArray: JurisdictionData[] = [];
  private cache = new MemoryCache<JurisdictionData | JurisdictionData[]>(300000); // 5 min TTL
  private cacheEnabled: boolean;

  constructor() {
    this.cacheEnabled = process.env.JURISDICTION_CACHE === 'true';
    this.loadSeedData();
  }

  async getJurisdiction(id: string): Promise<JurisdictionData> {
    if (this.cacheEnabled) {
      const cached = this.cache.get(`jurisdiction:${id}`) as JurisdictionData;
      if (cached) return cached;
    }

    const jurisdiction = this.jurisdictions.get(id);
    if (!jurisdiction) {
      throw new Error(`Jurisdiction ${id} not found`);
    }

    if (this.cacheEnabled) {
      this.cache.set(`jurisdiction:${id}`, jurisdiction);
    }

    return jurisdiction;
  }

  async getJurisdictions(state?: string): Promise<JurisdictionData[]> {
    const cacheKey = state && state.trim() !== '' ? `jurisdictions:state:${state}` : 'jurisdictions:all';

    if (this.cacheEnabled) {
      const cached = this.cache.get(cacheKey) as JurisdictionData[];
      if (cached) return cached;
    }

    let result: JurisdictionData[];
    if (state && state.trim() !== '') {
      result = this.jurisdictionsByState.get(state) || [];
    } else {
      result = this.allJurisdictionsArray;
    }

    if (this.cacheEnabled) {
      this.cache.set(cacheKey, result);
    }
    
    return result;
  }

  private loadSeedData(): void {
    const seedJurisdictions: JurisdictionData[] = [
      {
        jurisdiction_id: 'harris-county-tx',
        name: 'Harris County',
        state: 'TX',
        appeal_window_start: 'January 1',
        appeal_window_end: 'March 31',
        deadline_rule: '30 days after notice of appraised value',
        fee: '$250-$500 depending on property value',
        forms: ['50-132 Notice of Protest', '50-139 Owner Statement'],
        efile_available: true,
        evidence_preshare_required: true,
        decision_standard: 'Preponderance of evidence',
        citations: ['Texas Property Tax Code § 41.43', 'Texas Property Tax Code § 41.44']
      },
      {
        jurisdiction_id: 'cook-county-il',
        name: 'Cook County',
        state: 'IL',
        appeal_window_start: 'Upon receipt of assessment notice',
        appeal_window_end: '30 days after notice',
        deadline_rule: '30 days from assessment notice date',
        fee: '$50-$200 based on assessment',
        forms: ['Residential Appeal Form', 'Commercial Appeal Form'],
        efile_available: false,
        evidence_preshare_required: false,
        decision_standard: 'Clear and convincing evidence',
        citations: ['35 ILCS 200/16-180', '35 ILCS 200/16-185']
      },
      {
        jurisdiction_id: 'maricopa-county-az',
        name: 'Maricopa County',
        state: 'AZ',
        appeal_window_start: 'September 1',
        appeal_window_end: 'December 31',
        deadline_rule: '60 days after notice of value',
        fee: '$25-$150 sliding scale',
        forms: ['Value Appeal Petition', 'Property Record Card'],
        efile_available: true,
        evidence_preshare_required: false,
        decision_standard: 'Preponderance of evidence',
        citations: ['Arizona Revised Statutes § 42-16051', 'Arizona Revised Statutes § 42-16052']
      }
    ];

    seedJurisdictions.forEach(jurisdiction => {
      this.jurisdictions.set(jurisdiction.jurisdiction_id, jurisdiction);
    });

    this.allJurisdictionsArray = Array.from(this.jurisdictions.values());
    
    this.jurisdictionsByState.clear();
    this.allJurisdictionsArray.forEach(jurisdiction => {
      const state = jurisdiction.state;
      if (!this.jurisdictionsByState.has(state)) {
        this.jurisdictionsByState.set(state, []);
      }
      this.jurisdictionsByState.get(state)!.push(jurisdiction);
    });
  }
}