import { useEffect } from "react";
import { useReportsStore } from "../store/reports";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileBarChart2, Brain, DollarSign, Lock, Loader2, Download, BarChart3 } from "lucide-react";
import { useToast } from "../components/ui/use-toast";

export function Reports() {
  const { reports, loadingId, error, fetchReports, unlockReport } = useReportsStore();
  const { toast } = useToast();

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
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">📈 Reports</h1>
        <p className="text-zinc-500">
          Access CHARLY's premium intelligence — from savings forecasts to AI-generated summaries
        </p>
      </div>

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
                      asChild
                    >
                      <a
                        href={report.download_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Report
                      </a>
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
    </div>
  );
}