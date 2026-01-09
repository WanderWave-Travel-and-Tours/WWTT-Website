import React from 'react';
import { X, Upload, FileText, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import './Sellerratemodal.css';

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
            <h3>📊 Smart Excel Import - Auto-Detects Format!</h3>
            <p>System automatically supports TWO formats:</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
              {/* Standard Format */}
              <div style={{ 
                padding: '12px', 
                background: '#f8fafc', 
                borderLeft: '3px solid #3b82f6', 
                borderRadius: '6px' 
              }}>
                <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>
                  ✅ Standard Table
                </h4>
                <ul style={{ fontSize: '12px', color: '#475569', margin: 0, paddingLeft: '18px' }}>
                  <li>Headers in Row 1</li>
                  <li>Auto-detects columns</li>
                  <li>Single sheet</li>
                </ul>
              </div>

              {/* WTT Format */}
              <div style={{ 
                padding: '12px', 
                background: '#f8fafc', 
                borderLeft: '3px solid #10b981', 
                borderRadius: '6px' 
              }}>
                <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>
                  ✅ WTT Contracted
                </h4>
                <ul style={{ fontSize: '12px', color: '#475569', margin: 0, paddingLeft: '18px' }}>
                  <li>Sheet = Destination</li>
                  <li>Multiple sheets</li>
                  <li>Position-based</li>
                </ul>
              </div>
            </div>

            <p style={{ 
              color: '#10b981', 
              fontWeight: '600', 
              marginTop: '16px',
              padding: '10px 14px',
              background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
              borderRadius: '6px',
              border: '1px solid #6ee7b7'
            }}>
              ✨ Just upload - we'll auto-detect which format!
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