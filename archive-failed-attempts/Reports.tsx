import { useEffect, useState } from "react";
import { useReportsStore } from "../store/reports";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileBarChart2, Brain, DollarSign, Lock, Loader2, Download, BarChart3, FileText } from "lucide-react";
import { useToast } from "../components/ui/use-toast";
import { AdvancedReporting } from "../components/AdvancedReporting";
import CommercialPropertyAnalysis from "../components/CommercialPropertyAnalysis";

export function Reports() {
  const { reports, loadingId, error, fetchReports, unlockReport, downloadReport } = useReportsStore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("premium");

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    if (error) toast({ title: "❌ Unlock Failed", description: error, variant: "destructive" });
  }, [error, toast]);

  const handleUnlock = async (id: string, name: string) => {
    try {
      await unlockReport(id);
      toast({ title: `✅ ${name} unlocked!`, description: "You can now download this report." });
    } catch {
      toast({ title: "❌ Unlock failed", description: "Please try again." });
    }
  };

  const handleDownload = async (id: string, name: string) => {
    try {
      await downloadReport(id);
      toast({ title: `📥 Downloading ${name}`, description: "Your report is being downloaded." });
    } catch {
      toast({ title: "❌ Download failed", description: "Please try again." });
    }
  };

  const getReportIcon = (type: string) => {
    switch (type) {
      case "savings":
        return <DollarSign className="w-5 h-5" />;
      case "leads":
        return <FileBarChart2 className="w-5 h-5" />;
      case "narrative":
        return <Brain className="w-5 h-5" />;
      default:
        return <BarChart3 className="w-5 h-5" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Enhanced Header Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">📈 Reports & Analytics</h1>
              <p className="text-gray-600 mt-2">
                Access CHARLY's comprehensive reporting suite — from premium intelligence to advanced analytics
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">$2.5M+</div>
              <div className="text-sm text-gray-500">Total Savings Identified</div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <FileBarChart2 className="w-8 h-8 text-green-600" />
                <div>
                  <div className="font-semibold text-gray-900">156 Properties</div>
                  <div className="text-sm text-gray-500">Ready for Appeals</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <Brain className="w-8 h-8 text-purple-600" />
                <div>
                  <div className="font-semibold text-gray-900">AI Insights</div>
                  <div className="text-sm text-gray-500">Market Analysis Ready</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <DollarSign className="w-8 h-8 text-blue-600" />
                <div>
                  <div className="font-semibold text-gray-900">87% Success</div>
                  <div className="text-sm text-gray-500">Historical Win Rate</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="premium" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Premium Reports
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            📊 Advanced Reporting
          </TabsTrigger>
          <TabsTrigger value="commercial" className="flex items-center gap-2">
            <FileBarChart2 className="w-4 h-4" />
            🏢 Commercial Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="premium" className="space-y-6 mt-6">
          {reports.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BarChart3 className="w-12 h-12 text-zinc-400 mb-4" />
                <h3 className="text-lg font-medium text-zinc-900 mb-2">No reports available</h3>
                <p className="text-zinc-500 text-center">
                  Reports will be generated once you upload property data and run analysis
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reports.map((report) => (
                <Card key={report.id} className="flex flex-col transition-shadow hover:shadow-md">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-lg">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-zinc-100">
                        {getReportIcon(report.type)}
                      </div>
                      {report.name}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {report.description}
                    </CardDescription>
                    <div className="text-xs text-zinc-400">
                      Report ID: {report.id}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0 mt-auto">
                    <div className="flex flex-col gap-2">
                      {report.unlocked ? (
                        <Button
                          variant="default"
                          size="sm"
                          className="w-full justify-start bg-green-600 hover:bg-green-700"
                          onClick={() => handleDownload(report.id, report.name)}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Report
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            className="w-full justify-start"
                            onClick={() => handleUnlock(report.id, report.name)}
                            disabled={loadingId === report.id}
                          >
                            {loadingId === report.id ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <DollarSign className="w-4 h-4 mr-2" />
                            )}
                            {loadingId === report.id ? "Unlocking..." : `Unlock for $${report.price}`}
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start text-zinc-400 cursor-not-allowed"
                            disabled
                          >
                            <Lock className="w-4 h-4 mr-2" />
                            Preview Locked
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="advanced" className="mt-6">
          <AdvancedReporting />
        </TabsContent>

        <TabsContent value="commercial" className="mt-6">
          <CommercialPropertyAnalysis />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default Reports;