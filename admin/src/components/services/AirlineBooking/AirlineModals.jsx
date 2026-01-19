import React from "react";
import { 
  X, CreditCard, CheckCircle, Clock, User, Mail, DollarSign, 
  Calendar, AlertCircle, Upload, FileText, TrendingUp, Package, Send,
  Edit // Idinagdag ang Edit icon
} from "lucide-react";
import { useNavigate } from "react-router-dom"; // Idinagdag para sa navigation
import "./AirlineModals.css"; 

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
};

// --- MAIN INQUIRY MODAL ---
export const AirlineInquiryModal = ({ inquiry, onClose, onUpdateStatus, onRequestPayment, setShowContactRemarks }) => {
  const navigate = useNavigate(); // Hook para sa paglipat ng page

  if (!inquiry) return null;

  // Status Configuration
  const getStatusConfig = (status) => {
    const configs = {
      PENDING: { color: "#64748b", bg: "#f8fafc", border: "#e2e8f0", label: "PENDING REVIEW", sub: "Awaiting initial review" },
      CONTACTED: { color: "#b45309", bg: "#fffbeb", border: "#fde68a", label: "ACTION REQUIRED", sub: "User needs to respond" },
      PAYMENT_PENDING: { color: "#b45309", bg: "#fff7ed", border: "#fed7aa", label: "WAITING PAYMENT", sub: "Invoice sent" },
      PAID: { color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe", label: "PAID", sub: "Payment submitted" },
      CONFIRMED: { color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe", label: "CONFIRMED", sub: "Ready for booking" },
      COMPLETED: { color: "#15803d", bg: "#f0fdf4", border: "#bbf7d0", label: "COMPLETED", sub: "Documents delivered" },
      CANCELLED: { color: "#b91c1c", bg: "#fef2f2", border: "#fecaca", label: "CANCELLED", sub: "Request terminated" },
    };
    return configs[status] || configs.PENDING;
  };

  const statusConfig = getStatusConfig(inquiry.status);

  return (
    <div className="air-overlay" onClick={onClose}>
      <div className="air-modal air-modal-lg" onClick={e => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className="air-header">
          <div className="air-header-left">
            <h2 className="air-title">Request Details</h2>
            <div className="air-meta">
              <span className="air-ref">REF: #{inquiry._id.slice(-8).toUpperCase()}</span>
              <span className="air-dot">•</span>
              <span>{formatDate(inquiry.createdAt)}</span>
            </div>
          </div>
          
          <div className="air-header-right">
             <div className="air-status-pill" style={{
                 backgroundColor: statusConfig.bg, 
                 borderColor: statusConfig.border,
                 color: statusConfig.color
             }}>
                <Clock size={20} />
                <div className="air-pill-text">
                    <span className="air-pill-label">{statusConfig.label}</span>
                    <span className="air-pill-sub">{statusConfig.sub}</span>
                </div>
             </div>
             <button className="air-close" onClick={onClose}><X size={20}/></button>
          </div>
        </div>

        {/* BODY */}
        <div className="air-body">
          
          {/* ZONE 1: Processing Complete */}
          {inquiry.status === 'COMPLETED' && (
            <div className="air-zone-success">
               <div className="air-zone-header">
                  <div className="air-icon-box-success">
                    <CheckCircle size={24} color="white" strokeWidth={3} />
                  </div>
                  <div className="air-zone-text">
                     <h4>Processing Complete</h4>
                     <p>The following documents have been sent to the user:</p>
                  </div>
               </div>
               
               <div>
                  <div className="air-sent-label">SENT TO USER (STORED)</div>
                  <div className="air-file-card">
                     <div className="air-file-icon-green"><FileText size={22} /></div>
                     <div className="air-file-info">
                        <span className="air-file-name">ticket_confirmed_{inquiry._id.slice(-4)}.pdf</span>
                        <span className="air-file-sub">Sent • {formatDate(new Date())}</span>
                     </div>
                     <a href="#" className="air-view-link"><TrendingUp size={16}/> View</a>
                  </div>
               </div>
            </div>
          )}

          {/* ZONE 1B: Upload */}
          {inquiry.status === 'CONFIRMED' && (
            <div className="air-zone-upload">
               <div className="air-zone-header">
                  <div className="air-icon-box-warning"><Upload size={24} color="white"/></div>
                  <div className="air-zone-text">
                     <h4>Upload Final Documents</h4>
                     <p>Upload flight tickets to complete this order.</p>
                  </div>
               </div>
               <div className="air-upload-box" onClick={() => onUpdateStatus(inquiry._id, 'COMPLETED')}>
                  <Package size={28} color="#f59e0b"/>
                  <span>Click to browse or drag files here</span>
               </div>
            </div>
          )}

          {/* ZONE 2: Client Information */}
          <div className="air-section-card">
            <h3 className="air-section-label">CLIENT INFORMATION</h3>
            <div className="air-client-list">
                <div className="air-client-row">
                    <div className="air-icon-yellow"><User size={20}/></div>
                    <div>
                        <label>FULL NAME</label>
                        <div className="air-val">{inquiry.fullName}</div>
                    </div>
                </div>
                <div className="air-client-row">
                    <div className="air-icon-yellow"><Mail size={20}/></div>
                    <div>
                        <label>EMAIL ADDRESS</label>
                        <div className="air-val">{inquiry.email}</div>
                    </div>
                </div>
                <div className="air-client-row">
                    <div className="air-icon-yellow"><DollarSign size={20}/></div>
                    <div>
                        <label>AMOUNT</label>
                        <div className="air-val air-price">₱{(inquiry.estimatedPrice || 0).toLocaleString()}</div>
                    </div>
                </div>
                <div className="air-client-row">
                    <div className="air-icon-yellow"><Calendar size={20}/></div>
                    <div>
                        <label>SUBMITTED</label>
                        <div className="air-val">{formatDate(inquiry.createdAt)}</div>
                    </div>
                </div>
            </div>
          </div>

          {/* ZONE 3: Flight Details */}
          <div className="air-section-card">
            <h3 className="air-section-label">FLIGHT DETAILS</h3>
            <div className="air-flight-details">
                <div className="air-flight-row">
                    <span className="lbl">Route:</span>
                    <span className="val">{inquiry.flightDetails?.origin} ➝ {inquiry.flightDetails?.destination}</span>
                </div>
                <div className="air-flight-row">
                    <span className="lbl">Departure:</span>
                    <span className="val">{formatDate(inquiry.flightDetails?.departureDate)}</span>
                </div>
                <div className="air-flight-row">
                    <span className="lbl">Airline:</span>
                    <span className="val">{inquiry.flightDetails?.airline || 'Any Airline'}</span>
                </div>
                <div className="air-flight-row">
                    <span className="lbl">Pax:</span>
                    <span className="val">{inquiry.passengers?.length || 1} Passenger(s)</span>
                </div>
            </div>
          </div>

          {/* ZONE 4: Request Message */}
          <div className="air-section-card">
            <h3 className="air-section-label">REQUEST MESSAGE</h3>
            <div className="air-msg-box">
               {inquiry.message || "No additional notes."}
            </div>
          </div>

          {/* ZONE 5: Documents */}
          <div className="air-section-card">
            <div className="air-doc-header">
                <h3 className="air-section-label" style={{marginBottom:0}}>SUBMITTED DOCUMENTS (REQUIREMENTS)</h3>
                <span className="air-badge-orange">0 FILES</span>
            </div>
            <div className="air-empty-docs">
                <div className="air-empty-icon"><FileText size={40}/></div>
                <h4>No Requirements Yet</h4>
                <p>User hasn't uploaded any documents for this request.</p>
            </div>
          </div>

          {/* ZONE 6: QUICK ACTIONS */}
          <div className="air-actions-section">
             <h3 className="air-section-label">QUICK ACTIONS</h3>
             <div className="air-action-cards">
                <button className="air-card-btn btn-pending" onClick={() => onUpdateStatus(inquiry._id, 'PENDING')}>
                    <div className="ac-icon"><Clock size={20}/></div>
                    <div className="ac-text"><span>Set Pending</span><label>Return to review</label></div>
                </button>
                <button className="air-card-btn btn-issue" onClick={() => setShowContactRemarks(true)}>
                    <div className="ac-icon"><AlertCircle size={20}/></div>
                    <div className="ac-text"><span>Report Issue</span><label>Contact user</label></div>
                </button>
                <button className="air-card-btn btn-payment" onClick={onRequestPayment}>
                    <div className="ac-icon"><CreditCard size={20}/></div>
                    <div className="ac-text"><span>Request Payment</span><label>Send invoice</label></div>
                </button>
                <button className="air-card-btn btn-complete" onClick={() => onUpdateStatus(inquiry._id, 'COMPLETED')}>
                    <div className="ac-icon"><CheckCircle size={20}/></div>
                    <div className="ac-text"><span>Mark Complete</span><label>Finish request</label></div>
                </button>
                <button className="air-card-btn btn-cancel" onClick={() => onUpdateStatus(inquiry._id, 'CANCELLED')}>
                    <div className="ac-icon"><X size={20}/></div>
                    <div className="ac-text"><span>Cancel Request</span><label>Terminate process</label></div>
                </button>
             </div>
          </div>
        </div>

        {/* FOOTER - Idinagdag ang Edit Button dito para kapareho ng TourDetailModal flow */}
        <div className="air-modal-footer" style={{ 
            padding: '20px 32px', 
            borderTop: '1px solid #e2e8f0', 
            display: 'flex', 
            justifyContent: 'flex-end',
            gap: '12px',
            backgroundColor: '#f8fafc',
            borderBottomLeftRadius: '16px',
            borderBottomRightRadius: '16px'
        }}>

          <button className="air-close-btn-secondary" onClick={onClose} style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              backgroundColor: 'white',
              cursor: 'pointer',
              fontWeight: '600',
              color: '#64748b'
          }}>
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

// --- REPORT ISSUE MODAL ---
export const AirlineContactRemarksModal = ({ remarks, setRemarks, setEvidence, onSubmit, onClose }) => (
    <div className="air-overlay">
      <div className="air-modal air-modal-sm">
        <div className="air-report-header">
          <div className="air-report-titles"><h2>Report Issue</h2><p>Notify user about required actions or problems</p></div>
          <button className="air-close-simple" onClick={onClose}><X size={20}/></button>
        </div>
        <div className="air-report-body">
          <div className="air-field-group">
            <label>Remarks for User <span className="req">*</span></label>
            <textarea className="air-textarea" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Describe the issue or action required..." />
            <div className="air-char-count">{remarks.length} / 500 characters</div>
          </div>
          <div className="air-field-group">
            <label>Attach Evidence (Optional)</label>
            <div className="air-file-input">
               <input type="file" id="evidence-file" onChange={(e) => setEvidence(e.target.files[0])} accept=".pdf,.jpg,.png,.jpeg" hidden />
               <label htmlFor="evidence-file" className="air-upload-btn-simple"><Upload size={16} /><span>Choose file</span></label>
            </div>
            <div className="air-file-hint">PDF, JPG, or PNG (max 5MB)</div>
          </div>
          <button className="air-submit-yellow" onClick={onSubmit} disabled={!remarks.trim()}><Send size={16} /><span>Send Report</span></button>
        </div>
      </div>
    </div>
);