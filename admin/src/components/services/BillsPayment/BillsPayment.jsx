import React, { useState } from 'react';
import Sidebar from '../../sidebar/sidebar';
import { Plus, Receipt, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import './BillsPayment.css';

const BillsPayment = () => {
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

    const stats = [
        { label: 'Total Transactions', value: '2,300', icon: <Receipt size={24}/> },
        { label: 'Pending Process', value: '4', icon: <Clock size={24}/> },
        { label: 'Successful', value: '2,290', icon: <CheckCircle size={24}/> },
        { label: 'Failed', value: '6', icon: <AlertTriangle size={24}/> },
    ];

    const data = [
        { id: 'BP-1001', client: 'Wanderwave Office', biller: 'Meralco', acctNo: '1234567890', amount: '₱15,000.00', dueDate: 'Nov 30, 2025', status: 'Paid' },
        { id: 'BP-1002', client: 'Client: Juan', biller: 'PLDT', acctNo: '0288881234', amount: '₱1,699.00', dueDate: 'Dec 05, 2025', status: 'Unpaid' },
    ];

    return (
        <div className="bills-page">
            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={() => setSidebarCollapsed(!isSidebarCollapsed)} />
            <main className={`bills-main ${isSidebarCollapsed ? 'expanded' : ''}`}>
                <div className="bills-container">
                    <div className="bills-header">
                        <div className="bills-title">
                            <h1>Bills Payment</h1>
                            <p>Utilities, Telecom, and Government Fees</p>
                        </div>
                        <button className="bills-btn-add"><Plus size={18} style={{marginRight:'8px'}}/> Pay Bill</button>
                    </div>

                    <div className="bills-stats-grid">
                        {stats.map((s, i) => (
                            <div className="bills-card" key={i}>
                                <div><h2>{s.value}</h2><span>{s.label}</span></div>
                                <div className="bills-card-icon">{s.icon}</div>
                            </div>
                        ))}
                    </div>

                    <div className="bills-table-container">
                        <table className="bills-table">
                            <thead>
                                <tr>
                                    <th>Trans ID</th>
                                    <th>Client/Ref</th>
                                    <th>Biller</th>
                                    <th>Account No.</th>
                                    <th>Amount</th>
                                    <th>Due Date</th>
                                    <th>Status</th>
                                    <th style={{textAlign:'right'}}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((item) => (
                                    <tr key={item.id}>
                                        <td style={{fontWeight:'700', color:'#0f172a'}}>{item.id}</td>
                                        <td>{item.client}</td>
                                        <td style={{fontWeight:'700'}}>{item.biller}</td>
                                        <td style={{fontFamily:'monospace'}}>{item.acctNo}</td>
                                        <td style={{fontWeight:'700', color:'#10b981'}}>{item.amount}</td>
                                        <td>{item.dueDate}</td>
                                        <td><span className={`status-pill status-${item.status.toLowerCase()}`}>{item.status}</span></td>
                                        <td style={{textAlign:'right'}}>
                                            <button className="bills-action-btn">Receipt</button>
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
export default BillsPayment;