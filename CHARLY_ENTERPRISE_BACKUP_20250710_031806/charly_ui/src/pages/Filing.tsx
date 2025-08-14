import { useEffect } from "react";
import { useFilingStore } from "@/store/filing";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, PenLine, FileText, Calendar, DollarSign, MapPin } from "lucide-react";

export function Filing() {
  const { packets, fetchPackets } = useFilingStore();

  useEffect(() => {
    fetchPackets();
  }, [fetchPackets]);

  // Mock data for demonstration
  const mockPackets = [
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
      packet_type: "Commercial Appeal"
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
      packet_type: "Residential Appeal"
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
      packet_type: "Commercial Appeal"
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
          Manage appeal packets, upload signatures, and track filing status
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
              ${displayPackets.reduce((sum: number, p: any) => sum + (p.potential_savings || 0), 0)?.toLocaleString?.() ?? '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Packets Section */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Appeal Packets</h2>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <FileText className="w-4 h-4 mr-2" />
            Generate New Packet
          </Button>
        </div>

        {displayPackets.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">No appeal packets yet</h3>
            <p className="text-gray-500 mb-4">
              Appeal packets will appear here once they're generated from your property data
            </p>
            <Button>
              <FileText className="w-4 h-4 mr-2" />
              Generate First Packet
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayPackets.map((packet: any) => (
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
                        <Button size="sm" variant="outline" className="flex-1">
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                        <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700">
                          <Upload className="w-4 h-4 mr-1" />
                          Upload Signed
                        </Button>
                      </>
                    )}
                    {packet.status === "Ready to File" && (
                      <Button size="sm" className="w-full bg-green-600 hover:bg-green-700">
                        <FileText className="w-4 h-4 mr-1" />
                        File Appeal
                      </Button>
                    )}
                    {packet.status === "Filed" && (
                      <Button size="sm" variant="outline" className="w-full">
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
          <Card className="border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors cursor-pointer">
            <CardContent className="p-6 text-center">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="font-medium text-gray-700">Bulk Upload Signatures</p>
              <p className="text-sm text-gray-500">Upload multiple signed documents</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-dashed border-gray-300 hover:border-green-500 transition-colors cursor-pointer">
            <CardContent className="p-6 text-center">
              <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="font-medium text-gray-700">Batch File Appeals</p>
              <p className="text-sm text-gray-500">File multiple ready appeals</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-dashed border-gray-300 hover:border-purple-500 transition-colors cursor-pointer">
            <CardContent className="p-6 text-center">
              <Download className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="font-medium text-gray-700">Download All Packets</p>
              <p className="text-sm text-gray-500">Export all packets as ZIP</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}