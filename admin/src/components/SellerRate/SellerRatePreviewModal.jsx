import React from 'react';
import { X, CheckCircle, FileSpreadsheet, AlertCircle } from 'lucide-react';
import './SellerRatePreviewModal.css';

const SellerRatePreviewModal = ({ 
  show, 
  onClose, 
  previewData, 
  onConfirm 
}) => {
  
  if (!show || !previewData) return null;

  const mapping = previewData.mapping || {};
  const hasMappings = Object.keys(mapping).length > 0;
  const isWTT = previewData.format && previewData.format.includes('WTT');

  return (
    <div className="sr-modal-overlay" onClick={onClose}>
      <div className="sr-modal sr-preview-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sr-modal-header">
          <h2>Preview Excel Import</h2>
          <button onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <div className="sr-preview-content">
          {/* Format Detection Badge */}
          {previewData.format && (
            <div style={{
              padding: '8px 16px',
              background: isWTT ? '#d1fae5' : '#dbeafe',
              border: `1px solid ${isWTT ? '#6ee7b7' : '#93c5fd'}`,
              borderRadius: '6px',
              marginBottom: '16px',
              textAlign: 'center',
              fontWeight: '600',
              color: isWTT ? '#047857' : '#1e40af'
            }}>
              🔍 Detected: {previewData.format}
            </div>
          )}

          {/* Stats */}
          <div className="sr-preview-stats">
            <div className="sr-stat-item">
              <FileSpreadsheet size={20} />
              <span><strong>{previewData.totalRows}</strong> rows found</span>
            </div>
            <div className="sr-stat-item">
              <CheckCircle size={20} />
              <span><strong>{previewData.validRows || 0}</strong> valid entries</span>
            </div>
            {isWTT && previewData.totalSheets && (
              <div className="sr-stat-item">
                <FileSpreadsheet size={20} />
                <span><strong>{previewData.totalSheets}</strong> destinations (sheets)</span>
              </div>
            )}
          </div>

          {/* Column Mapping */}
          <h3>Detected Column Mapping</h3>
          {hasMappings ? (
            <div className="sr-column-mapping">
              {Object.entries(mapping).map(([field, column]) => (
                <div key={field} className="sr-mapping-item">
                  <span className="sr-field-name">{field}</span>
                  <span className="sr-arrow">→</span>
                  <span className="sr-column-name">{column || 'Not found'}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="sr-preview-warning">
              <AlertCircle size={18} />
              <p>Could not detect column mappings automatically. Please check your Excel file format.</p>
            </div>
          )}

          {/* Sample Data Preview */}
          {previewData.sampleRows && previewData.sampleRows.length > 0 && (
            <>
              <h3>Sample Data (First 3 Rows)</h3>
              <div className="sr-sample-data">
                {previewData.sampleRows.slice(0, 3).map((row, idx) => (
                  <div key={idx} className="sr-sample-row">
                    <span className="sr-row-number">Row {idx + 1}</span>
                    <div className="sr-row-data">
                      <span><strong>Destination:</strong> {row.destination}</span>
                      <span><strong>Activity:</strong> {row.activity}</span>
                      <span><strong>Supplier:</strong> {row.supplier}</span>
                      <span><strong>Rate:</strong> ₱{row.supplierRate?.toLocaleString() || '0'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Warning if no valid rows */}
          {previewData.validRows === 0 && (
            <div className="sr-preview-warning">
              <AlertCircle size={18} />
              <p>No valid data found. Please ensure your Excel has columns for destination/activity and supplier rate.</p>
            </div>
          )}

          {/* Actions */}
          <div className="sr-preview-actions">
            <button 
              type="button" 
              className="sr-btn-cancel" 
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className="sr-btn-primary"
              onClick={onConfirm}
              disabled={!previewData.validRows || previewData.validRows === 0}
            >
              <CheckCircle size={16} />
              Import {previewData.validRows || 0} Rates
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerRatePreviewModal;