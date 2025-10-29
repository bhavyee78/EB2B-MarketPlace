'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import axios from 'axios';

interface RfqModalProps {
  product: {
    id: string;
    name: string;
    moq: number;
  };
  onClose: () => void;
}

export default function RfqModal({ product, onClose }: RfqModalProps) {
  const [requestedQty, setRequestedQty] = useState(product.moq);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post('/api/rfqs', {
        productId: product.id,
        requestedQty,
        note,
      });
      onClose();
      // Show success message
    } catch (error) {
      console.error('Failed to create RFQ:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Request Quote</h2>
          <button onClick={onClose} className="p-1">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product
            </label>
            <p className="text-gray-900">{product.name}</p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Requested Quantity
            </label>
            <input
              type="number"
              min={product.moq}
              value={requestedQty}
              onChange={(e) => setRequestedQty(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Minimum order quantity: {product.moq}
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Any specific requirements or questions..."
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Quote Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}