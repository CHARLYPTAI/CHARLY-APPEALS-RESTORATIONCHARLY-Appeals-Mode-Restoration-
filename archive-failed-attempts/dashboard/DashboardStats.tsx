import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Eye } from 'lucide-react';

interface KPI {
  label: string;
  value: string;
  icon: React.ReactNode;
  bgColor: string;
  textColor: string;
}

interface DashboardStatsProps {
  kpis: KPI[];
  kpiOrder: number[];
  selectedKPI: string | null;
  onKpiOrderChange: (newOrder: number[]) => void;
  onKPIClick: (label: string, value: string) => void;
  onShowDetails: () => void;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  kpis,
  kpiOrder,
  selectedKPI,
  onKpiOrderChange,
  onKPIClick,
  onShowDetails
}) => {
  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'));
    const newOrder = [...kpiOrder];
    const currentIndex = newOrder.indexOf(targetIndex);
    newOrder[currentIndex] = draggedIndex;
    newOrder[kpiOrder.indexOf(draggedIndex)] = targetIndex;
    onKpiOrderChange(newOrder);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpiOrder.map((kpiIndex) => {
        const kpi = kpis[kpiIndex];
        if (!kpi) return null;
        
        return (
          <Card 
            key={kpiIndex} 
            draggable
            onDragStart={(e) => e.dataTransfer.setData('text/plain', kpiIndex.toString())}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, kpiIndex)}
            className={`border-0 shadow-md hover:shadow-lg transition-all duration-200 cursor-move transform hover:scale-105 relative overflow-hidden ${
              selectedKPI === kpi.label ? 'ring-2 ring-blue-500 bg-blue-50' : ''
            }`}
            onClick={() => onKPIClick(kpi.label, kpi.value)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${kpi.bgColor} transition-colors hover:opacity-80`}>
                  {kpi.icon}
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-green-600 font-medium">+12%</span>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">{kpi.label}</p>
              <p className={`text-3xl font-bold ${kpi.textColor} transition-colors`}>{kpi.value}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-gray-500">vs last month</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    onShowDetails();
                  }}
                >
                  <Eye className="w-3 h-3 mr-1" />
                  Details
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};