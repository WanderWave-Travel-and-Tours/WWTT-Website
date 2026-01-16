import React from 'react';
import './BookingTable.css';

const BookingTable = ({
    loading,
    filteredBookingsCount,
    currentBookings,
    handleViewDetails,
    handleConfirm,
    handleCancel,
    handleArchive,
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
    ArchiveIcon,
    RotateCcwIcon,
    WalletIcon,
    startIndex
}) => {

    const getStatusBadgeClass = (status) => {
        switch (status?.toLowerCase()) {
            case 'confirmed': return 'badge-confirmed';
            case 'pending': return 'badge-pending';
            case 'cancelled': return 'badge-cancelled';
            default: return 'badge-pending';
        }
    };

    // ✅ FIXED: Get payment status badge - USE CORRECT CALCULATION
    const getPaymentStatusBadge = (booking) => {
        // Full payment type
        if (booking.paymentType === 'full') {
            if (booking.status === 'confirmed' || booking.status === 'fully_paid') {
                return {
                    text: 'Paid in Full',
                    class: 'payment-badge-full'
                };
            }
            return {
                text: 'Pending Payment',
                class: 'payment-badge-pending'
            };
        }

        // Partial payment logic - CORRECTED
        const totalAmount = booking.totalAmount || 0;
        const remainingBalance = booking.remainingBalance || 0;
        const balancePaid = booking.balancePaidAmount || 0;
        
        // Calculate actual paid amount
        const initialPaid = totalAmount - remainingBalance;

        // Check if fully paid (balance paid and no remaining)
        if (balancePaid > 0 && remainingBalance <= 0) {
            return {
                text: 'Fully Paid',
                class: 'payment-badge-full'
            };
        }

        // Initial payment made, balance pending
        if (initialPaid > 0 && balancePaid === 0 && remainingBalance > 0) {
            return {
                text: `Partial (₱${remainingBalance.toLocaleString()} due)`,
                class: 'payment-badge-partial'
            };
        }

        // No payment yet
        return {
            text: 'Pending Payment',
            class: 'payment-badge-pending'
        };
    };

    if (loading) {
        return (
            <tbody>
                <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: '60px', color: '#64748b', fontSize: '16px' }}>
                        Loading active bookings...
                    </td>
                </tr>
            </tbody>
        );
    }

    if (filteredBookingsCount === 0) {
        return (
            <tbody>
                <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: '60px', color: '#64748b', fontSize: '16px' }}>
                        No active bookings found
                    </td>
                </tr>
            </tbody>
        );
    }

    return (
        <tbody>
            {currentBookings.map((booking, index) => {
                const isArchived = booking.isArchive === 'Yes';
                const paymentStatus = getPaymentStatusBadge(booking);

                return (
                    <tr key={booking.mongoId || booking.id}>
                        {/* Numbering */}
                        <td style={{ fontWeight: "700", color: '#0f172a', textAlign: 'center' }}>
                            {startIndex + index + 1}
                        </td>

                        {/* Booking ID + Date */}
                        <td style={{ fontWeight: "700" }}>
                            {booking.id}
                            <div className="booking-date-small">
                                Booked: {booking.bookingDate}
                            </div>
                        </td> 

                        {/* Customer Details */}
                        <td>
                            <div className="customer-name">{booking.customerName}</div>
                            <div className="customer-contact">
                                <MailIcon size={13} />
                                <span>{booking.email}</span>
                            </div>
                        </td>

                        {/* Package Name */}
                        <td>
                            <div className="package-name-cell">
                                <div className="package-initials-badge">BK</div>
                                {booking.packageName}
                            </div>
                        </td>

                        {/* Travel Date */}
                        <td>{booking.travelDate}</td>

                        {/* Guests */}
                        <td>
                            <div className="guests-cell">
                                <UsersIcon size={15} />
                                {booking.guests}
                            </div>
                        </td>

                        {/* Amount - CORRECTED CALCULATION */}
                        <td>
                            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                                {booking.paymentType === 'partial' ? (
                                    <>
                                        <strong style={{color: '#059669'}}>
                                            ₱{(booking.totalAmount - booking.remainingBalance).toLocaleString()}
                                        </strong>
                                        <span style={{fontSize: '0.75rem', color: '#64748b'}}>
                                            of ₱{booking.totalAmount.toLocaleString()}
                                        </span>
                                    </>
                                ) : (
                                    <strong>₱{booking.totalAmount.toLocaleString()}</strong>
                                )}
                            </div>
                        </td>

                        {/* ✅ NEW: Payment Status */}
                        <td>
                            <div className={`payment-status-badge ${paymentStatus.class}`}>
                                <WalletIcon size={14} />
                                <span>{paymentStatus.text}</span>
                            </div>
                        </td>

                        {/* Booking Status Badge */}
                        <td>
                            <span className={`bkm-badge ${getStatusBadgeClass(booking.status)}`}>
                                {booking.status || 'pending'}
                            </span>
                        </td>

                        {/* Actions */}
                        <td style={{ textAlign: "right" }}>
                            <div className="bkm-action-group">

                                {/* View Button */}
                                <button
                                    className="bkm-action-btn bkm-view-btn"
                                    onClick={() => handleViewDetails(booking)}
                                    title="View Details"
                                >
                                    <EyeIcon size={16} />
                                    View
                                </button>

                                {/* Archive / Unarchive Button */}
                                <button
                                    className={`bkm-action-btn ${isArchived ? 'bkm-unarchive-btn' : 'bkm-archive-btn'}`}
                                    onClick={() => handleArchive(booking)}
                                    disabled={actionLoading}
                                    title={isArchived ? 'Unarchive booking' : 'Archive booking'}
                                >
                                    {isArchived ? (
                                        <>
                                            <RotateCcwIcon size={16} />
                                            Unarchive
                                        </>
                                    ) : (
                                        <>
                                            <ArchiveIcon size={16} />
                                            Archive
                                        </>
                                    )}
                                </button>
                            </div>
                        </td>
                    </tr>
                );
            })}
        </tbody>
    );
};

export default BookingTable;