import React from "react";
import { X, CheckCircle, Receipt, User, Calendar, CreditCard, Clock, AlertTriangle, DollarSign } from "lucide-react";
import "./BillsModals.css";

export const BillsModal = ({ bill, onClose, onUpdateStatus }) => {
  if (!bill) return null;

  const getStatusIcon = (status) => {
      switch(status) {
          case 'Paid': return <CheckCircle size={16}/>;
          case 'Failed': return <AlertTriangle size={16}/>;
          default: return <Clock size={16}/>;
      }
  };

  const getStatusColor = (status) => {
      switch(status) {
          case 'Paid': return 'green';
          case 'Pending': return 'amber';
          case 'Unpaid': return 'slate';
          case 'Failed': return 'red';
          default: return 'amber';
      }
  };

  const color = getStatusColor(bill.status);

  return (
    <div className="bpm-overlay" onClick={onClose}>
      <div className="bpm-modal bpm-modal-lg" onClick={(e) => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className="bpm-header">
          <div className="bpm-header-content">
            <div className="bpm-title-group">
              <h2 className="bpm-title">Transaction Details</h2>
              <div className="bpm-meta">
                <span className="bpm-ref">ID: #{bill.id}</span>
              </div>
            </div>
            <div className={`bpm-status-badge bpm-status-${color}`}>
              <div className="bpm-status-icon">{getStatusIcon(bill.status)}</div>
              <div className="bpm-status-content">
                <span className="bpm-status-label">{bill.status}</span>
                <span className="bpm-status-desc">Transaction status</span>
              </div>
            </div>
          </div>
          <button className="bpm-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        {/* BODY */}
        <div className="bpm-body">
          
          {/* CLIENT INFO */}
          <div className="bpm-card">
            <div className="bpm-card-header">
              <h3 className="bpm-card-title">Payer Information</h3>
            </div>
            <div className="bpm-grid">
              <div className="bpm-info-item">
                <div className="bpm-info-icon"><User size={18} /></div>
                <div className="bpm-info-content">
                  <label className="bpm-info-label">Client Name</label>
                  <span className="bpm-info-value">{bill.client}</span>
                </div>
              </div>
              <div className="bpm-info-item">
                <div className="bpm-info-icon"><DollarSign size={18} /></div>
                <div className="bpm-info-content">
                  <label className="bpm-info-label">Total Amount</label>
                  <span className="bpm-info-value" style={{color: '#16a34a'}}>₱{bill.amount?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* BILLER INFO */}
          <div className="bpm-card">
            <div className="bpm-card-header">
              <h3 className="bpm-card-title">Billing Details</h3>
            </div>
            <div className="bpm-grid">
               <div className="bpm-info-item">
                <div className="bpm-info-icon"><Receipt size={18} /></div>
                <div className="bpm-info-content">
                  <label className="bpm-info-label">Biller Name</label>
                  <span className="bpm-info-value">{bill.biller}</span>
                </div>
              </div>
              <div className="bpm-info-item">
                <div className="bpm-info-icon"><CreditCard size={18} /></div>
                <div className="bpm-info-content">
                  <label className="bpm-info-label">Account Number</label>
                  <span className="bpm-info-value" style={{fontFamily: 'monospace'}}>{bill.acctNo}</span>
                </div>
              </div>
              <div className="bpm-info-item">
                <div className="bpm-info-icon"><Calendar size={18} /></div>
                <div className="bpm-info-content">
                  <label className="bpm-info-label">Due Date</label>
                  <span className="bpm-info-value">{bill.dueDate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="bpm-card">
            <div className="bpm-card-header">
              <h3 className="bpm-card-title">Quick Actions</h3>
            </div>
            <div className="bpm-action-grid">
              <button className="bpm-action-btn bpm-action-success" onClick={() => onUpdateStatus(bill.id, "Paid")}>
                <div className="bpm-action-icon"><CheckCircle size={18} /></div>
                <div className="bpm-action-content">
                  <span className="bpm-action-label">Mark as Paid</span>
                  <span className="bpm-action-desc">Confirm payment</span>
                </div>
              </button>
              <button className="bpm-action-btn bpm-action-danger" onClick={() => onUpdateStatus(bill.id, "Failed")}>
                <div className="bpm-action-icon"><AlertTriangle size={18} /></div>
                <div className="bpm-action-content">
                  <span className="bpm-action-label">Mark Failed</span>
                  <span className="bpm-action-desc">Transaction error</span>
                </div>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};