import React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface Notification {
  id: string;
  message: string;
  type: string;
}

interface NotificationsPanelProps {
  notifications: Notification[];
  onClearAll: () => void;
  onDismiss: (id: string) => void;
}

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
  notifications,
  onClearAll,
  onDismiss
}) => {
  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-blue-900">
          Recent Updates
        </h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClearAll}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          Clear All
        </Button>
      </div>
      <div className="space-y-2">
        {notifications.map(notification => (
          <div 
            key={notification.id} 
            className="text-sm text-blue-800 flex items-start gap-2 animate-fade-in group"
          >
            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
              notification.type === 'error' ? 'bg-red-500' : 
              notification.type === 'warning' ? 'bg-yellow-500' : 
              'bg-blue-500'
            }`} />
            <span className="flex-1">{notification.message}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDismiss(notification.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity h-5 w-5 p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};