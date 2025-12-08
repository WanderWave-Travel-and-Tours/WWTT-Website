import React, { useState } from 'react';
import Sidebar from '../../sidebar/sidebar';
import { Plus, Hotel, CalendarCheck, XCircle, Bed } from 'lucide-react';
import './HotelBooking.css';

const HotelBooking = () => {
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

    const stats = [
        { label: 'Room Reservations', value: '342', icon: <Hotel size={24}/> },
        { label: 'Check-ins Today', value: '8', icon: <Bed size={24}/> },
        { label: 'Confirmed', value: '310', icon: <CalendarCheck size={24}/> },
        { label: 'Cancelled', value: '24', icon: <XCircle size={24}/> },
    ];

    const reservations = [
        { id: 'HTL-55', client: 'Coco Martin', hotel: 'Henann Resort', location: 'Boracay', dates: 'Dec 20 - Dec 25', status: 'Confirmed' },
        { id: 'HTL-56', client: 'Vice Ganda', hotel: 'Okada Manila', location: 'Manila', dates: 'Dec 31 - Jan 02', status: 'Pending' },
    ];

    return (
        <div className="hotel-page">
            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={() => setSidebarCollapsed(!isSidebarCollapsed)} />
            <main className={`hotel-main ${isSidebarCollapsed ? 'expanded' : ''}`}>
                <div className="hotel-container">
                    <div className="hotel-header">
                        <div className="hotel-title">
                            <h1>Hotel Reservations</h1>
                            <p>Manage hotel inventory and guest bookings</p>
                        </div>
                        <button className="hotel-btn-add"><Plus size={18} style={{marginRight:'8px'}}/> New Reservation</button>
                    </div>

                    <div className="hotel-stats-grid">
                        {stats.map((s, i) => (
                            <div className="hotel-card" key={i}>
                                <div><h2>{s.value}</h2><span>{s.label}</span></div>
                                <div className="hotel-card-icon">{s.icon}</div>
                            </div>
                        ))}
                    </div>

                    <div className="hotel-table-container">
                        <table className="hotel-table">
                            <thead>
                                <tr>
                                    <th>Resv ID</th>
                                    <th>Guest Name</th>
                                    <th>Hotel / Resort</th>
                                    <th>Travel Dates</th>
                                    <th>Status</th>
                                    <th style={{textAlign:'right'}}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reservations.map((res) => (
                                    <tr key={res.id}>
                                        <td style={{fontWeight:'700', color:'#0f172a'}}>{res.id}</td>
                                        <td>{res.client}</td>
                                        <td>{res.hotel} <span style={{color:'#64748b', fontSize:'12px'}}>({res.location})</span></td>
                                        <td>{res.dates}</td>
                                        <td><span className={`hotel-badge status-${res.status === 'Confirmed' ? 'active' : 'pending'}`}>{res.status}</span></td>
                                        <td style={{textAlign:'right'}}>
                                            <button className="hotel-action-btn">View Details</button>
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
export default HotelBooking;