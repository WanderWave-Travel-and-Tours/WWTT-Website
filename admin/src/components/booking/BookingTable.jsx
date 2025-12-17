import React from 'react';
import './BookingTable.css'; 

const BookingTable = ({ 
    loading, 
    filteredBookingsCount, 
    currentBookings, 
    handleViewDetails, 
    handleConfirm, 
    handleCancel, 
    actionLoading,
    MailIcon,
    CheckCircleIcon,
    AlertCircleIcon,
    XCircleIcon,
    EyeIcon,
    CheckIcon,
    XIcon,
    CalendarIcon,
    UsersIcon,
    startIndex // Prop para sa numbering
}) => {

    const getStatusBadgeClass = (status) => {
        switch(status.toLowerCase()) {
            case 'confirmed': return 'badge-confirmed';
            case 'pending': return 'badge-pending';
            case 'cancelled': return 'badge-cancelled';
            default: return 'badge-pending';
        }
    }

    // UPDATED: Colspan increased to 9 (8 original + 1 for numbering)
    if (loading) {
        return (
            <tr><td colSpan="9" style={{textAlign:'center', padding:'40px', color:'#64748b'}}>Loading bookings...</td></tr>
        );
    }

    // UPDATED: Colspan increased to 9
    if (filteredBookingsCount === 0) {
        return (
            <tr><td colSpan="9" style={{textAlign:'center', padding:'40px', color:'#64748b'}}>No bookings found</td></tr>
        );
    }

    return (
        <div className="bkm-table-wrapper">
            <table className="bkm-table">
                <thead>
                    <tr>
                        <th style={{ width: '50px' }}>No.</th> {/* NEW COLUMN FOR NUMBERING */}
                        <th>Booking ID</th>
                        <th>Customer Details</th>
                        <th>Package</th>
                        <th>Travel Date</th>
                        <th>Guests</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {currentBookings.map((booking, index) => (
                        <tr key={booking.id}>
                            {/* NEW COLUMN: Sequential Numbering */}
                            <td style={{ fontWeight: "700", color: '#0f172a' }}>
                                {startIndex + index + 1}
                            </td>

                            <td style={{ fontWeight: "700" }}>
                                {booking.id}
                                <div className="booking-date-small">
                                    Booked: {booking.bookingDate}
                                </div>
                            </td>

                            <td>
                                <div className="customer-name">{booking.customerName}</div>
                                <div className="customer-contact">
                                    <MailIcon size={13} />
                                    <span>{booking.email}</span>
                                </div>
                            </td>

                            {/* Package Name UI */}
                            <td>
                                <div className="package-name-cell">
                                    <div className="package-initials-badge">BK</div>
                                    {booking.packageName}
                                </div>
                            </td>

                            <td>
                                {booking.travelDate}
                            </td>

                            <td>
                                <div className="guests-cell">
                                    {/* UPDATED: Mas magandang icon para sa guests/pax */}
                                    <UsersIcon size={15} /> 
                                    {booking.guests}
                                </div>
                            </td>

                            <td>
                                ₱{booking.totalAmount.toLocaleString()}
                            </td>

                            <td>
                                <span className={`bkm-badge ${getStatusBadgeClass(booking.status)}`}>
                                    {booking.status}
                                </span>
                            </td>

                            <td style={{ textAlign: "right" }}>
                                <div className="bkm-action-group">
                                    
                                    {/* 1. VIEW BUTTON (Text) - Always present */}
                                    <button 
                                        className="bkm-action-btn bkm-view-btn" 
                                        onClick={() => handleViewDetails(booking)}
                                        title="View Details"
                                    >
                                        View
                                    </button>
                                    
                                    {/* 2. ARCHIVE BUTTON (Text) - For active statuses */}
                                    {(booking.status === 'pending' || booking.status === 'confirmed') && (
                                         <button 
                                            className="bkm-action-btn bkm-archive-text-btn"
                                            onClick={() => handleCancel(booking)}
                                            disabled={actionLoading}
                                            title="Archive / Cancel Booking"
                                        >
                                            Archive
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default BookingTable;