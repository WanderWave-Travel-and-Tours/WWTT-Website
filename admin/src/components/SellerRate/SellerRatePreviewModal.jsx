import React from 'react';
import { X, CheckCircle, FileSpreadsheet } from 'lucide-react';
import './SellerRateModal.css';

const SellerRatePreviewModal = ({ 
  show, 
  onClose, 
  previewData, 
  onConfirm 
}) => {
  
  if (!show || !previewData) return null;

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
          {/* Stats */}
          <div className="sr-preview-stats">
            <div className="sr-stat-item">
              <FileSpreadsheet size={20} />
              <span><strong>{previewData.totalRows}</strong> rows found</span>
            </div>
            <div className="sr-stat-item">
              <CheckCircle size={20} />
              <span><strong>{previewData.validRows}</strong> valid entries</span>
            </div>
          </div>

          {/* Column Mapping */}
          <h3>Detected Column Mapping</h3>
          <div className="sr-column-mapping">
            {Object.entries(previewData.mapping).map(([field, column]) => (
              <div key={field} className="sr-mapping-item">
                <span className="sr-field-name">{field}</span>
                <span className="sr-arrow">→</span>
                <span className="sr-column-name">{column || 'Not found'}</span>
              </div>
            ))}
          </div>

          {/* Sample Data Preview */}
          {previewData.sampleRows && previewData.sampleRows.length > 0 && (
            <>
              <h3>Sample Data (First 3 Rows)</h3>
              <div className="sr-column-mapping">
                {previewData.sampleRows.slice(0, 3).map((row, idx) => (
                  <div key={idx} className="sr-mapping-item">
                    <span className="sr-field-name">Row {idx + 1}</span>
                    <span className="sr-arrow">→</span>
                    <span className="sr-column-name" style={{ fontSize: '12px', maxWidth: '400px' }}>
                      {row.destination} | {row.activity} | ₱{row.supplierRate}
                    </span>
                  </div>
                ))}
              </div>
            </>
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
            >
              <CheckCircle size={16} />
              Import {previewData.validRows} Rates
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerRatePreviewModal;