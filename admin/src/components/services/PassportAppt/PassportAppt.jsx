import React, { useState } from 'react';
import Sidebar from '../../sidebar/sidebar';
import { Plus, BookOpen, Calendar, CheckCircle, RotateCcw } from 'lucide-react';
import './PassportAppt.css';

const PassportAppt = () => {
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

    const stats = [
        { label: 'Appointments', value: '120', icon: <BookOpen size={24}/> },
        { label: 'This Week', value: '8', icon: <Calendar size={24}/> },
        { label: 'Confirmed', value: '110', icon: <CheckCircle size={24}/> },
        { label: 'Rescheduled', value: '2', icon: <RotateCcw size={24}/> },
    ];

    const data = [
        { id: 'PPT-88', client: 'Bea Alonzo', type: 'Renewal', site: 'DFA Aseana', date: 'Dec 10, 2025', time: '10:00 AM', status: 'Confirmed' },
        { id: 'PPT-89', client: 'John Lloyd', type: 'New', site: 'DFA Megamall', date: 'Dec 12, 2025', time: '02:00 PM', status: 'Pending' },
    ];

    return (
        <div className="passport-page">
            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={() => setSidebarCollapsed(!isSidebarCollapsed)} />
            <main className={`passport-main ${isSidebarCollapsed ? 'expanded' : ''}`}>
                <div className="passport-container">
                    <div className="passport-header">
                        <div className="passport-title">
                            <h1>Passport Appointment</h1>
                            <p>DFA Slot Management & Assistance</p>
                        </div>
                        <button className="passport-btn-add"><Plus size={18} style={{marginRight:'8px'}}/> Set Appointment</button>
                    </div>

                    <div className="passport-stats-grid">
                        {stats.map((s, i) => (
                            <div className="passport-card" key={i}>
                                <div><h2>{s.value}</h2><span>{s.label}</span></div>
                                <div className="passport-card-icon">{s.icon}</div>
                            </div>
                        ))}
                    </div>

                    <div className="passport-table-container">
                        <table className="passport-table">
                            <thead>
                                <tr>
                                    <th>Appt ID</th>
                                    <th>Applicant</th>
                                    <th>Type</th>
                                    <th>DFA Site</th>
                                    <th>Date & Time</th>
                                    <th>Status</th>
                                    <th style={{textAlign:'right'}}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((item) => (
                                    <tr key={item.id}>
                                        <td style={{fontWeight:'700', color:'#0f172a'}}>{item.id}</td>
                                        <td>{item.client}</td>
                                        <td>{item.type}</td>
                                        <td>{item.site}</td>
                                        <td>{item.date} <br/><span style={{fontSize:'12px', color:'#64748b'}}>{item.time}</span></td>
                                        <td><span style={{background:'#dcfce7', color:'#166534', padding:'4px 10px', borderRadius:'6px', fontSize:'11px', fontWeight:'700', textTransform:'uppercase'}}>{item.status}</span></td>
                                        <td style={{textAlign:'right'}}>
                                            <button className="passport-action-btn">View</button>
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
export default PassportAppt;