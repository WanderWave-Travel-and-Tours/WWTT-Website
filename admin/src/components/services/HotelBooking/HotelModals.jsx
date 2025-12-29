import React from "react";
import { X, CheckCircle, User, Mail, Hotel, Calendar, MapPin, Phone, DollarSign } from "lucide-react";
import "./HotelModals.css";

export const ReservationModal = ({ reservation, onClose, onConfirm, onCancel }) => {
  if (!reservation) return null;

  const getStatusIcon = (status) => {
      switch(status) {
          case 'Confirmed': return <CheckCircle size={16}/>;
          case 'Cancelled': return <X size={16}/>;
          default: return <Calendar size={16}/>;
      }
  };

  const getStatusColor = (status) => {
      switch(status) {
          case 'Confirmed': return 'green';
          case 'Pending': return 'amber';
          case 'Cancelled': return 'red';
          default: return 'amber';
      }
  };

  const color = getStatusColor(reservation.status);

  return (
    <div className="hbm-overlay" onClick={onClose}>
      <div className="hbm-modal hbm-modal-lg" onClick={(e) => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className="hbm-header">
          <div className="hbm-header-content">
            <div className="hbm-title-group">
              <h2 className="hbm-title">Booking Details</h2>
              <div className="hbm-meta">
                <span className="hbm-ref">ID: {reservation.id}</span>
              </div>
            </div>
            <div className={`hbm-status-badge hbm-status-${color}`}>
              <div className="hbm-status-icon">{getStatusIcon(reservation.status)}</div>
              <div className="hbm-status-content">
                <span className="hbm-status-label">{reservation.status}</span>
                <span className="hbm-status-desc">Reservation status</span>
              </div>
            </div>
          </div>
          <button className="hbm-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        {/* BODY */}
        <div className="hbm-body">
          
          {/* GUEST INFO */}
          <div className="hbm-card">
            <div className="hbm-card-header">
              <h3 className="hbm-card-title">Guest Information</h3>
            </div>
            <div className="hbm-grid">
              <div className="hbm-info-item">
                <div className="hbm-info-icon"><User size={18} /></div>
                <div className="hbm-info-content">
                  <label className="hbm-info-label">Guest Name</label>
                  <span className="hbm-info-value">{reservation.guest}</span>
                </div>
              </div>
              <div className="hbm-info-item">
                <div className="hbm-info-icon"><Phone size={18} /></div>
                <div className="hbm-info-content">
                  <label className="hbm-info-label">Contact</label>
                  <span className="hbm-info-value">+63 912 345 6789</span>
                </div>
              </div>
              <div className="hbm-info-item">
                <div className="hbm-info-icon"><Mail size={18} /></div>
                <div className="hbm-info-content">
                  <label className="hbm-info-label">Email</label>
                  <span className="hbm-info-value">{reservation.guest.toLowerCase().replace(/ /g, '.')}@email.com</span>
                </div>
              </div>
            </div>
          </div>

          {/* HOTEL INFO */}
          <div className="hbm-card">
            <div className="hbm-card-header">
              <h3 className="hbm-card-title">Hotel & Room Details</h3>
            </div>
            <div className="hbm-grid">
               <div className="hbm-info-item">
                <div className="hbm-info-icon"><Hotel size={18} /></div>
                <div className="hbm-info-content">
                  <label className="hbm-info-label">Hotel Name</label>
                  <span className="hbm-info-value">{reservation.hotel}</span>
                </div>
              </div>
              <div className="hbm-info-item">
                <div className="hbm-info-icon"><MapPin size={18} /></div>
                <div className="hbm-info-content">
                  <label className="hbm-info-label">Room Type</label>
                  <span className="hbm-info-value">{reservation.room}</span>
                </div>
              </div>
              <div className="hbm-info-item">
                <div className="hbm-info-icon"><Calendar size={18} /></div>
                <div className="hbm-info-content">
                  <label className="hbm-info-label">Check-in Date</label>
                  <span className="hbm-info-value">{reservation.checkIn}</span>
                </div>
              </div>
              <div className="hbm-info-item">
                <div className="hbm-info-icon"><DollarSign size={18} /></div>
                <div className="hbm-info-content">
                  <label className="hbm-info-label">Total Price</label>
                  <span className="hbm-info-value" style={{color:'#16a34a'}}>₱{reservation.price?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="hbm-card">
            <div className="hbm-card-header">
              <h3 className="hbm-card-title">Quick Actions</h3>
            </div>
            <div className="hbm-action-grid">
              <button className="hbm-action-btn hbm-action-success" onClick={onConfirm}>
                <div className="hbm-action-icon"><CheckCircle size={18} /></div>
                <div className="hbm-action-content">
                  <span className="hbm-action-label">Confirm Booking</span>
                  <span className="hbm-action-desc">Approve reservation</span>
                </div>
              </button>
              <button className="hbm-action-btn hbm-action-danger" onClick={onCancel}>
                <div className="hbm-action-icon"><X size={18} /></div>
                <div className="hbm-action-content">
                  <span className="hbm-action-label">Cancel Booking</span>
                  <span className="hbm-action-desc">Reject reservation</span>
                </div>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};