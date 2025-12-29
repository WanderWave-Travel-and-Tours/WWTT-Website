import React from "react";
import { X, CheckCircle, Shield, User, Calendar, FileText, Clock, AlertTriangle, DollarSign } from "lucide-react";
import "./TravelModals.css";

export const TravelModal = ({ policy, onClose, onUpdateStatus }) => {
  if (!policy) return null;

  const getStatusIcon = (status) => {
      switch(status) {
          case 'Active': return <CheckCircle size={16}/>;
          case 'Expired': return <AlertTriangle size={16}/>;
          default: return <Clock size={16}/>;
      }
  };

  const getStatusColor = (status) => {
      switch(status) {
          case 'Active': return 'green';
          case 'Pending': return 'amber';
          case 'Expired': return 'red';
          default: return 'amber';
      }
  };

  const color = getStatusColor(policy.status);

  return (
    <div className="tim-overlay" onClick={onClose}>
      <div className="tim-modal tim-modal-lg" onClick={(e) => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className="tim-header">
          <div className="tim-header-content">
            <div className="tim-title-group">
              <h2 className="tim-title">Policy Details</h2>
              <div className="tim-meta">
                <span className="tim-ref">POL: #{policy.id}</span>
              </div>
            </div>
            <div className={`tim-status-badge tim-status-${color}`}>
              <div className="tim-status-icon">{getStatusIcon(policy.status)}</div>
              <div className="tim-status-content">
                <span className="tim-status-label">{policy.status}</span>
                <span className="tim-status-desc">Current status</span>
              </div>
            </div>
          </div>
          <button className="tim-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        {/* BODY */}
        <div className="tim-body">
          
          {/* CLIENT INFO */}
          <div className="tim-card">
            <div className="tim-card-header">
              <h3 className="tim-card-title">Insured Information</h3>
            </div>
            <div className="tim-grid">
              <div className="tim-info-item">
                <div className="tim-info-icon"><User size={18} /></div>
                <div className="tim-info-content">
                  <label className="tim-info-label">Client Name</label>
                  <span className="tim-info-value">{policy.client}</span>
                </div>
              </div>
              <div className="tim-info-item">
                <div className="tim-info-icon"><DollarSign size={18} /></div>
                <div className="tim-info-content">
                  <label className="tim-info-label">Premium Amount</label>
                  <span className="tim-info-value" style={{color: '#16a34a'}}>₱{policy.amount?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* COVERAGE INFO */}
          <div className="tim-card">
            <div className="tim-card-header">
              <h3 className="tim-card-title">Coverage Details</h3>
            </div>
            <div className="tim-grid">
               <div className="tim-info-item">
                <div className="tim-info-icon"><Shield size={18} /></div>
                <div className="tim-info-content">
                  <label className="tim-info-label">Insurance Provider</label>
                  <span className="tim-info-value">{policy.provider}</span>
                </div>
              </div>
              <div className="tim-info-item">
                <div className="tim-info-icon"><FileText size={18} /></div>
                <div className="tim-info-content">
                  <label className="tim-info-label">Plan / Coverage</label>
                  <span className="tim-info-value">{policy.coverage}</span>
                </div>
              </div>
              <div className="tim-info-item">
                <div className="tim-info-icon"><Calendar size={18} /></div>
                <div className="tim-info-content">
                  <label className="tim-info-label">Duration</label>
                  <span className="tim-info-value">{policy.days}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="tim-card">
            <div className="tim-card-header">
              <h3 className="tim-card-title">Quick Actions</h3>
            </div>
            <div className="tim-action-grid">
              <button className="tim-action-btn tim-action-success" onClick={() => onUpdateStatus(policy.id, "Active")}>
                <div className="tim-action-icon"><CheckCircle size={18} /></div>
                <div className="tim-action-content">
                  <span className="tim-action-label">Activate Policy</span>
                  <span className="tim-action-desc">Confirm issuance</span>
                </div>
              </button>
              <button className="tim-action-btn tim-action-danger" onClick={() => onUpdateStatus(policy.id, "Expired")}>
                <div className="tim-action-icon"><AlertTriangle size={18} /></div>
                <div className="tim-action-content">
                  <span className="tim-action-label">Mark Expired</span>
                  <span className="tim-action-desc">End coverage</span>
                </div>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};