'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

interface Lead {
  id: string;
  companyName: string;
  contactName: string;
  email?: string;
  phone?: string;
  status: string;
  source?: string;
  estimatedValue?: number;
  closeProbability?: number;
  expectedCloseDate?: string;
  lastContactDate?: string;
  nextFollowUpDate?: string;
  assignedTo?: {
    id: string;
    fullName: string;
    email: string;
  };
  activities: Array<{
    type: string;
    subject: string;
    createdAt: string;
  }>;
  tasks: Array<{
    title: string;
    status: string;
    dueDate?: string;
    priority: number;
  }>;
}

interface LeadsResponse {
  leads: Lead[];
  total: number;
  limit: number;
  offset: number;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const pageSize = 10;

  useEffect(() => {
    fetchLeads();
  }, [currentPage, searchTerm, statusFilter]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: pageSize.toString(),
        offset: ((currentPage - 1) * pageSize).toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
      });

      const response = await axios.get(`/api/crm/leads?${params}`);
      const data: LeadsResponse = response.data;
      
      setLeads(data.leads);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const totalPages = Math.ceil(total / pageSize);

  const handleDelete = async (leadId: string) => {
    if (confirm('Are you sure you want to delete this lead?')) {
      try {
        await axios.delete(`/api/crm/leads/${leadId}`);
        fetchLeads();
      } catch (error) {
        console.error('Failed to delete lead:', error);
      }
    }
  };

  const LeadRow = ({ lead }: { lead: Lead }) => (
    <tr key={lead.id} className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div>
            <div className="text-sm font-medium text-gray-900">{lead.companyName}</div>
            <div className="text-sm text-gray-500">{lead.contactName}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col space-y-1">
          {lead.email && (
            <div className="flex items-center text-sm text-gray-600">
              <EnvelopeIcon className="w-4 h-4 mr-1" />
              {lead.email}
            </div>
          )}
          {lead.phone && (
            <div className="flex items-center text-sm text-gray-600">
              <PhoneIcon className="w-4 h-4 mr-1" />
              {lead.phone}
            </div>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(lead.status)}`}>
          {lead.status.replace('_', ' ')}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {lead.source || '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {lead.estimatedValue ? `£${lead.estimatedValue.toLocaleString()}` : '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {lead.closeProbability ? `${lead.closeProbability}%` : '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {lead.expectedCloseDate ? new Date(lead.expectedCloseDate).toLocaleDateString() : '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {/* View lead logic */}}
            className="text-blue-600 hover:text-blue-900"
          >
            <EyeIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => {/* Edit lead logic */}}
            className="text-yellow-600 hover:text-yellow-900"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(lead.id)}
            className="text-red-600 hover:text-red-900"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Leads Management</h1>
          <p className="text-gray-600 mt-1">Manage your sales leads and track their progress</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 w-full sm:w-auto"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Add Lead</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="relative flex-1 sm:flex-none">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="NEW">New</option>
                <option value="CONTACTED">Contacted</option>
                <option value="QUALIFIED">Qualified</option>
                <option value="PROPOSAL">Proposal</option>
                <option value="NEGOTIATION">Negotiation</option>
                <option value="CLOSED_WON">Closed Won</option>
                <option value="CLOSED_LOST">Closed Lost</option>
              </select>
              <FunnelIcon className="w-5 h-5 absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div className="text-sm text-gray-600">
            Showing {leads.length} of {total} leads
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company / Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Est. Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Close Prob.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expected Close
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No leads found. Create your first lead to get started.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => <LeadRow key={lead.id} lead={lead} />)
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(currentPage * pageSize, total)}</span> of{' '}
                  <span className="font-medium">{total}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  {[...Array(totalPages)].map((_, index) => {
                    const page = index + 1;
                    if (page === currentPage || Math.abs(page - currentPage) <= 2 || page === 1 || page === totalPages) {
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            page === currentPage
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (Math.abs(page - currentPage) === 3) {
                      return <span key={page} className="px-3 py-2 text-gray-500">...</span>;
                    }
                    return null;
                  })}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : leads.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center text-gray-500">
            No leads found. Create your first lead to get started.
          </div>
        ) : (
          leads.map((lead) => (
            <div key={lead.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{lead.companyName}</h3>
                  <p className="text-sm text-gray-600">{lead.contactName}</p>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(lead.status)}`}>
                  {lead.status.replace('_', ' ')}
                </span>
              </div>
              
              <div className="space-y-2">
                {lead.email && (
                  <div className="flex items-center text-sm text-gray-600">
                    <EnvelopeIcon className="w-4 h-4 mr-2" />
                    {lead.email}
                  </div>
                )}
                {lead.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <PhoneIcon className="w-4 h-4 mr-2" />
                    {lead.phone}
                  </div>
                )}
                
                <div className="flex justify-between text-sm text-gray-600 pt-2">
                  <span>Source: {lead.source || '-'}</span>
                  <span>Value: {lead.estimatedValue ? `£${lead.estimatedValue.toLocaleString()}` : '-'}</span>
                </div>
                
                {lead.expectedCloseDate && (
                  <div className="text-sm text-gray-600">
                    Expected Close: {new Date(lead.expectedCloseDate).toLocaleDateString()}
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-2 mt-4 pt-3 border-t border-gray-200">
                <button
                  onClick={() => {/* View lead logic */}}
                  className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg"
                >
                  <EyeIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {/* Edit lead logic */}}
                  className="p-2 text-yellow-600 hover:text-yellow-900 hover:bg-yellow-50 rounded-lg"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(lead.id)}
                  className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
        
        {/* Mobile Pagination */}
        {totalPages > 1 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex justify-between items-center">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}