import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Scale, Clock, CheckCircle, DollarSign } from 'lucide-react';

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

interface AppealsStatsProps {
  appeals: Appeal[];
  selectedJurisdiction: string;
}

export const AppealsStats: React.FC<AppealsStatsProps> = ({ appeals, selectedJurisdiction }) => {
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

  const wonAppeals = filterByJurisdiction(appeals.filter((appeal) => 
    appeal.status.toLowerCase() === "won"
  ));

  const totalSavings = wonAppeals.reduce((sum, appeal) => {
    return sum + (appeal.actualSavings || appeal.potentialSavings || 0);
  }, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="border-0 shadow-md">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-blue-50">
              <Scale className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-2xl font-bold text-blue-600">{openAppeals.length}</span>
          </div>
          <p className="text-sm text-gray-600 font-medium">Open Appeals</p>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-orange-50">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-2xl font-bold text-orange-600">{inProgressAppeals.length}</span>
          </div>
          <p className="text-sm text-gray-600 font-medium">In Progress</p>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-green-50">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-2xl font-bold text-green-600">{wonAppeals.length}</span>
          </div>
          <p className="text-sm text-gray-600 font-medium">Successful Appeals</p>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-purple-50">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-2xl font-bold text-purple-600">
              ${totalSavings.toLocaleString()}
            </span>
          </div>
          <p className="text-sm text-gray-600 font-medium">Total Savings</p>
        </CardContent>
      </Card>
    </div>
  );
};