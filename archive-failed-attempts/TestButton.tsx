import React, { useState } from 'react';
import { authenticatedRequest } from '../lib/auth';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function TestButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTest = async () => {
    console.log('[TestButton] clicked');
    setIsLoading(true);
    setResult(null);
    
    try {
      const packetData = {
        packet_request: {
          property_id: "test-123",
          appeal_type: "standard", 
          jurisdiction: "default"
        }
      };
      
      console.log('[TestButton] request body', packetData);
      
      const response = await authenticatedRequest('/api/appeals/generate-packet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(packetData)
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const responseData = await response.json();
      console.log('[TestButton] response', responseData);
      
      setResult({
        success: true,
        message: `Success! Packet ID: ${responseData.packet_id}`
      });
      
    } catch (error) {
      console.error('[TestButton] error', error);
      setResult({
        success: false,
        message: `Error: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Authentication Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleTest}
            disabled={isLoading}
            className="w-full transition-all duration-200 hover:scale-105 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Testing API...
              </>
            ) : (
              'Test Generate Appeal Packet'
            )}
          </Button>
          
          {result && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              result.success 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {result.success ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span className="text-sm">{result.message}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}