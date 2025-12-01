import React, { useState } from 'react';
import Sidebar from '../../sidebar/sidebar';
import { Plus, Shield, Clock, FileText, AlertCircle } from 'lucide-react';
import './TravelInsurance.css';

const TravelInsurance = () => {
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

    const stats = [
        { label: 'Policies Active', value: '45', icon: <Shield size={24}/> },
        { label: 'Pending Issuance', value: '2', icon: <Clock size={24}/> },
        { label: 'Expired', value: '120', icon: <FileText size={24}/> },
        { label: 'Claims', value: '0', icon: <AlertCircle size={24}/> },
    ];

    const data = [
        { id: 'INS-99', client: 'Anne Curtis', provider: 'Standard Insurance', coverage: 'International Gold', days: '15 Days', amount: '₱2,500', status: 'Active' },
    ];

    return (
        <div className="insurance-page">
            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={() => setSidebarCollapsed(!isSidebarCollapsed)} />
            <main className={`insurance-main ${isSidebarCollapsed ? 'expanded' : ''}`}>
                <div className="insurance-container">
                    <div className="insurance-header">
                        <div className="insurance-title">
                            <h1>Travel Insurance</h1>
                            <p>Medical and Trip Cancellation Coverage</p>
                        </div>
                        <button className="insurance-btn-add"><Plus size={18} style={{marginRight:'8px'}}/> New Policy</button>
                    </div>

                    <div className="insurance-stats-grid">
                        {stats.map((s, i) => (
                            <div className="insurance-card" key={i}>
                                <div><h2>{s.value}</h2><span>{s.label}</span></div>
                                <div className="insurance-card-icon">{s.icon}</div>
                            </div>
                        ))}
                    </div>

                    <div className="insurance-table-container">
                        <table className="insurance-table">
                            <thead>
                                <tr>
                                    <th>Policy No.</th>
                                    <th>Insured Name</th>
                                    <th>Provider</th>
                                    <th>Coverage</th>
                                    <th>Duration</th>
                                    <th>Premium</th>
                                    <th>Status</th>
                                    <th style={{textAlign:'right'}}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((item) => (
                                    <tr key={item.id}>
                                        <td style={{fontWeight:'700', color:'#0f172a'}}>{item.id}</td>
                                        <td>{item.client}</td>
                                        <td>{item.provider}</td>
                                        <td>{item.coverage}</td>
                                        <td>{item.days}</td>
                                        <td style={{fontWeight:'700'}}>{item.amount}</td>
                                        <td><span className={`status-pill status-${item.status.toLowerCase()}`}>{item.status}</span></td>
                                        <td style={{textAlign:'right'}}>
                                            <button className="insurance-action-btn">Policy</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};
export default TravelInsurance;