import React from "react";
import {
  X, CheckCircle, User, Mail, Calendar, MapPin, Users, Phone, DollarSign
} from "lucide-react";
import "./TourModals.css";

// --- HELPER FUNCTIONS ---
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
};

// ==========================================
// 1. TOUR DETAILS MODAL
// ==========================================
export const TourModal = ({
  tour, onClose, onUpdateStatus, onConfirm, onCancel
}) => {
  if (!tour) return null;

  const getStatusConfig = (status) => {
    const configs = {
      Confirmed: { color: "green", icon: CheckCircle, label: "Confirmed", description: "Tour is confirmed" },
      Pending: { color: "amber", icon: Calendar, label: "Pending", description: "Awaiting confirmation" },
      Cancelled: { color: "red", icon: X, label: "Cancelled", description: "Tour cancelled" },
    };
    return configs[status] || configs.Pending;
  };

  const statusConfig = getStatusConfig(tour.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="tur-overlay" onClick={onClose}>
      <div className="tur-modal tur-modal-lg" onClick={(e) => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className="tur-header">
          <div className="tur-header-content">
            <div className="tur-title-group">
              <h2 className="tur-title">Tour Package Details</h2>
              <div className="tur-meta">
                <span className="tur-ref">ID: {tour.id}</span>
                <span className="tur-divider">•</span>
                <span className="tur-date">Created {formatDate(new Date())}</span>
              </div>
            </div>
            <div className={`tur-status-badge tur-status-${statusConfig.color}`}>
              <div className="tur-status-icon"><StatusIcon size={16} /></div>
              <div className="tur-status-content">
                <span className="tur-status-label">{statusConfig.label}</span>
                <span className="tur-status-desc">{statusConfig.description}</span>
              </div>
            </div>
          </div>
          <button className="tur-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="tur-body">
          
          {/* ALERTS */}
          {tour.status === "Pending" && (
            <div className="tur-alert tur-alert-warning">
              <div className="tur-alert-icon"><Calendar size={22} /></div>
              <div className="tur-alert-content">
                <h4 className="tur-alert-title">Confirmation Required</h4>
                <p className="tur-alert-desc">This tour package is awaiting your confirmation. Please review the details below.</p>
              </div>
              <button className="tur-btn tur-btn-success tur-btn-sm" onClick={onConfirm}>
                <CheckCircle size={16} /><span>Confirm Tour</span>
              </button>
            </div>
          )}

          {/* CLIENT INFORMATION */}
          <div className="tur-card">
            <div className="tur-card-header">
              <h3 className="tur-card-title">Lead Guest Information</h3>
            </div>
            <div className="tur-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="tur-info-item">
                <div className="tur-info-icon"><User size={18} /></div>
                <div className="tur-info-content">
                  <label className="tur-info-label">Lead Guest</label>
                  <span className="tur-info-value">{tour.client}</span>
                </div>
              </div>
              <div className="tur-info-item">
                <div className="tur-info-icon"><Phone size={18} /></div>
                <div className="tur-info-content">
                  <label className="tur-info-label">Contact Number</label>
                  <span className="tur-info-value">+63 912 345 6789</span>
                </div>
              </div>
              <div className="tur-info-item">
                <div className="tur-info-icon"><Mail size={18} /></div>
                <div className="tur-info-content">
                  <label className="tur-info-label">Email Address</label>
                  <span className="tur-info-value">{tour.client.toLowerCase().replace(/ /g, '.')}@email.com</span>
                </div>
              </div>
              <div className="tur-info-item">
                <div className="tur-info-icon"><Users size={18} /></div>
                <div className="tur-info-content">
                  <label className="tur-info-label">Number of Pax</label>
                  <span className="tur-info-value">{tour.pax}</span>
                </div>
              </div>
            </div>
          </div>

          {/* TOUR PACKAGE INFORMATION */}
          <div className="tur-card">
            <div className="tur-card-header">
              <h3 className="tur-card-title">Package Details</h3>
              <span className="tur-badge tur-badge-green">TOUR PACKAGE</span>
            </div>
            <div className="tur-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="tur-info-item">
                <div className="tur-info-icon"><MapPin size={18} /></div>
                <div className="tur-info-content">
                  <label className="tur-info-label">Package Name</label>
                  <span className="tur-info-value">{tour.package}</span>
                </div>
              </div>
              <div className="tur-info-item">
                <div className="tur-info-icon"><Calendar size={18} /></div>
                <div className="tur-info-content">
                  <label className="tur-info-label">Travel Dates</label>
                  <span className="tur-info-value">{tour.travelDate}</span>
                </div>
              </div>
              <div className="tur-info-item">
                <div className="tur-info-icon"><DollarSign size={18} /></div>
                <div className="tur-info-content">
                  <label className="tur-info-label">Total Amount</label>
                  <span className="tur-info-value">₱25,500.00</span>
                </div>
              </div>
              <div className="tur-info-item">
                <div className="tur-info-icon"><Users size={18} /></div>
                <div className="tur-info-content">
                  <label className="tur-info-label">Tour Guide</label>
                  <span className="tur-info-value">John Doe</span>
                </div>
              </div>
            </div>
          </div>

          {/* SPECIAL REQUESTS */}
          <div className="tur-card">
            <div className="tur-card-header">
              <h3 className="tur-card-title">Special Requests / Notes</h3>
            </div>
            <div className="tur-message-box">
              {tour.notes || <span className="tur-msg-empty">No special requests provided by the guest.</span>}
            </div>
          </div>

          {/* ACTIONS */}
          <div className="tur-card">
            <div className="tur-card-header">
              <h3 className="tur-card-title">Quick Actions</h3>
            </div>
            <div className="tur-action-grid">
              <button className="tur-action-btn tur-action-primary" onClick={onConfirm}>
                <div className="tur-action-icon"><CheckCircle size={18} /></div>
                <div className="tur-action-content">
                  <span className="tur-action-label">Confirm Tour</span>
                  <span className="tur-action-desc">Approve package</span>
                </div>
              </button>

              <button className="tur-action-btn tur-action-success" onClick={() => alert('Email sent!')}>
                <div className="tur-action-icon"><Mail size={18} /></div>
                <div className="tur-action-content">
                  <span className="tur-action-label">Send Email</span>
                  <span className="tur-action-desc">Contact guest</span>
                </div>
              </button>

              <button className="tur-action-btn tur-action-danger" onClick={onCancel}>
                <div className="tur-action-icon"><X size={18} /></div>
                <div className="tur-action-content">
                  <span className="tur-action-label">Cancel Tour</span>
                  <span className="tur-action-desc">Reject package</span>
                </div>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};