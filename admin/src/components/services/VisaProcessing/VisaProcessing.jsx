import React, { useState } from 'react';
import Sidebar from '../../sidebar/sidebar';
import { Plus, FolderOpen, Clock, CheckCircle, RefreshCw } from 'lucide-react';
import './VisaProcessing.css';

const VisaProcessing = () => {
    // Note: Assuming Sidebar component handles its own collapse state internally 
    // or passes it up. If Sidebar is fixed, we just toggle margin here.
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

    const stats = [
        { label: 'Total Applications', value: '1,240', icon: <FolderOpen size={24} /> },
        { label: 'Pending Review', value: '15', icon: <Clock size={24} /> },
        { label: 'Visas Approved', value: '1,180', icon: <CheckCircle size={24} /> },
        { label: 'In Processing', value: '45', icon: <RefreshCw size={24} /> },
    ];

    const applications = [
        { id: 'VISA-101', client: 'Juan Dela Cruz', country: 'Japan 🇯🇵', type: 'Tourist Visa', date: 'Nov 20, 2025', status: 'Pending' },
        { id: 'VISA-102', client: 'Maria Clara', country: 'USA 🇺🇸', type: 'F1 Student', date: 'Nov 18, 2025', status: 'Approved' },
        { id: 'VISA-103', client: 'Jose Rizal', country: 'Spain 🇪🇸', type: 'Work Visa', date: 'Nov 19, 2025', status: 'Process' },
    ];

    return (
        <div className="visa-page">
            {/* Sidebar is Fixed */}
            <Sidebar 
                isCollapsed={isSidebarCollapsed} 
                toggleSidebar={() => setSidebarCollapsed(!isSidebarCollapsed)} 
            />
            
            {/* Main Content Scrolls Independently */}
            <main className={`visa-main ${isSidebarCollapsed ? 'expanded' : ''}`}>
                <div className="visa-container">
                    <div className="visa-header">
                        <div className="visa-title">
                            <h1>Visa Processing</h1>
                            <p>Managing {applications.length} active applications</p>
                        </div>
                        <button className="visa-btn-add">
                            <Plus size={18} /> Add New Visa
                        </button>
                    </div>

                    <div className="visa-stats-grid">
                        {stats.map((stat, index) => (
                            <div className="visa-card" key={index}>
                                <div className="visa-card-content">
                                    <h2>{stat.value}</h2>
                                    <span>{stat.label}</span>
                                </div>
                                <div className="visa-card-icon">{stat.icon}</div>
                            </div>
                        ))}
                    </div>

                    <div className="visa-table-container">
                        <table className="visa-table">
                            <thead>
                                <tr>
                                    <th>Ref ID</th>
                                    <th>Applicant</th>
                                    <th>Country</th>
                                    <th>Visa Type</th>
                                    <th>Date Received</th>
                                    <th>Status</th>
                                    <th style={{textAlign:'right'}}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {applications.map((app) => (
                                    <tr key={app.id}>
                                        <td style={{fontWeight:'700', color:'#0f172a'}}>{app.id}</td>
                                        <td>{app.client}</td>
                                        <td>{app.country}</td>
                                        <td>{app.type}</td>
                                        <td>{app.date}</td>
                                        <td>
                                            <span className={`visa-badge badge-${app.status.toLowerCase()}`}>
                                                {app.status}
                                            </span>
                                        </td>
                                        <td style={{textAlign:'right'}}>
                                            <button className="visa-action-btn visa-view-btn">View</button>
                                            <button className="visa-action-btn">Delete</button>
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

export default VisaProcessing;