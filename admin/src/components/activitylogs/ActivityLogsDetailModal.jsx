import React from 'react';
import { X, Calendar, User, Activity, Globe, Monitor, AlertCircle, CheckCircle, Info, Clock } from 'lucide-react';
import './ActivityLogsDetailModal.css'; 

export const ActivityLogsDetailModal = ({ 
    showModal, 
    selectedLog, 
    setShowModal, 
    formatDate
}) => {
    if (!showModal || !selectedLog) return null;

    const closeModal = () => setShowModal(false);

    const getSeverityConfig = (severity) => {
        const configs = {
            INFO: { color: "blue", icon: Info, label: "Information", description: "Normal activity log" },
            SUCCESS: { color: "green", icon: CheckCircle, label: "Success", description: "Operation completed successfully" },
            WARNING: { color: "yellow", icon: AlertCircle, label: "Warning", description: "Potential issue detected" },
            ERROR: { color: "red", icon: AlertCircle, label: "Error", description: "Operation failed" },
        };
        return configs[severity.toUpperCase()] || configs.INFO; 
    };

    const severityConfig = getSeverityConfig(selectedLog.severity);
    const SeverityIcon = severityConfig.icon;

    return (
        <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="log-header-content">
                        <div className="log-title-group">
                            <h2 className="log-title">Activity Log Details</h2>
                            <div className="log-meta">
                                <span className="log-ref">ID: {selectedLog.id}</span>
                                <span className="log-divider">•</span>
                                <span className="log-date">Log #{selectedLog.logNumber}</span>
                            </div>
                        </div>
                        <div className={`log-severity-badge log-severity-${severityConfig.color}`}>
                            <div className="log-severity-icon"><SeverityIcon size={16} /></div>
                            <div className="log-severity-content">
                                <span className="log-severity-label">{severityConfig.label}</span>
                                <span className="log-severity-desc">{severityConfig.description}</span>
                            </div>
                        </div>
                    </div>
                    <button className="modal-close" onClick={closeModal} aria-label="Close modal">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="modal-body">
                    {/* 1. GENERAL LOG INFORMATION */}
                    <div className="log-card">
                        <div className="log-card-header">
                            <h3 className="log-card-title">General Information</h3>
                        </div>
                        <div className="log-grid">
                            <div className="log-info-item">
                                <div className="log-info-icon" style={{background: '#dbeafe', color: '#1e40af'}}>
                                    <Activity size={18} />
                                </div>
                                <div className="log-info-content">
                                    <label className="log-info-label">Action Type</label>
                                    <span className="log-info-value">{selectedLog.action}</span>
                                </div>
                            </div>
                            
                            <div className="log-info-item">
                                <div className="log-info-icon" style={{background: '#fef3c7', color: '#92400e'}}>
                                    <Monitor size={18} />
                                </div>
                                <div className="log-info-content">
                                    <label className="log-info-label">Module</label>
                                    <span className="log-info-value">{selectedLog.module}</span>
                                </div>
                            </div>
                            
                            <div className="log-info-item">
                                <div className="log-info-icon" style={{background: '#d1fae5', color: '#065f46'}}>
                                    <User size={18} />
                                </div>
                                <div className="log-info-content">
                                    <label className="log-info-label">User</label>
                                    <span className="log-info-value">{selectedLog.user}</span>
                                </div>
                            </div>
                            
                            <div className="log-info-item">
                                <div className="log-info-icon" style={{background: '#e0e7ff', color: '#3730a3'}}>
                                    <Calendar size={18} />
                                </div>
                                <div className="log-info-content">
                                    <label className="log-info-label">Timestamp</label>
                                    <span className="log-info-value">{formatDate(selectedLog.timestamp)}</span>
                                </div>
                            </div>

                            <div className="log-info-item">
                                <div className="log-info-icon" style={{background: '#fef2f2', color: '#991b1b'}}>
                                    <Globe size={18} />
                                </div>
                                <div className="log-info-content">
                                    <label className="log-info-label">IP Address</label>
                                    <span className="log-info-value">{selectedLog.ipAddress}</span>
                                </div>
                            </div>

                            <div className="log-info-item">
                                <div className="log-info-icon" style={{background: '#f3e8ff', color: '#6b21a8'}}>
                                    <Clock size={18} />
                                </div>
                                <div className="log-info-content">
                                    <label className="log-info-label">Duration</label>
                                    <span className="log-info-value">{selectedLog.details.duration}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* 2. ACTIVITY DESCRIPTION */}
                    <div className="log-card">
                        <div className="log-card-header">
                            <h3 className="log-card-title">Activity Description</h3>
                        </div>
                        <div className="log-message-box">
                            <p style={{margin:0, color:'#475569'}}>
                                {selectedLog.description}
                            </p>
                        </div>
                    </div>

                    {/* 3. TECHNICAL DETAILS */}
                    <div className="log-card">
                        <div className="log-card-header">
                            <h3 className="log-card-title">Technical Details</h3>
                        </div>
                        <div className="log-grid">
                            <div className="log-info-item">
                                <div className="log-info-icon" style={{background: '#e0f2fe', color: '#0c4a6e'}}>
                                    <Monitor size={18} />
                                </div>
                                <div className="log-info-content">
                                    <label className="log-info-label">HTTP Method</label>
                                    <span className="log-info-value">{selectedLog.details.method}</span>
                                </div>
                            </div>
                            
                            <div className="log-info-item">
                                <div className="log-info-icon" style={{background: '#dcfce7', color: '#14532d'}}>
                                    <CheckCircle size={18} />
                                </div>
                                <div className="log-info-content">
                                    <label className="log-info-label">Status Code</label>
                                    <span className="log-info-value">{selectedLog.details.statusCode}</span>
                                </div>
                            </div>
                            
                            <div className="log-info-item">
                                <div className="log-info-icon" style={{background: '#fef3c7', color: '#713f12'}}>
                                    <Activity size={18} />
                                </div>
                                <div className="log-info-content">
                                    <label className="log-info-label">Endpoint</label>
                                    <span className="log-info-value" style={{fontSize: '13px'}}>{selectedLog.details.endpoint}</span>
                                </div>
                            </div>
                            
                            <div className="log-info-item">
                                <div className="log-info-icon" style={{background: '#ede9fe', color: '#5b21b6'}}>
                                    <Info size={18} />
                                </div>
                                <div className="log-info-content">
                                    <label className="log-info-label">Affected Records</label>
                                    <span className="log-info-value">{selectedLog.details.affectedRecords}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 4. USER AGENT */}
                    <div className="log-card">
                        <div className="log-card-header">
                            <h3 className="log-card-title">User Agent Information</h3>
                        </div>
                        <div className="log-message-box" style={{fontSize: '12px', fontFamily: 'monospace'}}>
                            {selectedLog.userAgent}
                        </div>
                    </div>

                    {/* 5. FULL LOG DATA (For technical review) */}
                    <div className="log-card">
                        <div className="log-card-header">
                            <h3 className="log-card-title">Full Log Data (JSON)</h3>
                        </div>
                        <div className="log-message-box" style={{height: '150px', overflowY: 'auto'}}>
                            <pre style={{ margin: 0, fontSize: '12px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                                {JSON.stringify(selectedLog, null, 2)}
                            </pre>
                        </div>
                    </div>
                </div>

                {/* FOOTER ACTIONS */}
                <div className="modal-footer">
                    <button className="log-btn log-btn-ghost" onClick={closeModal}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ActivityLogsDetailModal;