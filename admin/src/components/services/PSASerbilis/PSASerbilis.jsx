import React, { useState } from 'react';
import Sidebar from '../../sidebar/sidebar';
import { Plus, FileText, Truck, AlertTriangle } from 'lucide-react';
import './PSASerbilis.css';

const PSASerbilis = () => {
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

    const stats = [
        { label: 'Total Requests', value: '450', icon: <FileText size={24}/> },
        { label: 'To Process', value: '12', icon: <AlertTriangle size={24}/> },
        { label: 'Delivered', value: '410', icon: <Truck size={24}/> },
        { label: 'Issues', value: '3', icon: <AlertTriangle size={24}/> },
    ];

    const data = [
        { id: 'PSA-101', client: 'Ana Marie Otin', type: 'Birth Certificate', copies: 2, purpose: 'Passport App', status: 'Pending' },
        { id: 'PSA-102', client: 'Cardo Dalisay', type: 'Death Certificate', copies: 1, purpose: 'Claims', status: 'Completed' },
    ];

    return (
        <div className="psa-page">
            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={() => setSidebarCollapsed(!isSidebarCollapsed)} />
            <main className={`psa-main ${isSidebarCollapsed ? 'expanded' : ''}`}>
                <div className="psa-container">
                    <div className="psa-header">
                        <div className="psa-title">
                            <h1>PSA Serbilis</h1>
                            <p>Birth, Marriage, Death Certificate Processing</p>
                        </div>
                        <button className="psa-btn-add"><Plus size={18} style={{marginRight:'8px'}}/> Request Document</button>
                    </div>

                    <div className="psa-stats-grid">
                        {stats.map((s, i) => (
                            <div className="psa-card" key={i}>
                                <div><h2>{s.value}</h2><span>{s.label}</span></div>
                                <div className="psa-card-icon">{s.icon}</div>
                            </div>
                        ))}
                    </div>

                    <div className="psa-table-container">
                        <table className="psa-table">
                            <thead>
                                <tr>
                                    <th>Ref No.</th>
                                    <th>Requester</th>
                                    <th>Document Type</th>
                                    <th>Purpose</th>
                                    <th>Status</th>
                                    <th style={{textAlign:'right'}}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((row) => (
                                    <tr key={row.id}>
                                        <td style={{fontWeight:'700', color:'#0f172a'}}>{row.id}</td>
                                        <td>{row.client}</td>
                                        <td><span style={{background:'#fef3c7', padding:'4px 8px', borderRadius:'4px', fontSize:'11px', fontWeight:'700', color:'#92400e'}}>{row.type}</span></td>
                                        <td>{row.purpose}</td>
                                        <td><span style={{background:'#dcfce7', color:'#166534', padding:'4px 10px', borderRadius:'6px', fontSize:'11px', fontWeight:'700', textTransform:'uppercase'}}>{row.status}</span></td>
                                        <td style={{textAlign:'right'}}>
                                            <button className="psa-action-btn">View</button>
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
export default PSASerbilis;