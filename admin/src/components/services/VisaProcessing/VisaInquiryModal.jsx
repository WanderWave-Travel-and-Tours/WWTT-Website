import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  X, CreditCard, CheckCircle, Upload, Send, FileText, 
  AlertCircle, Clock, User, Mail, DollarSign, Calendar, 
  Package, TrendingUp, Globe, Flag
} from "lucide-react";
import "./VisaInquiryModal.css"; // Sariling CSS ng Visa

const VisaInquiryModal = ({ isOpen, onClose, inquiry, refreshData }) => {
  const [documents, setDocuments] = useState([]);
  const [showContactRemarks, setShowContactRemarks] = useState(false);
  const [contactRemarks, setContactRemarks] = useState("");
  const [contactEvidence, setContactEvidence] = useState(null);
  const [localInquiryStatus, setLocalInquiryStatus] = useState(inquiry?.status || 'PENDING');
  
  // Delivery States
  const [showDeliverDocs, setShowDeliverDocs] = useState(false);
  const [deliveryFiles, setDeliveryFiles] = useState([]);

  useEffect(() => {
    if (inquiry) {
        setLocalInquiryStatus(inquiry.status);
        fetchDocuments(inquiry._id);
    }
  }, [inquiry]);

  const fetchDocuments = async (inquiryId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/documents/inquiry/${inquiryId}`);
      if (response.data.success) {
        setDocuments(response.data.documents || []);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      setDocuments([]);
    }
  };

  const handleUpdateStatus = async (status) => {
    try {
        const response = await axios.put(
            `http://localhost:5000/api/inquiries/${inquiry._id}/status`,
            { status }
        );
        if (response.data.success) {
            alert('Status updated successfully!');
            setLocalInquiryStatus(status);
            refreshData(); 
        }
    } catch (error) {
        alert('Failed to update status');
    }
  };

  const submitContactWithRemarks = async () => {
    try {
        const formData = new FormData();
        formData.append('status', 'CONTACTED');
        formData.append('remarks', contactRemarks);
        if (contactEvidence) formData.append('evidence', contactEvidence);

        const response = await axios.put(
            `http://localhost:5000/api/inquiries/${inquiry._id}/status`,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
        );

        if (response.data.success) {
            alert('Status updated to CONTACTED with remarks!');
            setLocalInquiryStatus('CONTACTED');
            refreshData();
            setShowContactRemarks(false);
            setContactRemarks("");
            setContactEvidence(null);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to update status');
    }
  };

  const handleRequestPayment = async () => {
    if (!window.confirm("Are documents correct? This will notify the user to pay.")) return;
    await handleUpdateStatus('PAYMENT_PENDING');
  };

  const handleConfirmPayment = async () => {
    if (!window.confirm("Confirm that payment has been received?")) return;
    try {
        const response = await axios.put(`http://localhost:5000/api/inquiries/${inquiry._id}/confirm-payment`, {
            adminName: 'Admin' 
        });
        if (response.data.success) {
            alert("Payment Confirmed! You can now process the visa.");
            setLocalInquiryStatus('CONFIRMED');
            refreshData();
        }
    } catch (error) {
        alert("Failed to confirm payment");
    }
  };

  // Deliver Documents Function
  const handleDeliverDocuments = async () => {
    if (deliveryFiles.length === 0) {
        alert("Please select files to upload.");
        return;
    }

    try {
        const formData = new FormData();
        deliveryFiles.forEach(file => formData.append('documents', file));

        const response = await axios.put(
            `http://localhost:5000/api/inquiries/${inquiry._id}/deliver-documents`,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
        );

        if (response.data.success) {
            alert("Documents delivered successfully! Request marked as COMPLETED.");
            setLocalInquiryStatus('COMPLETED');
            setDeliveryFiles([]);
            setShowDeliverDocs(false);
            refreshData();
        }
    } catch (error) {
        console.error("Delivery Error:", error);
        alert("Failed to deliver documents.");
    }
  };

  // Helpers
  const formatDate = (d) => d ? new Date(d).toLocaleDateString() : 'N/A';
  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getStatusConfig = (status) => {
    const configs = {
      PENDING: { color: "slate", icon: Clock, label: "Pending Review", description: "Awaiting initial review" },
      CONTACTED: { color: "amber", icon: AlertCircle, label: "Action Required", description: "User needs to respond" },
      PAYMENT_PENDING: { color: "amber", icon: CreditCard, label: "Waiting Payment", description: "Invoice sent to user" },
      PAID: { color: "blue", icon: CreditCard, label: "Payment Submitted", description: "Verify payment proof" },
      CONFIRMED: { color: "green", icon: CheckCircle, label: "Payment Confirmed", description: "Ready for processing" },
      COMPLETED: { color: "success", icon: CheckCircle, label: "Completed", description: "Documents delivered" },
      CANCELLED: { color: "red", icon: X, label: "Cancelled", description: "Request was cancelled" },
    };
    return configs[status] || configs.PENDING;
  };

  if (!isOpen || !inquiry) return null;

  const statusConfig = getStatusConfig(localInquiryStatus);
  const StatusIcon = statusConfig.icon;

  // Filter Logic
  let finalSentDocs = [];
  if (inquiry.deliveredDocuments && inquiry.deliveredDocuments.length > 0) {
    finalSentDocs = inquiry.deliveredDocuments;
  }

  // Group client docs by section if available, otherwise flat list
  const clientDocs = documents.filter(doc => !doc.isAdminUpload);

  return (
    <>
      <div className="vim-overlay" onClick={onClose}>
        <div className="vim-modal vim-modal-lg" onClick={(e) => e.stopPropagation()}>
          
          {/* HEADER */}
          <div className="vim-header">
            <div className="vim-header-content">
              <div className="vim-title-group">
                <h2 className="vim-title">Visa Request Details</h2>
                <div className="vim-meta">
                  <span className="vim-ref">REF: #{inquiry._id.slice(-8).toUpperCase()}</span>
                  <span className="vim-divider">•</span>
                  <span className="vim-date">{formatDate(inquiry.createdAt)}</span>
                </div>
              </div>
              <div className={`vim-status-badge vim-status-${statusConfig.color}`}>
                <div className="vim-status-icon"><StatusIcon size={16} /></div>
                <div className="vim-status-content">
                  <span className="vim-status-label">{statusConfig.label}</span>
                  <span className="vim-status-desc">{statusConfig.description}</span>
                </div>
              </div>
            </div>
            <button className="vim-close-btn" onClick={onClose} aria-label="Close modal">
              <X size={20} />
            </button>
          </div>

          {/* BODY */}
          <div className="vim-body">
            
            {/* ALERTS */}
            {localInquiryStatus === "PAID" && (
              <div className="vim-alert vim-alert-warning">
                <div className="vim-alert-icon"><CreditCard size={22} /></div>
                <div className="vim-alert-content">
                  <h4 className="vim-alert-title">Payment Verification Required</h4>
                  <p className="vim-alert-desc">The user has submitted payment proof. Please review.</p>
                </div>
                <button className="vim-btn vim-btn-success vim-btn-sm" onClick={handleConfirmPayment}>
                  <CheckCircle size={16} /><span>Confirm Payment</span>
                </button>
              </div>
            )}

            {localInquiryStatus === "CONFIRMED" && !showDeliverDocs && finalSentDocs.length === 0 && (
              <div className="vim-alert vim-alert-info">
                <div className="vim-alert-icon"><Upload size={22} /></div>
                <div className="vim-alert-content">
                  <h4 className="vim-alert-title">Ready for Visa Processing</h4>
                  <p className="vim-alert-desc">Payment confirmed. Process application and upload results when ready.</p>
                </div>
                <button className="vim-btn vim-btn-primary vim-btn-sm" onClick={() => setShowDeliverDocs(true)}>
                  <Upload size={16} /><span>Upload Results</span>
                </button>
              </div>
            )}

            {/* ADMIN UPLOAD ZONE */}
            {(showDeliverDocs || localInquiryStatus === 'COMPLETED' || finalSentDocs.length > 0) && (
              <div className="vim-upload-zone" style={{ 
                borderColor: localInquiryStatus === 'COMPLETED' ? '#22c55e' : '#cbd5e1',
                backgroundColor: localInquiryStatus === 'COMPLETED' ? '#f0fdf4' : undefined
              }}>
                <div className="vim-upload-header">
                  <div className="vim-upload-icon" style={{ background: localInquiryStatus === 'COMPLETED' ? '#22c55e' : undefined }}>
                    {localInquiryStatus === 'COMPLETED' ? <CheckCircle size={20} color="white"/> : <Upload size={20} color="white"/>}
                  </div>
                  <div className="vim-upload-text">
                    <h4>{localInquiryStatus === 'COMPLETED' ? 'Processing Complete' : 'Upload Final Documents'}</h4>
                    <p>
                      {localInquiryStatus === 'COMPLETED' 
                        ? 'The following documents have been sent to the user:' 
                        : 'Upload the approved visa or relevant documents here.'}
                    </p>
                  </div>
                </div>

                {/* SENT FILES LIST */}
                {finalSentDocs.length > 0 && (
                  <div className="vim-file-list" style={{ marginBottom: '20px' }}>
                    <div className="vim-file-header" style={{ color: '#16a34a' }}><span>Sent to User</span></div>
                    {finalSentDocs.map((doc, idx) => (
                      <div key={idx} className="vim-file-item" style={{ 
                        borderColor: '#86efac', background: 'white', boxShadow: '0 2px 5px rgba(22, 163, 74, 0.05)'
                      }}>
                        <div className="vim-file-icon" style={{ color: '#16a34a', background: '#dcfce7' }}>
                          <FileText size={18} />
                        </div>
                        <div className="vim-file-info">
                          <span className="vim-file-name" style={{fontWeight:'700', color: '#15803d'}}>
                            {doc.fileName || doc.originalName}
                          </span>
                          <span className="vim-file-size" style={{color:'#16a34a'}}>
                             Sent • {formatDate(doc.uploadedAt)}
                          </span>
                        </div>
                        <a href={`http://localhost:5000${doc.fileUrl}`} target="_blank" rel="noopener noreferrer" 
                           className="vim-btn vim-btn-ghost vim-btn-sm" style={{color:'#16a34a'}}>
                          <TrendingUp size={14} /> View
                        </a>
                      </div>
                    ))}
                  </div>
                )}

                {/* UPLOAD INPUT */}
                <div className="vim-upload-wrapper">
                  <input
                    type="file" multiple accept=".pdf,.jpg,.png,.jpeg"
                    onChange={(e) => setDeliveryFiles(Array.from(e.target.files))}
                    className="vim-hidden-input" id="visa-delivery-files"
                  />
                  <label htmlFor="visa-delivery-files" className="vim-upload-label" style={{ background: 'white', borderStyle: 'dashed' }}>
                    <Package size={24} />
                    <span>
                      {localInquiryStatus === 'COMPLETED' 
                        ? 'Click to send ADDITIONAL files' 
                        : 'Click to browse or drag files here'}
                    </span>
                  </label>
                </div>

                {/* PENDING UPLOADS */}
                {deliveryFiles.length > 0 && (
                  <div className="vim-file-list">
                    <div className="vim-file-header"><span>Ready to Send ({deliveryFiles.length})</span></div>
                    {deliveryFiles.map((file, idx) => (
                      <div key={idx} className="vim-file-item" style={{ borderStyle: 'dashed' }}>
                        <div className="vim-file-icon"><FileText size={18} /></div>
                        <div className="vim-file-info">
                          <span className="vim-file-name">{file.name}</span>
                          <span className="vim-file-size">{formatFileSize(file.size)}</span>
                        </div>
                        <button className="vim-file-remove" onClick={() => setDeliveryFiles(deliveryFiles.filter((_, i) => i !== idx))}>
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* ACTION BUTTONS */}
                {deliveryFiles.length > 0 && (
                  <div className="vim-upload-actions">
                    <button className="vim-btn vim-btn-ghost" onClick={() => { setDeliveryFiles([]); if(localInquiryStatus !== 'COMPLETED') setShowDeliverDocs(false); }}>
                      Cancel
                    </button>
                    <button className="vim-btn vim-btn-primary" onClick={handleDeliverDocuments}>
                      <Send size={16} /><span>{localInquiryStatus === 'COMPLETED' ? 'Send Additional' : 'Send & Complete'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* CLIENT INFORMATION */}
            <div className="vim-card">
              <div className="vim-card-header">
                <h3 className="vim-card-title">Client Information</h3>
              </div>
              <div className="vim-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="vim-info-item">
                  <div className="vim-info-icon"><User size={18} /></div>
                  <div className="vim-info-content">
                    <label className="vim-info-label">Full Name</label>
                    <span className="vim-info-value">{inquiry.fullName}</span>
                  </div>
                </div>
                <div className="vim-info-item">
                  <div className="vim-info-icon"><Mail size={18} /></div>
                  <div className="vim-info-content">
                    <label className="vim-info-label">Email Address</label>
                    <span className="vim-info-value">{inquiry.email}</span>
                  </div>
                </div>
                <div className="vim-info-item">
                  <div className="vim-info-icon"><Globe size={18} /></div>
                  <div className="vim-info-content">
                    <label className="vim-info-label">Visa Service</label>
                    <span className="vim-info-value">{inquiry.serviceName}</span>
                  </div>
                </div>
                <div className="vim-info-item">
                  <div className="vim-info-icon"><Flag size={18} /></div>
                  <div className="vim-info-content">
                    <label className="vim-info-label">Country</label>
                    <span className="vim-info-value">{inquiry.visaCountry || 'N/A'}</span>
                  </div>
                </div>
                <div className="vim-info-item">
                  <div className="vim-info-icon"><DollarSign size={18} /></div>
                  <div className="vim-info-content">
                    <label className="vim-info-label">Amount</label>
                    <span className="vim-info-value vim-val-amount">₱{(inquiry.estimatedPrice || 0).toLocaleString()}</span>
                  </div>
                </div>
                <div className="vim-info-item">
                  <div className="vim-info-icon"><Calendar size={18} /></div>
                  <div className="vim-info-content">
                    <label className="vim-info-label">Submitted</label>
                    <span className="vim-info-value">{formatDate(inquiry.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* REQUEST MESSAGE */}
            <div className="vim-card">
              <div className="vim-card-header">
                <h3 className="vim-card-title">Request Message</h3>
              </div>
              <div className="vim-message-box">
                {inquiry.message || <span className="vim-msg-empty">No message provided by the user.</span>}
              </div>
            </div>

            {/* SUBMITTED DOCUMENTS (CLIENT) */}
            <div className="vim-card">
              <div className="vim-card-header">
                <h3 className="vim-card-title">Submitted Requirements</h3>
                <span className="vim-badge vim-badge-amber">{clientDocs.length} file{clientDocs.length === 1 ? "" : "s"}</span>
              </div>
              {clientDocs.length === 0 ? (
                <div className="vim-empty">
                  <div className="vim-empty-icon"><FileText size={48} /></div>
                  <h4 className="vim-empty-title">No Requirements Yet</h4>
                  <p className="vim-empty-desc">User hasn't uploaded any documents for this request.</p>
                </div>
              ) : (
                <div className="vim-doc-list">
                  {clientDocs.map((doc) => (
                    <div key={doc._id} className="vim-doc-item">
                      <div className="vim-doc-icon"><FileText size={20} /></div>
                      <div className="vim-doc-info">
                        <span className="vim-doc-name">{doc.originalName}</span>
                        <span className="vim-doc-meta">{formatFileSize(doc.fileSize)} • {formatDate(doc.uploadedAt)}</span>
                      </div>
                      <a href={`http://localhost:5000${doc.fileUrl}`} download={doc.originalName} className="vim-btn vim-btn-ghost vim-btn-sm">
                        <Upload size={14} style={{transform: 'rotate(180deg)'}} /> Download
                      </a>
                      <a href={`http://localhost:5000${doc.fileUrl}`} target="_blank" rel="noopener noreferrer" className="vim-btn vim-btn-ghost vim-btn-sm">
                        <TrendingUp size={14} /> View
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* QUICK ACTIONS */}
            <div className="vim-card">
              <div className="vim-card-header">
                <h3 className="vim-card-title">Quick Actions</h3>
              </div>
              <div className="vim-action-grid">
                <button className="vim-action-btn vim-action-secondary" onClick={() => handleUpdateStatus("PENDING")}>
                  <div className="vim-action-icon"><Clock size={18} /></div>
                  <div className="vim-action-content">
                    <span className="vim-action-label">Set Pending</span>
                    <span className="vim-action-desc">Return to review</span>
                  </div>
                </button>

                <button className="vim-action-btn vim-action-warning" onClick={() => setShowContactRemarks(true)}>
                  <div className="vim-action-icon"><AlertCircle size={18} /></div>
                  <div className="vim-action-content">
                    <span className="vim-action-label">Report Issue</span>
                    <span className="vim-action-desc">Contact user</span>
                  </div>
                </button>

                <button className="vim-action-btn vim-action-primary" onClick={handleRequestPayment}>
                  <div className="vim-action-icon"><CreditCard size={18} /></div>
                  <div className="vim-action-content">
                    <span className="vim-action-label">Request Payment</span>
                    <span className="vim-action-desc">Send invoice</span>
                  </div>
                </button>

                <button className="vim-action-btn vim-action-success" onClick={() => handleUpdateStatus("COMPLETED")}>
                  <div className="vim-action-icon"><CheckCircle size={18} /></div>
                  <div className="vim-action-content">
                    <span className="vim-action-label">Mark Complete</span>
                    <span className="vim-action-desc">Finish request</span>
                  </div>
                </button>

                <button className="vim-action-btn vim-action-danger" onClick={() => handleUpdateStatus("CANCELLED")}>
                  <div className="vim-action-icon"><X size={18} /></div>
                  <div className="vim-action-content">
                    <span className="vim-action-label">Cancel Request</span>
                    <span className="vim-action-desc">Terminate process</span>
                  </div>
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* SUB-MODAL: Contact Remarks (Same structure) */}
      {showContactRemarks && (
        <div className="vim-overlay" style={{ zIndex: 10000 }}>
            <div className="vim-modal vim-modal-sm">
                <div className="vim-header">
                    <div className="vim-header-content">
                        <div className="vim-title-group">
                            <h2 className="vim-title">Report Issue</h2>
                            <div className="vim-meta"><span className="vim-subtitle">Notify user about issues</span></div>
                        </div>
                    </div>
                    <button className="vim-close-btn" onClick={() => setShowContactRemarks(false)}><X size={20} /></button>
                </div>
                <div className="vim-body">
                    <div className="vim-form-group">
                        <label className="vim-form-label">Remarks for User <span className="vim-label-req">*</span></label>
                        <textarea 
                            className="vim-input" rows="6" 
                            value={contactRemarks} onChange={(e) => setContactRemarks(e.target.value)}
                            placeholder="Describe the issue or missing document..."
                        />
                    </div>
                    <div className="vim-form-group">
                        <label className="vim-form-label">Attach Evidence (Optional)</label>
                        <div className="vim-file-wrapper">
                            <input type="file" className="vim-hidden-input" id="ev-file" onChange={(e) => setContactEvidence(e.target.files[0])} />
                            <label htmlFor="ev-file" className="vim-file-btn"><Upload size={18}/><span>Choose file</span></label>
                        </div>
                    </div>
                    <button className="vim-btn vim-btn-primary vim-btn-block" onClick={submitContactWithRemarks}>
                        <Send size={16} /><span>Send Report</span>
                    </button>
                </div>
            </div>
        </div>
      )}
    </>
  );
};

export default VisaInquiryModal;