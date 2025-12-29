import React from "react";
import { X, CheckCircle, Heart, User, Calendar, FileText, Clock, AlertTriangle } from "lucide-react";
import "./MarriageModals.css";

export const MarriageModal = ({ request, onClose, onUpdateStatus }) => {
  if (!request) return null;

  const getStatusIcon = (status) => {
      switch(status) {
          case 'Completed': return <CheckCircle size={16}/>;
          case 'Unclaimed': return <AlertTriangle size={16}/>;
          default: return <Clock size={16}/>;
      }
  };

  const getStatusColor = (status) => {
      switch(status) {
          case 'Completed': return 'green';
          case 'Processing': return 'blue';
          case 'Unclaimed': return 'red';
          default: return 'amber';
      }
  };

  const color = getStatusColor(request.status);

  return (
    <div className="mcm-overlay" onClick={onClose}>
      <div className="mcm-modal mcm-modal-lg" onClick={(e) => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className="mcm-header">
          <div className="mcm-header-content">
            <div className="mcm-title-group">
              <h2 className="mcm-title">Request Details</h2>
              <div className="mcm-meta">
                <span className="mcm-ref">REF: #{request.id}</span>
              </div>
            </div>
            <div className={`mcm-status-badge mcm-status-${color}`}>
              <div className="mcm-status-icon">{getStatusIcon(request.status)}</div>
              <div className="mcm-status-content">
                <span className="mcm-status-label">{request.status}</span>
                <span className="mcm-status-desc">Current status</span>
              </div>
            </div>
          </div>
          <button className="mcm-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        {/* BODY */}
        <div className="mcm-body">
          
          {/* COUPLE INFO */}
          <div className="mcm-card">
            <div className="mcm-card-header">
              <h3 className="mcm-card-title">Marriage Information</h3>
            </div>
            <div className="mcm-grid">
              <div className="mcm-info-item">
                <div className="mcm-info-icon"><User size={18} /></div>
                <div className="mcm-info-content">
                  <label className="mcm-info-label">Husband</label>
                  <span className="mcm-info-value">{request.husband}</span>
                </div>
              </div>
              <div className="mcm-info-item">
                <div className="mcm-info-icon"><Heart size={18} /></div>
                <div className="mcm-info-content">
                  <label className="mcm-info-label">Wife</label>
                  <span className="mcm-info-value">{request.wife}</span>
                </div>
              </div>
              <div className="mcm-info-item">
                <div className="mcm-info-icon"><Calendar size={18} /></div>
                <div className="mcm-info-content">
                  <label className="mcm-info-label">Date Married</label>
                  <span className="mcm-info-value">{request.dateMarried}</span>
                </div>
              </div>
               <div className="mcm-info-item">
                <div className="mcm-info-icon"><FileText size={18} /></div>
                <div className="mcm-info-content">
                  <label className="mcm-info-label">No. of Copies</label>
                  <span className="mcm-info-value">{request.copies}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="mcm-card">
            <div className="mcm-card-header">
              <h3 className="mcm-card-title">Quick Actions</h3>
            </div>
            <div className="mcm-action-grid">
              <button className="mcm-action-btn mcm-action-success" onClick={() => onUpdateStatus(request.id, "Completed")}>
                <div className="mcm-action-icon"><CheckCircle size={18} /></div>
                <div className="mcm-action-content">
                  <span className="mcm-action-label">Mark Completed</span>
                  <span className="mcm-action-desc">Ready for pickup/delivery</span>
                </div>
              </button>
              <button className="mcm-action-btn mcm-action-danger" onClick={() => onUpdateStatus(request.id, "Unclaimed")}>
                <div className="mcm-action-icon"><AlertTriangle size={18} /></div>
                <div className="mcm-action-content">
                  <span className="mcm-action-label">Mark Unclaimed</span>
                  <span className="mcm-action-desc">Client did not show</span>
                </div>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};