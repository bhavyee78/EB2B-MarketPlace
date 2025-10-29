'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ChartBarIcon, 
  UserGroupIcon, 
  CurrencyPoundIcon,
  TrendingUpIcon,
  ClockIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';

interface DashboardStats {
  totalLeads: number;
  activeLeads: number;
  pipelineValue: number;
  leadsThisMonth: number;
  leadsLastMonth: number;
  recentActivities: Array<{
    id: string;
    type: string;
    subject: string;
    createdAt: string;
    lead?: {
      companyName: string;
      contactName: string;
    };
  }>;
  upcomingTasks: Array<{
    id: string;
    title: string;
    dueDate: string;
    priority: number;
    lead?: {
      companyName: string;
      contactName: string;
    };
  }>;
  salesTargets: Array<{
    targetType: string;
    targetValue: number;
    actualValue: number;
    period: string;
  }> | null;
  conversionRate: string;
}

interface LeadPipeline {
  status: string;
  count: number;
  value: number;
}

export default function SalesDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pipeline, setPipeline] = useState<LeadPipeline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, pipelineResponse] = await Promise.all([
        axios.get('/api/crm/dashboard'),
        axios.get('/api/crm/pipeline')
      ]);
      
      setStats(statsResponse.data);
      setPipeline(pipelineResponse.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-200 h-64 rounded-lg"></div>
          <div className="bg-gray-200 h-64 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return <div className="text-center py-12">Failed to load dashboard data</div>;
  }

  const statCards = [
    {
      title: 'Total Leads',
      value: stats.totalLeads,
      icon: UserGroupIcon,
      color: 'bg-blue-500',
      change: stats.leadsThisMonth - stats.leadsLastMonth,
      changeType: stats.leadsThisMonth >= stats.leadsLastMonth ? 'increase' : 'decrease'
    },
    {
      title: 'Active Leads',
      value: stats.activeLeads,
      icon: TrendingUpIcon,
      color: 'bg-green-500',
      change: null,
      changeType: 'neutral'
    },
    {
      title: 'Pipeline Value',
      value: `£${(stats.pipelineValue / 1000).toFixed(1)}k`,
      icon: CurrencyPoundIcon,
      color: 'bg-purple-500',
      change: null,
      changeType: 'neutral'
    },
    {
      title: 'Conversion Rate',
      value: `${stats.conversionRate}%`,
      icon: ChartBarIcon,
      color: 'bg-orange-500',
      change: null,
      changeType: 'neutral'
    }
  ];

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'NEW': 'bg-gray-100 text-gray-800',
      'CONTACTED': 'bg-blue-100 text-blue-800',
      'QUALIFIED': 'bg-yellow-100 text-yellow-800',
      'PROPOSAL': 'bg-orange-100 text-orange-800',
      'NEGOTIATION': 'bg-purple-100 text-purple-800',
      'CLOSED_WON': 'bg-green-100 text-green-800',
      'CLOSED_LOST': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'CALL': return PhoneIcon;
      case 'EMAIL': return EnvelopeIcon;
      case 'MEETING': return CalendarDaysIcon;
      default: return ClockIcon;
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'text-red-600';
      case 2: return 'text-yellow-600';
      case 3: return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Sales Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's your sales overview.</p>
        </div>
        <button 
          onClick={fetchDashboardData}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
        >
          Refresh Data
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                {stat.change !== null && (
                  <p className={`text-sm mt-2 ${stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.changeType === 'increase' ? '+' : ''}{stat.change} from last month
                  </p>
                )}
              </div>
              <div className={`p-3 rounded-full ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Pipeline Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Sales Pipeline</h2>
          <div className="space-y-4">
            {pipeline.map((stage, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(stage.status)}`}>
                    {stage.status.replace('_', ' ')}
                  </span>
                  <span className="text-sm text-gray-600">{stage.count} leads</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  £{(stage.value / 1000).toFixed(1)}k
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activities</h2>
          <div className="space-y-4">
            {stats.recentActivities.slice(0, 5).map((activity) => {
              const ActivityIcon = getActivityIcon(activity.type);
              return (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="p-1 bg-blue-100 rounded-full">
                    <ActivityIcon className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.subject}</p>
                    {activity.lead && (
                      <p className="text-xs text-gray-600">
                        {activity.lead.companyName} - {activity.lead.contactName}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      {new Date(activity.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Tasks</h2>
          <div className="space-y-4">
            {stats.upcomingTasks.slice(0, 5).map((task) => (
              <div key={task.id} className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{task.title}</p>
                  {task.lead && (
                    <p className="text-xs text-gray-600">
                      {task.lead.companyName}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
                    {task.priority === 1 ? 'High' : task.priority === 2 ? 'Medium' : 'Low'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sales Targets */}
        {stats.salesTargets && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Sales Targets</h2>
            <div className="space-y-4">
              {stats.salesTargets.map((target, index) => {
                const percentage = (target.actualValue / target.targetValue) * 100;
                return (
                  <div key={index}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {target.targetType}
                      </span>
                      <span className="text-sm text-gray-600">
                        {target.actualValue} / {target.targetValue}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {percentage.toFixed(1)}% of target achieved
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}