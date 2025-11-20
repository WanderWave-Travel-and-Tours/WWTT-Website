import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../sidebar/sidebar';
import './servicemanagement.css';

const ServiceManagement = () => {
    const location = useLocation();
    const [serviceType, setServiceType] = useState('');
    const [pageData, setPageData] = useState({ title: '', emoji: '', description: '' });

    useEffect(() => {
        const path = location.pathname;
        
        if (path.includes('visa')) {
            setServiceType('VISA');
            setPageData({ 
                title: 'Visa Processing', 
                emoji: '🛂', 
                description: 'Manage tourist, student, and work visa applications.' 
            });
        } else if (path.includes('psa')) {
            setServiceType('PSA');
            setPageData({ 
                title: 'PSA Serbilis', 
                emoji: '📄', 
                description: 'Track birth, marriage, and death certificate requests.' 
            });
        } else if (path.includes('cenomar')) {
            setServiceType('CENOMAR');
            setPageData({ 
                title: 'CENOMAR Request', 
                emoji: '💍', 
                description: 'Certificate of No Marriage application management.' 
            });
        } else if (path.includes('passport')) {
            setServiceType('PASSPORT');
            setPageData({ 
                title: 'Passport Appointment', 
                emoji: '📘', 
                description: 'Schedule and manage DFA passport appointments.' 
            });
        }
    }, [location]);

    const mockApplications = [
        { id: 1, client: 'Juan Dela Cruz', type: 'New Application', status: 'Pending', date: '2025-11-20' },
        { id: 2, client: 'Maria Clara', type: 'Renewal', status: 'Completed', date: '2025-11-18' },
        { id: 3, client: 'Jose Rizal', type: 'Rush', status: 'In Process', date: '2025-11-19' },
    ];

    return (
        <div className="admin-layout">
            <Sidebar />

            <div className="service-content">
                <div className="service-header">
                    <h1>{pageData.emoji} {pageData.title}</h1>
                    <button className="add-new-btn">➕ New {serviceType} Request</button>
                </div>
                
                <p className="service-description">{pageData.description}</p>

                <div className="stats-container">
                    <div className="stat-card">
                        <h3>Total Requests</h3>
                        <p>1,240</p>
                    </div>
                    <div className="stat-card">
                        <h3>Pending</h3>
                        <p style={{color: 'orange'}}>15</p>
                    </div>
                    <div className="stat-card">
                        <h3>Completed</h3>
                        <p style={{color: 'green'}}>1,180</p>
                    </div>
                </div>

                <div className="table-container">
                    <h3>Recent {pageData.title} Requests</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Client Name</th>
                                <th>Request Type</th>
                                <th>Date Received</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mockApplications.map((app) => (
                                <tr key={app.id}>
                                    <td>#{app.id}</td>
                                    <td style={{fontWeight: 'bold'}}>{app.client}</td>
                                    <td>{app.type}</td>
                                    <td>{app.date}</td>
                                    <td>
                                        <span className={`status-badge ${app.status.toLowerCase().replace(' ', '-')}`}>
                                            {app.status}
                                        </span>
                                    </td>
                                    <td>
                                        <button className="action-btn">View</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ServiceManagement;