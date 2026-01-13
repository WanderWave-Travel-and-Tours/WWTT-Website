import React, { useState, useEffect } from 'react';
import { X, Upload, FileText, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '../toast/ToastManager'; // Gumagamit ng ToastManager
import CustomConfirmModal from '../confirmationModal/CustomConfirmModal'; // Import ng iyong Custom Modal
import './Sellerratemodal.css';

const SellerRateUploadModal = ({ 
  show, 
  onClose, 
  selectedFile, 
  onFileSelect, 
  uploadStatus 
}) => {
  const toast = useToast(); // Hook para sa toast notifications
  const [showConfirm, setShowConfirm] = useState(false);

  // Monitor uploadStatus para mag-trigger ng Toast kapag nagbago ang state mula sa parent
  useEffect(() => {
    if (uploadStatus) {
      if (uploadStatus.type === 'success') {
        toast.success(uploadStatus.message, "Upload Complete");
      } else if (uploadStatus.type === 'error') {
        toast.error(uploadStatus.message, "Upload Failed");
      }
    }
  }, [uploadStatus, toast]);

  if (!show) return null;

  // Intercept sa file selection para magdagdag ng feedback
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onFileSelect(e);
      toast.info(`Selected: ${file.name}`, "File Attached");
    }
  };

  // Safe close handler: Magtatanong muna kung may file na nakasalang
  const handleCloseRequest = () => {
    if (selectedFile && uploadStatus?.type !== 'success') {
      setShowConfirm(true);
    } else {
      onClose();
    }
  };

  return (
    <>
      <div className="sr-modal-overlay" onClick={handleCloseRequest}>
        <div className="sr-modal sr-upload-modal" onClick={(e) => e.stopPropagation()}>
          <div className="sr-modal-header">
            <h2>Upload Excel Rate Sheet</h2>
            <button onClick={handleCloseRequest} aria-label="Close modal">
              <X size={20} />
            </button>
          </div>

          <div className="sr-upload-content">
            {/* Instructions - Pinanatili ang lahat ng existing styles at content */}
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
                  onChange={handleFileChange}
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

            {/* Upload Status - UI feedback na pinanatili */}
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

      {/* Confirmation Modal integrated */}
      <CustomConfirmModal 
        isOpen={showConfirm}
        title="Discard Upload?"
        message="You have a file selected. Are you sure you want to close without finishing the upload?"
        type="danger"
        onConfirm={() => {
          setShowConfirm(false);
          onClose();
        }}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
};

export default SellerRateUploadModal;