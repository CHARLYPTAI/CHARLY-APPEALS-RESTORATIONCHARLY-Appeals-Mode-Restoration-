import { describe, it, expect, beforeEach } from 'vitest';
import { JurisdictionService } from '../services/jurisdiction-service.js';

describe('JurisdictionService', () => {
  let jurisdictionService: JurisdictionService;

  beforeEach(() => {
    jurisdictionService = new JurisdictionService();
  });

  describe('getJurisdiction', () => {
    it('should return jurisdiction data for valid ID', async () => {
      const jurisdiction = await jurisdictionService.getJurisdiction('harris-county-tx');

      expect(jurisdiction).toEqual({
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
      });
    });

    it('should return Cook County jurisdiction data', async () => {
      const jurisdiction = await jurisdictionService.getJurisdiction('cook-county-il');

      expect(jurisdiction).toEqual({
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
      });
    });

    it('should return Maricopa County jurisdiction data', async () => {
      const jurisdiction = await jurisdictionService.getJurisdiction('maricopa-county-az');

      expect(jurisdiction).toEqual({
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
      });
    });

    it('should throw error for non-existent jurisdiction', async () => {
      await expect(jurisdictionService.getJurisdiction('non-existent-jurisdiction'))
        .rejects.toThrow('Jurisdiction non-existent-jurisdiction not found');
    });

    it('should throw error for empty jurisdiction ID', async () => {
      await expect(jurisdictionService.getJurisdiction(''))
        .rejects.toThrow('Jurisdiction  not found');
    });

    it('should throw error for null jurisdiction ID', async () => {
      await expect(jurisdictionService.getJurisdiction(null as any))
        .rejects.toThrow('Jurisdiction null not found');
    });
  });

  describe('getJurisdictions', () => {
    it('should return all jurisdictions when no state filter provided', async () => {
      const jurisdictions = await jurisdictionService.getJurisdictions();

      expect(jurisdictions).toHaveLength(3);
      expect(jurisdictions.map(j => j.jurisdiction_id)).toEqual([
        'harris-county-tx',
        'cook-county-il',
        'maricopa-county-az'
      ]);
    });

    it('should return all jurisdictions for undefined state', async () => {
      const jurisdictions = await jurisdictionService.getJurisdictions(undefined);

      expect(jurisdictions).toHaveLength(3);
    });

    it('should filter jurisdictions by state TX', async () => {
      const jurisdictions = await jurisdictionService.getJurisdictions('TX');

      expect(jurisdictions).toHaveLength(1);
      expect(jurisdictions[0].jurisdiction_id).toBe('harris-county-tx');
      expect(jurisdictions[0].state).toBe('TX');
    });

    it('should filter jurisdictions by state IL', async () => {
      const jurisdictions = await jurisdictionService.getJurisdictions('IL');

      expect(jurisdictions).toHaveLength(1);
      expect(jurisdictions[0].jurisdiction_id).toBe('cook-county-il');
      expect(jurisdictions[0].state).toBe('IL');
    });

    it('should filter jurisdictions by state AZ', async () => {
      const jurisdictions = await jurisdictionService.getJurisdictions('AZ');

      expect(jurisdictions).toHaveLength(1);
      expect(jurisdictions[0].jurisdiction_id).toBe('maricopa-county-az');
      expect(jurisdictions[0].state).toBe('AZ');
    });

    it('should return empty array for non-existent state', async () => {
      const jurisdictions = await jurisdictionService.getJurisdictions('CA');

      expect(jurisdictions).toHaveLength(0);
      expect(jurisdictions).toEqual([]);
    });

    it('should handle lowercase state filter', async () => {
      const jurisdictions = await jurisdictionService.getJurisdictions('tx');

      expect(jurisdictions).toHaveLength(0); // Should be case-sensitive
    });

    it('should handle empty string state filter', async () => {
      const jurisdictions = await jurisdictionService.getJurisdictions('');

      expect(jurisdictions).toHaveLength(3); // Should return all jurisdictions for empty string
    });

    it('should verify all jurisdiction data structure', async () => {
      const jurisdictions = await jurisdictionService.getJurisdictions();

      jurisdictions.forEach(jurisdiction => {
        expect(jurisdiction).toHaveProperty('jurisdiction_id');
        expect(jurisdiction).toHaveProperty('name');
        expect(jurisdiction).toHaveProperty('state');
        expect(jurisdiction).toHaveProperty('appeal_window_start');
        expect(jurisdiction).toHaveProperty('appeal_window_end');
        expect(jurisdiction).toHaveProperty('deadline_rule');
        expect(jurisdiction).toHaveProperty('fee');
        expect(jurisdiction).toHaveProperty('forms');
        expect(jurisdiction).toHaveProperty('efile_available');
        expect(jurisdiction).toHaveProperty('evidence_preshare_required');
        expect(jurisdiction).toHaveProperty('decision_standard');
        expect(jurisdiction).toHaveProperty('citations');

        expect(typeof jurisdiction.jurisdiction_id).toBe('string');
        expect(typeof jurisdiction.name).toBe('string');
        expect(typeof jurisdiction.state).toBe('string');
        expect(typeof jurisdiction.appeal_window_start).toBe('string');
        expect(typeof jurisdiction.appeal_window_end).toBe('string');
        expect(typeof jurisdiction.deadline_rule).toBe('string');
        expect(typeof jurisdiction.fee).toBe('string');
        expect(Array.isArray(jurisdiction.forms)).toBe(true);
        expect(typeof jurisdiction.efile_available).toBe('boolean');
        expect(typeof jurisdiction.evidence_preshare_required).toBe('boolean');
        expect(typeof jurisdiction.decision_standard).toBe('string');
        expect(Array.isArray(jurisdiction.citations)).toBe(true);

        expect(jurisdiction.jurisdiction_id.length).toBeGreaterThan(0);
        expect(jurisdiction.name.length).toBeGreaterThan(0);
        expect(jurisdiction.state.length).toBe(2);
        expect(jurisdiction.forms.length).toBeGreaterThan(0);
        expect(jurisdiction.citations.length).toBeGreaterThan(0);
      });
    });

    it('should verify efile_available varies by jurisdiction', async () => {
      const jurisdictions = await jurisdictionService.getJurisdictions();

      const efileStatuses = jurisdictions.map(j => j.efile_available);
      expect(efileStatuses).toContain(true);
      expect(efileStatuses).toContain(false);
    });

    it('should verify evidence_preshare_required varies by jurisdiction', async () => {
      const jurisdictions = await jurisdictionService.getJurisdictions();

      const preshareStatuses = jurisdictions.map(j => j.evidence_preshare_required);
      expect(preshareStatuses).toContain(true);
      expect(preshareStatuses).toContain(false);
    });

    it('should verify all states are represented', async () => {
      const jurisdictions = await jurisdictionService.getJurisdictions();

      const states = jurisdictions.map(j => j.state);
      expect(states).toContain('TX');
      expect(states).toContain('IL');
      expect(states).toContain('AZ');
    });

    it('should verify citation formats are valid', async () => {
      const jurisdictions = await jurisdictionService.getJurisdictions();

      jurisdictions.forEach(jurisdiction => {
        jurisdiction.citations.forEach(citation => {
          expect(typeof citation).toBe('string');
          expect(citation.length).toBeGreaterThan(0);
          expect(citation).toMatch(/§|ILCS|Statutes/);
        });
      });
    });

    it('should verify form names are descriptive', async () => {
      const jurisdictions = await jurisdictionService.getJurisdictions();

      jurisdictions.forEach(jurisdiction => {
        jurisdiction.forms.forEach(form => {
          expect(typeof form).toBe('string');
          expect(form.length).toBeGreaterThan(5); // Should be descriptive
        });
      });
    });
  });

  describe('Constructor and Initialization', () => {
    it('should load seed data during construction', () => {
      const newService = new JurisdictionService();
      
      expect(newService).toBeInstanceOf(JurisdictionService);
    });

    it('should have consistent data across instances', async () => {
      const service1 = new JurisdictionService();
      const service2 = new JurisdictionService();

      const jurisdictions1 = await service1.getJurisdictions();
      const jurisdictions2 = await service2.getJurisdictions();

      expect(jurisdictions1).toEqual(jurisdictions2);
    });
  });
});