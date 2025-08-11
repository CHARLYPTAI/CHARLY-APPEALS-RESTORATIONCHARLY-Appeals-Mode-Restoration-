import React, { useState } from 'react';
import { Users, Eye, Settings, Palette, Globe, Download, UserCheck } from 'lucide-react';
import { useToast } from './ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface ClientPortal {
  id: string;
  clientName: string;
  domain: string;
  status: 'active' | 'pending' | 'suspended';
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  customization: {
    headerText: string;
    footerText: string;
    contactEmail: string;
    supportPhone: string;
  };
  features: {
    propertyLookup: boolean;
    appealTracking: boolean;
    documentDownload: boolean;
    notifications: boolean;
    reporting: boolean;
  };
  clients: {
    id: string;
    name: string;
    email: string;
    propertiesCount: number;
    lastLogin: string;
    status: 'active' | 'inactive';
  }[];
  analytics: {
    totalLogins: number;
    uniqueUsers: number;
    avgSessionTime: string;
    documentDownloads: number;
  };
}

const mockPortals: ClientPortal[] = [
  {
    id: '1',
    clientName: 'Austin Property Consultants',
    domain: 'austinpropertyappeals.com',
    status: 'active',
    logoUrl: '/logos/austin-pc.png',
    primaryColor: '#1e40af',
    secondaryColor: '#64748b',
    customization: {
      headerText: 'Austin Property Tax Appeals Portal',
      footerText: '© 2024 Austin Property Consultants. All rights reserved.',
      contactEmail: 'support@austinpropertyappeals.com',
      supportPhone: '(512) 555-0123'
    },
    features: {
      propertyLookup: true,
      appealTracking: true,
      documentDownload: true,
      notifications: true,
      reporting: true
    },
    clients: [
      { id: '1', name: 'Westfield Properties', email: 'contact@westfield.com', propertiesCount: 45, lastLogin: '2024-01-15', status: 'active' },
      { id: '2', name: 'Metro Real Estate', email: 'info@metro-re.com', propertiesCount: 28, lastLogin: '2024-01-14', status: 'active' },
      { id: '3', name: 'Downtown Holdings', email: 'admin@downtown.com', propertiesCount: 12, lastLogin: '2024-01-10', status: 'inactive' }
    ],
    analytics: {
      totalLogins: 1247,
      uniqueUsers: 45,
      avgSessionTime: '12m 34s',
      documentDownloads: 389
    }
  },
  {
    id: '2',
    clientName: 'Texas Commercial Appeals',
    domain: 'txcommercialappeals.com',
    status: 'active',
    primaryColor: '#dc2626',
    secondaryColor: '#374151',
    customization: {
      headerText: 'Texas Commercial Property Appeals',
      footerText: '© 2024 Texas Commercial Appeals LLC',
      contactEmail: 'help@txcommercialappeals.com',
      supportPhone: '(214) 555-0567'
    },
    features: {
      propertyLookup: true,
      appealTracking: true,
      documentDownload: true,
      notifications: false,
      reporting: true
    },
    clients: [
      { id: '4', name: 'Corporate Centers Inc', email: 'legal@corpcenter.com', propertiesCount: 67, lastLogin: '2024-01-14', status: 'active' },
      { id: '5', name: 'Retail Properties Group', email: 'appeals@rpgroup.com', propertiesCount: 34, lastLogin: '2024-01-13', status: 'active' }
    ],
    analytics: {
      totalLogins: 892,
      uniqueUsers: 32,
      avgSessionTime: '9m 47s',
      documentDownloads: 156
    }
  }
];

const ClientPortalWhiteLabel: React.FC = () => {
  const { toast } = useToast();
  const [selectedPortal, setSelectedPortal] = useState<ClientPortal | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'customization' | 'clients' | 'analytics'>('overview');
  const [previewMode, setPreviewMode] = useState(false);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'active': 'bg-green-100 text-green-700',
      'pending': 'bg-yellow-100 text-yellow-700',
      'suspended': 'bg-red-100 text-red-700',
      'inactive': 'bg-gray-100 text-gray-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  if (previewMode && selectedPortal) {
    // Portal Preview Mode
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Preview Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => setPreviewMode(false)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Exit Preview
              </Button>
              <Badge variant="outline">Preview Mode</Badge>
            </div>
            <div className="text-sm text-gray-600">
              {selectedPortal.domain}
            </div>
          </div>
        </div>

        {/* Portal UI Simulation */}
        <div style={{ backgroundColor: selectedPortal.primaryColor }} className="p-6 text-white">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold">{selectedPortal.customization.headerText}</h1>
            <p className="mt-2 opacity-90">Welcome to your property tax appeals portal</p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6 text-center">
                <Building className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                <h3 className="text-lg font-semibold mb-2">Property Lookup</h3>
                <p className="text-gray-600">Search and view your property assessments</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-green-600" />
                <h3 className="text-lg font-semibold mb-2">Track Appeals</h3>
                <p className="text-gray-600">Monitor the status of your active appeals</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Download className="h-12 w-12 mx-auto mb-4 text-purple-600" />
                <h3 className="text-lg font-semibold mb-2">Download Reports</h3>
                <p className="text-gray-600">Access your appeal documents and reports</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span>Appeal filed for 123 Main Street</span>
                  <span className="text-sm text-gray-500">2 days ago</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span>New assessment received for Commerce Center</span>
                  <span className="text-sm text-gray-500">5 days ago</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span>Appeal won - 456 Business Park</span>
                  <span className="text-sm text-gray-500">1 week ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <footer style={{ backgroundColor: selectedPortal.secondaryColor }} className="text-white p-6 mt-12">
          <div className="max-w-6xl mx-auto text-center">
            <p>{selectedPortal.customization.footerText}</p>
            <div className="flex justify-center gap-6 mt-4 text-sm">
              <span>📧 {selectedPortal.customization.contactEmail}</span>
              <span>📞 {selectedPortal.customization.supportPhone}</span>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-2">
          <Globe className="h-6 w-6 text-blue-600" />
          Client Portal & White-Label Solutions
        </h2>
        <p className="text-gray-600">
          Manage branded client portals and white-label solutions for your partners
        </p>
      </div>

      {!selectedPortal ? (
        // Portal List View
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Active Portals</h3>
            <Button 
              className="flex items-center gap-2"
              onClick={() => {
                toast({
                  title: "Create Portal",
                  description: "Portal creation wizard opened - enterprise white-label solution ready",
                });
              }}
            >
              <Plus className="h-4 w-4" />
              Create Portal
            </Button>
          </div>

          {mockPortals.map((portal) => (
            <Card 
              key={portal.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedPortal(portal)}
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{portal.clientName}</h3>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <Globe className="h-4 w-4" />
                      {portal.domain}
                    </p>
                  </div>
                  <Badge className={getStatusColor(portal.status)}>
                    {portal.status.toUpperCase()}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Active Clients</p>
                    <p className="text-xl font-semibold">{portal.clients.filter(c => c.status === 'active').length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Properties</p>
                    <p className="text-xl font-semibold">
                      {portal.clients.reduce((sum, client) => sum + client.propertiesCount, 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Monthly Logins</p>
                    <p className="text-xl font-semibold">{portal.analytics.totalLogins}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Avg Session</p>
                    <p className="text-xl font-semibold">{portal.analytics.avgSessionTime}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {Object.entries(portal.features).map(([feature, enabled]) => (
                    <Badge
                      key={feature}
                      variant={enabled ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {feature.replace(/([A-Z])/g, ' $1').trim()}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        // Portal Detail View
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => setSelectedPortal(null)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Portals
              </Button>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{selectedPortal.clientName}</h3>
                <p className="text-gray-600">{selectedPortal.domain}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setPreviewMode(true)}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                Preview Portal
              </Button>
              <Badge className={getStatusColor(selectedPortal.status)}>
                {selectedPortal.status.toUpperCase()}
              </Badge>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'overview' | 'customization' | 'clients' | 'analytics')}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="customization">Customization</TabsTrigger>
              <TabsTrigger value="clients">Clients</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5 text-blue-600" />
                      Portal Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Domain</p>
                      <p className="font-medium">{selectedPortal.domain}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Primary Color</p>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-6 h-6 rounded border"
                          style={{ backgroundColor: selectedPortal.primaryColor }}
                        />
                        <span className="font-medium">{selectedPortal.primaryColor}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Features Enabled</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Object.entries(selectedPortal.features)
                          .filter(([, enabled]) => enabled)
                          .map(([feature]) => (
                            <Badge key={feature} variant="secondary" className="text-xs">
                              {feature.replace(/([A-Z])/g, ' $1').trim()}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-green-600" />
                      Usage Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{selectedPortal.clients.length}</p>
                        <p className="text-sm text-gray-600">Total Clients</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">
                          {selectedPortal.clients.reduce((sum, client) => sum + client.propertiesCount, 0)}
                        </p>
                        <p className="text-sm text-gray-600">Properties</p>
                      </div>
                    </div>
                    <div className="pt-4 border-t">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-600">Active Users</span>
                        <span className="text-sm font-medium">
                          {selectedPortal.clients.filter(c => c.status === 'active').length} / {selectedPortal.clients.length}
                        </span>
                      </div>
                      <Progress 
                        value={(selectedPortal.clients.filter(c => c.status === 'active').length / selectedPortal.clients.length) * 100} 
                        className="h-2" 
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="customization" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5 text-purple-600" />
                    Portal Customization
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="headerText">Header Text</Label>
                        <Input 
                          id="headerText"
                          value={selectedPortal.customization.headerText}
                          readOnly
                        />
                      </div>
                      <div>
                        <Label htmlFor="footerText">Footer Text</Label>
                        <Input 
                          id="footerText"
                          value={selectedPortal.customization.footerText}
                          readOnly
                        />
                      </div>
                      <div>
                        <Label htmlFor="contactEmail">Contact Email</Label>
                        <Input 
                          id="contactEmail"
                          value={selectedPortal.customization.contactEmail}
                          readOnly
                        />
                      </div>
                      <div>
                        <Label htmlFor="supportPhone">Support Phone</Label>
                        <Input 
                          id="supportPhone"
                          value={selectedPortal.customization.supportPhone}
                          readOnly
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label>Feature Toggles</Label>
                        <div className="space-y-3 mt-2">
                          {Object.entries(selectedPortal.features).map(([feature, enabled]) => (
                            <div key={feature} className="flex items-center justify-between">
                              <Label className="text-sm font-normal">
                                {feature.replace(/([A-Z])/g, ' $1').trim()}
                              </Label>
                              <Switch checked={enabled} disabled />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="clients" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-blue-600" />
                    Portal Clients
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedPortal.clients.map((client) => (
                      <div key={client.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Users className="h-8 w-8 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">{client.name}</p>
                            <p className="text-sm text-gray-600">{client.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{client.propertiesCount} properties</p>
                          <p className="text-xs text-gray-500">Last login: {new Date(client.lastLogin).toLocaleDateString()}</p>
                          <Badge className={`mt-1 ${getStatusColor(client.status)}`}>
                            {client.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-2xl font-bold text-blue-600">{selectedPortal.analytics.totalLogins}</p>
                    <p className="text-sm text-gray-600 mt-1">Total Logins</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-2xl font-bold text-green-600">{selectedPortal.analytics.uniqueUsers}</p>
                    <p className="text-sm text-gray-600 mt-1">Unique Users</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-2xl font-bold text-purple-600">{selectedPortal.analytics.avgSessionTime}</p>
                    <p className="text-sm text-gray-600 mt-1">Avg Session Time</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-2xl font-bold text-orange-600">{selectedPortal.analytics.documentDownloads}</p>
                    <p className="text-sm text-gray-600 mt-1">Document Downloads</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

// Missing icon components
const ArrowLeft = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const Plus = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const Building = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

export default ClientPortalWhiteLabel;