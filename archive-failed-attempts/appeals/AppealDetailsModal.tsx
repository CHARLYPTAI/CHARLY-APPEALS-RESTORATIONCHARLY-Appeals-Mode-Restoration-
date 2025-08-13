import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, DollarSign, FileText, Clock } from 'lucide-react';

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

interface AppealDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appeal: Appeal | null;
}

export const AppealDetailsModal: React.FC<AppealDetailsModalProps> = ({
  isOpen,
  onClose,
  appeal
}) => {
  if (!appeal) return null;

  const getStatusColor = (status: string) => {
    const lowerStatus = status.toLowerCase();
    if (["pending", "submitted"].includes(lowerStatus)) return "bg-blue-100 text-blue-800";
    if (["in-review", "hearing-scheduled"].includes(lowerStatus)) return "bg-orange-100 text-orange-800";
    if (lowerStatus === "won") return "bg-green-100 text-green-800";
    if (lowerStatus === "lost") return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{appeal.property}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Badge className={getStatusColor(appeal.status)}>
              {appeal.status}
            </Badge>
            <span className="text-sm text-gray-500">Appeal ID: {appeal.id}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Property Information</h3>
              
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{appeal.jurisdiction}</span>
              </div>

              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Filed: {new Date(appeal.filedDate).toLocaleDateString()}</span>
              </div>

              {appeal.deadline && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Deadline: {new Date(appeal.deadline).toLocaleDateString()}</span>
                </div>
              )}

              {appeal.hearingDate && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Hearing: {new Date(appeal.hearingDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Financial Details</h3>
              
              {appeal.currentAssessment && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Assessment:</span>
                  <span className="font-medium">${appeal.currentAssessment.toLocaleString()}</span>
                </div>
              )}

              {appeal.proposedValue && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Proposed Value:</span>
                  <span className="font-medium">${appeal.proposedValue.toLocaleString()}</span>
                </div>
              )}

              {appeal.potentialSavings && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Potential Savings:</span>
                  <span className="font-medium text-green-600">
                    ${appeal.potentialSavings.toLocaleString()}
                  </span>
                </div>
              )}

              {appeal.status.toLowerCase() === "won" && appeal.actualSavings && (
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-600 font-medium">Actual Savings:</span>
                  <span className="font-bold text-green-600">
                    ${appeal.actualSavings.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {appeal.status.toLowerCase() === "won" && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-green-800">Appeal Successful!</h4>
              </div>
              <p className="text-green-700 text-sm">
                Your appeal was successful. The assessment has been reduced from{' '}
                ${appeal.originalAssessment?.toLocaleString()} to{' '}
                ${appeal.finalAssessment?.toLocaleString()}, resulting in{' '}
                ${appeal.actualSavings?.toLocaleString()} in annual savings.
              </p>
            </div>
          )}

          {appeal.status.toLowerCase() === "lost" && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-red-600" />
                <h4 className="font-semibold text-red-800">Appeal Denied</h4>
              </div>
              <p className="text-red-700 text-sm">
                Unfortunately, this appeal was not successful. The assessment remains at{' '}
                ${appeal.currentAssessment?.toLocaleString()}.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};