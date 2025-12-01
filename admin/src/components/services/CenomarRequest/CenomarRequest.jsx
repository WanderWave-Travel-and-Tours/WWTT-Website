import React, { useState } from 'react';
import Sidebar from '../../sidebar/sidebar';
import { Plus, UserCheck, CreditCard, CheckSquare, AlertOctagon } from 'lucide-react';
import './CenomarRequest.css';

const CenomarRequest = () => {
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

    const stats = [
        { label: 'Cenomar Requests', value: '85', icon: <UserCheck size={24}/> },
        { label: 'Pending Payment', value: '5', icon: <CreditCard size={24}/> },
        { label: 'Released', value: '78', icon: <CheckSquare size={24}/> },
        { label: 'Unclaimed', value: '2', icon: <AlertOctagon size={24}/> },
    ];

    const data = [
        { id: 'CNM-001', client: 'Dingdong Dantes', spouse: 'Marian Rivera', purpose: 'Marriage License', date: 'Nov 25, 2025', status: 'Process' },
    ];

    return (
        <div className="cenomar-page">
            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={() => setSidebarCollapsed(!isSidebarCollapsed)} />
            <main className={`cenomar-main ${isSidebarCollapsed ? 'expanded' : ''}`}>
                <div className="cenomar-container">
                    <div className="cenomar-header">
                        <div className="cenomar-title">
                            <h1>CENOMAR Request</h1>
                            <p>Certificate of No Marriage Applications</p>
                        </div>
                        <button className="cenomar-btn-add"><Plus size={18} style={{marginRight:'8px'}}/> New Request</button>
                    </div>

                    <div className="cenomar-stats-grid">
                        {stats.map((s, i) => (
                            <div className="cenomar-card" key={i}>
                                <div><h2>{s.value}</h2><span>{s.label}</span></div>
                                <div className="cenomar-card-icon">{s.icon}</div>
                            </div>
                        ))}
                    </div>

                    <div className="cenomar-table-container">
                        <table className="cenomar-table">
                            <thead>
                                <tr>
                                    <th>Ref #</th>
                                    <th>Applicant</th>
                                    <th>Intended Spouse</th>
                                    <th>Purpose</th>
                                    <th>Date Filed</th>
                                    <th>Status</th>
                                    <th style={{textAlign:'right'}}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((item) => (
                                    <tr key={item.id}>
                                        <td style={{fontWeight:'700', color:'#0f172a'}}>{item.id}</td>
                                        <td>{item.client}</td>
                                        <td>{item.spouse}</td>
                                        <td>{item.purpose}</td>
                                        <td>{item.date}</td>
                                        <td><span className={`status-pill status-${item.status.toLowerCase()}`}>{item.status}</span></td>
                                        <td style={{textAlign:'right'}}>
                                            <button className="cenomar-action-btn">Details</button>
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
export default CenomarRequest;