import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Scale, Clock, CheckCircle, FileText, Calendar } from "lucide-react";

export function Appeals() {
  // Mock appeals data
  const openAppeals = [
    {
      id: "APL-001",
      property: "123 Main St, Austin, TX",
      currentAssessment: 450000,
      proposedValue: 380000,
      potentialSavings: 14000,
      filedDate: "2024-02-15",
      deadline: "2024-03-31",
      status: "Under Review",
      jurisdiction: "Travis County"
    },
    {
      id: "APL-002", 
      property: "456 Oak Ave, Houston, TX",
      currentAssessment: 285000,
      proposedValue: 265000,
      potentialSavings: 4200,
      filedDate: "2024-02-20",
      deadline: "2024-04-15",
      status: "Documents Requested",
      jurisdiction: "Harris County"
    }
  ];

  const inProgressAppeals = [
    {
      id: "APL-003",
      property: "789 Business Blvd, Dallas, TX",
      currentAssessment: 1200000,
      proposedValue: 950000,
      potentialSavings: 52500,
      filedDate: "2024-01-10",
      hearingDate: "2024-03-15",
      status: "Hearing Scheduled",
      jurisdiction: "Dallas County"
    }
  ];

  const wonAppeals = [
    {
      id: "APL-004",
      property: "321 Commerce St, San Antonio, TX",
      originalAssessment: 650000,
      finalAssessment: 520000,
      actualSavings: 27300,
      completedDate: "2024-01-25",
      status: "Won",
      jurisdiction: "Bexar County"
    },
    {
      id: "APL-005",
      property: "555 Industrial Dr, Fort Worth, TX", 
      originalAssessment: 890000,
      finalAssessment: 750000,
      actualSavings: 29400,
      completedDate: "2024-02-08",
      status: "Won",
      jurisdiction: "Tarrant County"
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">⚖️ Appeals</h1>
        <p className="text-gray-600">Manage and track your property tax appeals</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-blue-50">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">Open Appeals</p>
            <p className="text-3xl font-bold text-blue-700">{openAppeals.length}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-orange-50">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">In Progress</p>
            <p className="text-3xl font-bold text-orange-700">{inProgressAppeals.length}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-green-50">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">Appeals Won</p>
            <p className="text-3xl font-bold text-green-700">{wonAppeals.length}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-purple-50">
                <Scale className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">Total Savings</p>
            <p className="text-3xl font-bold text-purple-700">
              ${(wonAppeals.reduce((sum, appeal) => sum + appeal.actualSavings, 0)).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Appeals Tabs */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <Tabs defaultValue="open" className="w-full">
          <TabsList className="bg-gray-100 p-1 rounded-lg">
            <TabsTrigger value="open" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Open Appeals ({openAppeals.length})
            </TabsTrigger>
            <TabsTrigger value="progress" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              In Progress ({inProgressAppeals.length})
            </TabsTrigger>
            <TabsTrigger value="won" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Won ({wonAppeals.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="open" className="mt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900">Open Appeals</h3>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <FileText className="w-4 h-4 mr-2" />
                  File New Appeal
                </Button>
              </div>
              
              {openAppeals.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">No open appeals</h3>
                  <p className="text-gray-500">Start by filing a new appeal for an over-assessed property</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {openAppeals.map((appeal) => (
                    <Card key={appeal.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                          <div className="lg:col-span-2">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-semibold text-gray-900">{appeal.property}</h4>
                                <p className="text-sm text-gray-600">{appeal.jurisdiction} • {appeal.id}</p>
                              </div>
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                {appeal.status}
                              </Badge>
                            </div>
                            <div className="flex items-center text-sm text-gray-500 space-x-4">
                              <span>Filed: {appeal.filedDate}</span>
                              <span className="text-orange-600 font-medium">
                                Deadline: {appeal.deadline}
                              </span>
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-700">Current Assessment</p>
                            <p className="text-lg font-semibold text-gray-900">
                              ${appeal.currentAssessment.toLocaleString()}
                            </p>
                            <p className="text-sm font-medium text-gray-700">Proposed Value</p>
                            <p className="text-lg font-semibold text-blue-600">
                              ${appeal.proposedValue.toLocaleString()}
                            </p>
                          </div>
                          
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-700">Potential Savings</p>
                            <p className="text-lg font-semibold text-green-600">
                              ${appeal.potentialSavings.toLocaleString()}
                            </p>
                            <div className="pt-2">
                              <Button variant="outline" size="sm">
                                View Details
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="progress" className="mt-6">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">Appeals In Progress</h3>
              
              {inProgressAppeals.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">No appeals in progress</h3>
                  <p className="text-gray-500">Appeals will appear here once they move past initial filing</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {inProgressAppeals.map((appeal) => (
                    <Card key={appeal.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                          <div className="lg:col-span-2">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-semibold text-gray-900">{appeal.property}</h4>
                                <p className="text-sm text-gray-600">{appeal.jurisdiction} • {appeal.id}</p>
                              </div>
                              <Badge className="bg-orange-100 text-orange-700">
                                {appeal.status}
                              </Badge>
                            </div>
                            <div className="flex items-center text-sm text-gray-500 space-x-4">
                              <span>Filed: {appeal.filedDate}</span>
                              {appeal.hearingDate && (
                                <span className="text-blue-600 font-medium flex items-center">
                                  <Calendar className="w-4 h-4 mr-1" />
                                  Hearing: {appeal.hearingDate}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-700">Current Assessment</p>
                            <p className="text-lg font-semibold text-gray-900">
                              ${appeal.currentAssessment.toLocaleString()}
                            </p>
                            <p className="text-sm font-medium text-gray-700">Proposed Value</p>
                            <p className="text-lg font-semibold text-blue-600">
                              ${appeal.proposedValue.toLocaleString()}
                            </p>
                          </div>
                          
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-700">Potential Savings</p>
                            <p className="text-lg font-semibold text-green-600">
                              ${appeal.potentialSavings.toLocaleString()}
                            </p>
                            <div className="pt-2">
                              <Button variant="outline" size="sm">
                                Manage Appeal
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="won" className="mt-6">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">Successfully Won Appeals</h3>
              
              {wonAppeals.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">No won appeals yet</h3>
                  <p className="text-gray-500">Completed successful appeals will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {wonAppeals.map((appeal) => (
                    <Card key={appeal.id} className="hover:shadow-md transition-shadow border-green-200">
                      <CardContent className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                          <div className="lg:col-span-2">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-semibold text-gray-900">{appeal.property}</h4>
                                <p className="text-sm text-gray-600">{appeal.jurisdiction} • {appeal.id}</p>
                              </div>
                              <Badge className="bg-green-100 text-green-700">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                {appeal.status}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-500">
                              Completed: {appeal.completedDate}
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-700">Original Assessment</p>
                            <p className="text-lg font-semibold text-gray-900">
                              ${appeal.originalAssessment.toLocaleString()}
                            </p>
                            <p className="text-sm font-medium text-gray-700">Final Assessment</p>
                            <p className="text-lg font-semibold text-blue-600">
                              ${appeal.finalAssessment.toLocaleString()}
                            </p>
                          </div>
                          
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-700">Total Savings</p>
                            <p className="text-lg font-semibold text-green-600">
                              ${appeal.actualSavings.toLocaleString()}
                            </p>
                            <div className="pt-2">
                              <Button variant="outline" size="sm">
                                View Certificate
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}