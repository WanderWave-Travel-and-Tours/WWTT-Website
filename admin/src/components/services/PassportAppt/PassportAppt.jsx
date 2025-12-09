import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../../sidebar/sidebar';
import { 
    BookOpen, Calendar, CheckCircle, RotateCcw, 
    FileText, Settings, RefreshCw, X, CreditCard, User 
} from 'lucide-react';
import './PassportAppt.css';

const PassportAppt = () => {
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
    
    // Data States
    const [appointments, setAppointments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Modal States
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [documents, setDocuments] = useState([]); // Para sa uploaded docs kung meron

    // 1. Fetch Inquiries (GAYA NG SA VISA PROCESSING - Client Side Filter)
    const fetchInquiries = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get('http://localhost:5000/api/inquiries');
            
            if (response.data.success) {
                // DITO YUNG LOGIC NA KATULAD SA VISA: Filter sa frontend
                const passportRequests = response.data.data.filter(inq => 
                    inq.inquiryType === 'PASSPORT' || 
                    (inq.serviceName && inq.serviceName.toUpperCase().includes('PASSPORT'))
                );
                
                // Sort by date (newest first)
                passportRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                
                setAppointments(passportRequests);
                console.log('✅ Passport Appointments loaded:', passportRequests.length);
            }
        } catch (error) {
            console.error('Error fetching inquiries:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // 2. Fetch Documents (Gaya sa Visa)
    const fetchDocuments = async (inquiryId) => {
        try {
            const response = await axios.get(`http://localhost:5000/api/documents/inquiry/${inquiryId}`);
            if (response.data.success) {
                setDocuments(response.data.documents || []);
            }
        } catch (error) {
            console.error('Error fetching documents:', error);
            setDocuments([]);
        }
    };

    useEffect(() => {
        fetchInquiries();
    }, []);

    // 3. Status Update Logic (Gaya sa Visa)
    const handleUpdateStatus = async (id, newStatus) => {
        try {
            const response = await axios.put(
                `http://localhost:5000/api/inquiries/${id}/status`,
                { status: newStatus }
            );

            if (response.data.success) {
                alert(`Status updated to ${newStatus}`);
                fetchInquiries(); // Refresh list
                
                // Update local modal state if open
                if (selectedAppointment && selectedAppointment._id === id) {
                    setSelectedAppointment({ ...selectedAppointment, status: newStatus });
                }
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status');
        }
    };

    const handleViewAppointment = async (appt) => {
        setSelectedAppointment(appt);
        await fetchDocuments(appt._id);
        setIsViewModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsViewModalOpen(false);
        setSelectedAppointment(null);
        setDocuments([]);
    };

    // Helper for Status Colors
    const getStatusBadgeClass = (status) => {
        switch(status) {
            case 'PAID': return 'badge-paid'; // Need sa CSS
            case 'COMPLETED': return 'badge-completed';
            case 'CANCELLED': return 'badge-cancelled';
            case 'CONTACTED': return 'badge-contacted';
            case 'PAYMENT_PENDING': return 'badge-payment-pending';
            default: return 'badge-pending';
        }
    };

    // Stats Calculation
    const stats = [
        { label: 'Total Appointments', value: appointments.length, icon: <BookOpen size={24}/> },
        { label: 'Pending', value: appointments.filter(a => a.status === 'PENDING').length, icon: <Calendar size={24}/> },
        { label: 'Completed', value: appointments.filter(a => a.status === 'COMPLETED').length, icon: <CheckCircle size={24}/> },
        { label: 'Cancelled', value: appointments.filter(a => a.status === 'CANCELLED').length, icon: <RotateCcw size={24}/> },
    ];

    return (
        <div className="passport-page">
            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={() => setSidebarCollapsed(!isSidebarCollapsed)} />
            <main className={`passport-main ${isSidebarCollapsed ? 'expanded' : ''}`}>
                <div className="passport-container">
                    
                    {/* Header */}
                    <div className="passport-header">
                        <div className="passport-title">
                            <h1>Passport Appointment</h1>
                            <p>DFA Slot Management & Assistance</p>
                        </div>
                        <button onClick={fetchInquiries} className="passport-btn-refresh" style={{display:'flex', alignItems:'center', gap:'8px', background:'white', border:'1px solid #e2e8f0', padding:'8px 16px', borderRadius:'8px', cursor:'pointer'}}>
                            <RefreshCw size={16}/> Refresh List
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="passport-stats-grid">
                        {stats.map((s, i) => (
                            <div className="passport-card" key={i}>
                                <div><h2>{s.value}</h2><span>{s.label}</span></div>
                                <div className="passport-card-icon">{s.icon}</div>
                            </div>
                        ))}
                    </div>

                    {/* Table */}
                    <div className="passport-table-container">
                        {isLoading ? (
                            <div style={{padding:'40px', textAlign:'center', color:'#64748b'}}>Loading appointments...</div>
                        ) : (
                            <table className="passport-table">
                                <thead>
                                    <tr>
                                        <th>Ref ID</th>
                                        <th>Applicant</th>
                                        <th>Type</th>
                                        <th>DFA Site</th>
                                        <th>Target Date</th>
                                        <th>Status</th>
                                        <th style={{textAlign:'right'}}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {appointments.length > 0 ? appointments.map((item) => (
                                        <tr key={item._id}>
                                            <td style={{fontWeight:'700', color:'#0f172a'}}>
                                                {item._id.substring(item._id.length - 6).toUpperCase()}
                                            </td>
                                            <td>
                                                <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                                                    <div style={{background:'#eff6ff', padding:'8px', borderRadius:'50%', color:'#3b82f6'}}><User size={16}/></div>
                                                    <div>
                                                        {item.fullName}
                                                        <br/><span style={{fontSize:'11px', color:'#94a3b8'}}>{item.email}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                {item.passportDetails?.applicationType || 'NEW'}
                                                <br/><span style={{fontSize:'11px', color:'#64748b'}}>{item.passportDetails?.processingType || 'REGULAR'}</span>
                                            </td>
                                            <td>
                                                {item.passportDetails?.dfaLocation || 'TBD'}
                                            </td>
                                            <td>
                                                {item.passportDetails?.appointmentDate || 'TBD'}
                                            </td>
                                            <td>
                                                <span className={`visa-badge ${getStatusBadgeClass(item.status)}`} style={{padding:'4px 10px', borderRadius:'6px', fontSize:'11px', fontWeight:'700', textTransform:'uppercase'}}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td style={{textAlign:'right'}}>
                                                <button 
                                                    className="passport-action-btn" 
                                                    onClick={() => handleViewAppointment(item)}
                                                >
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="7" style={{textAlign:'center', padding:'30px', color:'#64748b'}}>
                                                No Passport appointments found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </main>

            {/* VIEW MODAL (Ginaya sa VisaProcessing) */}
            {isViewModalOpen && selectedAppointment && (
                <div className="modal-overlay" onClick={(e) => { if(e.target.className === 'modal-overlay') handleCloseModal() }}>
                    <div className="modal-content modal-content-large">
                        <div className="modal-header">
                            <div>
                                <h2 style={{margin: 0, fontSize: "20px", fontWeight: 800, color: "#0f172a"}}>APPOINTMENT DETAILS</h2>
                                <p style={{margin: "4px 0 0 0", color: "#64748b", fontSize: "13px"}}>
                                    Ref: {selectedAppointment._id.toUpperCase()}
                                </p>
                            </div>
                            <button className="modal-close-btn" onClick={handleCloseModal}><X size={24} /></button>
                        </div>

                        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                            {/* Client Info Grid */}
                            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', marginBottom: '20px', border:'1px solid #e2e8f0' }}>
                                <h3 style={{fontSize:'14px', fontWeight:'700', marginBottom:'15px', color:'#334155'}}>CLIENT INFORMATION</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div>
                                        <label style={{fontSize:'11px', color:'#64748b', fontWeight:'600'}}>FULL NAME</label>
                                        <p style={{margin:'4px 0 0', fontWeight:'600', color:'#0f172a'}}>{selectedAppointment.fullName}</p>
                                    </div>
                                    <div>
                                        <label style={{fontSize:'11px', color:'#64748b', fontWeight:'600'}}>EMAIL ADDRESS</label>
                                        <p style={{margin:'4px 0 0', fontWeight:'600', color:'#0f172a'}}>{selectedAppointment.email}</p>
                                    </div>
                                    <div>
                                        <label style={{fontSize:'11px', color:'#64748b', fontWeight:'600'}}>CONTACT NUMBER</label>
                                        <p style={{margin:'4px 0 0', fontWeight:'600', color:'#0f172a'}}>{selectedAppointment.contactNumber || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label style={{fontSize:'11px', color:'#64748b', fontWeight:'600'}}>ESTIMATED FEE</label>
                                        <p style={{margin:'4px 0 0', fontWeight:'600', color:'#059669'}}>₱{selectedAppointment.estimatedPrice?.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Passport Specific Details */}
                            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', marginBottom: '20px', border:'1px solid #e2e8f0' }}>
                                <h3 style={{fontSize:'14px', fontWeight:'700', marginBottom:'15px', color:'#334155'}}>PASSPORT DETAILS</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                                    <div>
                                        <label style={{fontSize:'11px', color:'#64748b', fontWeight:'600'}}>APPLICATION TYPE</label>
                                        <div style={{marginTop:'5px', display:'inline-block', padding:'4px 12px', background:'white', border:'1px solid #cbd5e1', borderRadius:'6px', fontSize:'13px', fontWeight:'600'}}>
                                            {selectedAppointment.passportDetails?.applicationType || 'NEW'}
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{fontSize:'11px', color:'#64748b', fontWeight:'600'}}>PROCESSING</label>
                                        <div style={{marginTop:'5px', display:'inline-block', padding:'4px 12px', background:'white', border:'1px solid #cbd5e1', borderRadius:'6px', fontSize:'13px', fontWeight:'600'}}>
                                            {selectedAppointment.passportDetails?.processingType || 'REGULAR'}
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{fontSize:'11px', color:'#64748b', fontWeight:'600'}}>DFA SITE</label>
                                        <p style={{margin:'4px 0 0', fontWeight:'600', color:'#0f172a'}}>{selectedAppointment.passportDetails?.dfaLocation || 'To be assigned'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Actions / Status Update */}
                            <div style={{marginTop: '20px'}}>
                                <h3 style={{fontSize:'14px', fontWeight:'700', marginBottom:'15px', color:'#334155'}}>UPDATE STATUS</h3>
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                    <button 
                                        className="passport-action-btn" 
                                        style={{background:'#f1f5f9', color:'#475569', border:'1px solid #cbd5e1'}}
                                        onClick={() => handleUpdateStatus(selectedAppointment._id, 'PENDING')}
                                    >
                                        Set Pending
                                    </button>
                                    <button 
                                        className="passport-action-btn" 
                                        style={{background:'#e0f2fe', color:'#0369a1', border:'1px solid #bae6fd'}}
                                        onClick={() => handleUpdateStatus(selectedAppointment._id, 'CONTACTED')}
                                    >
                                        Set Contacted
                                    </button>
                                    <button 
                                        className="passport-action-btn"
                                        style={{background:'#dcfce7', color:'#15803d', border:'1px solid #86efac', display:'flex', alignItems:'center', gap:'5px'}}
                                        onClick={() => handleUpdateStatus(selectedAppointment._id, 'PAYMENT_PENDING')}
                                    >
                                        <CreditCard size={14}/> Approve & Payment
                                    </button>
                                    <button 
                                        className="passport-action-btn" 
                                        style={{background:'#3b82f6', color:'white', border:'none'}}
                                        onClick={() => handleUpdateStatus(selectedAppointment._id, 'COMPLETED')}
                                    >
                                        Mark Completed
                                    </button>
                                    <button 
                                        className="passport-action-btn" 
                                        style={{background:'#ef4444', color:'white', border:'none'}}
                                        onClick={() => handleUpdateStatus(selectedAppointment._id, 'CANCELLED')}
                                    >
                                        Cancel Appt
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="passport-action-btn" onClick={handleCloseModal}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PassportAppt;