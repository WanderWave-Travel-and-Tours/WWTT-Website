import React, { useState } from 'react';
import Sidebar from '../../sidebar/sidebar';
import { Plus, Plane, Calendar, Tag, AlertCircle } from 'lucide-react';
import './AirlineBooking.css';

const AirlineBooking = () => {
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

    const stats = [
        { label: 'Total Flights', value: '850', icon: <Plane size={24}/> },
        { label: 'Upcoming', value: '24', icon: <Calendar size={24}/> },
        { label: 'Issued Tickets', value: '810', icon: <Tag size={24}/> },
        { label: 'Cancelled', value: '16', icon: <AlertCircle size={24}/> },
    ];

    const bookings = [
        { id: 'FL-202', client: 'Sarah Geronimo', airline: 'Cebu Pacific', route: 'MNL ➝ CEB', flightDate: 'Dec 15, 2025', status: 'Issued' },
        { id: 'FL-203', client: 'Bamboo Manalac', airline: 'PAL', route: 'MNL ➝ LAX', flightDate: 'Jan 10, 2026', status: 'Pending' },
        { id: 'FL-204', client: 'Regine V.', airline: 'AirAsia', route: 'DVO ➝ MNL', flightDate: 'Nov 30, 2025', status: 'Cancelled' },
    ];

    return (
        <div className="airline-page">
            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={() => setSidebarCollapsed(!isSidebarCollapsed)} />
            <main className={`airline-main ${isSidebarCollapsed ? 'expanded' : ''}`}>
                <div className="airline-container">
                    <div className="airline-header">
                        <div className="airline-title">
                            <h1>Airline Ticketing</h1>
                            <p>Domestic and international flight booking management.</p>
                        </div>
                        <button className="airline-btn-add"><Plus size={18} style={{marginRight:'8px'}}/> Book Flight</button>
                    </div>

                    <div className="airline-stats-grid">
                        {stats.map((s, i) => (
                            <div className="airline-card" key={i}>
                                <div><h2>{s.value}</h2><span>{s.label}</span></div>
                                <div className="airline-card-icon">{s.icon}</div>
                            </div>
                        ))}
                    </div>

                    <div className="airline-table-container">
                        <table className="airline-table">
                            <thead>
                                <tr>
                                    <th>Booking Ref</th>
                                    <th>Passenger</th>
                                    <th>Airline</th>
                                    <th>Route</th>
                                    <th>Flight Date</th>
                                    <th>Status</th>
                                    <th style={{textAlign:'right'}}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bookings.map((bk) => (
                                    <tr key={bk.id}>
                                        <td style={{ fontWeight: '700', color: '#0f172a' }}>{bk.id}</td>
                                        <td>{bk.client}</td>
                                        <td>{bk.airline}</td>
                                        <td style={{ fontFamily: 'monospace', fontSize: '13px' }}>{bk.route}</td>
                                        <td>{bk.flightDate}</td>
                                        <td>
                                            <span className={`status-pill status-${bk.status.toLowerCase()}`}>
                                                {bk.status}
                                            </span>
                                        </td>
                                        <td style={{textAlign:'right'}}>
                                            <button className="airline-action-btn">View Ticket</button>
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
export default AirlineBooking;