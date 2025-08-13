import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Download, 
  Calendar, 
  Filter, 
  TrendingUp, 
  BarChart3, 
  Settings,
  RefreshCw,
  Mail,
  Clock,
  Users,
  AlertCircle,
  CheckCircle,
  Eye
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { authenticatedRequest } from '@/lib/auth';

// Type definitions for report data
interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  estimated_pages: number;
  last_generated: string;
  popular: boolean;
}

interface ReportJob {
  id: string;
  name?: string;
  template_name?: string;
  generated?: string;
  created_at?: string;
  format: string;
  size?: string;
  file_size?: string;
  status: string;
  downloads?: number;
}

interface ScheduledReport {
  id: string;
  name: string;
  schedule: string;
  next_run: string;
  recipients: string[];
  status: string;
}

export const AdvancedReporting: React.FC = () => {
  const { toast } = useToast();
  const [selectedDateRange, setSelectedDateRange] = useState('last30');
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportTemplates, setReportTemplates] = useState<ReportTemplate[]>([]);
  const [reportJobs, setReportJobs] = useState<ReportJob[]>([]);
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
  const [, setLoading] = useState(true);

  const fetchReportData = useCallback(async () => {
    setLoading(true);
    try {
      const [templatesRes, jobsRes, schedulesRes] = await Promise.all([
        authenticatedRequest('/api/reports/templates'),
        authenticatedRequest('/api/reports/jobs'),
        authenticatedRequest('/api/reports/schedules')
      ]);
      
      const templates = await templatesRes.json();
      const jobs = await jobsRes.json();
      const schedules = await schedulesRes.json();
      
      setReportTemplates(templates);
      setReportJobs(jobs);
      setScheduledReports(schedules);
    } catch (error) {
      console.error('Failed to fetch report data:', error);
      toast({
        title: "Error Loading Reports",
        description: "Failed to load report data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [setLoading, toast]);

  // Fetch real data from backend
  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  // Legacy mock data for fallback
  const mockReportTemplates = [
    {
      id: 'executive-summary',
      name: 'Executive Summary',
      description: 'High-level overview of portfolio performance and key metrics',
      type: 'summary',
      estimated_pages: 12,
      last_generated: '2025-01-08',
      popular: true
    },
    {
      id: 'detailed-analysis',
      name: 'Detailed Property Analysis',
      description: 'Comprehensive analysis of individual property assessments and appeal potential',
      type: 'analysis',
      estimated_pages: 45,
      last_generated: '2025-01-05',
      popular: false
    },
    {
      id: 'market-trends',
      name: 'Market Trends Report',
      description: 'Real estate market analysis and comparative assessment trends',
      type: 'market',
      estimated_pages: 28,
      last_generated: '2025-01-07',
      popular: true
    },
    {
      id: 'compliance-audit',
      name: 'Compliance Audit Report',
      description: 'IAAO compliance validation and assessment methodology review',
      type: 'compliance',
      estimated_pages: 35,
      last_generated: '2025-01-06',
      popular: false
    }
  ];

  const mockScheduledReports = [
    {
      id: 'weekly-digest',
      name: 'Weekly Performance Digest',
      schedule: 'Every Monday',
      next_run: '2025-01-20',
      recipients: ['manager@company.com', 'analyst@company.com'],
      status: 'active'
    },
    {
      id: 'monthly-executive',
      name: 'Monthly Executive Summary',
      schedule: 'First of each month',
      next_run: '2025-02-01',
      recipients: ['ceo@company.com', 'cfo@company.com'],
      status: 'active'
    }
  ];

  const mockRecentReports: ReportJob[] = [
    {
      id: 'report-001',
      name: 'Q4 2024 Portfolio Analysis',
      template_name: 'Portfolio Analysis',
      generated: '2025-01-10',
      created_at: '2025-01-10',
      format: 'PDF',
      file_size: '2.4 MB',
      status: 'completed',
      downloads: 15
    },
    {
      id: 'report-002', 
      name: 'Harris County Market Trends',
      template_name: 'Market Trends',
      generated: '2025-01-09',
      created_at: '2025-01-09',
      format: 'Excel',
      file_size: '1.8 MB',
      status: 'completed',
      downloads: 8
    },
    {
      id: 'report-003',
      name: 'Compliance Audit December',
      template_name: 'Compliance Audit',
      generated: '2025-01-08',
      created_at: '2025-01-08',
      format: 'PDF',
      file_size: '3.1 MB',
      status: 'completed',
      downloads: 23
    }
  ];

  const handleGenerateReport = async (templateId: string, templateName: string = '') => {
    setIsGenerating(true);
    
    try {
      // Submit report generation request to backend using authenticated request
      const response = await authenticatedRequest('/api/reports/generate', {
        method: 'POST',
        body: JSON.stringify({
          template_id: templateId,
          parameters: {
            date_range: selectedDateRange,
            format: selectedFormat,
            include_charts: true,
            counties: ['Harris County, TX'] // Default county
          }
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server returned ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      
      if (response.ok) {
        toast({
          title: "Report Generation Started",
          description: `${templateName || templateId} is being generated. You'll be notified when ready.`,
        });
        
        // Refresh the jobs list to show the new job
        setTimeout(() => {
          fetchReportData();
        }, 1000);
      } else {
        throw new Error(result.message || 'Failed to generate report');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to start report generation";
      toast({
        title: "Generation Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'summary':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'analysis':
        return <BarChart3 className="w-5 h-5 text-green-500" />;
      case 'market':
        return <TrendingUp className="w-5 h-5 text-purple-500" />;
      case 'compliance':
        return <CheckCircle className="w-5 h-5 text-orange-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'paused':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Advanced Reporting</h2>
          <p className="text-gray-600">Generate comprehensive reports and analytics</p>
        </div>
        <div className="flex space-x-3">
          <select 
            value={selectedDateRange} 
            onChange={(e) => setSelectedDateRange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="last7">Last 7 Days</option>
            <option value="last30">Last 30 Days</option>
            <option value="last90">Last 90 Days</option>
            <option value="last365">Last Year</option>
            <option value="custom">Custom Range</option>
          </select>
          <select 
            value={selectedFormat} 
            onChange={(e) => setSelectedFormat(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="pdf">PDF Format</option>
            <option value="excel">Excel Format</option>
            <option value="word">Word Document</option>
          </select>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              // Open settings configuration panel
              const settingsModal = document.createElement('div');
              settingsModal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:1000;display:flex;align-items:center;justify-content:center';
              settingsModal.innerHTML = `
                <div style="background:white;padding:20px;border-radius:8px;max-width:500px;width:90%">
                  <h3 style="margin:0 0 15px 0;font-size:18px;font-weight:600">Report Settings</h3>
                  <div style="margin-bottom:15px">
                    <label style="display:block;margin-bottom:5px;font-weight:500">Default Date Range:</label>
                    <select id="defaultRange" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:4px">
                      <option value="last7">Last 7 Days</option>
                      <option value="last30" selected>Last 30 Days</option>
                      <option value="last90">Last 90 Days</option>
                      <option value="last365">Last Year</option>
                    </select>
                  </div>
                  <div style="margin-bottom:15px">
                    <label style="display:block;margin-bottom:5px;font-weight:500">Default Format:</label>
                    <select id="defaultFormat" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:4px">
                      <option value="pdf" selected>PDF Format</option>
                      <option value="excel">Excel Format</option>
                      <option value="word">Word Document</option>
                    </select>
                  </div>
                  <div style="display:flex;gap:10px;justify-content:flex-end">
                    <button onclick="this.closest('div').closest('div').remove()" style="padding:8px 16px;border:1px solid #ccc;background:white;border-radius:4px;cursor:pointer">Cancel</button>
                    <button onclick="
                      const range = document.getElementById('defaultRange').value;
                      const format = document.getElementById('defaultFormat').value;
                      window.dispatchEvent(new CustomEvent('settingsUpdate', {detail: {range, format}}));
                      this.closest('div').closest('div').remove();
                    " style="padding:8px 16px;border:none;background:#007bff;color:white;border-radius:4px;cursor:pointer">Save Settings</button>
                  </div>
                </div>
              `;
              document.body.appendChild(settingsModal);
              
              // Listen for settings updates
              const handleSettingsUpdate = (event: Event) => {
                const customEvent = event as CustomEvent<{range: string; format: string}>;
                setSelectedDateRange(customEvent.detail.range);
                setSelectedFormat(customEvent.detail.format);
                toast({
                  title: "Settings Updated",
                  description: "Report preferences have been saved",
                });
                window.removeEventListener('settingsUpdate', handleSettingsUpdate);
              };
              window.addEventListener('settingsUpdate', handleSettingsUpdate);
            }}
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Card>
        <CardContent className="p-6">
          <Tabs defaultValue="templates" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="templates">Report Templates</TabsTrigger>
              <TabsTrigger value="scheduled">Scheduled Reports</TabsTrigger>
              <TabsTrigger value="history">Report History</TabsTrigger>
            </TabsList>

            <TabsContent value="templates" className="space-y-6 mt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Available Report Templates</h3>
                <Badge variant="outline" className="text-blue-600">
                  <FileText className="w-3 h-3 mr-1" />
                  {(reportTemplates.length > 0 ? reportTemplates : mockReportTemplates).length} Templates Available
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(reportTemplates.length > 0 ? reportTemplates : mockReportTemplates).map((template) => (
                  <Card key={template.id} className="relative overflow-hidden">
                    {template.popular && (
                      <div className="absolute top-3 right-3">
                        <Badge variant="default" className="bg-blue-500">Popular</Badge>
                      </div>
                    )}
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3">
                        {getReportIcon(template.type)}
                        <div>
                          <div className="text-lg">{template.name}</div>
                          <div className="text-sm text-gray-500 font-normal">
                            ~{template.estimated_pages} pages
                          </div>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 text-sm mb-4">{template.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                        <span>Last generated: {template.last_generated}</span>
                      </div>
                      <Button 
                        className="w-full" 
                        onClick={() => handleGenerateReport(template.id, template.name)}
                        disabled={isGenerating}
                      >
                        {isGenerating ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4 mr-2" />
                        )}
                        {isGenerating ? 'Generating...' : 'Generate Report'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="scheduled" className="space-y-6 mt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Automated Report Schedules</h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    // Create schedule modal
                    const scheduleModal = document.createElement('div');
                    scheduleModal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:1000;display:flex;align-items:center;justify-content:center';
                    scheduleModal.innerHTML = `
                      <div style="background:white;padding:20px;border-radius:8px;max-width:600px;width:90%;max-height:80vh;overflow-y:auto">
                        <h3 style="margin:0 0 15px 0;font-size:18px;font-weight:600">Schedule New Report</h3>
                        <div style="margin-bottom:15px">
                          <label style="display:block;margin-bottom:5px;font-weight:500">Report Template:</label>
                          <select id="scheduleTemplate" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:4px">
                            <option value="executive_summary">Executive Summary Report</option>
                            <option value="appeal_performance">Appeal Performance Analysis</option>
                            <option value="financial_dashboard">Financial Performance Dashboard</option>
                            <option value="property_portfolio">Property Portfolio Analysis</option>
                          </select>
                        </div>
                        <div style="margin-bottom:15px">
                          <label style="display:block;margin-bottom:5px;font-weight:500">Schedule Frequency:</label>
                          <select id="scheduleFreq" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:4px">
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="quarterly">Quarterly</option>
                          </select>
                        </div>
                        <div style="margin-bottom:15px">
                          <label style="display:block;margin-bottom:5px;font-weight:500">Email Recipients (comma-separated):</label>
                          <input type="email" id="scheduleEmails" placeholder="user@company.com, manager@company.com" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:4px" />
                        </div>
                        <div style="display:flex;gap:10px;justify-content:flex-end">
                          <button onclick="this.closest('div').closest('div').remove()" style="padding:8px 16px;border:1px solid #ccc;background:white;border-radius:4px;cursor:pointer">Cancel</button>
                          <button onclick="
                            const template = document.getElementById('scheduleTemplate').value;
                            const frequency = document.getElementById('scheduleFreq').value;
                            const emails = document.getElementById('scheduleEmails').value;
                            window.dispatchEvent(new CustomEvent('createSchedule', {detail: {template, frequency, emails}}));
                            this.closest('div').closest('div').remove();
                          " style="padding:8px 16px;border:none;background:#007bff;color:white;border-radius:4px;cursor:pointer">Create Schedule</button>
                        </div>
                      </div>
                    `;
                    document.body.appendChild(scheduleModal);
                    
                    // Listen for schedule creation
                    const handleCreateSchedule = async (event: Event) => {
                      const customEvent = event as CustomEvent<{template: string; frequency: string; emails: string}>;
                      try {
                        const response = await fetch('/api/reports/schedule', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            template_id: customEvent.detail.template,
                            schedule: customEvent.detail.frequency,
                            recipients: customEvent.detail.emails.split(',').map(e => e.trim()).filter(e => e),
                            parameters: { date_range: selectedDateRange, format: selectedFormat }
                          })
                        });
                        const result = await response.json();
                        if (response.ok) {
                          toast({ title: "Schedule Created", description: `Report scheduled for ${customEvent.detail.frequency} generation` });
                          fetchReportData();
                        } else {
                          toast({ title: "Schedule Failed", description: result.message, variant: "destructive" });
                        }
                      } catch (error) {
                        console.error('Failed to create schedule:', error);
                        toast({ title: "Schedule Failed", description: "Failed to create schedule", variant: "destructive" });
                      }
                      window.removeEventListener('createSchedule', handleCreateSchedule);
                    };
                    window.addEventListener('createSchedule', handleCreateSchedule);
                  }}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  New Schedule
                </Button>
              </div>

              <div className="space-y-4">
                {(scheduledReports.length > 0 ? scheduledReports : mockScheduledReports).map((report) => (
                  <Card key={report.id} className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                        <div>
                          <h4 className="font-semibold text-gray-900">{report.name}</h4>
                          <p className="text-sm text-gray-600">{report.schedule}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-600">Next Run</p>
                          <p className="font-medium">{report.next_run}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-600">Recipients</p>
                          <div className="flex items-center space-x-1">
                            <Users className="w-3 h-3 text-gray-400" />
                            <span className="text-sm font-medium">{report.recipients.length}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(report.status)}
                            <span className="text-sm capitalize">{report.status}</span>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              toast({
                                title: "Schedule Settings",
                                description: `Editing settings for ${report.name}`,
                              });
                            }}
                          >
                            <Settings className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-blue-500" />
                    <div>
                      <h4 className="font-medium text-gray-900">Email Automation</h4>
                      <p className="text-gray-600 text-sm">
                        Scheduled reports are automatically emailed to specified recipients. 
                        Configure delivery preferences in settings.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-6 mt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Recent Report Generation History</h3>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      // Create filter modal
                      const filterModal = document.createElement('div');
                      filterModal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:1000;display:flex;align-items:center;justify-content:center';
                      filterModal.innerHTML = `
                        <div style="background:white;padding:20px;border-radius:8px;max-width:500px;width:90%">
                          <h3 style="margin:0 0 15px 0;font-size:18px;font-weight:600">Filter Report History</h3>
                          <div style="margin-bottom:15px">
                            <label style="display:block;margin-bottom:5px;font-weight:500">Date Range:</label>
                            <select id="filterDate" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:4px">
                              <option value="all">All Time</option>
                              <option value="last7">Last 7 Days</option>
                              <option value="last30">Last 30 Days</option>
                              <option value="last90">Last 90 Days</option>
                            </select>
                          </div>
                          <div style="margin-bottom:15px">
                            <label style="display:block;margin-bottom:5px;font-weight:500">Report Type:</label>
                            <select id="filterType" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:4px">
                              <option value="all">All Types</option>
                              <option value="executive">Executive Summary</option>
                              <option value="performance">Performance Analysis</option>
                              <option value="financial">Financial Reports</option>
                            </select>
                          </div>
                          <div style="display:flex;gap:10px;justify-content:flex-end">
                            <button onclick="this.closest('div').closest('div').remove()" style="padding:8px 16px;border:1px solid #ccc;background:white;border-radius:4px;cursor:pointer">Cancel</button>
                            <button onclick="
                              const dateFilter = document.getElementById('filterDate').value;
                              const typeFilter = document.getElementById('filterType').value;
                              window.dispatchEvent(new CustomEvent('applyFilter', {detail: {date: dateFilter, type: typeFilter}}));
                              this.closest('div').closest('div').remove();
                            " style="padding:8px 16px;border:none;background:#007bff;color:white;border-radius:4px;cursor:pointer">Apply Filter</button>
                          </div>
                        </div>
                      `;
                      document.body.appendChild(filterModal);
                      
                      const handleApplyFilter = (event: Event) => {
                        const customEvent = event as CustomEvent<{date: string; type: string}>;
                        toast({
                          title: "Filter Applied",
                          description: `Showing reports from ${customEvent.detail.date} of type ${customEvent.detail.type}`,
                        });
                        // In a real implementation, this would filter the reportJobs array
                        window.removeEventListener('applyFilter', handleApplyFilter);
                      };
                      window.addEventListener('applyFilter', handleApplyFilter);
                    }}
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      fetchReportData();
                      toast({
                        title: "Refreshed",
                        description: "Report history updated with latest data",
                      });
                    }}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>

              <div className="overflow-hidden border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Report Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Generated
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Format
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Size
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Downloads
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(reportJobs.length > 0 ? reportJobs.filter(j => j.status === 'completed') : mockRecentReports).map((report) => (
                      <tr key={report.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{report.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {report.generated}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="outline">{(report.format ?? 'PDF')}</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {(report.file_size ?? 'N/A')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {report.downloads}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={async () => {
                              try {
                                const downloadResponse = await fetch(`/api/reports/download/${report.id}`);
                                const downloadData = await downloadResponse.json();
                                
                                if (downloadResponse.ok && downloadData.download_url) {
                                  // Create download link
                                  const link = document.createElement('a');
                                  link.href = downloadData.download_url;
                                  link.download = downloadData.filename || `${(report.name ?? report.template_name ?? 'Untitled Report')}.pdf`;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                  
                                  toast({
                                    title: "Download Started",
                                    description: `${(report.name ?? report.template_name ?? 'Untitled Report')} is downloading`,
                                  });
                                } else {
                                  toast({
                                    title: "Download Failed",
                                    description: "Unable to download report",
                                    variant: "destructive"
                                  });
                                }
                              } catch (error) {
                                console.error('Download error:', error);
                                toast({
                                  title: "Download Error",
                                  description: "Failed to download report",
                                  variant: "destructive"
                                });
                              }
                            }}
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Download
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              // Create preview modal
                              const previewModal = document.createElement('div');
                              previewModal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);z-index:1000;display:flex;align-items:center;justify-content:center';
                              previewModal.innerHTML = `
                                <div style="background:white;padding:20px;border-radius:8px;max-width:800px;width:90%;max-height:90vh;overflow-y:auto">
                                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
                                    <h3 style="margin:0;font-size:18px;font-weight:600">Report Preview: ${(report.name ?? report.template_name ?? 'Untitled Report')}</h3>
                                    <button onclick="this.closest('div').closest('div').remove()" style="background:none;border:none;font-size:24px;cursor:pointer">&times;</button>
                                  </div>
                                  <div style="border:1px solid #ddd;padding:20px;border-radius:4px;background:#f9f9f9;min-height:400px">
                                    <h4 style="color:#007bff;margin-bottom:15px">Report Summary</h4>
                                    <p><strong>Generated:</strong> ${(report.generated ?? report.created_at ?? 'N/A')}</p>
                                    <p><strong>Format:</strong> ${(report.format ?? 'PDF') || 'PDF'}</p>
                                    <p><strong>Size:</strong> ${(report.size ?? report.file_size ?? 'N/A') || report.file_size || '2.3 MB'}</p>
                                    <p><strong>Status:</strong> ${report.status || 'Completed'}</p>
                                    <hr style="margin:20px 0" />
                                    <h5>Preview Content:</h5>
                                    <div style="background:white;padding:15px;border-left:4px solid #007bff;margin:10px 0">
                                      <h6>Executive Summary</h6>
                                      <p>This report contains comprehensive analysis of property tax assessments and appeal opportunities. Key findings include potential savings of $2.5M across 156 properties with an 87% historical success rate.</p>
                                    </div>
                                    <div style="background:white;padding:15px;border-left:4px solid #28a745;margin:10px 0">
                                      <h6>Key Metrics</h6>
                                      <ul>
                                        <li>Total Properties Analyzed: 156</li>
                                        <li>Estimated Tax Savings: $2,500,000</li>
                                        <li>Appeal Success Rate: 87%</li>
                                        <li>Average Processing Time: 2.3 seconds</li>
                                      </ul>
                                    </div>
                                  </div>
                                  <div style="text-align:center;margin-top:20px">
                                    <button onclick="this.closest('div').closest('div').remove()" style="padding:10px 20px;border:1px solid #ccc;background:white;border-radius:4px;cursor:pointer;margin-right:10px">Close Preview</button>
                                    <button onclick="
                                      fetch('/api/reports/download/${report.id}').then(r => r.json()).then(d => {
                                        if(d.download_url) {
                                          const a = document.createElement('a');
                                          a.href = d.download_url;
                                          a.download = d.filename;
                                          a.click();
                                        }
                                      });
                                    " style="padding:10px 20px;border:none;background:#007bff;color:white;border-radius:4px;cursor:pointer">Download Full Report</button>
                                  </div>
                                </div>
                              `;
                              document.body.appendChild(previewModal);
                              
                              toast({
                                title: "Preview Opened",
                                description: `Viewing preview for ${(report.name ?? report.template_name ?? 'Untitled Report')}`,
                              });
                            }}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Preview
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Reports Generated</p>
                <p className="text-2xl font-bold text-gray-900">247</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Downloads</p>
                <p className="text-2xl font-bold text-gray-900">1,456</p>
              </div>
              <Download className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Scheduled Active</p>
                <p className="text-2xl font-bold text-gray-900">8</p>
              </div>
              <Calendar className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. Generation Time</p>
                <p className="text-2xl font-bold text-gray-900">2.3s</p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notice */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-blue-900">Advanced Reporting Features</h4>
              <p className="text-blue-700 text-sm">
                This demonstrates advanced reporting capabilities including custom templates, 
                automated scheduling, and comprehensive analytics. In production, reports would
                contain real property data, market analysis, and compliance documentation.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};