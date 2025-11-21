import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../sidebar/sidebar';
import './ServiceManagement.css';

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
        <div className="svc-page">
            <Sidebar />
            <main className="svc-main">
                <div className="svc-container">
                    <header className="svc-header">
                        <div className="svc-header-left">
                            <h1 className="svc-title">{pageData.title.toUpperCase()}</h1>
                            <p className="svc-subtitle">{pageData.description}</p>
                        </div>
                        <button className="svc-btn svc-btn--add">
                            + New {serviceType} Request
                        </button>
                    </header>

                    <div className="svc-stats">
                        <div className="svc-stat">
                            <span className="svc-stat-icon">📊</span>
                            <div className="svc-stat-content">
                                <strong>1,240</strong>
                                <span>Total Requests</span>
                            </div>
                        </div>
                        <div className="svc-stat">
                            <span className="svc-stat-icon">⏳</span>
                            <div className="svc-stat-content">
                                <strong className="svc-stat--pending">15</strong>
                                <span>Pending</span>
                            </div>
                        </div>
                        <div className="svc-stat">
                            <span className="svc-stat-icon">✅</span>
                            <div className="svc-stat-content">
                                <strong className="svc-stat--completed">1,180</strong>
                                <span>Completed</span>
                            </div>
                        </div>
                        <div className="svc-stat">
                            <span className="svc-stat-icon">🔄</span>
                            <div className="svc-stat-content">
                                <strong className="svc-stat--process">45</strong>
                                <span>In Process</span>
                            </div>
                        </div>
                    </div>

                    <div className="svc-table-section">
                        <div className="svc-table-header">
                            <h2 className="svc-table-title">RECENT REQUESTS</h2>
                            <span className="svc-table-badge">{mockApplications.length} entries</span>
                        </div>
                        
                        <div className="svc-table-wrapper">
                            <table className="svc-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>CLIENT NAME</th>
                                        <th>REQUEST TYPE</th>
                                        <th>DATE RECEIVED</th>
                                        <th>STATUS</th>
                                        <th>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {mockApplications.map((app) => (
                                        <tr key={app.id}>
                                            <td>
                                                <span className="svc-id">#{app.id}</span>
                                            </td>
                                            <td>
                                                <span className="svc-client">{app.client}</span>
                                            </td>
                                            <td>
                                                <span className="svc-type">{app.type}</span>
                                            </td>
                                            <td>
                                                <div className="svc-date">
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                                        <line x1="16" y1="2" x2="16" y2="6"/>
                                                        <line x1="8" y1="2" x2="8" y2="6"/>
                                                        <line x1="3" y1="10" x2="21" y2="10"/>
                                                    </svg>
                                                    <span>{app.date}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`svc-status svc-status--${app.status.toLowerCase().replace(' ', '-')}`}>
                                                    {app.status}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="svc-actions">
                                                    <button className="svc-action-btn svc-action-btn--view">
                                                        View
                                                    </button>
                                                    <button className="svc-action-btn svc-action-btn--edit">
                                                        Edit
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ServiceManagement;