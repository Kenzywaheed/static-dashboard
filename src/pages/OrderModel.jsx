import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
// import api from '../services/api'; 
import toast from 'react-hot-toast';

const OrderModel = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const queryClient = useQueryClient();

  // Fetch requirements
  const { data: requirements = [] } = useQuery({
    queryKey: ['model-requirements'],
    queryFn: async () => {
      const response = await api.get('/model/requirements');
      // Ensure we always return an array
      if (!response.data) return [];
      if (Array.isArray(response.data)) return response.data;
      return [];
    },
  });

  // Fetch approved models
  const { data: approvedModels = [] } = useQuery({
    queryKey: ['model-approved'],
    queryFn: async () => {
      const response = await api.get('/model/approved');
      // Ensure we always return an array
      if (!response.data) return [];
      if (Array.isArray(response.data)) return response.data;
      return [];
    },
  });

  // Fetch pending models
  const { data: pendingModels = [] } = useQuery({
    queryKey: ['model-pending'],
    queryFn: async () => {
      const response = await api.get('/model/pending');
      // Ensure we always return an array
      if (!response.data) return [];
      if (Array.isArray(response.data)) return response.data;
      return [];
    },
  });

  // Approve model mutation
  const approveMutation = useMutation({
    mutationFn: (id) => api.put(`/model/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries(['model-pending']);
      queryClient.invalidateQueries(['model-approved']);
      toast.success('Model approved successfully');
    },
    onError: () => {
      toast.error('Failed to approve model');
    },
  });

  // Reject model mutation
  const rejectMutation = useMutation({
    mutationFn: (id) => api.put(`/model/${id}/reject`),
    onSuccess: () => {
      queryClient.invalidateQueries(['model-pending']);
      toast.success('Model rejected');
    },
    onError: () => {
      toast.error('Failed to reject model');
    },
  });

  const handleApprove = (id) => {
    approveMutation.mutate(id);
  };

  const handleReject = (id) => {
    rejectMutation.mutate(id);
  };

  // Default requirements if none exist
  const defaultRequirements = [
    { id: 1, title: 'Model Requirements', description: 'Must be 18+ years old', required: true },
    { id: 2, title: 'Photo Quality', description: 'High resolution photos required', required: true },
    { id: 3, title: 'Response Time', description: 'Within 24 hours', required: false },
  ];

  const displayRequirements = requirements.length > 0 ? requirements : defaultRequirements;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Order Model</h1>
        <p className="text-gray-500 dark:text-gray-400">Manage model requirements and approvals</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('requirements')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'requirements'
              ? 'border-blue-500 text-blue-500'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Requirements
        </button>
        <button
          onClick={() => setActiveTab('approved')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'approved'
              ? 'border-blue-500 text-blue-500'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Approved Models ({approvedModels.length})
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'pending'
              ? 'border-blue-500 text-blue-500'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Pending Models ({pendingModels.length})
        </button>
      </div>

      {/* Requirements Tab */}
      {activeTab === 'requirements' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Model Requirements</h2>
          <div className="space-y-4">
            {displayRequirements.map((req) => (
              <div key={req.id} className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-800 dark:text-white">{req.name || req.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{req.requirements || req.description}</p>
                </div>
                {req.required && (
                  <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">Required</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approved Models Tab */}
      {activeTab === 'approved' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Approved Models</h2>
          {approvedModels.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No approved models</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Requirements</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {approvedModels.map((model) => (
                    <tr key={model.id} className="border-b border-gray-100 dark:border-gray-700">
                      <td className="py-3 px-4 text-sm text-gray-800 dark:text-gray-200">{model.name}</td>
                      <td className="py-3 px-4 text-sm text-gray-800 dark:text-gray-200">{model.requirements}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                          {model.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Pending Models Tab */}
      {activeTab === 'pending' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Pending Models</h2>
          {pendingModels.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No pending models</p>
          ) : (
            <div className="space-y-4">
              {pendingModels.map((model) => (
                <div key={model.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-800 dark:text-white">{model.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{model.requirements}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Status: {model.status}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(model.id)}
                      disabled={approveMutation.isPending}
                      className="flex items-center gap-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                    >
                      <CheckIcon className="h-4 w-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(model.id)}
                      disabled={rejectMutation.isPending}
                      className="flex items-center gap-1 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                    >
                      <XMarkIcon className="h-4 w-4" />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderModel;

