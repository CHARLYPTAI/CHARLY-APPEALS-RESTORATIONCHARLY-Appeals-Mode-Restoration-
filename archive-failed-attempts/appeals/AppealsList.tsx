import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, DollarSign, Eye, Settings, FileText, Download, Scale, Clock, CheckCircle } from 'lucide-react';

interface Appeal {
  id: string;
  property: string;
  jurisdiction: string;
  status: string;
  filedDate: string;
  currentAssessment?: number;
  proposedValue?: number;
  potentialSavings?: number;
  deadline?: string;
  hearingDate?: string;
  completedDate?: string;
  originalAssessment?: number;
  finalAssessment?: number;
  actualSavings?: number;
}

interface AppealsListProps {
  appeals: Appeal[];
  selectedJurisdiction: string;
  onViewDetails: (appeal: Appeal) => void;
  onManageAppeal: (appeal: Appeal) => void;
  onGenerateCertificate: (appeal: Appeal) => void;
}

export const AppealsList: React.FC<AppealsListProps> = ({ 
  appeals, 
  selectedJurisdiction, 
  onViewDetails, 
  onManageAppeal, 
  onGenerateCertificate 
}) => {
  const filterByJurisdiction = (appealsList: Appeal[]) => {
    if (selectedJurisdiction === 'all') return appealsList;
    return appealsList.filter(appeal => appeal.jurisdiction === selectedJurisdiction);
  };

  const openAppeals = filterByJurisdiction(appeals.filter((appeal) => 
    ["pending", "submitted", "in-review"].includes(appeal.status.toLowerCase())
  ));

  const inProgressAppeals = filterByJurisdiction(appeals.filter((appeal) => 
    ["hearing-scheduled", "under-review", "awaiting-decision"].includes(appeal.status.toLowerCase())
  ));

  const completedAppeals = filterByJurisdiction(appeals.filter((appeal) => 
    ["won", "lost", "settled", "withdrawn"].includes(appeal.status.toLowerCase())
  ));

  const getStatusColor = (status: string) => {
    const lowerStatus = status.toLowerCase();
    if (["pending", "submitted"].includes(lowerStatus)) return "bg-blue-100 text-blue-800";
    if (["in-review", "hearing-scheduled"].includes(lowerStatus)) return "bg-orange-100 text-orange-800";
    if (lowerStatus === "won") return "bg-green-100 text-green-800";
    if (lowerStatus === "lost") return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800";
  };

  const AppealCard: React.FC<{ appeal: Appeal }> = ({ appeal }) => (
    <Card className="mb-4 hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{appeal.property}</h3>
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{appeal.jurisdiction}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{new Date(appeal.filedDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                <span>${appeal.potentialSavings?.toLocaleString() || 'TBD'}</span>
              </div>
            </div>
            <Badge className={getStatusColor(appeal.status)}>
              {appeal.status}
            </Badge>
          </div>
          <div className="flex gap-2 ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(appeal)}
            >
              <Eye className="w-4 h-4 mr-1" />
              View
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onManageAppeal(appeal)}
            >
              <Settings className="w-4 h-4 mr-1" />
              Manage
            </Button>
            {appeal.status.toLowerCase() === "won" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onGenerateCertificate(appeal)}
              >
                <FileText className="w-4 h-4 mr-1" />
                Certificate
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <Tabs defaultValue="open" className="w-full">
        <TabsList className="bg-gray-100 p-1 rounded-lg">
          <TabsTrigger value="open" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Open Appeals ({openAppeals.length})
          </TabsTrigger>
          <TabsTrigger value="progress" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            In Progress ({inProgressAppeals.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Completed ({completedAppeals.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="mt-6">
          {openAppeals.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Scale className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No Open Appeals</p>
              <p>Start by creating a new appeal for one of your properties.</p>
            </div>
          ) : (
            openAppeals.map((appeal) => (
              <AppealCard key={appeal.id} appeal={appeal} />
            ))
          )}
        </TabsContent>

        <TabsContent value="progress" className="mt-6">
          {inProgressAppeals.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No Appeals In Progress</p>
              <p>Appeals that are under review or scheduled for hearing will appear here.</p>
            </div>
          ) : (
            inProgressAppeals.map((appeal) => (
              <AppealCard key={appeal.id} appeal={appeal} />
            ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          {completedAppeals.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No Completed Appeals</p>
              <p>Successful appeals and final decisions will appear here.</p>
            </div>
          ) : (
            completedAppeals.map((appeal) => (
              <AppealCard key={appeal.id} appeal={appeal} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};