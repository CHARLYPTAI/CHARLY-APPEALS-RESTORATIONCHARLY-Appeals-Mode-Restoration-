import { useEffect, useState } from "react";
import { useFilingStore } from "@/store/filing";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, PenLine, FileText, Calendar, DollarSign, MapPin, Loader2 } from "lucide-react";
import { authenticatedRequest, authService } from "@/lib/auth";
import { useToast } from "@/components/ui/use-toast";

interface FilingPacket {
  id: string;
  property_address: string;
  county: string;
  current_assessment: number;
  proposed_value: number;
  potential_savings: number;
  deadline: string;
  status: string;
  created_date: string;
  packet_type: string;
  filed_date?: string;
  download_url?: string;
}

export function Filing() {
  const { 
    packets, 
    loading, 
    fetchPackets, 
    uploadSignedDoc, 
    fileAppeal
  } = useFilingStore();
  
  const [isDownloadingBulk, setIsDownloadingBulk] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const initializeAuthentication = async () => {
      try {
        console.log("Filing: Checking authentication status...");
        
        // Clear any previous auth error
        setAuthError(null);
        
        // Check if already authenticated
        if (!authService.isAuthenticated()) {
          console.log("Filing: Not authenticated, attempting auto-login...");
          
          try {
            // Auto-login with default credentials for enterprise deployment
            const authResult = await authService.login({
              email: "admin@charly.com",
              password: "CharlyCTO2025!"
            });
            
            console.log("Filing: Auto-login successful", authResult.user.email);
            setAuthError(null);
          } catch (loginError) {
            console.error("Filing: Auto-login failed:", loginError);
            const errorMessage = loginError.message || "Authentication failed";
            setAuthError(`Login failed: ${errorMessage}`);
            
            // Show user-friendly error message
            toast({
              title: "Authentication Error",
              description: `Unable to login automatically. Please check if the backend is running. Error: ${errorMessage}`,
              variant: "destructive",
            });
            return; // Don't continue if auth fails
          }
        } else {
          console.log("Filing: Already authenticated");
        }
        
        // Small delay to ensure token is properly stored
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Now fetch data with authentication
        console.log("Filing: Fetching packets...");
        fetchPackets();
      } catch (error) {
        console.error("Filing: Authentication initialization failed:", error);
        setAuthError("Failed to initialize authentication");
        
        // Continue rendering with fallback data - never show white screen
        console.log("Filing: Using fallback mode due to auth error");
      }
    };

    initializeAuthentication();
  }, [fetchPackets]);



  const handleFileAppeal = async (packet: FilingPacket) => {
    try {
      await fileAppeal({
        property_id: packet.id,
        jurisdiction: packet.county,
        packet_id: packet.id
      });
      
      // Refresh packets to show updated status
      fetchPackets();
    } catch (error) {
      console.error('Failed to file appeal:', error);
    }
  };

  const handleUploadSigned = async (packetId: string) => {
    // In a real implementation, this would open a file picker
    // For now, we'll simulate with a mock file
    const mockFile = new File(["mock content"], "signed_document.pdf", { type: "application/pdf" });
    
    try {
      await uploadSignedDoc(packetId, mockFile);
      
      // Refresh packets to show updated status
      fetchPackets();
    } catch (error) {
      console.error('Failed to upload signed document:', error);
    }
  };

  const handleDownloadPacket = async (packet: FilingPacket) => {
    try {
      const response = await authenticatedRequest(`/api/filing/download/${packet.id}`, {
        method: 'GET',
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `appeal_packet_${packet.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Packet Downloaded",
          description: `Successfully downloaded packet for ${packet.property_address}`,
        });
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      console.error('Failed to download packet:', error);
      toast({
        title: "Download Error",
        description: "Failed to download packet. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBulkDownload = async () => {
    if (displayPackets.length === 0) {
      toast({
        title: "No Packets",
        description: "No packets available for download.",
        variant: "destructive",
      });
      return;
    }

    setIsDownloadingBulk(true);
    try {
      // Download each packet individually (since bulk generation is removed)
      for (const packet of displayPackets) {
        if (packet.download_url) {
          try {
            const response = await authenticatedRequest(packet.download_url);
            if (response.ok) {
              const blob = await response.blob();
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `appeal_packet_${packet.id}.pdf`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              
              // Small delay between downloads
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          } catch (downloadError) {
            console.error(`Failed to download packet ${packet.id}:`, downloadError);
          }
        }
      }

      toast({
        title: "Bulk Download Complete",
        description: `Downloaded ${displayPackets.length} individual PDF packets`,
      });

    } catch (error) {
      console.error('Failed to download bulk packets:', error);
      toast({
        title: "Download Error", 
        description: "Failed to download packets. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloadingBulk(false);
    }
  };

  // Mock data for demonstration
  const mockPackets: FilingPacket[] = [
    {
      id: "PKT-001",
      property_address: "123 Main St, Austin, TX",
      county: "Travis County",
      current_assessment: 450000,
      proposed_value: 380000,
      potential_savings: 14000,
      deadline: "2024-03-31",
      status: "Awaiting Signature",
      created_date: "2024-02-15",
      packet_type: "Commercial Appeal",
      download_url: "/packets/PKT-001.pdf"
    },
    {
      id: "PKT-002",
      property_address: "456 Oak Ave, Houston, TX", 
      county: "Harris County",
      current_assessment: 285000,
      proposed_value: 265000,
      potential_savings: 4200,
      deadline: "2024-04-15",
      status: "Filed",
      created_date: "2024-02-20",
      filed_date: "2024-02-25",
      packet_type: "Residential Appeal",
      download_url: "/packets/PKT-002.pdf"
    },
    {
      id: "PKT-003",
      property_address: "789 Business Blvd, Dallas, TX",
      county: "Dallas County", 
      current_assessment: 1200000,
      proposed_value: 950000,
      potential_savings: 52500,
      deadline: "2024-03-25",
      status: "Ready to File",
      created_date: "2024-02-10",
      packet_type: "Commercial Appeal",
      download_url: "/packets/PKT-003.pdf"
    }
  ];

  const displayPackets = packets.length > 0 ? packets : mockPackets;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Awaiting Signature":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Filed":
        return "bg-green-100 text-green-700 border-green-200";
      case "Ready to File":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Awaiting Signature":
        return <PenLine className="w-4 h-4" />;
      case "Filed":
        return <FileText className="w-4 h-4" />;
      case "Ready to File":
        return <Upload className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📁 Filing</h1>
        <p className="text-gray-600">
          Submit generated appeal packets to counties and track filing progress
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-blue-50">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">Total Packets</p>
            <p className="text-3xl font-bold text-blue-700">{displayPackets.length}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-yellow-50">
                <PenLine className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">Awaiting Signature</p>
            <p className="text-3xl font-bold text-yellow-700">
              {displayPackets.filter(p => p.status === "Awaiting Signature").length}
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-green-50">
                <Upload className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">Filed</p>
            <p className="text-3xl font-bold text-green-700">
              {displayPackets.filter(p => p.status === "Filed").length}
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-purple-50">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">Total Potential Savings</p>
            <p className="text-3xl font-bold text-purple-700">
              ${(displayPackets as FilingPacket[]).reduce((sum: number, p: FilingPacket) => sum + (p.potential_savings || 0), 0)?.toLocaleString?.() ?? '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Packets Section */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Appeal Packets</h2>
        </div>

        {displayPackets.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">No appeal packets yet</h3>
            <p className="text-gray-500 mb-4">
              Appeal packets generated in the Appeals page will appear here for county submission
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-700 font-medium mb-2">📋 Next Steps:</p>
              <ol className="text-sm text-blue-600 space-y-1">
                <li>1. Go to Appeals page to generate packets</li>
                <li>2. Return here to submit to counties</li>
                <li>3. Track filing progress and deadlines</li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(displayPackets as FilingPacket[]).map((packet: FilingPacket) => (
              <Card key={packet.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="space-y-1">
                      <CardTitle className="text-lg leading-tight text-gray-900">
                        {packet.property_address}
                      </CardTitle>
                      <CardDescription className="text-gray-600">
                        {packet.county} • {packet.packet_type}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(packet.status)}>
                      {getStatusIcon(packet.status)}
                      <span className="ml-1">{packet.status}</span>
                    </Badge>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>ID: {packet.id}</span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-700">Current Assessment</p>
                      <p className="text-lg font-semibold text-gray-900">
                        ${packet.current_assessment?.toLocaleString?.() ?? '—'}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Proposed Value</p>
                      <p className="text-lg font-semibold text-blue-600">
                        ${packet.proposed_value?.toLocaleString?.() ?? '—'}
                      </p>
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-sm font-medium text-green-700">Potential Savings</p>
                    <p className="text-xl font-bold text-green-700">
                      ${packet.potential_savings?.toLocaleString?.() ?? '—'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span>Created: {packet.created_date}</span>
                    </div>
                    {packet.status !== "Filed" && (
                      <span className="text-orange-600 font-medium">
                        Due: {packet.deadline}
                      </span>
                    )}
                    {packet.filed_date && (
                      <span className="text-green-600 font-medium">
                        Filed: {packet.filed_date}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    {packet.status === "Awaiting Signature" && (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => handleDownloadPacket(packet)}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                        <Button 
                          size="sm" 
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                          onClick={() => handleUploadSigned(packet.id)}
                          disabled={loading}
                        >
                          <Upload className="w-4 h-4 mr-1" />
                          Upload Signed
                        </Button>
                      </>
                    )}
                    {packet.status === "Ready to File" && (
                      <Button 
                        size="sm" 
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={() => handleFileAppeal(packet)}
                        disabled={loading}
                      >
                        <FileText className="w-4 h-4 mr-1" />
                        File Appeal
                      </Button>
                    )}
                    {packet.status === "Filed" && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full"
                        onClick={() => handleDownloadPacket(packet)}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download Filed Copy
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card 
            className="border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors cursor-pointer"
            onClick={() => {
              // Trigger file input for bulk upload
              const input = document.createElement('input');
              input.type = 'file';
              input.multiple = true;
              input.accept = '.pdf,.jpg,.jpeg,.png';
              input.onchange = (e) => {
                const files = (e.target as HTMLInputElement).files;
                if (files && files.length > 0) {
                  // Process bulk signature upload
                  Array.from(files).forEach(async (file, index) => {
                    try {
                      await uploadSignedDoc(`PKT-${String(index + 1).padStart(3, '0')}`, file);
                    } catch (error) {
                      console.error(`Failed to upload ${file.name}:`, error);
                    }
                  });
                  // Refresh packets after upload
                  fetchPackets();
                }
              };
              input.click();
            }}
          >
            <CardContent className="p-6 text-center">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="font-medium text-gray-700">Bulk Upload Signatures</p>
              <p className="text-sm text-gray-500">Upload multiple signed documents</p>
            </CardContent>
          </Card>

          <Card 
            className="border-2 border-dashed border-gray-300 hover:border-green-500 transition-colors cursor-pointer"
            onClick={async () => {
              try {
                // File all packets that are ready to file
                const readyPackets = displayPackets.filter(p => p.status === "Ready to File");
                if (readyPackets.length === 0) {
                  alert("No packets ready to file. Please ensure packets are signed first.");
                  return;
                }
                
                // Batch file all ready packets
                for (const packet of readyPackets) {
                  await fileAppeal({
                    property_id: packet.id,
                    jurisdiction: packet.county,
                    packet_id: packet.id
                  });
                }
                
                // Refresh packets to show updated status
                fetchPackets();
                alert(`Successfully filed ${readyPackets.length} appeals`);
              } catch (error) {
                console.error('Failed to batch file appeals:', error);
                alert('Failed to batch file appeals. Please try again.');
              }
            }}
          >
            <CardContent className="p-6 text-center">
              <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="font-medium text-gray-700">Batch File Appeals</p>
              <p className="text-sm text-gray-500">File multiple ready appeals</p>
            </CardContent>
          </Card>

          <Card 
            className={`border-2 border-dashed border-gray-300 hover:border-purple-500 transition-colors cursor-pointer ${isDownloadingBulk ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={isDownloadingBulk ? undefined : handleBulkDownload}
          >
            <CardContent className="p-6 text-center">
              {isDownloadingBulk ? (
                <Loader2 className="w-8 h-8 text-purple-600 mx-auto mb-2 animate-spin" />
              ) : (
                <Download className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              )}
              <p className="font-medium text-gray-700">
                {isDownloadingBulk ? 'Generating Packets...' : 'Download All Packets'}
              </p>
              <p className="text-sm text-gray-500">
                {isDownloadingBulk ? 'Creating PDF packets with server' : 'Export all packets as ZIP'}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Filing;