import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Eye, CheckCircle } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  status?: string;
  property?: string;
}

interface RecentActivityProps {
  activities: ActivityItem[];
  loading: boolean;
  onViewActivity: (activity: ActivityItem) => void;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({
  activities,
  loading,
  onViewActivity
}) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'appeal':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'deadline':
        return <Calendar className="w-4 h-4 text-orange-600" />;
      default:
        return <Eye className="w-4 h-4 text-blue-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'won':
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'in-review':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
      case 'lost':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">📋 Recent Activity</h3>
          <span className="text-sm text-gray-500">{activities.length} items</span>
        </div>
        
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Eye className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>No recent activity</p>
            </div>
          ) : (
            activities.map((activity) => (
              <div 
                key={activity.id} 
                className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => onViewActivity(activity)}
              >
                <div className="flex-shrink-0 mt-1">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    {activity.message}
                  </p>
                  {activity.property && (
                    <p className="text-xs text-gray-600 mb-1">
                      Property: {activity.property}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleDateString()} at{' '}
                      {new Date(activity.timestamp).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                    {activity.status && (
                      <Badge className={`text-xs ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </Badge>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-6 px-2">
                  <Eye className="w-3 h-3" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};