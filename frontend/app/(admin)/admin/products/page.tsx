'use client';

import { useState } from 'react';
import { Upload, Download, FileText, Image, CheckCircle, XCircle, AlertTriangle, Package } from 'lucide-react';
import axios from 'axios';

interface ImportResult {
  success: any[];
  errors: any[];
  total: number;
}

export default function ProductsAdminPage() {
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [imageResult, setImageResult] = useState<ImportResult | null>(null);

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                 file.type === 'application/vnd.ms-excel')) {
      setExcelFile(file);
      setImportResult(null);
    } else {
      alert('Please select a valid Excel file (.xlsx or .xls)');
    }
  };

  const handleZipUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/zip') {
      setZipFile(file);
      setImageResult(null);
    } else {
      alert('Please select a valid ZIP file');
    }
  };

  const importProducts = async () => {
    if (!excelFile) {
      alert('Please select an Excel file first');
      return;
    }

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', excelFile);

      const response = await axios.post('/api/admin/import/products', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setImportResult(response.data);
    } catch (error) {
      console.error('Import failed:', error);
      alert('Import failed: ' + (error as any)?.response?.data?.message || error.message);
    } finally {
      setImporting(false);
    }
  };

  const uploadImages = async () => {
    if (!zipFile) {
      alert('Please select a ZIP file first');
      return;
    }

    setUploadingImages(true);
    try {
      const formData = new FormData();
      formData.append('file', zipFile);

      const response = await axios.post('/api/admin/upload/product-images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setImageResult(response.data);
    } catch (error) {
      console.error('Image upload failed:', error);
      alert('Image upload failed: ' + (error as any)?.response?.data?.message || error.message);
    } finally {
      setUploadingImages(false);
    }
  };

  const downloadTemplate = () => {
    // Create a sample Excel template
    const templateData = [
      [
        'sku', 'name', 'description', 'category', 'collection', 'tags', 
        'moq', 'price', 'pack_size', 'lead_time_days', 'countries_bought_in', 
        'customization_options', 'filename', 'ai_suggestion'
      ],
      [
        'SAMPLE-001', 'Sample Product', 'This is a sample product description', 
        'Sample Category', 'Sample Collection', 'tag1,tag2,tag3',
        '10', '25.99', 'Pack of 12', '7', 'UK,US,DE',
        'Color customization,Size options', 'sample-001', 'Great for seasonal displays'
      ]
    ];

    const csvContent = templateData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product-import-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Product Management</h1>
          <p className="text-gray-600">Import products from Excel and upload product images</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Excel Import Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold">Import Products from Excel</h2>
            </div>

            <div className="space-y-4">
              <div>
                <button
                  onClick={downloadTemplate}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 mb-4"
                >
                  <Download className="w-4 h-4" />
                  Download Template
                </button>
                <p className="text-sm text-gray-600">
                  Download the CSV template with all required columns and sample data
                </p>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleExcelUpload}
                  className="hidden"
                  id="excel-upload"
                />
                <label htmlFor="excel-upload" className="cursor-pointer">
                  <div className="text-center">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-700">
                      {excelFile ? excelFile.name : 'Click to upload Excel file'}
                    </p>
                    <p className="text-sm text-gray-500">
                      Supports .xlsx, .xls, and .csv files
                    </p>
                  </div>
                </label>
              </div>

              <button
                onClick={importProducts}
                disabled={!excelFile || importing}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? 'Importing...' : 'Import Products'}
              </button>
            </div>

            {/* Import Results */}
            {importResult && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Import Results
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>{importResult.success.length} products imported successfully</span>
                  </div>
                  {importResult.errors.length > 0 && (
                    <div className="flex items-center gap-2 text-red-600">
                      <XCircle className="w-4 h-4" />
                      <span>{importResult.errors.length} errors</span>
                    </div>
                  )}
                  <p className="text-sm text-gray-600">
                    Total rows processed: {importResult.total}
                  </p>
                </div>

                {importResult.errors.length > 0 && (
                  <details className="mt-4">
                    <summary className="cursor-pointer font-medium text-red-600 hover:text-red-700">
                      View Errors ({importResult.errors.length})
                    </summary>
                    <div className="mt-2 max-h-40 overflow-y-auto">
                      {importResult.errors.map((error: any, idx: number) => (
                        <div key={idx} className="text-sm bg-red-50 p-2 rounded mb-1">
                          <strong>Row {error.row}</strong> ({error.sku}): {error.error}
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            )}
          </div>

          {/* Image Upload Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <Image className="w-6 h-6 text-purple-600" />
              <h2 className="text-xl font-semibold">Upload Product Images</h2>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Instructions:</h4>
                    <ul className="text-sm text-blue-700 mt-1 space-y-1">
                      <li>• Create a ZIP file containing all product images</li>
                      <li>• Image filenames should match the 'filename' column in your Excel</li>
                      <li>• Supported formats: JPG, JPEG, PNG, GIF, WEBP</li>
                      <li>• Images will be automatically linked to products</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <input
                  type="file"
                  accept=".zip"
                  onChange={handleZipUpload}
                  className="hidden"
                  id="zip-upload"
                />
                <label htmlFor="zip-upload" className="cursor-pointer">
                  <div className="text-center">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-700">
                      {zipFile ? zipFile.name : 'Click to upload ZIP file'}
                    </p>
                    <p className="text-sm text-gray-500">
                      ZIP archive containing product images
                    </p>
                  </div>
                </label>
              </div>

              <button
                onClick={uploadImages}
                disabled={!zipFile || uploadingImages}
                className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadingImages ? 'Uploading...' : 'Upload Images'}
              </button>
            </div>

            {/* Image Upload Results */}
            {imageResult && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Image className="w-5 h-5" />
                  Upload Results
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>{imageResult.success.length} images processed successfully</span>
                  </div>
                  {imageResult.errors.length > 0 && (
                    <div className="flex items-center gap-2 text-red-600">
                      <XCircle className="w-4 h-4" />
                      <span>{imageResult.errors.length} errors</span>
                    </div>
                  )}
                  <p className="text-sm text-gray-600">
                    Total files processed: {imageResult.total}
                  </p>
                </div>

                {imageResult.success.length > 0 && (
                  <details className="mt-4">
                    <summary className="cursor-pointer font-medium text-green-600 hover:text-green-700">
                      View Successful Uploads ({imageResult.success.length})
                    </summary>
                    <div className="mt-2 max-h-40 overflow-y-auto">
                      {imageResult.success.map((item: any, idx: number) => (
                        <div key={idx} className="text-sm bg-green-50 p-2 rounded mb-1">
                          <strong>{item.filename}</strong>: {item.message}
                        </div>
                      ))}
                    </div>
                  </details>
                )}

                {imageResult.errors.length > 0 && (
                  <details className="mt-4">
                    <summary className="cursor-pointer font-medium text-red-600 hover:text-red-700">
                      View Errors ({imageResult.errors.length})
                    </summary>
                    <div className="mt-2 max-h-40 overflow-y-auto">
                      {imageResult.errors.map((error: any, idx: number) => (
                        <div key={idx} className="text-sm bg-red-50 p-2 rounded mb-1">
                          <strong>{error.filename}</strong>: {error.error}
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">How to Use</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">Step 1: Prepare Excel File</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Download the CSV template using the button above</li>
                <li>• Fill in your product data following the template structure</li>
                <li>• Include a 'filename' column with image filenames (without extension)</li>
                <li>• Required fields: sku, name, moq, price</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2">Step 2: Upload Images</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Create a ZIP file with all product images</li>
                <li>• Name images to match the 'filename' column values</li>
                <li>• Example: If filename is 'product-001', image should be 'product-001.jpg'</li>
                <li>• Supported formats: JPG, JPEG, PNG, GIF, WEBP</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}