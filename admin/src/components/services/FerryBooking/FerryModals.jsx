import React from "react";
import { X, CreditCard, CheckCircle, Ship, Calendar, MapPin, User, Mail, DollarSign, Clock, AlertCircle } from "lucide-react";
import "./FerryModals.css";

// --- BOOKING DETAILS MODAL ---
export const BookingModal = ({ booking, onClose, onUpdateStatus }) => {
  if (!booking) return null;

  return (
    <div className="fry-overlay" onClick={onClose}>
      <div className="fry-modal fry-modal-lg" onClick={(e) => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className="fry-header">
          <div className="fry-header-content">
            <div className="fry-title-group">
              <h2 className="fry-title">Booking Details</h2>
              <div className="fry-meta">
                <span className="fry-ref">REF: #{booking.id}</span>
              </div>
            </div>
            <div className={`fry-status-badge fry-status-${booking.status === 'Issued' ? 'green' : 'amber'}`}>
              <div className="fry-status-icon">{booking.status === 'Issued' ? <CheckCircle size={16}/> : <Clock size={16}/>}</div>
              <div className="fry-status-content">
                <span className="fry-status-label">{booking.status}</span>
                <span className="fry-status-desc">{booking.status === 'Issued' ? 'Ticket confirmed' : 'Awaiting processing'}</span>
              </div>
            </div>
          </div>
          <button className="fry-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        {/* BODY */}
        <div className="fry-body">
          
          {/* PASSENGER INFO */}
          <div className="fry-card">
            <div className="fry-card-header">
              <h3 className="fry-card-title">Passenger Information</h3>
            </div>
            <div className="fry-grid">
              <div className="fry-info-item">
                <div className="fry-info-icon"><User size={18} /></div>
                <div className="fry-info-content">
                  <label className="fry-info-label">Full Name</label>
                  <span className="fry-info-value">{booking.client}</span>
                </div>
              </div>
              <div className="fry-info-item">
                <div className="fry-info-icon"><DollarSign size={18} /></div>
                <div className="fry-info-content">
                  <label className="fry-info-label">Ticket Price</label>
                  <span className="fry-info-value fry-val-amount">₱{booking.price?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ITINERARY */}
          <div className="fry-card">
            <div className="fry-card-header">
              <h3 className="fry-card-title">Trip Itinerary</h3>
            </div>
            <div className="fry-grid">
               <div className="fry-info-item">
                <div className="fry-info-icon"><Ship size={18} /></div>
                <div className="fry-info-content">
                  <label className="fry-info-label">Vessel Line</label>
                  <span className="fry-info-value">{booking.vessel}</span>
                </div>
              </div>
              <div className="fry-info-item">
                <div className="fry-info-icon"><MapPin size={18} /></div>
                <div className="fry-info-content">
                  <label className="fry-info-label">Route</label>
                  <span className="fry-info-value">{booking.route}</span>
                </div>
              </div>
              <div className="fry-info-item">
                <div className="fry-info-icon"><Calendar size={18} /></div>
                <div className="fry-info-content">
                  <label className="fry-info-label">Departure Date</label>
                  <span className="fry-info-value">{booking.date}</span>
                </div>
              </div>
              <div className="fry-info-item">
                <div className="fry-info-icon"><CheckCircle size={18} /></div>
                <div className="fry-info-content">
                  <label className="fry-info-label">Accommodation Class</label>
                  <span className="fry-info-value">{booking.class}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="fry-card">
            <div className="fry-card-header">
              <h3 className="fry-card-title">Quick Actions</h3>
            </div>
            <div className="fry-action-grid">
              <button className="fry-action-btn fry-action-success" onClick={() => onUpdateStatus(booking.id, "Issued")}>
                <div className="fry-action-icon"><CheckCircle size={18} /></div>
                <div className="fry-action-content">
                  <span className="fry-action-label">Issue Ticket</span>
                  <span className="fry-action-desc">Confirm booking</span>
                </div>
              </button>
              <button className="fry-action-btn fry-action-secondary" onClick={() => onUpdateStatus(booking.id, "Pending")}>
                <div className="fry-action-icon"><Clock size={18} /></div>
                <div className="fry-action-content">
                  <span className="fry-action-label">Set Pending</span>
                  <span className="fry-action-desc">Review later</span>
                </div>
              </button>
              <button className="fry-action-btn fry-action-danger" onClick={() => onUpdateStatus(booking.id, "Cancelled")}>
                <div className="fry-action-icon"><X size={18} /></div>
                <div className="fry-action-content">
                  <span className="fry-action-label">Cancel Booking</span>
                  <span className="fry-action-desc">Refund passenger</span>
                </div>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// --- ROUTE LIST MODAL (Placeholder for "Manage Service") ---
export const RouteListModal = ({ onClose }) => (
    <div className="fry-overlay" onClick={onClose}>
      <div className="fry-modal fry-modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="fry-header">
          <div className="fry-header-content">
             <h2 className="fry-title">Manage Routes</h2>
          </div>
          <button className="fry-close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="fry-body" style={{textAlign:'center', padding:'40px'}}>
             <Ship size={48} color="#cbd5e1" style={{margin:'0 auto 20px'}}/>
             <h4 style={{margin:'0 0 10px', color:'#0f172a'}}>Route Management</h4>
             <p style={{margin:0, color:'#64748b'}}>This feature is coming soon.</p>
        </div>
      </div>
    </div>
);