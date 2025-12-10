import React, { useState, useEffect } from "react";
import axios from "axios";
import { X, CreditCard } from "lucide-react";
import "./VisaInquiryModal.css"; 

const VisaInquiryModal = ({ isOpen, onClose, inquiry, refreshData }) => {
  const [documents, setDocuments] = useState([]);
  const [showContactRemarks, setShowContactRemarks] = useState(false);
  const [contactRemarks, setContactRemarks] = useState("");
  const [contactEvidence, setContactEvidence] = useState(null);
  const [localInquiryStatus, setLocalInquiryStatus] = useState(inquiry.status);

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

  // Helpers
  const formatDate = (d) => new Date(d).toLocaleDateString();
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={(e) => e.target.className === "modal-overlay" && onClose()}>
        <div className="modal-content modal-content-large">
          <div className="modal-header">
            <div>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "#0f172a", textTransform: "uppercase" }}>
                Inquiry Details
              </h2>
              <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "13px" }}>
                Review customer information and submitted documents
              </p>
            </div>
            <button className="modal-close-btn" onClick={onClose}><X size={24} /></button>
          </div>

          <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            {/* Customer Info Section */}
            <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px', color: '#0f172a' }}>Customer Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', background: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
                    <div><p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px 0' }}>Full Name</p><p style={{ fontWeight: 600, margin: 0 }}>{inquiry.fullName}</p></div>
                    <div><p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px 0' }}>Email</p><p style={{ fontWeight: 600, margin: 0 }}>{inquiry.email}</p></div>
                    <div><p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px 0' }}>Service</p><p style={{ fontWeight: 600, margin: 0 }}>{inquiry.serviceName}</p></div>
                    <div><p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px 0' }}>Status</p>
                    <span className={`visa-badge badge-${(localInquiryStatus || 'pending').toLowerCase()}`}>{localInquiryStatus}</span></div>
                </div>
            </div>

            {/* Message Section */}
            <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px', color: '#0f172a' }}>Message</h3>
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', fontSize: '14px', lineHeight: '1.6' }}>
                    {inquiry.message}
                </div>
            </div>

            {/* Documents Section */}
            <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px', color: '#0f172a' }}>Submitted Documents ({documents.length})</h3>
                {documents.length === 0 ? <p style={{ textAlign: 'center', color: '#94a3b8' }}>No documents uploaded.</p> : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {Object.entries(documents.reduce((acc, doc) => {
                            const sec = doc.section || 'General';
                            if (!acc[sec]) acc[sec] = [];
                            acc[sec].push(doc);
                            return acc;
                        }, {})).map(([section, docs]) => (
                            <div key={section} style={{ background: '#f8fafc', borderRadius: '8px', padding: '16px', border: '1px solid #e2e8f0' }}>
                                <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>📁 {section}</h4>
                                {docs.map((doc) => (
                                    <div key={doc._id} style={{ background: 'white', padding: '12px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <div>
                                            <p style={{ fontWeight: 600, margin: '0' }}>{doc.originalName}</p>
                                            <p style={{ fontSize: '11px', color: '#94a3b8' }}>{formatFileSize(doc.fileSize)} • {formatDate(doc.uploadDate)}</p>
                                        </div>
                                        <div>
                                            <a href={`http://localhost:5000${doc.fileUrl}`} target="_blank" rel="noopener noreferrer" className="visa-action-btn visa-view-btn" style={{ fontSize: '12px' }}>View</a>
                                            <a href={`http://localhost:5000${doc.fileUrl}`} download={doc.originalName} className="visa-action-btn" style={{ fontSize: '12px' }}>Download</a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Actions Section */}
            <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px', color: '#0f172a' }}>Update Status</h3>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button className="visa-action-btn" onClick={() => handleUpdateStatus('PENDING')} disabled={localInquiryStatus === 'PENDING'}>Set Pending</button>
                    <button className="visa-action-btn" onClick={() => setShowContactRemarks(true)} disabled={localInquiryStatus === 'CONTACTED'}>Set Contacted (Remarks)</button>
                    <button className="visa-action-btn" onClick={handleRequestPayment} disabled={localInquiryStatus === 'PAYMENT_PENDING' || localInquiryStatus === 'PAID'} style={{ background: '#059669', color: 'white' }}>
                        <CreditCard size={16} /> Approve & Request Payment
                    </button>
                    <button className="visa-action-btn visa-view-btn" onClick={() => handleUpdateStatus('COMPLETED')} disabled={localInquiryStatus === 'COMPLETED'}>Set Completed</button>
                    <button className="visa-action-btn" onClick={() => handleUpdateStatus('CANCELLED')} disabled={localInquiryStatus === 'CANCELLED'} style={{ background: '#ef4444', color: 'white' }}>Cancel</button>
                </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="visa-action-btn" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>

      {/* SUB-MODAL: Contact Remarks */}
      {showContactRemarks && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
            <div className="modal-content" style={{ maxWidth: '500px' }}>
                <div className="modal-header">
                    <h3>Add Remarks & Evidence</h3>
                    <button className="modal-close-btn" onClick={() => setShowContactRemarks(false)}><X size={24} /></button>
                </div>
                <div className="modal-body">
                    <div className="form-group">
                        <label>Remarks / Issues Found *</label>
                        <textarea 
                            rows="4" className="req-input-text" style={{ width: '100%', resize: 'none' }}
                            value={contactRemarks} onChange={(e) => setContactRemarks(e.target.value)}
                            placeholder="Explain the error in documents..."
                        />
                    </div>
                    <div className="form-group" style={{ marginTop: '15px' }}>
                        <label>Upload Evidence (Screenshot/Doc)</label>
                        <input type="file" accept="image/*,.pdf" onChange={(e) => setContactEvidence(e.target.files[0])} />
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="modal-cancel-btn" onClick={() => setShowContactRemarks(false)}>Cancel</button>
                    <button className="modal-save-btn" onClick={submitContactWithRemarks}>Proceed</button>
                </div>
            </div>
        </div>
      )}
    </>
  );
};

export default VisaInquiryModal;