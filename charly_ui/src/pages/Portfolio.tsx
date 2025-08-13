// 🍎 Portfolio Page - Apple Real Estate Management Excellence
// "Your properties deserve world-class management" - Steve Jobs

import React, { useEffect, useState } from 'react';
import { PropertyCard } from '../components/PropertyCard';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { LoadingDots } from '../components/LoadingDots';
import { APPLE_COLORS, NEUTRAL_COLORS } from '../design/colors';
import { SPACING } from '../design/spacing';
import { authenticatedRequest } from '../lib/auth';

interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  county: string;
  property_type: 'Residential' | 'Commercial' | 'Industrial' | 'Mixed Use' | 'Vacant Land';
  current_assessment: number;
  assessed_value: number;
  proposed_value?: number;
  potential_savings?: number;
  status: 'Under Review' | 'Appeal Filed' | 'Won' | 'Lost' | 'Pending';
  square_footage?: number;
  year_built?: number;
  created_date: string;
}

interface PropertyFormData {
  address: string;
  city: string;
  state: string;
  zip_code: string;
  county: string;
  property_type: Property['property_type'];
  current_assessment: string;
  square_footage: string;
  year_built: string;
}

const Portfolio: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<PropertyFormData>({
    address: '',
    city: '',
    state: '',
    zip_code: '',
    county: '',
    property_type: 'Residential',
    current_assessment: '',
    square_footage: '',
    year_built: '',
  });

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authenticatedRequest('/api/portfolio/');
      if (!response.ok) {
        throw new Error('Failed to load properties');
      }
      
      const data = await response.json();
      setProperties(data.properties || data || []);
    } catch (err) {
      console.error('Error loading properties:', err);
      setError(err instanceof Error ? err.message : 'Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      address: '',
      city: '',
      state: '',
      zip_code: '',
      county: '',
      property_type: 'Residential',
      current_assessment: '',
      square_footage: '',
      year_built: '',
    });
  };

  const handleAddProperty = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEditProperty = (property: Property) => {
    setFormData({
      address: property.address,
      city: property.city,
      state: property.state,
      zip_code: property.zip_code,
      county: property.county,
      property_type: property.property_type,
      current_assessment: property.current_assessment.toString(),
      square_footage: property.square_footage?.toString() || '',
      year_built: property.year_built?.toString() || '',
    });
    setEditingProperty(property);
    setShowEditModal(true);
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (!confirm('Are you sure you want to delete this property?')) return;
    
    try {
      const response = await authenticatedRequest(`/api/portfolio/properties/${propertyId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setProperties(properties.filter(p => p.id !== propertyId));
      } else {
        throw new Error('Failed to delete property');
      }
    } catch (err) {
      console.error('Error deleting property:', err);
      alert('Failed to delete property');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.address || !formData.city || !formData.current_assessment) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      
      const payload = {
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip_code: formData.zip_code,
        county: formData.county,
        property_type: formData.property_type,
        current_assessment: parseFloat(formData.current_assessment),
        square_footage: formData.square_footage ? parseInt(formData.square_footage) : undefined,
        year_built: formData.year_built ? parseInt(formData.year_built) : undefined,
      };

      const isEdit = showEditModal && editingProperty;
      const url = isEdit 
        ? `/api/portfolio/properties/${editingProperty.id}` 
        : '/api/portfolio/properties';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await authenticatedRequest(url, {
        method,
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await loadProperties(); // Reload the list
        setShowAddModal(false);
        setShowEditModal(false);
        setEditingProperty(null);
        resetForm();
      } else {
        throw new Error('Failed to save property');
      }
    } catch (err) {
      console.error('Error saving property:', err);
      alert('Failed to save property');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateAppeal = (propertyId: string) => {
    // Navigate to appeals page with property pre-selected
    console.log('Create appeal for property:', propertyId);
    alert('Appeal creation coming in Phase 6!');
  };

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorCard}>
          <h2 style={styles.errorTitle}>Unable to Load Properties</h2>
          <p style={styles.errorMessage}>{error}</p>
          <Button onClick={loadProperties}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Portfolio</h1>
          <p style={styles.subtitle}>
            Manage your property portfolio with Apple-quality tools
          </p>
        </div>
        
        <Button
          variant="primary"
          onClick={handleAddProperty}
          disabled={loading}
        >
          Add Property
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div style={styles.loadingContainer}>
          <LoadingDots size="lg" />
          <p style={styles.loadingText}>Loading properties...</p>
        </div>
      ) : properties.length === 0 ? (
        <div style={styles.emptyState}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={NEUTRAL_COLORS.GRAY_600} strokeWidth="1">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9,22 9,12 15,12 15,22" />
          </svg>
          <h3 style={styles.emptyTitle}>No Properties Yet</h3>
          <p style={styles.emptyText}>
            Add your first property to get started with appeals
          </p>
          <Button onClick={handleAddProperty}>Add Your First Property</Button>
        </div>
      ) : (
        <div style={styles.grid}>
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              onEdit={handleEditProperty}
              onDelete={handleDeleteProperty}
              onCreateAppeal={handleCreateAppeal}
            />
          ))}
        </div>
      )}

      {/* Add Property Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Property"
        maxWidth="600px"
      >
        <PropertyForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          submitting={submitting}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>

      {/* Edit Property Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Property"
        maxWidth="600px"
      >
        <PropertyForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          submitting={submitting}
          onCancel={() => setShowEditModal(false)}
          isEdit
        />
      </Modal>
    </div>
  );
};

// Property Form Component
interface PropertyFormProps {
  formData: PropertyFormData;
  setFormData: (data: PropertyFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  onCancel: () => void;
  isEdit?: boolean;
}

const PropertyForm: React.FC<PropertyFormProps> = ({
  formData,
  setFormData,
  onSubmit,
  submitting,
  onCancel,
  isEdit = false,
}) => {
  const updateField = (field: keyof PropertyFormData, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <form onSubmit={onSubmit} style={styles.form}>
      <div style={styles.formGrid}>
        <Input
          label="Address *"
          value={formData.address}
          onChange={(e) => updateField('address', e.target.value)}
          required
          autoFocus
        />
        
        <Input
          label="City *"
          value={formData.city}
          onChange={(e) => updateField('city', e.target.value)}
          required
        />
        
        <Input
          label="State"
          value={formData.state}
          onChange={(e) => updateField('state', e.target.value)}
        />
        
        <Input
          label="ZIP Code"
          value={formData.zip_code}
          onChange={(e) => updateField('zip_code', e.target.value)}
        />
        
        <Input
          label="County"
          value={formData.county}
          onChange={(e) => updateField('county', e.target.value)}
        />
        
        <div style={styles.selectWrapper}>
          <label style={styles.selectLabel}>Property Type</label>
          <select
            style={styles.select}
            value={formData.property_type}
            onChange={(e) => updateField('property_type', e.target.value as Property['property_type'])}
          >
            <option value="Residential">Residential</option>
            <option value="Commercial">Commercial</option>
            <option value="Industrial">Industrial</option>
            <option value="Mixed Use">Mixed Use</option>
            <option value="Vacant Land">Vacant Land</option>
          </select>
        </div>
        
        <Input
          label="Current Assessment *"
          type="number"
          value={formData.current_assessment}
          onChange={(e) => updateField('current_assessment', e.target.value)}
          required
        />
        
        <Input
          label="Square Footage"
          type="number"
          value={formData.square_footage}
          onChange={(e) => updateField('square_footage', e.target.value)}
        />
        
        <Input
          label="Year Built"
          type="number"
          value={formData.year_built}
          onChange={(e) => updateField('year_built', e.target.value)}
        />
      </div>
      
      <div style={styles.formActions}>
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </Button>
        
        <Button
          type="submit"
          variant="primary"
          loading={submitting}
          disabled={submitting}
        >
          {isEdit ? 'Update Property' : 'Add Property'}
        </Button>
      </div>
    </form>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: SPACING.LG,
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.XXL,
    gap: SPACING.LG,
  },

  title: {
    fontSize: '36px',
    fontWeight: 700,
    color: NEUTRAL_COLORS.GRAY_900,
    margin: 0,
    marginBottom: SPACING.XS,
    fontFamily: "'SF Pro Display', -apple-system, sans-serif",
  },

  subtitle: {
    fontSize: '18px',
    color: NEUTRAL_COLORS.GRAY_600,
    margin: 0,
    fontWeight: 400,
  },

  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '300px',
    gap: SPACING.LG,
  },

  loadingText: {
    fontSize: '16px',
    color: NEUTRAL_COLORS.GRAY_600,
    margin: 0,
  },

  emptyState: {
    textAlign: 'center' as const,
    padding: SPACING.XXL,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: SPACING.LG,
    maxWidth: '400px',
    margin: '0 auto',
  },

  emptyTitle: {
    fontSize: '24px',
    fontWeight: 600,
    color: NEUTRAL_COLORS.GRAY_900,
    margin: 0,
  },

  emptyText: {
    fontSize: '16px',
    color: NEUTRAL_COLORS.GRAY_600,
    margin: 0,
    lineHeight: 1.5,
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
    gap: SPACING.LG,
  },

  errorCard: {
    backgroundColor: NEUTRAL_COLORS.WHITE,
    borderRadius: '12px',
    padding: SPACING.XXL,
    border: `1px solid ${APPLE_COLORS.RED}20`,
    textAlign: 'center' as const,
    maxWidth: '500px',
    margin: '0 auto',
  },

  errorTitle: {
    fontSize: '24px',
    fontWeight: 600,
    color: APPLE_COLORS.RED,
    margin: 0,
    marginBottom: SPACING.SM,
  },

  errorMessage: {
    fontSize: '16px',
    color: NEUTRAL_COLORS.GRAY_600,
    margin: 0,
    marginBottom: SPACING.LG,
  },

  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: SPACING.LG,
  },

  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: SPACING.LG,
  },

  selectWrapper: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },

  selectLabel: {
    fontSize: '14px',
    fontWeight: 500,
    color: NEUTRAL_COLORS.GRAY_600,
    marginBottom: '4px',
  },

  select: {
    padding: '12px 16px',
    border: `1px solid ${NEUTRAL_COLORS.GRAY_100}`,
    borderRadius: '8px',
    fontSize: '16px',
    fontFamily: "'SF Pro Text', -apple-system, sans-serif",
    backgroundColor: NEUTRAL_COLORS.WHITE,
    color: NEUTRAL_COLORS.GRAY_900,
    transition: 'border-color 300ms cubic-bezier(0.25, 0.1, 0.25, 1)',
    
    ':focus': {
      outline: 'none',
      borderColor: APPLE_COLORS.BLUE,
      boxShadow: `0 0 0 3px ${APPLE_COLORS.BLUE}20`,
    },
  },

  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: SPACING.SM,
    paddingTop: SPACING.SM,
    borderTop: `1px solid ${NEUTRAL_COLORS.GRAY_100}`,
  },
} as const;

export default Portfolio;