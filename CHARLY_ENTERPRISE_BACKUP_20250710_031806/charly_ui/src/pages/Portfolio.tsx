import { useState } from "react";
import { usePortfolioStore } from "@/store/portfolio";
import { CloudUploadButton } from "@/components/CloudUploadButton";
import { ValuationTabs } from "@/components/ValuationTabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Upload, AlertCircle, Building, MapPin, Calculator, ArrowLeft } from "lucide-react";
import { validateFile } from "@/lib/fileValidation";
import { useToast } from "@/components/ui/use-toast";

export function Portfolio() {
  const { properties, loading, error, ingestFiles } = usePortfolioStore();
  const { toast } = useToast();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'valuation'>('list');

  const handleFileUpload = (files: FileList) => {
    const validFiles: File[] = [];
    const errors: string[] = [];

    Array.from(files).forEach((file) => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      toast({
        title: "File validation failed",
        description: errors.join(", "),
        variant: "destructive",
      });
    }

    if (validFiles.length > 0) {
      const fileList = new DataTransfer();
      validFiles.forEach(file => fileList.items.add(file));
      ingestFiles(fileList.files);
    }
  };

  // Mock property data for display
  const mockProperties = [
    {
      id: "1",
      address: "123 Main St, Austin, TX",
      propertyType: "Commercial",
      currentAssessment: 450000,
      estimatedValue: 380000,
      potentialSavings: 14000,
      status: "Under Review"
    },
    {
      id: "2", 
      address: "456 Oak Ave, Houston, TX",
      propertyType: "Residential",
      currentAssessment: 285000,
      estimatedValue: 265000,
      potentialSavings: 4200,
      status: "Appeal Filed"
    },
    {
      id: "3",
      address: "789 Business Blvd, Dallas, TX", 
      propertyType: "Commercial",
      currentAssessment: 1200000,
      estimatedValue: 950000,
      potentialSavings: 52500,
      status: "Won"
    }
  ];

  const displayProperties = properties.length > 0 ? properties : mockProperties;

  const handlePropertySelect = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    setViewMode('valuation');
  };

  const handleBackToList = () => {
    setSelectedPropertyId(null);
    setViewMode('list');
  };

  const handleValuationComplete = (finalValue: number) => {
    toast({
      title: "Valuation Completed",
      description: `Final appraised value: $${finalValue.toLocaleString()}`,
    });
  };

  const selectedProperty = displayProperties.find(p => p.id === selectedPropertyId);

  // Render valuation interface if property is selected
  if (viewMode === 'valuation' && selectedPropertyId && selectedProperty) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={handleBackToList}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Portfolio
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Property Valuation</h1>
            <p className="text-gray-600">{selectedProperty.address}</p>
          </div>
        </div>
        
        <ValuationTabs 
          propertyId={selectedPropertyId === "1" ? "prop_001" : `prop_00${selectedPropertyId}`}
          propertyAddress={selectedProperty.address}
          onValuationComplete={handleValuationComplete}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📁 Portfolio</h1>
        <p className="text-gray-600">Upload and manage your property data files</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {/* Upload Section */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Property Data</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors">
            <CardContent className="p-6 text-center">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="font-medium text-gray-700">Local Files</p>
              <p className="text-sm text-gray-500 mb-4">CSV, Excel, XML files</p>
              <Button 
                onClick={() => document.getElementById('file-upload')?.click()}
                variant="outline"
                size="sm"
              >
                Choose Files
              </Button>
              <input
                id="file-upload"
                type="file"
                multiple
                accept=".csv,.xlsx,.xls,.xml"
                className="hidden"
                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              />
            </CardContent>
          </Card>

          <Card className="border-2 border-dashed border-gray-300">
            <CardContent className="p-6 text-center">
              <CloudUploadButton provider="gdrive" />
              <p className="font-medium text-gray-700 mt-2">Google Drive</p>
              <p className="text-sm text-gray-500">Import from cloud</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-dashed border-gray-300">
            <CardContent className="p-6 text-center">
              <CloudUploadButton provider="dropbox" />
              <p className="font-medium text-gray-700 mt-2">Dropbox</p>
              <p className="text-sm text-gray-500">Import from cloud</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Properties Section */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Properties ({displayProperties.length})</h2>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Property
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading properties...</p>
          </div>
        ) : displayProperties.length === 0 ? (
          <div className="text-center py-12">
            <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">No properties yet</h3>
            <p className="text-gray-500 mb-4">Upload your property data files to get started</p>
            <Button onClick={() => document.getElementById('file-upload')?.click()}>
              <Upload className="w-4 h-4 mr-2" />
              Upload Files
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {displayProperties.map((property: any) => (
              <Card key={property.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="md:col-span-2">
                      <div className="flex items-start space-x-3">
                        <Building className="w-5 h-5 text-gray-500 mt-1" />
                        <div>
                          <h3 className="font-medium text-gray-900">{property.address}</h3>
                          <p className="text-sm text-gray-600">{property.propertyType}</p>
                          <div className="flex items-center mt-1">
                            <MapPin className="w-4 h-4 text-gray-400 mr-1" />
                            <span className="text-sm text-gray-500">Property ID: {property.id}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Current Assessment</p>
                        <p className="text-lg font-semibold text-gray-900">
                          ${property.currentAssessment.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Est. Fair Value</p>
                        <p className="text-lg font-semibold text-blue-600">
                          ${property.estimatedValue.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Potential Savings</p>
                        <p className="text-lg font-semibold text-green-600">
                          ${property.potentialSavings.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          property.status === 'Won' 
                            ? 'bg-green-100 text-green-800'
                            : property.status === 'Appeal Filed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {property.status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col justify-center space-y-2">
                      <Button
                        onClick={() => handlePropertySelect(property.id)}
                        className="bg-blue-600 hover:bg-blue-700 w-full"
                        size="sm"
                      >
                        <Calculator className="w-4 h-4 mr-2" />
                        Analyze Value
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {displayProperties.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Portfolio Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-600">Total Properties</p>
              <p className="text-2xl font-bold text-blue-700">{displayProperties.length}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm font-medium text-green-600">Total Potential Savings</p>
              <p className="text-2xl font-bold text-green-700">
                ${displayProperties.reduce((sum: number, p: any) => sum + (p.potentialSavings || 0), 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <p className="text-sm font-medium text-yellow-600">Under Review</p>
              <p className="text-2xl font-bold text-yellow-700">
                {displayProperties.filter((p: any) => p.status === 'Under Review').length}
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm font-medium text-purple-600">Appeals Won</p>
              <p className="text-2xl font-bold text-purple-700">
                {displayProperties.filter((p: any) => p.status === 'Won').length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}