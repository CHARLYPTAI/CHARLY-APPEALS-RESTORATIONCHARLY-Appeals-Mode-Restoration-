/**
 * Property Type Service
 * 
 * Provides IAAO/MAI compliant property type classifications and utilities
 * for consistent property type management across the CHARLY platform.
 */

export interface PropertyTypeSubtype {
  name: string;
  iaao_code: string;
  mai_class: string;
  description: string;
}

export interface PropertyType {
  type_name: string;
  iaao_code: string;
  subtypes: Record<string, PropertyTypeSubtype>;
}

export interface PropertyCategory {
  category_name: string;
  iaao_code: string;
  mai_classification: string;
  subtypes: Record<string, PropertyType | PropertyTypeSubtype>;
}

export interface PropertyTypeHierarchy {
  category: string;
  type?: string;
  subtype?: string;
  display_name: string;
  iaao_code: string;
  mai_class: string;
  description: string;
}

/**
 * IAAO/MAI compliant property type taxonomy
 * Based on professional appraisal industry standards
 */
export const PROPERTY_TYPE_TAXONOMY: Record<string, PropertyCategory> = {
  commercial: {
    category_name: "Commercial",
    iaao_code: "COM",
    mai_classification: "Income-Producing",
    subtypes: {
      office: {
        type_name: "Office",
        iaao_code: "COM-OFF",
        subtypes: {
          class_a_office: {
            name: "Class A Office Building",
            iaao_code: "COM-OFF-A",
            mai_class: "Class A Office",
            description: "Premium office buildings with superior construction, design, and amenities"
          },
          class_b_office: {
            name: "Class B Office Building",
            iaao_code: "COM-OFF-B", 
            mai_class: "Class B Office",
            description: "Good quality office buildings with standard amenities"
          },
          class_c_office: {
            name: "Class C Office Building",
            iaao_code: "COM-OFF-C",
            mai_class: "Class C Office", 
            description: "Older office buildings with basic amenities"
          },
          medical_office: {
            name: "Medical Office Building",
            iaao_code: "COM-OFF-MED",
            mai_class: "Medical Office",
            description: "Office buildings designed for medical and healthcare use"
          },
          government_office: {
            name: "Government Office Building",
            iaao_code: "COM-OFF-GOV",
            mai_class: "Government Office",
            description: "Office buildings used for government operations"
          }
        }
      },
      retail: {
        type_name: "Retail",
        iaao_code: "COM-RET",
        subtypes: {
          shopping_center: {
            name: "Shopping Center",
            iaao_code: "COM-RET-SC",
            mai_class: "Shopping Center",
            description: "Enclosed or open-air retail centers with multiple tenants"
          },
          strip_center: {
            name: "Strip Center", 
            iaao_code: "COM-RET-STRIP",
            mai_class: "Strip Center",
            description: "Linear retail centers with storefronts facing parking"
          },
          standalone_retail: {
            name: "Standalone Retail",
            iaao_code: "COM-RET-STAND",
            mai_class: "Freestanding Retail",
            description: "Single-tenant retail buildings"
          },
          big_box: {
            name: "Big Box Store",
            iaao_code: "COM-RET-BB",
            mai_class: "Big Box Retail",
            description: "Large format retail stores (typically 50,000+ sq ft)"
          },
          department_store: {
            name: "Department Store",
            iaao_code: "COM-RET-DEPT",
            mai_class: "Department Store",
            description: "Large retail stores with multiple departments"
          }
        }
      },
      industrial: {
        type_name: "Industrial",
        iaao_code: "COM-IND",
        subtypes: {
          warehouse: {
            name: "Warehouse/Distribution",
            iaao_code: "COM-IND-WH",
            mai_class: "Warehouse",
            description: "Buildings used for storage and distribution"
          },
          manufacturing: {
            name: "Manufacturing Facility",
            iaao_code: "COM-IND-MFG",
            mai_class: "Manufacturing",
            description: "Buildings used for production and manufacturing"
          },
          flex_space: {
            name: "Flex/R&D Space",
            iaao_code: "COM-IND-FLEX",
            mai_class: "Flex Industrial",
            description: "Flexible industrial space combining office and warehouse"
          },
          cold_storage: {
            name: "Cold Storage Facility",
            iaao_code: "COM-IND-COLD",
            mai_class: "Cold Storage",
            description: "Temperature-controlled storage facilities"
          },
          data_center: {
            name: "Data Center",
            iaao_code: "COM-IND-DATA",
            mai_class: "Data Center",
            description: "Facilities housing computer systems and data storage"
          }
        }
      },
      hospitality: {
        type_name: "Hospitality",
        iaao_code: "COM-HOSP",
        subtypes: {
          full_service_hotel: {
            name: "Full-Service Hotel",
            iaao_code: "COM-HOSP-FS",
            mai_class: "Full-Service Hotel",
            description: "Hotels with restaurants, meeting facilities, and full services"
          },
          limited_service_hotel: {
            name: "Limited-Service Hotel",
            iaao_code: "COM-HOSP-LS", 
            mai_class: "Limited-Service Hotel",
            description: "Hotels with basic amenities and limited services"
          },
          extended_stay: {
            name: "Extended Stay Hotel",
            iaao_code: "COM-HOSP-ES",
            mai_class: "Extended Stay",
            description: "Hotels designed for longer-term stays"
          },
          resort: {
            name: "Resort Property",
            iaao_code: "COM-HOSP-RESORT",
            mai_class: "Resort",
            description: "Destination properties with recreational amenities"
          }
        }
      },
      mixed_use: {
        type_name: "Mixed Use",
        iaao_code: "COM-MIXED",
        subtypes: {
          residential_commercial: {
            name: "Residential/Commercial Mixed Use",
            iaao_code: "COM-MIXED-RC",
            mai_class: "Mixed Use",
            description: "Properties combining residential and commercial uses"
          },
          office_retail: {
            name: "Office/Retail Mixed Use",
            iaao_code: "COM-MIXED-OR",
            mai_class: "Mixed Use",
            description: "Properties combining office and retail uses"
          }
        }
      }
    }
  },
  multifamily: {
    category_name: "Multifamily Residential",
    iaao_code: "MF",
    mai_classification: "Income-Producing Residential",
    subtypes: {
      garden_apartments: {
        name: "Garden Apartments",
        iaao_code: "MF-GARDEN",
        mai_class: "Garden Apartments",
        description: "Low-rise apartment complexes with landscaping"
      },
      mid_rise: {
        name: "Mid-Rise Apartments",
        iaao_code: "MF-MIDRISE",
        mai_class: "Mid-Rise Multifamily",
        description: "4-12 story apartment buildings"
      },
      high_rise: {
        name: "High-Rise Apartments",
        iaao_code: "MF-HIGHRISE",
        mai_class: "High-Rise Multifamily",
        description: "13+ story apartment buildings"
      },
      student_housing: {
        name: "Student Housing",
        iaao_code: "MF-STUDENT",
        mai_class: "Student Housing",
        description: "Housing specifically designed for students"
      },
      senior_housing: {
        name: "Senior Housing",
        iaao_code: "MF-SENIOR",
        mai_class: "Senior Housing",
        description: "Housing designed for senior citizens"
      },
      affordable_housing: {
        name: "Affordable Housing",
        iaao_code: "MF-AFFORD",
        mai_class: "Affordable Housing",
        description: "Subsidized or income-restricted housing"
      }
    }
  },
  residential: {
    category_name: "Residential",
    iaao_code: "RES",
    mai_classification: "Residential",
    subtypes: {
      single_family: {
        name: "Single Family Home",
        iaao_code: "RES-SF",
        mai_class: "Single Family",
        description: "Detached single-family residential properties"
      },
      condominium: {
        name: "Condominium",
        iaao_code: "RES-CONDO",
        mai_class: "Condominium",
        description: "Individual ownership units in multi-unit buildings"
      },
      townhome: {
        name: "Townhome",
        iaao_code: "RES-TOWN",
        mai_class: "Townhouse",
        description: "Attached residential units with individual ownership"
      },
      mobile_home: {
        name: "Mobile Home",
        iaao_code: "RES-MOBILE",
        mai_class: "Mobile Home",
        description: "Manufactured housing units"
      }
    }
  },
  vacant_land: {
    category_name: "Vacant Land",
    iaao_code: "LAND",
    mai_classification: "Land",
    subtypes: {
      commercial_land: {
        name: "Commercial Land",
        iaao_code: "LAND-COM",
        mai_class: "Commercial Land",
        description: "Vacant land zoned for commercial development"
      },
      residential_land: {
        name: "Residential Land",
        iaao_code: "LAND-RES",
        mai_class: "Residential Land",
        description: "Vacant land zoned for residential development"
      },
      industrial_land: {
        name: "Industrial Land",
        iaao_code: "LAND-IND",
        mai_class: "Industrial Land",
        description: "Vacant land zoned for industrial development"
      }
    }
  }
};

/**
 * Get all property types in a flat list format for dropdowns
 */
export const getAllPropertyTypes = (): PropertyTypeHierarchy[] => {
  const result: PropertyTypeHierarchy[] = [];

  Object.entries(PROPERTY_TYPE_TAXONOMY).forEach(([categoryKey, category]) => {
    Object.entries(category.subtypes).forEach(([typeKey, type]) => {
      if ('subtypes' in type) {
        // This is a type with subtypes (like office, retail, industrial)
        Object.entries(type.subtypes).forEach(([subtypeKey, subtype]) => {
          result.push({
            category: categoryKey,
            type: typeKey,
            subtype: subtypeKey,
            display_name: subtype.name,
            iaao_code: subtype.iaao_code,
            mai_class: subtype.mai_class,
            description: subtype.description
          });
        });
      } else {
        // This is a direct subtype (like multifamily categories)
        result.push({
          category: categoryKey,
          subtype: typeKey,
          display_name: type.name,
          iaao_code: type.iaao_code,
          mai_class: type.mai_class,
          description: type.description
        });
      }
    });
  });

  return result.sort((a, b) => a.display_name.localeCompare(b.display_name));
};

/**
 * Get property types by category
 */
export const getPropertyTypesByCategory = (categoryKey: string): PropertyTypeHierarchy[] => {
  return getAllPropertyTypes().filter(pt => pt.category === categoryKey);
};

/**
 * Get simplified property type list for basic dropdowns
 */
export const getSimplifiedPropertyTypes = (): Array<{value: string, label: string, iaao_code: string}> => {
  const simplified = [
    { value: 'COM-OFF', label: 'Office', iaao_code: 'COM-OFF' },
    { value: 'COM-RET', label: 'Retail', iaao_code: 'COM-RET' },
    { value: 'COM-IND', label: 'Industrial', iaao_code: 'COM-IND' },
    { value: 'COM-HOSP', label: 'Hospitality', iaao_code: 'COM-HOSP' },
    { value: 'COM-MIXED', label: 'Mixed Use', iaao_code: 'COM-MIXED' },
    { value: 'MF', label: 'Multifamily', iaao_code: 'MF' },
    { value: 'RES', label: 'Residential', iaao_code: 'RES' },
    { value: 'LAND', label: 'Vacant Land', iaao_code: 'LAND' }
  ];

  return simplified;
};

/**
 * Find property type by IAAO code
 */
export const findPropertyTypeByCode = (iaaoCode: string): PropertyTypeHierarchy | null => {
  return getAllPropertyTypes().find(pt => pt.iaao_code === iaaoCode) || null;
};

/**
 * Validate property type selection
 */
export const validatePropertyType = (propertyType: string): { valid: boolean; message?: string } => {
  if (!propertyType) {
    return { valid: false, message: 'Property type is required' };
  }

  const found = findPropertyTypeByCode(propertyType);
  if (!found) {
    return { valid: false, message: 'Invalid property type code' };
  }

  return { valid: true };
};

/**
 * Get category options for dropdown
 */
export const getCategoryOptions = () => {
  return Object.entries(PROPERTY_TYPE_TAXONOMY).map(([key, category]) => ({
    value: key,
    label: category.category_name,
    iaao_code: category.iaao_code
  }));
};

/**
 * Get legacy property type mapping for backward compatibility
 */
export const getLegacyPropertyTypeMapping = (): Record<string, string> => {
  return {
    'Commercial': 'COM-OFF',
    'Office': 'COM-OFF',
    'Retail': 'COM-RET', 
    'Industrial': 'COM-IND',
    'Multi-Family': 'MF',
    'Multifamily': 'MF',
    'Land': 'LAND',
    'Residential': 'RES'
  };
};

/**
 * Convert legacy property type to IAAO code
 */
export const convertLegacyPropertyType = (legacyType: string): string => {
  const mapping = getLegacyPropertyTypeMapping();
  return mapping[legacyType] || legacyType;
};