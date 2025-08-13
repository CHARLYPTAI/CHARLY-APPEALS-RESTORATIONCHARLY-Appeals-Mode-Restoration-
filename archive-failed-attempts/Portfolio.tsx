import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePortfolioStore } from "@/store/portfolio";
import { authService } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, Plus, Search } from "lucide-react";
import { PropertyList } from "@/components/portfolio/PropertyList";
import { PropertyCreationForm } from "@/components/portfolio/PropertyCreationForm";
import { Property } from "@/lib/api-client";

export function Portfolio() {
  const navigate = useNavigate();
  const { properties, loading, error, loadPortfolio } = usePortfolioStore();
  
  // UI state
  const [viewMode, setViewMode] = useState<'list' | 'analytics'>('list');
  const [compareProperties, setCompareProperties] = useState<string[]>([]);
  const [showAddPropertyModal, setShowAddPropertyModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'address' | 'value' | 'savings' | 'status'>('address');

  // Authentication and data loading
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await authService.ensureReady();
        
        // If not authenticated after ensureReady, auto-login for demo
        if (!authService.isAuthenticated()) {
          console.log('Portfolio: Not authenticated, attempting auto-login for demo...');
          try {
            await authService.login({
              email: 'admin@charly.com',
              password: 'CharlyCTO2025!'
            });
            console.log('Portfolio: Auto-login successful');
          } catch (loginError) {
            console.error('Portfolio: Auto-login failed:', loginError);
            return;
          }
        }
        
        await loadPortfolio();
      } catch (error) {
        console.error("Portfolio: Failed to initialize:", error);
      }
    };

    initializeAuth();
  }, [loadPortfolio]);

  // Property selection handlers
  const handlePropertySelect = (propertyId: string) => {
    const property = properties.find(p => p.id === propertyId);
    if (property) {
      setSelectedProperty(property);
      // TODO: Open property analysis modal
    }
  };

  const handleCompareToggle = (propertyId: string) => {
    setCompareProperties(prev => 
      prev.includes(propertyId) 
        ? prev.filter(id => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  const handleKeyDown = (event: React.KeyboardEvent, action: () => void) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  };

  const handlePropertyCreated = () => {
    loadPortfolio(); // Refresh the property list
  };

  // Filter properties based on current filters
  const filteredProperties = properties.filter(property => {
    const matchesSearch = searchQuery === '' || 
      property.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.county?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || property.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'value':
        return (b.current_assessment || 0) - (a.current_assessment || 0);
      case 'savings':
        return (b.potential_savings || 0) - (a.potential_savings || 0);
      case 'status':
        return a.status.localeCompare(b.status);
      case 'address':
      default:
        return a.address.localeCompare(b.address);
    }
  });

  if (viewMode === 'analytics') {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">📊 Portfolio Analytics</h1>
          <Button onClick={() => setViewMode('list')} variant="outline">
            Back to List
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-medium text-gray-900">Total Properties</h3>
            <p className="text-3xl font-bold text-blue-600">{properties.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-medium text-gray-900">Total Assessment</h3>
            <p className="text-3xl font-bold text-green-600">
              ${properties.reduce((sum, p) => sum + (p.current_assessment || 0), 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-medium text-gray-900">Potential Savings</h3>
            <p className="text-3xl font-bold text-orange-600">
              ${properties.reduce((sum, p) => sum + (p.potential_savings || 0), 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-medium text-gray-900">Success Rate</h3>
            <p className="text-3xl font-bold text-purple-600">
              {properties.length > 0 ? Math.round((properties.filter(p => p.status === 'Won').length / properties.length) * 100) : 0}%
            </p>
          </div>
        </div>
      </div>
    );
  }

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
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2" id="page-title">
              📁 Portfolio
            </h1>
            <p className="text-gray-600" id="page-description">
              Manage and analyze your property portfolio
            </p>
          </div>
          
          <div className="flex gap-2" role="toolbar" aria-label="Portfolio actions">
            {compareProperties.length > 0 && (
              <Button 
                onClick={() => console.log('Compare:', compareProperties)}
                className="bg-blue-600 hover:bg-blue-700"
                aria-label={`Compare ${compareProperties.length} selected properties`}
              >
                Compare ({compareProperties.length})
              </Button>
            )}
            
            <Button 
              variant="outline"
              onClick={() => setViewMode('analytics')}
              aria-label="Switch to analytics view"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </Button>
            
            <Button 
              onClick={() => setShowAddPropertyModal(true)}
              className="bg-green-600 hover:bg-green-700"
              aria-label="Add new property"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Property
            </Button>
          </div>
        </div>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-sm text-gray-500">Total Properties</div>
            <div className="text-2xl font-bold text-gray-900">{properties.length}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-sm text-gray-500">Total Value</div>
            <div className="text-2xl font-bold text-blue-600">
              ${properties.reduce((sum, p) => sum + (p.current_assessment || 0), 0).toLocaleString()}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-sm text-gray-500">Potential Savings</div>
            <div className="text-2xl font-bold text-green-600">
              ${properties.reduce((sum, p) => sum + (p.potential_savings || 0), 0).toLocaleString()}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-sm text-gray-500">Active Appeals</div>
            <div className="text-2xl font-bold text-orange-600">
              {properties.filter(p => p.status === 'Appeal Filed').length}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg border mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search properties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Under Review">Under Review</SelectItem>
                <SelectItem value="Appeal Filed">Appeal Filed</SelectItem>
                <SelectItem value="Won">Won</SelectItem>
                <SelectItem value="Lost">Lost</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="address">Address</SelectItem>
                <SelectItem value="value">Assessment Value</SelectItem>
                <SelectItem value="savings">Potential Savings</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchQuery('');
                setFilterStatus('all');
                setSortBy('address');
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>
        
        {/* Property List */}
        <PropertyList
          properties={filteredProperties}
          compareProperties={compareProperties}
          analysisResults={{}}
          isAnalyzing={null}
          onPropertySelect={handlePropertySelect}
          onCompareToggle={handleCompareToggle}
          handleKeyDown={handleKeyDown}
          loading={loading}
          error={error}
        />
      </main>

      {/* Add Property Modal */}
      <PropertyCreationForm
        open={showAddPropertyModal}
        onOpenChange={setShowAddPropertyModal}
        onPropertyCreated={handlePropertyCreated}
      />
    </div>
  );
}

export default Portfolio;