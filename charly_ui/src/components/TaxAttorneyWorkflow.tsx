import React, { useState } from 'react';
import { Briefcase, Scale, FileText, Calendar, Clock, CheckCircle, Users, FileCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

interface LegalCase {
  id: string;
  clientName: string;
  propertyAddress: string;
  caseNumber: string;
  status: 'intake' | 'discovery' | 'hearing-prep' | 'hearing' | 'post-hearing' | 'closed';
  filingDeadline: string;
  hearingDate?: string;
  assignedAttorney: string;
  potentialSavings: number;
  currentAssessment: number;
  proposedValue: number;
  documents: {
    name: string;
    type: string;
    status: 'pending' | 'uploaded' | 'reviewed';
    dueDate?: string;
  }[];
  tasks: {
    id: string;
    description: string;
    assignee: string;
    dueDate: string;
    status: 'pending' | 'in-progress' | 'completed';
    priority: 'low' | 'medium' | 'high';
  }[];
}

const mockCases: LegalCase[] = [
  {
    id: '1',
    clientName: 'Westfield Properties LLC',
    propertyAddress: '123 Commerce Center, Austin, TX',
    caseNumber: 'TX-2024-0892',
    status: 'hearing-prep',
    filingDeadline: '2024-03-15',
    hearingDate: '2024-04-22',
    assignedAttorney: 'Sarah Johnson',
    potentialSavings: 450000,
    currentAssessment: 8500000,
    proposedValue: 7200000,
    documents: [
      { name: 'Initial Appeal Form', type: 'legal', status: 'reviewed' },
      { name: 'Appraisal Report', type: 'valuation', status: 'uploaded' },
      { name: 'Comparable Sales Analysis', type: 'evidence', status: 'pending', dueDate: '2024-03-20' },
      { name: 'Income & Expense Statement', type: 'financial', status: 'uploaded' }
    ],
    tasks: [
      { id: '1', description: 'Review comparable sales data', assignee: 'Sarah Johnson', dueDate: '2024-03-18', status: 'in-progress', priority: 'high' },
      { id: '2', description: 'Prepare witness testimony outline', assignee: 'Michael Chen', dueDate: '2024-03-25', status: 'pending', priority: 'high' },
      { id: '3', description: 'Client meeting - hearing prep', assignee: 'Sarah Johnson', dueDate: '2024-04-10', status: 'pending', priority: 'medium' }
    ]
  },
  {
    id: '2',
    clientName: 'Riverside Retail Group',
    propertyAddress: '456 Main Street Mall, Houston, TX',
    caseNumber: 'TX-2024-1156',
    status: 'discovery',
    filingDeadline: '2024-04-01',
    assignedAttorney: 'Michael Chen',
    potentialSavings: 280000,
    currentAssessment: 5600000,
    proposedValue: 4800000,
    documents: [
      { name: 'Initial Appeal Form', type: 'legal', status: 'reviewed' },
      { name: 'Appraisal Report', type: 'valuation', status: 'pending', dueDate: '2024-03-10' },
      { name: 'Tenant Roll', type: 'financial', status: 'pending', dueDate: '2024-03-12' }
    ],
    tasks: [
      { id: '4', description: 'Request property records from county', assignee: 'Legal Assistant', dueDate: '2024-03-08', status: 'completed', priority: 'medium' },
      { id: '5', description: 'Analyze market comps', assignee: 'Michael Chen', dueDate: '2024-03-15', status: 'pending', priority: 'high' }
    ]
  }
];

const TaxAttorneyWorkflow: React.FC = () => {
  const [selectedCase, setSelectedCase] = useState<LegalCase | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'tasks'>('overview');
  const [showNewCaseModal, setShowNewCaseModal] = useState(false);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [cases, setCases] = useState<LegalCase[]>(mockCases);
  const [isCreatingCase, setIsCreatingCase] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const { toast } = useToast();

  // New case form state
  const [newCase, setNewCase] = useState({
    clientName: '',
    propertyAddress: '',
    caseNumber: '',
    assignedAttorney: '',
    currentAssessment: '',
    proposedValue: '',
    filingDeadline: '',
    hearingDate: '',
    notes: ''
  });

  // New task form state
  const [newTask, setNewTask] = useState({
    description: '',
    assignee: '',
    dueDate: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    notes: ''
  });

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      'intake': 'bg-gray-100 text-gray-700',
      'discovery': 'bg-blue-100 text-blue-700',
      'hearing-prep': 'bg-yellow-100 text-yellow-700',
      'hearing': 'bg-orange-100 text-orange-700',
      'post-hearing': 'bg-purple-100 text-purple-700',
      'closed': 'bg-green-100 text-green-700'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-700';
  };

  const getTaskPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'low': 'bg-gray-100 text-gray-700',
      'medium': 'bg-yellow-100 text-yellow-700',
      'high': 'bg-red-100 text-red-700'
    };
    return colors[priority] || 'bg-gray-100 text-gray-700';
  };

  const calculateDaysUntil = (date: string) => {
    const target = new Date(date);
    const today = new Date();
    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getCaseProgress = (caseData: LegalCase) => {
    const statusOrder = ['intake', 'discovery', 'hearing-prep', 'hearing', 'post-hearing', 'closed'];
    const currentIndex = statusOrder.indexOf(caseData.status);
    return ((currentIndex + 1) / statusOrder.length) * 100;
  };

  const handleCreateCase = async () => {
    if (!newCase.clientName || !newCase.propertyAddress || !newCase.assignedAttorney) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Client Name, Property Address, Assigned Attorney)",
        variant: "destructive"
      });
      return;
    }

    setIsCreatingCase(true);

    try {
      // Generate new case ID
      const newCaseId = (cases.length + 1).toString();
      const generatedCaseNumber = newCase.caseNumber || `TX-2024-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;

      // Calculate potential savings
      const currentAssessment = parseFloat(newCase.currentAssessment) || 0;
      const proposedValue = parseFloat(newCase.proposedValue) || 0;
      const potentialSavings = currentAssessment > proposedValue ? (currentAssessment - proposedValue) * 0.021 : 0; // Assuming 2.1% tax rate

      const createdCase: LegalCase = {
        id: newCaseId,
        clientName: newCase.clientName,
        propertyAddress: newCase.propertyAddress,
        caseNumber: generatedCaseNumber,
        status: 'intake',
        filingDeadline: newCase.filingDeadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default 30 days from now
        hearingDate: newCase.hearingDate || undefined,
        assignedAttorney: newCase.assignedAttorney,
        potentialSavings: Math.round(potentialSavings),
        currentAssessment: currentAssessment,
        proposedValue: proposedValue,
        documents: [
          { name: 'Initial Appeal Form', type: 'legal', status: 'pending' },
          { name: 'Property Records Request', type: 'administrative', status: 'pending' },
          { name: 'Assessment Review', type: 'valuation', status: 'pending' }
        ],
        tasks: [
          {
            id: '1',
            description: 'Complete client intake documentation',
            assignee: newCase.assignedAttorney,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
            status: 'pending',
            priority: 'high'
          },
          {
            id: '2',
            description: 'Request property assessment records',
            assignee: 'Legal Assistant',
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days from now
            status: 'pending',
            priority: 'medium'
          }
        ]
      };

      // Add to cases list
      setCases(prevCases => [...prevCases, createdCase]);

      // Reset form
      setNewCase({
        clientName: '',
        propertyAddress: '',
        caseNumber: '',
        assignedAttorney: '',
        currentAssessment: '',
        proposedValue: '',
        filingDeadline: '',
        hearingDate: '',
        notes: ''
      });

      // Close modal
      setShowNewCaseModal(false);

      // Show success toast
      toast({
        title: "Case Created Successfully",
        description: `New legal case ${generatedCaseNumber} has been created for ${newCase.clientName}`,
      });

      // Automatically select the new case
      setSelectedCase(createdCase);

    } catch (error) {
      console.error('Case creation error:', error);
      toast({
        title: "Case Creation Failed",
        description: "Unable to create new case. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreatingCase(false);
    }
  };

  const handleCreateTask = async () => {
    if (!selectedCase) {
      toast({
        title: "Error",
        description: "No case selected for task creation",
        variant: "destructive"
      });
      return;
    }

    if (!newTask.description || !newTask.assignee) {
      toast({
        title: "Validation Error",
        description: "Please fill in the task description and assignee",
        variant: "destructive"
      });
      return;
    }

    setIsCreatingTask(true);

    try {
      // Generate new task ID
      const maxTaskId = Math.max(...selectedCase.tasks.map(t => parseInt(t.id)), 0);
      const newTaskId = (maxTaskId + 1).toString();

      // Default due date to 7 days from now if not specified
      const defaultDueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const createdTask = {
        id: newTaskId,
        description: newTask.description,
        assignee: newTask.assignee,
        dueDate: newTask.dueDate || defaultDueDate,
        status: 'pending' as const,
        priority: newTask.priority
      };

      // Update the selected case with the new task
      const updatedCase = {
        ...selectedCase,
        tasks: [...selectedCase.tasks, createdTask]
      };

      // Update cases list
      setCases(prevCases => 
        prevCases.map(caseItem => 
          caseItem.id === selectedCase.id ? updatedCase : caseItem
        )
      );

      // Update selected case
      setSelectedCase(updatedCase);

      // Reset form
      setNewTask({
        description: '',
        assignee: '',
        dueDate: '',
        priority: 'medium',
        notes: ''
      });

      // Close modal
      setShowNewTaskModal(false);

      // Show success toast
      toast({
        title: "Task Created Successfully",
        description: `New task assigned to ${newTask.assignee} for case ${selectedCase.caseNumber}`,
      });

      // Switch to tasks tab if not already there
      setActiveTab('tasks');

    } catch (error) {
      console.error('Task creation error:', error);
      toast({
        title: "Task Creation Failed",
        description: "Unable to create new task. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreatingTask(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-2">
          <Briefcase className="h-6 w-6 text-blue-600" />
          Tax Attorney Workflow Management
        </h2>
        <p className="text-gray-600">
          Streamline legal workflows for property tax appeals and litigation
        </p>
      </div>

      {!selectedCase ? (
        // Case List View
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Active Cases</h3>
            <Button 
              className="flex items-center gap-2"
              onClick={() => setShowNewCaseModal(true)}
            >
              <Plus className="h-4 w-4" />
              New Case
            </Button>
          </div>

          {cases.map((legalCase) => (
            <Card 
              key={legalCase.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedCase(legalCase)}
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{legalCase.clientName}</h3>
                    <p className="text-sm text-gray-600">{legalCase.propertyAddress}</p>
                    <p className="text-sm text-gray-500 mt-1">Case #: {legalCase.caseNumber}</p>
                  </div>
                  <Badge className={getStatusColor(legalCase.status)}>
                    {legalCase.status.replace('-', ' ').toUpperCase()}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Assigned Attorney</p>
                    <p className="font-medium flex items-center gap-1">
                      <Users className="h-4 w-4 text-gray-400" />
                      {legalCase.assignedAttorney}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Filing Deadline</p>
                    <p className="font-medium flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {new Date(legalCase.filingDeadline).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Potential Savings</p>
                    <p className="font-medium text-green-600">
                      ${legalCase.potentialSavings.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Days Until Deadline</p>
                    <p className={`font-medium ${calculateDaysUntil(legalCase.filingDeadline) < 7 ? 'text-red-600' : 'text-gray-900'}`}>
                      {calculateDaysUntil(legalCase.filingDeadline)} days
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Case Progress</span>
                    <span className="font-medium">{Math.round(getCaseProgress(legalCase))}%</span>
                  </div>
                  <Progress value={getCaseProgress(legalCase)} className="h-2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        // Case Detail View
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => setSelectedCase(null)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Cases
              </Button>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{selectedCase.clientName}</h3>
                <p className="text-gray-600">{selectedCase.caseNumber}</p>
              </div>
            </div>
            <Badge className={getStatusColor(selectedCase.status)}>
              {selectedCase.status.replace('-', ' ').toUpperCase()}
            </Badge>
          </div>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'overview' | 'documents' | 'tasks')}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Scale className="h-5 w-5 text-blue-600" />
                      Case Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Property Address</p>
                      <p className="font-medium">{selectedCase.propertyAddress}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Assigned Attorney</p>
                      <p className="font-medium">{selectedCase.assignedAttorney}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Filing Deadline</p>
                      <p className="font-medium">{new Date(selectedCase.filingDeadline).toLocaleDateString()}</p>
                    </div>
                    {selectedCase.hearingDate && (
                      <div>
                        <p className="text-sm text-gray-600">Hearing Date</p>
                        <p className="font-medium">{new Date(selectedCase.hearingDate).toLocaleDateString()}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      Financial Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Current Assessment</p>
                      <p className="font-medium">${selectedCase.currentAssessment.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Proposed Value</p>
                      <p className="font-medium">${selectedCase.proposedValue.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Potential Tax Savings</p>
                      <p className="font-medium text-green-600">${selectedCase.potentialSavings.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Reduction Percentage</p>
                      <p className="font-medium">
                        {((1 - selectedCase.proposedValue / selectedCase.currentAssessment) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Case Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                    <div className="space-y-6">
                      {['intake', 'discovery', 'hearing-prep', 'hearing', 'post-hearing', 'closed'].map((status, index) => {
                        const isCompleted = ['intake', 'discovery', 'hearing-prep', 'hearing', 'post-hearing', 'closed'].indexOf(selectedCase.status) >= index;
                        const isCurrent = selectedCase.status === status;
                        
                        return (
                          <div key={status} className="flex items-center gap-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                              isCompleted ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                            }`}>
                              {isCompleted ? <CheckCircle className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                            </div>
                            <div className={`flex-1 ${isCurrent ? 'font-semibold' : ''}`}>
                              <p className="text-gray-900">{status.replace('-', ' ').charAt(0).toUpperCase() + status.replace('-', ' ').slice(1)}</p>
                              {isCurrent && <p className="text-sm text-gray-600">Current Stage</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Case Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedCase.documents.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileCheck className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">{doc.name}</p>
                            <p className="text-sm text-gray-600">Type: {doc.type}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {doc.dueDate && (
                            <p className="text-sm text-gray-600">
                              Due: {new Date(doc.dueDate).toLocaleDateString()}
                            </p>
                          )}
                          <Badge className={
                            doc.status === 'reviewed' ? 'bg-green-100 text-green-700' :
                            doc.status === 'uploaded' ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'
                          }>
                            {doc.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tasks" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      Case Tasks
                    </span>
                    <Button 
                      size="sm" 
                      className="flex items-center gap-2"
                      onClick={() => setShowNewTaskModal(true)}
                    >
                      <Plus className="h-4 w-4" />
                      Add Task
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedCase.tasks.map((task) => (
                      <div key={task.id} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                        <input
                          type="checkbox"
                          checked={task.status === 'completed'}
                          className="mt-1"
                          readOnly
                        />
                        <div className="flex-1">
                          <p className={`font-medium ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                            {task.description}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span className="text-gray-600">Assigned to: {task.assignee}</span>
                            <span className="text-gray-600">Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                            <Badge className={getTaskPriorityColor(task.priority)}>
                              {task.priority}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* New Case Creation Modal */}
      <Dialog open={showNewCaseModal} onOpenChange={setShowNewCaseModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-blue-600" />
              Create New Legal Case
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="clientName">Client Name *</Label>
                <Input
                  id="clientName"
                  placeholder="Enter client or company name"
                  value={newCase.clientName}
                  onChange={(e) => setNewCase({...newCase, clientName: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="propertyAddress">Property Address *</Label>
                <Textarea
                  id="propertyAddress"
                  placeholder="Enter complete property address"
                  value={newCase.propertyAddress}
                  onChange={(e) => setNewCase({...newCase, propertyAddress: e.target.value})}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="caseNumber">Case Number (Optional)</Label>
                <Input
                  id="caseNumber"
                  placeholder="Auto-generated if blank"
                  value={newCase.caseNumber}
                  onChange={(e) => setNewCase({...newCase, caseNumber: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="assignedAttorney">Assigned Attorney *</Label>
                <Select value={newCase.assignedAttorney} onValueChange={(value) => setNewCase({...newCase, assignedAttorney: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an attorney" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sarah Johnson">Sarah Johnson</SelectItem>
                    <SelectItem value="Michael Chen">Michael Chen</SelectItem>
                    <SelectItem value="Lisa Rodriguez">Lisa Rodriguez</SelectItem>
                    <SelectItem value="David Kim">David Kim</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="currentAssessment">Current Assessment Value</Label>
                <Input
                  id="currentAssessment"
                  type="number"
                  placeholder="Enter current assessed value"
                  value={newCase.currentAssessment}
                  onChange={(e) => setNewCase({...newCase, currentAssessment: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="proposedValue">Proposed Value</Label>
                <Input
                  id="proposedValue"
                  type="number"
                  placeholder="Enter proposed value"
                  value={newCase.proposedValue}
                  onChange={(e) => setNewCase({...newCase, proposedValue: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="filingDeadline">Filing Deadline</Label>
                <Input
                  id="filingDeadline"
                  type="date"
                  value={newCase.filingDeadline}
                  onChange={(e) => setNewCase({...newCase, filingDeadline: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="hearingDate">Hearing Date (Optional)</Label>
                <Input
                  id="hearingDate"
                  type="date"
                  value={newCase.hearingDate}
                  onChange={(e) => setNewCase({...newCase, hearingDate: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Enter any additional case details or notes"
                value={newCase.notes}
                onChange={(e) => setNewCase({...newCase, notes: e.target.value})}
                rows={3}
              />
            </div>

            {/* Calculated Potential Savings Display */}
            {newCase.currentAssessment && newCase.proposedValue && (
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">Estimated Tax Savings</h4>
                <p className="text-green-700">
                  ${Math.round((parseFloat(newCase.currentAssessment) - parseFloat(newCase.proposedValue)) * 0.021).toLocaleString()}
                  <span className="text-sm text-green-600 ml-2">(Assumes 2.1% tax rate)</span>
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewCaseModal(false)}
              disabled={isCreatingCase}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCase}
              disabled={isCreatingCase}
              className="flex items-center gap-2"
            >
              {isCreatingCase ? (
                <>
                  <Clock className="h-4 w-4 animate-spin" />
                  Creating Case...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Create Case
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Task Creation Modal */}
      <Dialog open={showNewTaskModal} onOpenChange={setShowNewTaskModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Add New Task
              {selectedCase && (
                <span className="text-sm font-normal text-gray-600 ml-2">
                  to {selectedCase.caseNumber}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="taskDescription">Task Description *</Label>
              <Textarea
                id="taskDescription"
                placeholder="Describe the task to be completed"
                value={newTask.description}
                onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="taskAssignee">Assign To *</Label>
              <Select value={newTask.assignee} onValueChange={(value) => setNewTask({...newTask, assignee: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sarah Johnson">Sarah Johnson</SelectItem>
                  <SelectItem value="Michael Chen">Michael Chen</SelectItem>
                  <SelectItem value="Lisa Rodriguez">Lisa Rodriguez</SelectItem>
                  <SelectItem value="David Kim">David Kim</SelectItem>
                  <SelectItem value="Legal Assistant">Legal Assistant</SelectItem>
                  <SelectItem value="Paralegal">Paralegal</SelectItem>
                  <SelectItem value="Research Associate">Research Associate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="taskDueDate">Due Date</Label>
                <Input
                  id="taskDueDate"
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Default: 7 days from now
                </p>
              </div>

              <div>
                <Label htmlFor="taskPriority">Priority</Label>
                <Select value={newTask.priority} onValueChange={(value: 'low' | 'medium' | 'high') => setNewTask({...newTask, priority: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="taskNotes">Additional Notes</Label>
              <Textarea
                id="taskNotes"
                placeholder="Any additional context or instructions"
                value={newTask.notes}
                onChange={(e) => setNewTask({...newTask, notes: e.target.value})}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewTaskModal(false)}
              disabled={isCreatingTask}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateTask}
              disabled={isCreatingTask}
              className="flex items-center gap-2"
            >
              {isCreatingTask ? (
                <>
                  <Clock className="h-4 w-4 animate-spin" />
                  Creating Task...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Add Task
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Fix missing imports
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

const DollarSign = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const Circle = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="8" strokeWidth={2} />
  </svg>
);

export default TaxAttorneyWorkflow;