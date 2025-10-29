'use client';

import { useState, useEffect } from 'react';
import { Star, Save, RefreshCcw, AlertTriangle, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';

interface FeatureItem {
  feature: string;
  priority: number;
  isActive: boolean;
  productCount: number;
}

export default function FeaturesAdminPage() {
  const [features, setFeatures] = useState<FeatureItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    loadFeatures();
  }, []);

  const loadFeatures = async () => {
    try {
      const response = await axios.get('/api/admin/features');
      setFeatures(response.data.features || []);
    } catch (error) {
      console.error('Failed to load features:', error);
      setMessage({ type: 'error', text: 'Failed to load features' });
    } finally {
      setLoading(false);
    }
  };

  const updateFeature = (index: number, field: keyof FeatureItem, value: any) => {
    const updated = [...features];
    updated[index] = { ...updated[index], [field]: value };
    setFeatures(updated);
  };

  const moveFeature = (index: number, direction: 'up' | 'down') => {
    const updated = [...features];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < updated.length) {
      // Swap priorities
      const temp = updated[index].priority;
      updated[index].priority = updated[targetIndex].priority;
      updated[targetIndex].priority = temp;
      
      // Sort by priority to reflect the change
      updated.sort((a, b) => a.priority - b.priority);
      setFeatures(updated);
    }
  };

  const saveFeatures = async () => {
    setSaving(true);
    setMessage(null);
    
    try {
      const response = await axios.put('/api/admin/features', {
        items: features.map(f => ({
          feature: f.feature,
          priority: f.priority,
          isActive: f.isActive
        }))
      });

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Features updated successfully!' });
        // Reload to get updated product counts
        await loadFeatures();
      } else {
        setMessage({ type: 'error', text: 'Failed to update features' });
      }
    } catch (error) {
      console.error('Save failed:', error);
      setMessage({ type: 'error', text: 'Failed to update features' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <RefreshCcw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading features...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Feature Management</h1>
          <p className="text-gray-600">
            Manage product feature sections displayed on the home page. Drag to reorder, toggle visibility, and set priorities.
          </p>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Features List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" />
                Feature Sections ({features.length})
              </h2>
              <button
                onClick={saveFeatures}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

          {features.length === 0 ? (
            <div className="p-12 text-center">
              <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Features Found</h3>
              <p className="text-gray-600">
                Features will appear here once products are tagged with feature values.
              </p>
              <button
                onClick={loadFeatures}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50"
              >
                <RefreshCcw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {features.map((feature, index) => (
                <div
                  key={feature.feature}
                  className={`p-6 transition-colors ${
                    feature.isActive ? 'bg-white' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      {/* Visibility Toggle */}
                      <button
                        onClick={() => updateFeature(index, 'isActive', !feature.isActive)}
                        className={`p-2 rounded-lg border-2 transition-colors ${
                          feature.isActive
                            ? 'border-green-300 bg-green-50 text-green-600 hover:bg-green-100'
                            : 'border-gray-300 bg-gray-50 text-gray-400 hover:bg-gray-100'
                        }`}
                        title={feature.isActive ? 'Hide feature' : 'Show feature'}
                      >
                        {feature.isActive ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </button>

                      {/* Feature Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className={`text-lg font-medium ${
                            feature.isActive ? 'text-gray-900' : 'text-gray-500'
                          }`}>
                            {feature.feature}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            feature.productCount > 0 
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {feature.productCount} product{feature.productCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                        
                        {/* Priority Input */}
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-gray-600">Priority:</label>
                          <input
                            type="number"
                            value={feature.priority}
                            onChange={(e) => updateFeature(index, 'priority', parseInt(e.target.value) || 0)}
                            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            min="0"
                          />
                          <span className="text-xs text-gray-500">
                            (lower = higher priority)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Move Buttons */}
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => moveFeature(index, 'up')}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveFeature(index, 'down')}
                        disabled={index === features.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Move down"
                      >
                        ↓
                      </button>
                    </div>
                  </div>

                  {feature.productCount === 0 && feature.isActive && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-center gap-2 text-amber-800">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          No products assigned to this feature
                        </span>
                      </div>
                      <p className="text-xs text-amber-700 mt-1">
                        This feature section won't appear on the home page until products are tagged with this feature.
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">How Feature Management Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">Feature Assignment</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Features are created automatically when products are tagged</li>
                <li>• Add feature tags to products in the Product Management section</li>
                <li>• Each unique feature value becomes a section on the home page</li>
                <li>• Examples: "Fast Selling", "Must Buy", "Top Choice"</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2">Priority & Display</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Lower priority numbers appear higher on the page (1 before 2)</li>
                <li>• Use the eye icon to show/hide feature sections</li>
                <li>• Only active features with products will show on the home page</li>
                <li>• Changes take effect immediately after saving</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}