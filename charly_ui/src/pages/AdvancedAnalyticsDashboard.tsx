import React, { useState, useEffect } from 'react';
import { motion } from '../hooks/useFramerMotionLite';
import { 
  BarChart3, Users, DollarSign, ArrowUp, ArrowDown, Activity,
  Download, RefreshCw,
  Cpu, Database, Timer, CheckCircle2
} from 'lucide-react';

interface MetricData {
  id: string;
  title: string;
  value: number | string;
  change: number;
  trend: 'up' | 'down' | 'stable';
  icon: React.ElementType;
  color: string;
  unit?: string;
  target?: number;
}

interface ChartData {
  timestamp: string;
  value: number;
  label: string;
}

interface UserBehaviorMetric {
  action: string;
  count: number;
  avgDuration: number;
  successRate: number;
  trend: number;
}

interface ROIMetric {
  category: string;
  investment: number;
  return: number;
  roi: number;
  projection: number;
}

interface PredictiveModel {
  type: string;
  accuracy: number;
  confidence: number;
  prediction: string;
  factors: string[];
}

const AdvancedAnalyticsDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('30d');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  // Real-time metrics state
  const [realTimeMetrics, setRealTimeMetrics] = useState<MetricData[]>([
    {
      id: 'active-users',
      title: 'Active Users',
      value: 1247,
      change: 12.5,
      trend: 'up',
      icon: Users,
      color: 'text-blue-600',
      target: 1500
    },
    {
      id: 'avg-processing-time',
      title: 'Avg Processing Time',
      value: '2.3s',
      change: -8.2,
      trend: 'down',
      icon: Timer,
      color: 'text-green-600'
    },
    {
      id: 'success-rate',
      title: 'Appeal Success Rate',
      value: '94.2%',
      change: 3.1,
      trend: 'up',
      icon: CheckCircle2,
      color: 'text-emerald-600',
      target: 95
    },
    {
      id: 'revenue',
      title: 'Monthly Revenue',
      value: '$487K',
      change: 15.8,
      trend: 'up',
      icon: DollarSign,
      color: 'text-purple-600',
      unit: 'USD'
    },
    {
      id: 'cpu-usage',
      title: 'System Load',
      value: '68%',
      change: -2.1,
      trend: 'down',
      icon: Cpu,
      color: 'text-orange-600',
      target: 80
    },
    {
      id: 'data-processed',
      title: 'Data Processed',
      value: '2.8TB',
      change: 22.4,
      trend: 'up',
      icon: Database,
      color: 'text-indigo-600'
    }
  ]);

  // User behavior analytics
  const [userBehavior] = useState<UserBehaviorMetric[]>([
    {
      action: 'Property Analysis',
      count: 3421,
      avgDuration: 245,
      successRate: 96.2,
      trend: 8.5
    },
    {
      action: 'Appeal Generation',
      count: 1876,
      avgDuration: 420,
      successRate: 94.8,
      trend: 12.3
    },
    {
      action: 'Market Intelligence',
      count: 2134,
      avgDuration: 180,
      successRate: 91.7,
      trend: -2.1
    },
    {
      action: 'Portfolio Management',
      count: 987,
      avgDuration: 310,
      successRate: 97.1,
      trend: 5.4
    }
  ]);

  // ROI tracking data
  const [roiMetrics] = useState<ROIMetric[]>([
    {
      category: 'Platform Development',
      investment: 850000,
      return: 2450000,
      roi: 188.2,
      projection: 315.7
    },
    {
      category: 'AI/ML Infrastructure',
      investment: 420000,
      return: 1230000,
      roi: 192.9,
      projection: 267.3
    },
    {
      category: 'User Acquisition',
      investment: 320000,
      return: 890000,
      roi: 178.1,
      projection: 245.8
    },
    {
      category: 'Performance Optimization',
      investment: 180000,
      return: 650000,
      roi: 261.1,
      projection: 389.4
    }
  ]);

  // Predictive models
  const [predictiveModels] = useState<PredictiveModel[]>([
    {
      type: 'Appeal Success Prediction',
      accuracy: 94.7,
      confidence: 89.2,
      prediction: 'High success probability (87%) for Q2 appeals',
      factors: ['Market trends', 'Assessment accuracy', 'Historical data', 'Economic indicators']
    },
    {
      type: 'User Churn Prediction',
      accuracy: 91.3,
      confidence: 85.6,
      prediction: 'Low churn risk (4.2%) for next quarter',
      factors: ['Usage patterns', 'Success rates', 'Support interactions', 'Feature adoption']
    },
    {
      type: 'Revenue Forecasting',
      accuracy: 88.9,
      confidence: 92.1,
      prediction: '$2.8M projected revenue for Q2',
      factors: ['Customer growth', 'Premium conversions', 'Market expansion', 'Retention rates']
    }
  ]);

  // Performance chart data
  const [performanceData, setPerformanceData] = useState<ChartData[]>([]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeMetrics(prev => 
        prev.map(metric => ({
          ...metric,
          value: typeof metric.value === 'number' 
            ? metric.value + (Math.random() - 0.5) * 10
            : metric.value,
          change: metric.change + (Math.random() - 0.5) * 2
        }))
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Generate performance chart data
  useEffect(() => {
    const generateData = () => {
      const data: ChartData[] = [];
      const now = new Date();
      const points = timeRange === '24h' ? 24 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      
      for (let i = points - 1; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - i * (timeRange === '24h' ? 3600000 : 86400000));
        data.push({
          timestamp: timestamp.toISOString(),
          value: Math.random() * 100 + 50,
          label: timeRange === '24h' 
            ? timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : timestamp.toLocaleDateString([], { month: 'short', day: 'numeric' })
        });
      }
      return data;
    };

    setPerformanceData(generateData());
  }, [timeRange]);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate data refresh
    await new Promise(resolve => setTimeout(resolve, 1500));
    setRefreshing(false);
  };

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    console.log(`Exporting analytics data as ${format}`);
    // Implementation for export functionality
  };

  const MetricCard: React.FC<{ metric: MetricData; isSelected: boolean }> = ({ metric, isSelected }) => (
    <motion.div
      className={`
        bg-white rounded-xl p-6 cursor-pointer transition-all duration-300
        ${isSelected ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-lg border border-gray-200'}
      `}
      onClick={() => setSelectedMetric(selectedMetric === metric.id ? null : metric.id)}
      whileHover="scaleIn"
      whileTap="scaleOut"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg bg-gray-50 ${metric.color}`}>
          <metric.icon size={24} />
        </div>
        <div className={`
          flex items-center text-sm font-medium
          ${metric.trend === 'up' ? 'text-green-600' : metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'}
        `}>
          {metric.trend === 'up' ? <ArrowUp size={16} /> : metric.trend === 'down' ? <ArrowDown size={16} /> : null}
          {Math.abs(metric.change)}%
        </div>
      </div>
      
      <div className="space-y-1">
        <h3 className="text-sm font-medium text-gray-600">{metric.title}</h3>
        <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
        {metric.target && (
          <div className="mt-2">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progress to target</span>
              <span>{Math.round((typeof metric.value === 'number' ? metric.value : 0) / metric.target * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${Math.min(100, (typeof metric.value === 'number' ? metric.value : 0) / metric.target * 100)}%` 
                }}
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );

  const UserBehaviorCard: React.FC<{ behavior: UserBehaviorMetric }> = ({ behavior }) => (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900">{behavior.action}</h4>
        <div className={`
          flex items-center text-sm
          ${behavior.trend > 0 ? 'text-green-600' : 'text-red-600'}
        `}>
          {behavior.trend > 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
          {Math.abs(behavior.trend)}%
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div>
          <span className="text-gray-500">Count</span>
          <p className="font-semibold">{behavior.count.toLocaleString()}</p>
        </div>
        <div>
          <span className="text-gray-500">Avg Duration</span>
          <p className="font-semibold">{Math.round(behavior.avgDuration / 60)}m</p>
        </div>
        <div>
          <span className="text-gray-500">Success Rate</span>
          <p className="font-semibold">{behavior.successRate}%</p>
        </div>
      </div>
    </div>
  );

  const ROICard: React.FC<{ roi: ROIMetric }> = ({ roi }) => (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <h4 className="font-medium text-gray-900 mb-3">{roi.category}</h4>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Investment</span>
          <span className="font-semibold">${(roi.investment / 1000).toFixed(0)}K</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Return</span>
          <span className="font-semibold">${(roi.return / 1000).toFixed(0)}K</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">ROI</span>
          <span className="font-bold text-green-600">{roi.roi}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">12m Projection</span>
          <span className="font-semibold text-blue-600">{roi.projection}%</span>
        </div>
      </div>
    </div>
  );

  const PredictiveModelCard: React.FC<{ model: PredictiveModel }> = ({ model }) => (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900">{model.type}</h4>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">Accuracy</span>
          <span className="text-sm font-semibold text-green-600">{model.accuracy}%</span>
        </div>
      </div>
      
      <p className="text-sm text-gray-700 mb-3">{model.prediction}</p>
      
      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
        <span>Confidence</span>
        <span>{model.confidence}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5 mb-3">
        <div 
          className="bg-blue-600 h-1.5 rounded-full"
          style={{ width: `${model.confidence}%` }}
        />
      </div>
      
      <div className="space-y-1">
        <span className="text-xs text-gray-500">Key Factors:</span>
        <div className="flex flex-wrap gap-1">
          {model.factors.map((factor, index) => (
            <span 
              key={index}
              className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded"
            >
              {factor}
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Advanced Analytics Dashboard</h1>
            <p className="text-gray-600 mt-1">Real-time performance metrics and intelligent insights</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as string)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
            
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleExport('pdf')}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                title="Export as PDF"
              >
                <Download size={16} />
              </button>
              <button
                onClick={() => handleExport('excel')}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                title="Export as Excel"
              >
                <BarChart3 size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Real-time Metrics Grid */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Real-time Performance Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {realTimeMetrics.map(metric => (
              <MetricCard
                key={metric.id}
                metric={metric}
                isSelected={selectedMetric === metric.id}
              />
            ))}
          </div>
        </div>

        {/* Performance Chart */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Performance Trends</h2>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Activity size={16} />
              <span>Live data updates every 5 seconds</span>
            </div>
          </div>
          
          <div className="h-64 relative">
            <svg className="w-full h-full" viewBox="0 0 800 250">
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.1" />
                </linearGradient>
              </defs>
              
              {performanceData.length > 0 && (
                <>
                  <path
                    d={`M ${performanceData.map((point, index) => 
                      `${(index / (performanceData.length - 1)) * 780 + 10},${250 - (point.value / 150) * 200}`
                    ).join(' L ')}`}
                    fill="url(#gradient)"
                    stroke="#3B82F6"
                    strokeWidth="2"
                  />
                  
                  {performanceData.map((point, index) => (
                    <circle
                      key={index}
                      cx={(index / (performanceData.length - 1)) * 780 + 10}
                      cy={250 - (point.value / 150) * 200}
                      r="4"
                      fill="#3B82F6"
                      className="hover:r-6 transition-all"
                    />
                  ))}
                </>
              )}
            </svg>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Behavior Analytics */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">User Behavior Analytics</h2>
            <div className="space-y-4">
              {userBehavior.map((behavior, index) => (
                <UserBehaviorCard key={index} behavior={behavior} />
              ))}
            </div>
          </div>

          {/* ROI Tracking */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">ROI Tracking & Reporting</h2>
            <div className="space-y-4">
              {roiMetrics.map((roi, index) => (
                <ROICard key={index} roi={roi} />
              ))}
            </div>
          </div>
        </div>

        {/* Predictive Models */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Predictive Success Modeling</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {predictiveModels.map((model, index) => (
              <PredictiveModelCard key={index} model={model} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalyticsDashboard;