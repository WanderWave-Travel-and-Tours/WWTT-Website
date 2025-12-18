import React from 'react';
import './BookingTable.css';

const BookingTable = ({
    loading,
    filteredBookingsCount,
    currentBookings,
    handleViewDetails,
    handleConfirm,
    handleCancel,
    handleArchive,        // NEW: Dedicated archive handler
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
    ArchiveIcon,          // NEW
    RotateCcwIcon,        // NEW for unarchive
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

    // Loading state - full row
    if (loading) {
        return (
            <tbody>
                <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '60px', color: '#64748b', fontSize: '16px' }}>
                        Loading active bookings...
                    </td>
                </tr>
            </tbody>
        );
    }

    // Empty state
    if (filteredBookingsCount === 0) {
        return (
            <tbody>
                <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '60px', color: '#64748b', fontSize: '16px' }}>
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

                        {/* Amount */}
                        <td>₱{booking.totalAmount.toLocaleString()}</td>

                        {/* Status Badge */}
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

                                {/* Optional: Confirm button only for pending */}
                                {!isArchived && booking.status === 'pending' && (
                                    <button
                                        className="bkm-action-btn bkm-confirm-btn"
                                        onClick={() => handleConfirm(booking)}
                                        disabled={actionLoading}
                                        title="Confirm booking"
                                    >
                                        <CheckIcon size={16} />
                                        Confirm
                                    </button>
                                )}

                                {/* Optional: Cancel button only for non-cancelled */}
                                {!isArchived && booking.status !== 'cancelled' && booking.status !== 'confirmed' && (
                                    <button
                                        className="bkm-action-btn bkm-cancel-btn"
                                        onClick={() => handleCancel(booking)}
                                        disabled={actionLoading}
                                        title="Cancel booking"
                                    >
                                        <XIcon size={16} />
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </td>
                    </tr>
                );
            })}
        </tbody>
    );
};

export default BookingTable;