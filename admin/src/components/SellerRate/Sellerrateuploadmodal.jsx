import React from 'react';
import { X, Upload, FileText, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import './SellerRateModal.css';

const SellerRateUploadModal = ({ 
  show, 
  onClose, 
  selectedFile, 
  onFileSelect, 
  uploadStatus 
}) => {
  
  if (!show) return null;

  return (
    <div className="sr-modal-overlay" onClick={onClose}>
      <div className="sr-modal sr-upload-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sr-modal-header">
          <h2>Upload Excel Rate Sheet</h2>
          <button onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <div className="sr-upload-content">
          {/* Instructions */}
          <div className="sr-upload-instructions">
            <h3>📊 Flexible Excel Import</h3>
            <p>The system automatically detects column names:</p>
            <ul>
              <li><strong>Destination:</strong> destination, dest, location, place, city</li>
              <li><strong>Activity:</strong> activity, tour, package, service</li>
              <li><strong>Supplier:</strong> supplier, vendor, provider, hotel</li>
              <li><strong>Rate:</strong> supplier rate, cost, net rate, base price</li>
              <li><strong>Markup:</strong> markup, margin, commission, profit</li>
            </ul>
            <p style={{ color: '#10b981', fontWeight: '600', marginTop: '12px' }}>
              ✨ Just upload - we'll detect your columns!
            </p>
          </div>

          {/* Upload Area */}
          <div className="sr-upload-area">
            <label className="sr-file-upload-label">
              <input 
                type="file" 
                accept=".xlsx,.xls"
                onChange={onFileSelect}
                hidden 
              />
              <Upload size={40} />
              <h3>Drop Excel file here or click to browse</h3>
              <p>Supports .xlsx and .xls files</p>
              {selectedFile && (
                <div className="sr-selected-file">
                  <FileText size={20} />
                  <span>{selectedFile.name}</span>
                </div>
              )}
            </label>
          </div>

          {/* Upload Status */}
          {uploadStatus && (
            <div className={`sr-upload-status ${uploadStatus.type}`}>
              {uploadStatus.type === 'loading' && <RefreshCw size={18} className="spinning" />}
              {uploadStatus.type === 'success' && <CheckCircle size={18} />}
              {uploadStatus.type === 'error' && <AlertCircle size={18} />}
              <span>{uploadStatus.message}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerRateUploadModal;