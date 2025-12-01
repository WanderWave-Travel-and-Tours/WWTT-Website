import React, { useState } from 'react';
import Sidebar from '../../sidebar/sidebar';
import { Anchor, Ship, Calendar, Ticket, Plus } from 'lucide-react';
import './FerryBooking.css';

const FerryBooking = () => {
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

    const stats = [
        { label: 'Total Bookings', value: '67', icon: <Ship size={24}/> },
        { label: 'Departing Today', value: '4', icon: <Calendar size={24}/> },
        { label: 'Tickets Issued', value: '60', icon: <Ticket size={24}/> },
        { label: 'Cancellations', value: '1', icon: <Anchor size={24}/> },
    ];

    const bookings = [
        { id: 'FRY-21', client: 'Pedro Penduko', vessel: '2GO Travel', route: 'MNL - CEB', class: 'Tourist', date: 'Dec 18, 2025', status: 'Issued' },
        { id: 'FRY-22', client: 'Juan Tamad', vessel: 'OceanJet', route: 'CEB - TAG', class: 'Open Air', date: 'Dec 19, 2025', status: 'Pending' },
    ];

    return (
        <div className="ferry-page">
            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={() => setSidebarCollapsed(!isSidebarCollapsed)} />
            <main className={`ferry-main ${isSidebarCollapsed ? 'expanded' : ''}`}>
                <div className="ferry-header">
                    <div className="ferry-title">
                        <h1>Ferry Booking</h1>
                        <p>Inter-island vessel schedules and ticketing.</p>
                    </div>
                    <button className="ferry-btn-add"><Plus size={18} style={{marginRight:'8px'}}/> Book Ferry</button>
                </div>

                <div className="ferry-stats-grid">
                    {stats.map((stat, i) => (
                        <div className="ferry-card" key={i}>
                            <div>
                                <h2>{stat.value}</h2>
                                <span>{stat.label}</span>
                            </div>
                            <div className="ferry-card-icon">{stat.icon}</div>
                        </div>
                    ))}
                </div>

                <div className="ferry-table-container">
                    <table className="ferry-table">
                        <thead>
                            <tr>
                                <th>Ticket ID</th>
                                <th>Passenger</th>
                                <th>Vessel Line</th>
                                <th>Route</th>
                                <th>Class</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookings.map((item) => (
                                <tr key={item.id}>
                                    <td style={{fontWeight:'700'}}>{item.id}</td>
                                    <td>{item.client}</td>
                                    <td>{item.vessel}</td>
                                    <td style={{fontFamily:'monospace'}}>{item.route}</td>
                                    <td>{item.class}</td>
                                    <td>{item.date}</td>
                                    <td><span className={`status-pill status-${item.status.toLowerCase()}`}>{item.status}</span></td>
                                    <td><button className="ferry-action-btn">View</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
};
export default FerryBooking;