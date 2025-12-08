import React, { useState } from 'react';
import Sidebar from '../../sidebar/sidebar';
import { Plus, Palmtree, Map, Users, CheckSquare } from 'lucide-react';
import './TourArrangements.css';

const TourArrangements = () => {
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

    const stats = [
        { label: 'Active Tours', value: '5', icon: <Palmtree size={24}/> },
        { label: 'Upcoming', value: '3', icon: <Map size={24}/> },
        { label: 'Completed', value: '89', icon: <CheckSquare size={24}/> },
        { label: 'Inquiries', value: '12', icon: <Users size={24}/> },
    ];

    const data = [
        { id: 'TR-55', client: 'Family Cruz', package: 'El Nido Island Hopping', pax: '5 Adults, 2 Kids', travelDate: 'Jan 15-18, 2026', status: 'Confirmed' },
    ];

    return (
        <div className="tour-page">
            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={() => setSidebarCollapsed(!isSidebarCollapsed)} />
            <main className={`tour-main ${isSidebarCollapsed ? 'expanded' : ''}`}>
                <div className="tour-container">
                    <div className="tour-header">
                        <div className="tour-title">
                            <h1>Tour Packages</h1>
                            <p>Customized itineraries and travel arrangements</p>
                        </div>
                        <button className="tour-btn-add"><Plus size={18} style={{marginRight:'8px'}}/> Create Package</button>
                    </div>

                    <div className="tour-stats-grid">
                        {stats.map((s, i) => (
                            <div className="tour-card" key={i}>
                                <div><h2>{s.value}</h2><span>{s.label}</span></div>
                                <div className="tour-card-icon">{s.icon}</div>
                            </div>
                        ))}
                    </div>

                    <div className="tour-table-container">
                        <table className="tour-table">
                            <thead>
                                <tr>
                                    <th>Tour ID</th>
                                    <th>Lead Guest</th>
                                    <th>Package Name</th>
                                    <th>Pax</th>
                                    <th>Travel Dates</th>
                                    <th>Status</th>
                                    <th style={{textAlign:'right'}}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((row) => (
                                    <tr key={row.id}>
                                        <td style={{fontWeight:'700', color:'#0f172a'}}>{row.id}</td>
                                        <td>{row.client}</td>
                                        <td>{row.package}</td>
                                        <td>{row.pax}</td>
                                        <td>{row.travelDate}</td>
                                        <td><span style={{background:'#dcfce7', color:'#166534', padding:'4px 10px', borderRadius:'6px', fontSize:'11px', fontWeight:'700', textTransform:'uppercase'}}>{row.status}</span></td>
                                        <td style={{textAlign:'right'}}>
                                            <button className="tour-action-btn">View</button>
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
export default TourArrangements;