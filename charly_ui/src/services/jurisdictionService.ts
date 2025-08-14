/**
 * Jurisdiction Service
 * 
 * Provides unified jurisdiction management across the CHARLY platform
 * Replaces all hardcoded jurisdiction dropdowns with single source of truth
 */

export interface Jurisdiction {
  id: string;
  name: string;
  state: string;
  county: string;
  fullName: string;
  assessedValue?: string;
  appealVolume?: string;
  dataSource?: string;
  endpoint?: string;
  validationStatus: 'VERIFIED' | 'CONFIGURED' | 'PENDING';
  rank?: number;
}

/**
 * Master jurisdiction list from FINAL_VALIDATED_COUNTY_SELECTION and configuration sources
 * Single source of truth for all jurisdiction dropdowns across the platform
 */
export const MASTER_JURISDICTIONS: Jurisdiction[] = [
  {
    id: 'ca-los-angeles',
    name: 'Los Angeles County',
    state: 'CA',
    county: 'Los Angeles',
    fullName: 'Los Angeles County, CA',
    assessedValue: '$2.094T',
    appealVolume: '120,000+/year',
    dataSource: 'Official County Open Data Portal',
    endpoint: 'https://data.lacounty.gov/',
    validationStatus: 'VERIFIED',
    rank: 1
  },
  {
    id: 'wa-king',
    name: 'King County',
    state: 'WA', 
    county: 'King',
    fullName: 'King County, WA',
    assessedValue: '$780B',
    appealVolume: '45,000/year',
    dataSource: 'Socrata API Platform',
    endpoint: 'https://data.kingcounty.gov/',
    validationStatus: 'VERIFIED',
    rank: 2
  },
  {
    id: 'tx-harris',
    name: 'Harris County',
    state: 'TX',
    county: 'Harris',
    fullName: 'Harris County, TX',
    assessedValue: '$408B',
    appealVolume: '85,000/year',
    dataSource: 'ArcGIS REST API',
    endpoint: 'https://www.gis.hctx.net/arcgis/rest/services/HCAD/Parcels/MapServer',
    validationStatus: 'VERIFIED',
    rank: 3
  },
  {
    id: 'il-cook',
    name: 'Cook County',
    state: 'IL',
    county: 'Cook',
    fullName: 'Cook County, IL',
    assessedValue: '$325B',
    appealVolume: '400,000/year',
    dataSource: 'Open Data Portal',
    endpoint: 'https://datacatalog.cookcountyil.gov/',
    validationStatus: 'VERIFIED',
    rank: 4
  },
  {
    id: 'fl-miami-dade',
    name: 'Miami-Dade County',
    state: 'FL',
    county: 'Miami-Dade',
    fullName: 'Miami-Dade County, FL',
    assessedValue: '$385B',
    appealVolume: '75,000/year',
    dataSource: 'Open Data Hub',
    endpoint: 'https://opendata.miamidade.gov/',
    validationStatus: 'VERIFIED',
    rank: 5
  },
  {
    id: 'ny-nassau',
    name: 'Nassau County',
    state: 'NY',
    county: 'Nassau',
    fullName: 'Nassau County, NY',
    assessedValue: '$285B',
    appealVolume: '90,000/year',
    dataSource: 'NY State Open Data',
    endpoint: 'https://data.ny.gov/',
    validationStatus: 'VERIFIED',
    rank: 6
  },
  {
    id: 'az-maricopa',
    name: 'Maricopa County',
    state: 'AZ',
    county: 'Maricopa',
    fullName: 'Maricopa County, AZ',
    assessedValue: '$520B',
    appealVolume: '55,000/year',
    dataSource: 'Assessor Portal',
    endpoint: 'https://mcassessor.maricopa.gov/',
    validationStatus: 'VERIFIED',
    rank: 7
  },
  {
    id: 'pa-philadelphia',
    name: 'Philadelphia County',
    state: 'PA',
    county: 'Philadelphia',
    fullName: 'Philadelphia County, PA',
    assessedValue: '$150B',
    appealVolume: '65,000/year',
    dataSource: 'OpenDataPhilly',
    endpoint: 'https://www.opendataphilly.org/',
    validationStatus: 'VERIFIED',
    rank: 8
  },
  {
    id: 'mo-jackson',
    name: 'Jackson County',
    state: 'MO',
    county: 'Jackson',
    fullName: 'Jackson County, MO',
    validationStatus: 'CONFIGURED'
  },
  {
    id: 'mo-st-louis',
    name: 'St. Louis County',
    state: 'MO',
    county: 'St. Louis',
    fullName: 'St. Louis County, MO',
    validationStatus: 'CONFIGURED'
  },
  {
    id: 'tx-dallas',
    name: 'Dallas County',
    state: 'TX',
    county: 'Dallas',
    fullName: 'Dallas County, TX',
    validationStatus: 'CONFIGURED'
  }
];

/**
 * Get all jurisdictions sorted by rank (verified first, then alphabetical)
 */
export const getAllJurisdictions = (): Jurisdiction[] => {
  return MASTER_JURISDICTIONS.sort((a, b) => {
    // Verified jurisdictions first, sorted by rank
    if (a.validationStatus === 'VERIFIED' && b.validationStatus === 'VERIFIED') {
      return (a.rank || 999) - (b.rank || 999);
    }
    if (a.validationStatus === 'VERIFIED') return -1;
    if (b.validationStatus === 'VERIFIED') return 1;
    
    // Then alphabetical for non-verified
    return a.fullName.localeCompare(b.fullName);
  });
};

/**
 * Get jurisdictions by state
 */
export const getJurisdictionsByState = (state: string): Jurisdiction[] => {
  return getAllJurisdictions().filter(j => j.state === state);
};

/**
 * Get verified jurisdictions only
 */
export const getVerifiedJurisdictions = (): Jurisdiction[] => {
  return getAllJurisdictions().filter(j => j.validationStatus === 'VERIFIED');
};

/**
 * Get jurisdiction by ID
 */
export const getJurisdictionById = (id: string): Jurisdiction | null => {
  return MASTER_JURISDICTIONS.find(j => j.id === id) || null;
};

/**
 * Get jurisdiction by full name (e.g., "Harris County, TX")
 */
export const getJurisdictionByName = (fullName: string): Jurisdiction | null => {
  return MASTER_JURISDICTIONS.find(j => j.fullName === fullName) || null;
};

/**
 * Get all states that have jurisdictions
 */
export const getAvailableStates = (): string[] => {
  const states = [...new Set(MASTER_JURISDICTIONS.map(j => j.state))];
  return states.sort();
};

/**
 * Get jurisdiction dropdown options for Select components
 */
export const getJurisdictionOptions = () => {
  return getAllJurisdictions().map(jurisdiction => ({
    value: jurisdiction.id,
    label: jurisdiction.fullName,
    state: jurisdiction.state,
    verified: jurisdiction.validationStatus === 'VERIFIED',
    assessedValue: jurisdiction.assessedValue,
    appealVolume: jurisdiction.appealVolume
  }));
};

/**
 * Get simplified jurisdiction list for basic dropdowns
 */
export const getSimplifiedJurisdictionOptions = () => {
  return getVerifiedJurisdictions().map(jurisdiction => ({
    value: jurisdiction.id,
    label: jurisdiction.fullName
  }));
};

/**
 * Legacy jurisdiction names mapping for backward compatibility
 */
export const getLegacyJurisdictionMapping = (): Record<string, string> => {
  return {
    'Travis County': 'tx-travis',
    'Harris County': 'tx-harris', 
    'Dallas County': 'tx-dallas',
    'Tarrant County': 'tx-tarrant',
    'Collin County': 'tx-collin',
    'Denton County': 'tx-denton',
    'Harris, Travis, Dallas Counties': 'tx-harris,tx-travis,tx-dallas'
  };
};

/**
 * Convert legacy jurisdiction name to new ID format
 */
export const convertLegacyJurisdiction = (legacyName: string): string => {
  const mapping = getLegacyJurisdictionMapping();
  return mapping[legacyName] || legacyName;
};

/**
 * Validate jurisdiction selection
 */
export const validateJurisdiction = (jurisdictionId: string): { valid: boolean; message?: string } => {
  if (!jurisdictionId) {
    return { valid: false, message: 'Jurisdiction is required' };
  }

  const jurisdiction = getJurisdictionById(jurisdictionId);
  if (!jurisdiction) {
    return { valid: false, message: 'Invalid jurisdiction selected' };
  }

  return { valid: true };
};

/**
 * Get jurisdiction statistics summary
 */
export const getJurisdictionStats = () => {
  const all = getAllJurisdictions();
  const verified = getVerifiedJurisdictions();
  
  const totalAssessedValue = verified
    .filter(j => j.assessedValue)
    .reduce((sum, j) => {
      const value = j.assessedValue?.replace(/[$TB,]/g, '') || '0';
      const multiplier = j.assessedValue?.includes('T') ? 1000 : 1;
      return sum + (parseFloat(value) * multiplier);
    }, 0);

  const totalAppealVolume = verified
    .filter(j => j.appealVolume)
    .reduce((sum, j) => {
      const volume = j.appealVolume?.replace(/[,+/year]/g, '') || '0';
      return sum + parseInt(volume);
    }, 0);

  return {
    totalJurisdictions: all.length,
    verifiedJurisdictions: verified.length,
    totalAssessedValue: `$${totalAssessedValue.toFixed(1)}T+`,
    totalAppealVolume: `${totalAppealVolume.toLocaleString()}+/year`,
    availableStates: getAvailableStates().length
  };
};