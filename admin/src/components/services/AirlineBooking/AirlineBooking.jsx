// AirlineBooking.jsx
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Sidebar from '../../sidebar/sidebar';
import { 
    Plus, Plane, Calendar, Tag, AlertCircle, X, Eye, 
    CreditCard, ChevronLeft, ChevronRight, Search,
    UserPlus, Mail, Clock, CheckCircle, Archive, Filter, ChevronDown 
} from 'lucide-react';

import './AirlineBooking.css'; 
import AirlineApplicationModal from './AirlineApplicationModal'; 
import { AirlineInquiryModal, AirlineContactRemarksModal } from './AirlineModals'; 

// ── Toast & Confirmation Imports ────────────────────────────────────────
import { useToast } from '../../toast/ToastManager'; // Adjust path if needed
import CustomConfirmModal from '../../../components/confirmationModal/CustomConfirmModal';

const AirlineBooking = () => {
    const { success, error, warning, info } = useToast();

    const [isSidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth <= 1024);
    const [bookings, setBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    
    // Contact/Report Modal States
    const [showContactRemarks, setShowContactRemarks] = useState(false);
    const [contactRemarks, setContactRemarks] = useState("");
    const [contactEvidence, setContactEvidence] = useState(null);

    // Confirmation Modal States
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'primary', // 'primary' | 'danger'
        onConfirm: () => {},
        onCancel: () => {}
    });

    // Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // ── Helper: Get Admin Data for Activity Logs ────────────────────────────
    const getAdminData = () => {
        try {
            const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
            return {
                userEmail: adminData.email || adminData.username || adminData.user || 'Unknown Admin',
                adminId: adminData.id || adminData._id || null
            };
        } catch (error) {
            console.error('Error parsing admin data:', error);
            return { userEmail: 'Unknown Admin', adminId: null };
        }
    };

    useEffect(() => {
        const handleResize = () => setSidebarCollapsed(window.innerWidth <= 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Helper: Format Date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    // Helper: Badge Colors
    const getStatusBadgeClass = (status) => {
        const map = {
            'PENDING': 'badge-slate', 'CONTACTED': 'badge-amber',
            'PAYMENT_PENDING': 'badge-amber', 'PAID': 'badge-blue',
            'CONFIRMED': 'badge-blue', 'COMPLETED': 'badge-success', 
            'CANCELLED': 'badge-red'
        };
        return map[status] || 'badge-slate';
    };

    // Fetch flight booking inquiries
    const fetchFlightBookings = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get('/api/inquiries?isArchive=No');
            if (response.data.success) {
                const filtered = response.data.data.filter(inq => 
                    inq.inquiryType === 'FLIGHT_BOOKING' && inq.isArchive === 'No'
                );
                setBookings(filtered);
            }
        } catch (error) {
            console.error('Error fetching flight bookings:', error);
            error('Failed to load flight bookings');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { 
        fetchFlightBookings(); 
    }, []);

    // Filter Logic
    const filteredData = useMemo(() => {
        let data = bookings;
        
        // Automatically hide archived items
        data = data.filter(b => b.status !== 'ARCHIVED');

        if(statusFilter !== 'ALL') data = data.filter(b => b.status === statusFilter);
        
        if(searchTerm) {
            const lower = searchTerm.toLowerCase();
            data = data.filter(b => 
                b._id.toLowerCase().includes(lower) || 
                b.fullName?.toLowerCase().includes(lower) || 
                b.email?.toLowerCase().includes(lower)
            );
        }
        
        if (currentPage > Math.ceil(data.length / itemsPerPage) && data.length > 0) {
            setCurrentPage(1);
        }

        return data;
    }, [bookings, statusFilter, searchTerm, currentPage]);

    const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    // ── Confirmation Modal Helpers ──────────────────────────────────────────
    const showConfirm = (title, message, type = 'primary', onConfirm) => {
        setConfirmModal({
            isOpen: true,
            title,
            message,
            type,
            onConfirm: () => {
                onConfirm();
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            },
            onCancel: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
        });
    };

    // ── Status Update ───────────────────────────────────────────────────────
    const handleUpdateStatus = async (id, newStatus) => {
        showConfirm(
            "Update Status",
            `Are you sure you want to change status to **${newStatus}**?`,
            newStatus === 'CANCELLED' ? 'danger' : 'primary',
            async () => {
                try {
                    const { userEmail, adminId } = getAdminData();

                    const response = await axios.put(
                        `/api/inquiries/${id}/status`,
                        { 
                            status: newStatus,
                            userEmail,
                            adminId
                        }
                    );

                    if (response.data.success) {
                        success(`Status updated to ${newStatus}`);
                        fetchFlightBookings();
                        if (selectedBooking && selectedBooking._id === id) {
                            setSelectedBooking({ ...selectedBooking, status: newStatus });
                        }
                    }
                } catch (e) {
                    console.error(e);
                    error("Failed to update status");
                }
            }
        );
    };

    // ── Request Payment ─────────────────────────────────────────────────────
    const handleRequestPayment = () => {
        if (!selectedBooking) return;

        showConfirm(
            "Request Payment",
            "Send payment request to client?",
            'primary',
            async () => {
                try {
                    const { userEmail, adminId } = getAdminData();

                    const response = await axios.post(
                        `/api/inquiries/${selectedBooking._id}/request-payment`,
                        { userEmail, adminId }
                    );
                    
                    if (response.data.success) {
                        success('Payment request sent successfully!');
                        fetchFlightBookings();
                        setSelectedBooking({ ...selectedBooking, status: 'PAYMENT_PENDING' });
                    }
                } catch (error) {
                    console.error('Error requesting payment:', error);
                    error('Failed to send payment request');
                }
            }
        );
    };

    // ── Archive Booking ─────────────────────────────────────────────────────
    const handleArchiveBooking = (id) => {
        showConfirm(
            "Archive Inquiry",
            "Are you sure you want to archive this inquiry?",
            'danger',
            async () => {
                try {
                    const { userEmail, adminId } = getAdminData();

                    const response = await axios.put(
                        `/api/inquiries/${id}/archive`, 
                        { 
                            isArchive: 'Yes',
                            userEmail,
                            adminId
                        }
                    );

                    if (response.data.success) {
                        success('Inquiry archived successfully!');
                        fetchFlightBookings();
                        setIsViewModalOpen(false);
                    }
                } catch (error) {
                    console.error('Error archiving:', error);
                    error('Failed to archive inquiry');
                }
            }
        );
    };

    // ── Submit Contact with Remarks ─────────────────────────────────────────
    const submitContactWithRemarks = async () => {
        if (!selectedBooking || !contactRemarks.trim()) {
            warning('Please enter remarks before submitting');
            return;
        }
        
        try {
            const { userEmail, adminId } = getAdminData();

            const formData = new FormData();
            formData.append('status', 'CONTACTED');
            formData.append('remarks', contactRemarks);
            formData.append('userEmail', userEmail);
            formData.append('adminId', adminId);
            if (contactEvidence) formData.append('evidence', contactEvidence);

            const response = await axios.put(
                `/api/inquiries/${selectedBooking._id}/status`,
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );

            if (response.data.success) {
                success('Issue reported successfully!');
                fetchFlightBookings();
                setSelectedBooking({ ...selectedBooking, status: 'CONTACTED' });
                setShowContactRemarks(false);
                setContactRemarks("");
                setContactEvidence(null);
            }
        } catch (error) { 
            console.error(error); 
            error('Failed to report issue');
        }
    };

    const handleCloseViewModal = () => {
        setIsViewModalOpen(false);
        setTimeout(() => {
            setSelectedBooking(null);
            setShowContactRemarks(false);
            setContactRemarks("");
            setContactEvidence(null);
        }, 200);
    };

    // Stats Cards
    const stats = [
        { label: 'Total Flights', value: bookings.filter(b => b.status !== 'ARCHIVED').length, icon: <Plane size={24}/>, img: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80' },
        { label: 'Pending Review', value: bookings.filter(b => b.status === 'PENDING').length, icon: <Clock size={24}/>, img: 'https://images.unsplash.com/photo-1559297434-fae8a1916a79?auto=format&fit=crop&w=800&q=80' },
        { label: 'Pending Payment', value: bookings.filter(b => b.status === 'PAYMENT_PENDING').length, icon: <CreditCard size={24}/>, img: 'https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?auto=format&fit=crop&w=800&q=80' },
        { label: 'Completed', value: bookings.filter(b => b.status === 'COMPLETED').length, icon: <CheckCircle size={24}/>, img: 'https://images.unsplash.com/photo-1520689916669-e93e23292419?auto=format&fit=crop&w=800&q=80' }
    ];

    return (
        <div className="airline-page">
            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={() => setSidebarCollapsed(!isSidebarCollapsed)} />
            
            <main className={`airline-main ${isSidebarCollapsed ? 'expanded' : ''}`}>
                <div className="airline-container">
                    
                    {/* Header */}
                    <div className="airline-header">
                        <div className="airline-title">
                            <h1>Airline Booking</h1>
                            <p>Manage domestic and international flight booking inquiries.</p>
                        </div>
                        <button className="airline-btn-add" onClick={() => setIsAddModalOpen(true)}>
                            <UserPlus size={18}/> Add Walk-in
                        </button>
                    </div>

                    {/* Stats Grid */}
                    <div className="airline-stats-grid">
                        {stats.map((s, i) => (
                            <div className="airline-stat-card" key={i} style={{backgroundImage: `url(${s.img})`}}>
                                <div className="airline-stat-content">
                                    <h2>{s.value}</h2>
                                    <span>{s.label}</span>
                                </div>
                                <div className="airline-stat-icon">{s.icon}</div>
                            </div>
                        ))}
                    </div>
                    
                    {/* FILTER CARD */}
                    <div className="airline-filter-card">
                        <div className="airline-filter-wrapper">
                            <div className="airline-brand-label">
                                <Filter size={20} className="air-filter-icon"/>
                                AIRLINE <span>FILTERS</span>
                            </div>

                            <div className="airline-filter-group">
                                <span className="airline-filter-label">Status Type:</span>
                                <div className="airline-dropdown-container">
                                    <select 
                                        className="airline-dropdown" 
                                        value={statusFilter} 
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                    >
                                        <option value="ALL">All Requests</option>
                                        <option value="PENDING">Pending Review</option>
                                        <option value="CONTACTED">Contacted</option>
                                        <option value="PAYMENT_PENDING">Payment Pending</option>
                                        <option value="PAID">Paid</option>
                                        <option value="CONFIRMED">Confirmed</option>
                                        <option value="COMPLETED">Completed</option>
                                        <option value="CANCELLED">Cancelled</option>
                                    </select>
                                    <ChevronDown size={16} className="airline-dropdown-arrow"/>
                                </div>
                            </div>

                            <div className="airline-search-box">
                                <Search size={18} className="airline-search-icon" />
                                <input 
                                    type="text" 
                                    className="airline-search-input" 
                                    placeholder="Search Client, Ref ID, Email..." 
                                    value={searchTerm} 
                                    onChange={(e) => setSearchTerm(e.target.value)} 
                                />
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="airline-table-container">
                        <table className="airline-table">
                            <thead>
                                <tr>
                                    <th>Ref No.</th>
                                    <th>Client</th>
                                    <th>Flight Route</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th style={{textAlign:'right'}}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr><td colSpan="6" style={{textAlign:'center', padding:'50px'}}>Loading records...</td></tr>
                                ) : paginatedData.length === 0 ? (
                                    <tr><td colSpan="6" style={{textAlign:'center', padding:'50px'}}>No flight bookings found.</td></tr>
                                ) : (
                                    paginatedData.map((b) => (
                                        <tr key={b._id}>
                                            <td><span className="airline-ref">#{b._id.slice(-6).toUpperCase()}</span></td>
                                            <td>
                                                <div className="airline-client-name">{b.fullName}</div>
                                                <div className="airline-client-email"><Mail size={12}/> {b.email}</div>
                                            </td>
                                            <td>
                                                <div className="airline-route">
                                                    {b.flightDetails?.origin} → {b.flightDetails?.destination}
                                                </div>
                                                <div className="airline-truncate">{b.flightDetails?.airline || 'Any Airline'}</div>
                                            </td>
                                            <td>{new Date(b.createdAt).toLocaleDateString()}</td>
                                            <td><span className={`airline-badge ${getStatusBadgeClass(b.status)}`}>{b.status}</span></td>
                                            <td style={{textAlign: 'right'}}>
                                                <div className="airline-action-group">
                                                    <button 
                                                        className="airline-action-btn airline-view-btn" 
                                                        onClick={() => { 
                                                            setSelectedBooking(b); 
                                                            setIsViewModalOpen(true); 
                                                        }}
                                                    >
                                                        <Eye size={14}/> View
                                                    </button>
                                                    <button 
                                                        className="airline-action-btn" 
                                                        style={{ color: '#ef4444', borderColor: '#ef4444' }}
                                                        onClick={() => handleArchiveBooking(b._id)}
                                                    >
                                                        <Archive size={14}/> Archive
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="airline-pagination">
                            <span className="airline-page-info">Page {currentPage} of {totalPages}</span>
                            <div className="airline-page-controls">
                                <button 
                                    className="airline-page-btn" 
                                    onClick={() => setCurrentPage(c => Math.max(1, c-1))} 
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft size={16}/>
                                </button>
                                <button 
                                    className="airline-page-btn" 
                                    onClick={() => setCurrentPage(c => Math.min(totalPages, c+1))} 
                                    disabled={currentPage === totalPages}
                                >
                                    <ChevronRight size={16}/>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* ── MODALS ────────────────────────────────────────────────────────── */}
            {isViewModalOpen && selectedBooking && (
                <AirlineInquiryModal 
                    inquiry={selectedBooking} 
                    onClose={handleCloseViewModal}
                    onUpdateStatus={handleUpdateStatus}
                    onRequestPayment={handleRequestPayment}
                    onArchive={() => handleArchiveBooking(selectedBooking._id)}
                    setShowContactRemarks={setShowContactRemarks}
                />
            )}

            {showContactRemarks && (
                <AirlineContactRemarksModal
                    remarks={contactRemarks}
                    setRemarks={setContactRemarks}
                    setEvidence={setContactEvidence}
                    onSubmit={submitContactWithRemarks}
                    onClose={() => {
                        setShowContactRemarks(false);
                        setContactRemarks("");
                        setContactEvidence(null);
                    }}
                />
            )}

            <AirlineApplicationModal 
                isOpen={isAddModalOpen} 
                onClose={() => setIsAddModalOpen(false)} 
                refreshData={fetchFlightBookings} 
            />

            {/* Custom Confirmation Modal */}
            <CustomConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                onConfirm={confirmModal.onConfirm}
                onCancel={confirmModal.onCancel}
            />
        </div>
    );
};

export default AirlineBooking;