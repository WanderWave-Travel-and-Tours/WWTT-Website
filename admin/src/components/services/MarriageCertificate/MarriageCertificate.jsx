import React, { useState } from 'react';
import Sidebar from '../../sidebar/sidebar';
import { Plus, Heart, Clock, Truck, AlertOctagon } from 'lucide-react';
import './MarriageCertificate.css';

const MarriageCertificate = () => {
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

    const stats = [
        { label: 'Requests', value: '150', icon: <Heart size={24}/> },
        { label: 'Processing', value: '12', icon: <Clock size={24}/> },
        { label: 'Delivered', value: '135', icon: <Truck size={24}/> },
        { label: 'Unclaimed', value: '3', icon: <AlertOctagon size={24}/> },
    ];

    const requests = [
        { id: 'MC-101', husband: 'Dingdong Dantes', wife: 'Marian Rivera', dateMarried: 'Dec 30, 2014', copies: 2, status: 'Completed' },
        { id: 'MC-102', husband: 'Richard Gutierrez', wife: 'Sarah Lahbati', dateMarried: 'Mar 14, 2020', copies: 1, status: 'Pending' },
    ];

    return (
        <div className="marriage-page">
            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={() => setSidebarCollapsed(!isSidebarCollapsed)} />
            <main className={`marriage-main ${isSidebarCollapsed ? 'expanded' : ''}`}>
                <div className="marriage-container">
                    <div className="marriage-header">
                        <div className="marriage-title">
                            <h1>Marriage Certificate</h1>
                            <p>PSA Authenticated Marriage Certificate Requests</p>
                        </div>
                        <button className="marriage-btn-add"><Plus size={18} style={{marginRight:'8px'}}/> New Request</button>
                    </div>

                    <div className="marriage-stats-grid">
                        {stats.map((s, i) => (
                            <div className="marriage-card" key={i}>
                                <div><h2>{s.value}</h2><span>{s.label}</span></div>
                                <div className="marriage-card-icon">{s.icon}</div>
                            </div>
                        ))}
                    </div>

                    <div className="marriage-table-container">
                        <table className="marriage-table">
                            <thead>
                                <tr>
                                    <th>Ref #</th>
                                    <th>Husband Name</th>
                                    <th>Wife Name</th>
                                    <th>Date of Marriage</th>
                                    <th>Copies</th>
                                    <th>Status</th>
                                    <th style={{textAlign:'right'}}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map((req) => (
                                    <tr key={req.id}>
                                        <td style={{fontWeight:'700', color:'#0f172a'}}>{req.id}</td>
                                        <td>{req.husband}</td>
                                        <td>{req.wife}</td>
                                        <td>{req.dateMarried}</td>
                                        <td style={{textAlign:'center'}}>{req.copies}</td>
                                        <td><span className={`status-pill status-${req.status.toLowerCase()}`}>{req.status}</span></td>
                                        <td style={{textAlign:'right'}}>
                                            <button className="marriage-action-btn">Details</button>
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
export default MarriageCertificate;