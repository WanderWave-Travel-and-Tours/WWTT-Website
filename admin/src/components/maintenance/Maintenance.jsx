import React from 'react';
import { Coffee, Map, ArrowRight } from 'lucide-react';
import './Maintenance.css';

const Maintenance = () => {
    return (
        <div className="maintenance-wrapper">
            <div className="maintenance-container">
                <div className="maintenance-card">
                    
                    {/* Left Side (Visual) */}
                    <div className="maintenance-visual">
                        <div className="maintenance-bg-icon">
                            <Map size={100} /> 
                        </div>
                        
                        <div className="maintenance-visual-content">
                            <Coffee size={48} className="visual-icon" style={{ marginBottom: '16px', color: '#f59e0b' }} />
                            <h2 className="maintenance-visual-title">On A Break</h2>
                            <p className="maintenance-visual-sub">Back in a bit.</p>
                        </div>
                    </div>

                    {/* Right Side (Details) */}
                    <div className="maintenance-content">
                        <div className="maintenance-status-row">
                            <div className="status-item">
                                <span className="maintenance-label">Status</span>
                                <div className="maintenance-value">MAINTENANCE</div>
                            </div>
                            <div className="status-item right-align">
                                <span className="maintenance-label">Estimated</span>
                                <div className="maintenance-value highlight">SOON</div>
                            </div>
                        </div>

                        <h3 className="maintenance-title">
                            We are rerouting our servers.
                        </h3>
                        <p className="maintenance-desc">
                            Sorry for the delay! We are currently updating the system to serve you better.
                        </p>

                        <button className="maintenance-btn">
                            Check Again Later <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Maintenance;