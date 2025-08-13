import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar, Save, Upload, Download, MessageSquare, Activity } from 'lucide-react';

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

interface AppealManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  appeal: Appeal | null;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const AppealManagementModal: React.FC<AppealManagementModalProps> = ({
  isOpen,
  onClose,
  appeal,
  activeTab,
  onTabChange
}) => {
  const [notes, setNotes] = useState("");
  const [statusUpdate, setStatusUpdate] = useState("");
  const [hearingDate, setHearingDate] = useState("");

  if (!appeal) return null;

  const handleSaveNotes = () => {
    console.log("Saving notes for appeal:", appeal.id, notes);
  };

  const handleStatusUpdate = () => {
    console.log("Updating status for appeal:", appeal.id, statusUpdate);
  };

  const handleScheduleHearing = () => {
    console.log("Scheduling hearing for appeal:", appeal.id, hearingDate);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Manage Appeal: {appeal.property}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="communication">Communication</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="status" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Current Status</h3>
                <Badge className="text-sm px-3 py-1">
                  {appeal.status}
                </Badge>
                
                <div>
                  <Label htmlFor="status-update">Update Status</Label>
                  <Input
                    id="status-update"
                    value={statusUpdate}
                    onChange={(e) => setStatusUpdate(e.target.value)}
                    placeholder="Enter new status"
                  />
                  <Button onClick={handleStatusUpdate} className="mt-2" size="sm">
                    <Save className="w-4 h-4 mr-1" />
                    Update Status
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Key Dates</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Filed:</span>
                    <span>{new Date(appeal.filedDate).toLocaleDateString()}</span>
                  </div>
                  {appeal.deadline && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Deadline:</span>
                      <span>{new Date(appeal.deadline).toLocaleDateString()}</span>
                    </div>
                  )}
                  {appeal.hearingDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Hearing:</span>
                      <span>{new Date(appeal.hearingDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="hearing-date">Schedule Hearing</Label>
                  <Input
                    id="hearing-date"
                    type="date"
                    value={hearingDate}
                    onChange={(e) => setHearingDate(e.target.value)}
                  />
                  <Button onClick={handleScheduleHearing} className="mt-2" size="sm">
                    <Calendar className="w-4 h-4 mr-1" />
                    Schedule Hearing
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Internal Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add internal notes about this appeal..."
                rows={4}
              />
              <Button onClick={handleSaveNotes} className="mt-2" size="sm">
                <Save className="w-4 h-4 mr-1" />
                Save Notes
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="documents" className="mt-6 space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Appeal Documents</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Appeal Packet</h4>
                  <p className="text-sm text-gray-600 mb-3">Generated appeal documentation</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Supporting Documents</h4>
                  <p className="text-sm text-gray-600 mb-3">Upload additional evidence</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Upload className="w-4 h-4 mr-1" />
                      Upload
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="communication" className="mt-6 space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Communication Log</h3>
              
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-sm">System</span>
                  <span className="text-xs text-gray-500">
                    {new Date(appeal.filedDate).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm">Appeal submitted to {appeal.jurisdiction}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-message">Add Communication Entry</Label>
                <Textarea
                  id="new-message"
                  placeholder="Record phone calls, emails, or other communications..."
                  rows={3}
                />
                <Button size="sm">
                  <MessageSquare className="w-4 h-4 mr-1" />
                  Add Entry
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="mt-6 space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Activity Timeline</h3>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Appeal Created</p>
                    <p className="text-xs text-gray-500">
                      {new Date(appeal.filedDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Documents Generated</p>
                    <p className="text-xs text-gray-500">
                      {new Date(appeal.filedDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-600 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Status: {appeal.status}</p>
                    <p className="text-xs text-gray-500">Current</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};