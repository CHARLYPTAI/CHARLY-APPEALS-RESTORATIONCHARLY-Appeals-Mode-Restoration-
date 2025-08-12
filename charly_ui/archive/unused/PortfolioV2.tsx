/**
 * 🍎 CHARLY 2.0 - PORTFOLIO REVOLUTION
 * 
 * Apple-quality property management with IntelligentCanvas foundation
 * and progressive disclosure patterns throughout the experience.
 */

import { useState, useMemo } from "react";
import { usePortfolioStore } from "@/store/portfolio";
import { usePropertyAnalysisStore } from "@/store/propertyAnalysis";
import { 
  IntelligentCanvas, 
  Card, 
  MetricCard, 
  // FeatureCard,
  Button, 
  FloatingActionButton,
  // Accordion,
  ExpandableCard,
  CollapsibleSection
} from "@/components/v2";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, SlidersHorizontal, Building, Calculator, BarChart3, CheckSquare, Square, Package, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface Property {
  id: string;
  address: string;
  propertyType: string;
  currentAssessment: number;
  estimatedValue: number;
  potentialSavings: number;
  status: string;
  jurisdiction: string;
  parcelNumber: string;
  ownerName: string;
  yearBuilt: number;
  squareFootage: number;
  // V2: Collaborative features
  ownershipStatus?: 'claimed' | 'verified' | 'disputed';
  sharedWithCommunity?: boolean;
  communityInsights?: number;
  lastAnalyzed?: Date;
}

interface PortfolioFilters {
  search: string;
  jurisdiction: string;
  propertyType: string;
  status: string;
  minValue: string;
  maxValue: string;
  ownershipStatus?: string;
}

// ============================================================================
// PORTFOLIO V2 COMPONENT
// ============================================================================

export function PortfolioV2() {
  const { toast } = useToast();
  const { properties: storeProperties, loading } = usePortfolioStore();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { startAnalysis: _startAnalysis } = usePropertyAnalysisStore();

  // Mock data for demonstration (will be replaced with real data)
  const mockProperties: Property[] = [
    {
      id: 'prop_1',
      address: '123 Main Street, Chicago, IL 60601',
      propertyType: 'Commercial',
      currentAssessment: 850000,
      estimatedValue: 750000,
      potentialSavings: 100000,
      status: 'flagged',
      jurisdiction: 'cook-county',
      parcelNumber: '17-08-426-001',
      ownerName: 'ABC Holdings LLC',
      yearBuilt: 1995,
      squareFootage: 12500,
      ownershipStatus: 'verified',
      sharedWithCommunity: true,
      communityInsights: 12,
      lastAnalyzed: new Date('2024-07-10')
    },
    {
      id: 'prop_2',
      address: '456 Oak Avenue, Evanston, IL 60201',
      propertyType: 'Residential',
      currentAssessment: 450000,
      estimatedValue: 420000,
      potentialSavings: 30000,
      status: 'review',
      jurisdiction: 'cook-county',
      parcelNumber: '11-25-100-005',
      ownerName: 'John & Jane Smith',
      yearBuilt: 2010,
      squareFootage: 2800,
      ownershipStatus: 'claimed',
      sharedWithCommunity: false,
      communityInsights: 5,
      lastAnalyzed: new Date('2024-07-15')
    },
    {
      id: 'prop_3',
      address: '789 Industrial Blvd, Schaumburg, IL 60173',
      propertyType: 'Industrial',
      currentAssessment: 1200000,
      estimatedValue: 1050000,
      potentialSavings: 150000,
      status: 'flagged',
      jurisdiction: 'dupage-county',
      parcelNumber: '03-15-200-010',
      ownerName: 'Manufacturing Corp',
      yearBuilt: 1988,
      squareFootage: 25000,
      ownershipStatus: 'verified',
      sharedWithCommunity: true,
      communityInsights: 18,
      lastAnalyzed: new Date('2024-07-12')
    }
  ];

  // Use mock data if no real properties are loaded
  const properties = storeProperties.length > 0 ? storeProperties.map(p => ({
    ...p,
    propertyType: 'Commercial',
    potentialSavings: (p.assessed_value || 0) * 0.1,
    status: p.flags && p.flags.length > 0 ? 'flagged' : 'review',
    jurisdiction: 'cook-county',
    parcelNumber: `XX-XX-XXX-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
    ownerName: 'Property Owner',
    yearBuilt: 2000,
    squareFootage: 5000,
    currentAssessment: p.assessed_value || 0,
    estimatedValue: p.market_value || 0
  })) : mockProperties;

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showAddProperty, setShowAddProperty] = useState(false);

  // Filters state
  const [filters, setFilters] = useState<PortfolioFilters>({
    search: '',
    jurisdiction: 'all',
    propertyType: 'all',
    status: 'all',
    minValue: '',
    maxValue: '',
    ownershipStatus: 'all'
  });

  // New property form state
  const [newPropertyData, setNewPropertyData] = useState({
    address: '',
    propertyType: '',
    currentAssessment: '',
    estimatedValue: '',
    jurisdiction: '',
    parcelNumber: '',
    ownerName: '',
    yearBuilt: '',
    squareFootage: '',
    notes: ''
  });

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const portfolioMetrics = useMemo(() => {
    const totalProperties = properties.length;
    const totalValue = properties.reduce((sum, p) => sum + p.currentAssessment, 0);
    const totalSavings = properties.reduce((sum, p) => sum + p.potentialSavings, 0);
    const flaggedProperties = properties.filter(p => p.status === 'flagged').length;
    
    return {
      totalProperties,
      totalValue,
      totalSavings,
      flaggedProperties,
      avgSavings: totalProperties > 0 ? totalSavings / totalProperties : 0
    };
  }, [properties]);

  const filteredProperties = useMemo(() => {
    return properties.filter(property => {
      const matchesSearch = !filters.search || 
        property.address.toLowerCase().includes(filters.search.toLowerCase()) ||
        property.ownerName.toLowerCase().includes(filters.search.toLowerCase()) ||
        property.parcelNumber.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesJurisdiction = filters.jurisdiction === 'all' || property.jurisdiction === filters.jurisdiction;
      const matchesType = filters.propertyType === 'all' || property.propertyType === filters.propertyType;
      const matchesStatus = filters.status === 'all' || property.status === filters.status;
      
      const matchesMinValue = !filters.minValue || property.currentAssessment >= parseFloat(filters.minValue);
      const matchesMaxValue = !filters.maxValue || property.currentAssessment <= parseFloat(filters.maxValue);
      
      const matchesOwnership = filters.ownershipStatus === 'all' || property.ownershipStatus === filters.ownershipStatus;

      return matchesSearch && matchesJurisdiction && matchesType && matchesStatus && 
             matchesMinValue && matchesMaxValue && matchesOwnership;
    });
  }, [properties, filters]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handlePropertySelect = (propertyId: string) => {
    setSelectedProperties(prev => 
      prev.includes(propertyId) 
        ? prev.filter(id => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  const handleBulkSelectAll = () => {
    if (selectedProperties.length === filteredProperties.length) {
      setSelectedProperties([]);
    } else {
      setSelectedProperties(filteredProperties.map(p => p.id));
    }
  };

  // Property analysis handler for future use
  // Property analysis handler commented out for linting
  /* const handlePropertyAnalysis = async (propertyId: string) => {
    const property = properties.find(p => p.id === propertyId);
    if (!property) return;

    try {
      await startAnalysis(property);
      // Analysis modal will be handled by store
    } catch {
      toast({
        title: "Analysis Failed",
        description: "Unable to start property analysis. Please try again.",
        variant: "destructive"
      });
    }
  }; */

  const handleAddProperty = async () => {
    // Implementation for adding new property
    setShowAddProperty(false);
    // Reset form
    setNewPropertyData({
      address: '',
      propertyType: '',
      currentAssessment: '',
      estimatedValue: '',
      jurisdiction: '',
      parcelNumber: '',
      ownerName: '',
      yearBuilt: '',
      squareFootage: '',
      notes: ''
    });
    
    toast({
      title: "Property Added",
      description: "New property has been added to your portfolio.",
    });
  };

  const handleClaimProperty = async () => {
    // Implementation for property claiming workflow
    toast({
      title: "Property Claimed",
      description: "You have successfully claimed ownership of this property.",
    });
  };

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderPortfolioMetrics = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <MetricCard
        title="Total Properties"
        value={portfolioMetrics.totalProperties.toString()}
        change="+2 this month"
        icon={<Building className="h-6 w-6" />}
        variant="primary"
      />
      <MetricCard
        title="Total Value"
        value={`$${(portfolioMetrics.totalValue / 1000000).toFixed(1)}M`}
        change="+5.2% vs last year"
        icon={<BarChart3 className="h-6 w-6" />}
        variant="success"
      />
      <MetricCard
        title="Potential Savings"
        value={`$${(portfolioMetrics.totalSavings / 1000).toFixed(0)}K`}
        change="12% of assessment"
        icon={<Calculator className="h-6 w-6" />}
        variant="warning"
      />
      <MetricCard
        title="Flagged Properties"
        value={portfolioMetrics.flaggedProperties.toString()}
        change="Needs attention"
        icon={<AlertCircle className="h-6 w-6" />}
        variant="danger"
      />
    </div>
  );

  const renderPropertyCard = (property: Property) => (
    <ExpandableCard
      key={property.id}
      title={property.address}
      subtitle={`${property.jurisdiction} • ${property.propertyType}`}
      icon={<Building className="w-5 h-5" />}
      className="property-card"
      preview={
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div 
              className={cn(
                "w-4 h-4 rounded border-2 cursor-pointer transition-colors",
                selectedProperties.includes(property.id)
                  ? "bg-blue-600 border-blue-600"
                  : "border-gray-300 hover:border-blue-400"
              )}
              onClick={() => handlePropertySelect(property.id)}
            >
              {selectedProperties.includes(property.id) && (
                <CheckSquare className="w-3 h-3 text-white" />
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="font-semibold text-lg">
              ${property.currentAssessment.toLocaleString()}
            </p>
            <Badge 
              variant={property.status === 'flagged' ? 'destructive' : 'secondary'}
              className="mt-1"
            >
              {property.status}
            </Badge>
          </div>
        </div>
      }
      fullContent={
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Property Type</p>
              <p className="font-medium">{property.propertyType}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Year Built</p>
              <p className="font-medium">{property.yearBuilt}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Square Footage</p>
              <p className="font-medium">{property.squareFootage.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Potential Savings</p>
              <p className="font-medium text-green-600">
                ${property.potentialSavings.toLocaleString()}
              </p>
            </div>
          </div>
          
          {/* V2 Collaborative Features */}
          {property.ownershipStatus && (
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center space-x-4">
                <Badge variant="outline">
                  {property.ownershipStatus === 'verified' ? '✓ Verified Owner' : 
                   property.ownershipStatus === 'claimed' ? '⏳ Pending Verification' : 
                   '⚠️ Disputed'}
                </Badge>
                {property.sharedWithCommunity && (
                  <Badge variant="secondary">
                    🤝 Community Data Shared
                  </Badge>
                )}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = `/analysis/${property.id}`}
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  Analyze
                </Button>
                {property.ownershipStatus === 'claimed' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleClaimProperty(property.id)}
                  >
                    Verify Ownership
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      }
    />
  );

  const renderFiltersPanel = () => (
    <CollapsibleSection
      title="Advanced Filters"
      isOpen={showAdvancedFilters}
      onToggle={() => setShowAdvancedFilters(!showAdvancedFilters)}
      className="mb-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <Label htmlFor="jurisdiction">Jurisdiction</Label>
          <Select 
            value={filters.jurisdiction} 
            onValueChange={(value) => setFilters(prev => ({ ...prev, jurisdiction: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Jurisdictions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Jurisdictions</SelectItem>
              <SelectItem value="cook-county">Cook County</SelectItem>
              <SelectItem value="dupage-county">DuPage County</SelectItem>
              <SelectItem value="lake-county">Lake County</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="propertyType">Property Type</Label>
          <Select 
            value={filters.propertyType} 
            onValueChange={(value) => setFilters(prev => ({ ...prev, propertyType: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="commercial">Commercial</SelectItem>
              <SelectItem value="residential">Residential</SelectItem>
              <SelectItem value="industrial">Industrial</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <Select 
            value={filters.status} 
            onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="flagged">Flagged</SelectItem>
              <SelectItem value="review">Under Review</SelectItem>
              <SelectItem value="appeal">Appeal Filed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="minValue">Min Value</Label>
          <Input
            id="minValue"
            type="number"
            placeholder="$0"
            value={filters.minValue}
            onChange={(e) => setFilters(prev => ({ ...prev, minValue: e.target.value }))}
          />
        </div>

        <div>
          <Label htmlFor="maxValue">Max Value</Label>
          <Input
            id="maxValue"
            type="number"
            placeholder="No limit"
            value={filters.maxValue}
            onChange={(e) => setFilters(prev => ({ ...prev, maxValue: e.target.value }))}
          />
        </div>
      </div>
    </CollapsibleSection>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <IntelligentCanvas mode="portfolio" className="min-h-screen">
      {/* Header - Always visible */}
      <div className="flex items-center justify-between mb-8" data-section="header">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Property Portfolio</h1>
          <p className="text-gray-600 mt-2">
            Intelligent property management with collaborative insights
          </p>
        </div>
        <div className="flex items-center space-x-4" data-section="actions">
          {selectedProperties.length > 0 && (
            <Button
              variant="outline"
              onClick={() => {/* Bulk actions implementation */}}
              className="flex items-center"
            >
              <Package className="w-4 h-4 mr-2" />
              Bulk Actions ({selectedProperties.length})
            </Button>
          )}
          <Button onClick={() => setShowAddProperty(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Property
          </Button>
        </div>
      </div>

      {/* Portfolio Metrics - Always visible */}
      <div className="mb-8" data-section="header">
        {renderPortfolioMetrics()}
      </div>

      {/* Search and Filters */}
      <div data-section="filters">
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search properties, owners, or parcel numbers..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex items-center"
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button
            variant="outline"
            onClick={handleBulkSelectAll}
            className="flex items-center"
          >
            {selectedProperties.length === filteredProperties.length ? (
              <Square className="w-4 h-4 mr-2" />
            ) : (
              <CheckSquare className="w-4 h-4 mr-2" />
            )}
            Select All
          </Button>
        </div>

        {/* Advanced Filters */}
        {renderFiltersPanel()}
      </div>

      {/* Property List */}
      <div className="space-y-4" data-section="properties">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading properties...</p>
          </div>
        ) : filteredProperties.length === 0 ? (
          <Card className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Building className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Properties Found</h3>
            <p className="text-gray-600 mb-6">
              {properties.length === 0 
                ? "Get started by adding your first property."
                : "Try adjusting your filters or search terms."
              }
            </p>
            <Button onClick={() => setShowAddProperty(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Property
            </Button>
          </Card>
        ) : (
          filteredProperties.map(renderPropertyCard)
        )}
      </div>

      {/* Floating Action Button for Quick Add */}
      <FloatingActionButton
        onClick={() => setShowAddProperty(true)}
        className="fixed bottom-8 right-8"
      >
        <Plus className="w-6 h-6" />
      </FloatingActionButton>

      {/* Add Property Modal */}
      <Dialog open={showAddProperty} onOpenChange={setShowAddProperty}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Building className="w-5 h-5 text-blue-600" />
              <span>Add New Property</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="address">Property Address</Label>
              <Input
                id="address"
                value={newPropertyData.address}
                onChange={(e) => setNewPropertyData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="123 Main Street, City, State"
              />
            </div>
            <div>
              <Label htmlFor="parcelNumber">Parcel Number</Label>
              <Input
                id="parcelNumber"
                value={newPropertyData.parcelNumber}
                onChange={(e) => setNewPropertyData(prev => ({ ...prev, parcelNumber: e.target.value }))}
                placeholder="XX-XX-XXX-XXX"
              />
            </div>
            <div>
              <Label htmlFor="propertyType">Property Type</Label>
              <Select 
                value={newPropertyData.propertyType} 
                onValueChange={(value) => setNewPropertyData(prev => ({ ...prev, propertyType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="industrial">Industrial</SelectItem>
                  <SelectItem value="mixed-use">Mixed Use</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="jurisdiction">Jurisdiction</Label>
              <Select 
                value={newPropertyData.jurisdiction} 
                onValueChange={(value) => setNewPropertyData(prev => ({ ...prev, jurisdiction: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select jurisdiction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cook-county">Cook County</SelectItem>
                  <SelectItem value="dupage-county">DuPage County</SelectItem>
                  <SelectItem value="lake-county">Lake County</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="currentAssessment">Current Assessment</Label>
              <Input
                id="currentAssessment"
                type="number"
                value={newPropertyData.currentAssessment}
                onChange={(e) => setNewPropertyData(prev => ({ ...prev, currentAssessment: e.target.value }))}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="estimatedValue">Estimated Value</Label>
              <Input
                id="estimatedValue"
                type="number"
                value={newPropertyData.estimatedValue}
                onChange={(e) => setNewPropertyData(prev => ({ ...prev, estimatedValue: e.target.value }))}
                placeholder="0"
              />
            </div>
          </div>

          <DialogFooter className="space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setShowAddProperty(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAddProperty}>
              <Plus className="w-4 h-4 mr-2" />
              Add Property
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </IntelligentCanvas>
  );
}

export default PortfolioV2;