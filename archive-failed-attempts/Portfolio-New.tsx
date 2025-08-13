import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePortfolioStore } from "@/store/portfolio";
import { authService } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { BarChart3, Plus, Upload } from "lucide-react";
import { PropertyList } from "@/components/portfolio/PropertyList";
import { PropertyFilters } from "@/components/portfolio/PropertyFilters";
import { AddPropertyModal } from "@/components/portfolio/AddPropertyModal";
import { PropertyAnalysisModal } from "@/components/portfolio/PropertyAnalysisModal";
import { ComparisonView } from "@/components/portfolio/ComparisonView";
import { AnalyticsView } from "@/components/portfolio/AnalyticsView";
import { BulkActionsModal } from "@/components/portfolio/BulkActionsModal";
import { PortfolioSummary } from "@/components/portfolio/PortfolioSummary";
import { Property } from "@/lib/api-client";

type ViewMode = 'list' | 'comparison' | 'analytics';

export function Portfolio() {
  const navigate = useNavigate();
  const { properties, loading, error, loadPortfolio } = usePortfolioStore();
  
  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [compareProperties, setCompareProperties] = useState<string[]>([]);
  
  // Modal state
  const [showAddPropertyModal, setShowAddPropertyModal] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showBulkActionsModal, setShowBulkActionsModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string>('all');
  const [selectedPropertyType, setSelectedPropertyType] = useState<string>('all');
  const [minValue, setMinValue] = useState<string>('');
  const [maxValue, setMaxValue] = useState<string>('');
  const [sortBy, setSortBy] = useState<'address' | 'value' | 'savings' | 'status'>('address');

  // Authentication and data loading
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await authService.ensureReady();
        await loadPortfolio();
      } catch (error) {
        console.error("Portfolio: Failed to initialize:", error);
      }
    };

    initializeAuth();
  }, [loadPortfolio]);

  // Property selection handlers
  const handlePropertySelect = (property: Property) => {
    setSelectedProperty(property);
    setShowAnalysisModal(true);
  };

  const handleCompareToggle = (propertyId: string) => {
    setCompareProperties(prev => 
      prev.includes(propertyId) 
        ? prev.filter(id => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  const startComparison = () => {
    setViewMode('comparison');
  };

  const handleAnalysisModalClose = () => {
    setShowAnalysisModal(false);
    setSelectedProperty(null);
  };

  const handleAddPropertySuccess = () => {
    setShowAddPropertyModal(false);
    loadPortfolio(); // Refresh the property list
  };

  const handleKeyDown = (event: React.KeyboardEvent, action: () => void) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  };

  // Render different views based on viewMode
  const renderMainContent = () => {
    switch (viewMode) {
      case 'comparison':
        return (
          <ComparisonView
            compareProperties={compareProperties}
            properties={properties}
            onBackToList={() => setViewMode('list')}
            onClearComparison={() => setCompareProperties([])}
          />
        );
      
      case 'analytics':
        return (
          <AnalyticsView
            properties={properties}
            onBackToList={() => setViewMode('list')}
          />
        );
      
      default:
        return (
          <div className="space-y-6">
            <PortfolioSummary properties={properties} />
            
            <PropertyFilters
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              selectedJurisdiction={selectedJurisdiction}
              setSelectedJurisdiction={setSelectedJurisdiction}
              selectedPropertyType={selectedPropertyType}
              setSelectedPropertyType={setSelectedPropertyType}
              minValue={minValue}
              setMinValue={setMinValue}
              maxValue={maxValue}
              setMaxValue={setMaxValue}
              sortBy={sortBy}
              setSortBy={setSortBy}
            />
            
            <PropertyList
              properties={properties}
              compareProperties={compareProperties}
              analysisResults={{}} // TODO: Connect to analysis store if needed
              isAnalyzing={null}
              onPropertySelect={handlePropertySelect}
              onCompareToggle={handleCompareToggle}
              handleKeyDown={handleKeyDown}
              loading={loading}
              error={error}
            />
          </div>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Skip to content for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-[9999] focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label="Skip to main content"
      >
        Skip to main content
      </a>
      
      {/* Main content with proper semantic structure */}
      <main id="main-content" tabIndex={-1} role="main" aria-label="Portfolio Management">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2" id="page-title">
              📁 Portfolio
            </h1>
            <p className="text-gray-600" id="page-description">
              Manage and analyze your property portfolio
            </p>
          </div>
          
          <div className="flex gap-2" role="toolbar" aria-label="Portfolio actions">
            {compareProperties.length > 0 && viewMode === 'list' && (
              <Button 
                onClick={startComparison}
                className="bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label={`Compare ${compareProperties.length} selected properties`}
              >
                Compare ({compareProperties.length})
              </Button>
            )}
            
            {viewMode === 'list' && (
              <>
                <Button 
                  variant="outline"
                  onClick={() => setViewMode('analytics')}
                  aria-label="Switch to analytics view"
                  className="focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <BarChart3 className="w-4 h-4 mr-2" aria-hidden="true" />
                  Analytics
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => setShowBulkActionsModal(true)}
                  aria-label="Bulk actions"
                  className="focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <Upload className="w-4 h-4 mr-2" aria-hidden="true" />
                  Bulk Actions
                </Button>
                
                <Button 
                  onClick={() => setShowAddPropertyModal(true)}
                  className="bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  aria-label="Add new property"
                >
                  <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                  Add Property
                </Button>
              </>
            )}
          </div>
        </div>
        
        {renderMainContent()}
      </main>

      {/* Modals */}
      <AddPropertyModal
        showAddPropertyModal={showAddPropertyModal}
        onClose={() => setShowAddPropertyModal(false)}
        newPropertyData={{
          address: '',
          propertyType: '',
          currentAssessment: '',
          estimatedValue: '',
          jurisdiction: '',
          parcelNumber: '',
          ownerName: '',
          yearBuilt: '',
          squareFootage: '',
          notes: '',
        }}
        setNewPropertyData={() => {}} // TODO: Connect to actual state
        onAddProperty={handleAddPropertySuccess}
        isAddingProperty={loading}
        validationErrors={[]}
      />

      {selectedProperty && (
        <PropertyAnalysisModal
          property={selectedProperty}
          isOpen={showAnalysisModal}
          onClose={handleAnalysisModalClose}
        />
      )}

      <BulkActionsModal
        isOpen={showBulkActionsModal}
        onClose={() => setShowBulkActionsModal(false)}
        selectedProperties={compareProperties}
        onAction={(action) => {
          console.log('Bulk action:', action);
          setShowBulkActionsModal(false);
        }}
      />
    </div>
  );
}