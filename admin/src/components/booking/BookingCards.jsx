import React from 'react';
import './BookingCards.css';

const getStatusStripClass = (status) => {
    switch (status?.toLowerCase()) {
        case 'confirmed': return 'strip-confirmed';
        case 'cancelled': return 'strip-cancelled';
        default: return 'strip-pending';
    }
};

const getPaymentStatusBadge = (booking) => {
    if (booking.paymentType === 'full') {
        if (booking.status === 'confirmed' || booking.status === 'fully_paid') {
            return { text: 'Paid in Full', class: 'payment-badge-full' };
        }
        return { text: 'Pending', title: 'Pending Payment', class: 'payment-badge-pending' };
    }

    const totalAmount = booking.totalAmount || 0;
    const remainingBalance = booking.remainingBalance || 0;
    const balancePaid = booking.balancePaidAmount || 0;
    const initialPaid = totalAmount - remainingBalance;

    if (balancePaid > 0 && remainingBalance <= 0) {
        return { text: 'Fully Paid', class: 'payment-badge-full' };
    }
    if (initialPaid > 0 && balancePaid === 0 && remainingBalance > 0) {
        return {
            text: 'Partial',
            title: `₱${remainingBalance.toLocaleString()} balance due`,
            class: 'payment-badge-partial'
        };
    }
    return { text: 'Pending', title: 'Pending Payment', class: 'payment-badge-pending' };
};

const BookingCards = ({
    loading,
    filteredBookingsCount,
    currentBookings,
    handleViewDetails,
    handleArchive,
    actionLoading,
    selectedBookings,
    onToggleSelect,
    MailIcon,
    UsersIcon,
    ArchiveIcon,
    RotateCcwIcon,
    WalletIcon,
    CalendarIcon,
}) => {
    if (loading) {
        return (
            <div className="bkm-cards bkm-mobile-only">
                <div className="bkm-bcard-empty">Loading active bookings...</div>
            </div>
        );
    }

    if (filteredBookingsCount === 0) {
        return (
            <div className="bkm-cards bkm-mobile-only">
                <div className="bkm-bcard-empty">No active bookings found</div>
            </div>
        );
    }

    return (
        <div className="bkm-cards bkm-mobile-only">
            {currentBookings.map((booking) => {
                const isArchived = booking.isArchive === 'Yes';
                const paymentStatus = getPaymentStatusBadge(booking);
                const isSelected = selectedBookings.some(b => b.mongoId === booking.mongoId);
                const addOns = booking.rawData?.addOns;
                const hasTours = Array.isArray(addOns?.tours) && addOns.tours.length > 0;
                const hasTransfers = Array.isArray(addOns?.transfers) && addOns.transfers.length > 0;
                const addOnCount = (addOns?.tours?.length || 0) + (addOns?.transfers?.length || 0);
                const isPartial = booking.paymentType === 'partial'
                    && !(booking.status === 'confirmed' || booking.status === 'fully_paid')
                    && booking.remainingBalance > 0;
                const paidAmount = isPartial
                    ? booking.totalAmount - booking.remainingBalance
                    : booking.totalAmount;
                const paidPercent = isPartial && booking.totalAmount > 0
                    ? Math.min(100, Math.max(0, (paidAmount / booking.totalAmount) * 100))
                    : 100;

                return (
                    <div
                        key={booking.mongoId || booking.id}
                        className={`bkm-bcard ${isSelected ? 'selected-card' : ''}`}
                    >
                        <div className="bkm-bcard-top">
                            <label className="bkm-bcard-select">
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => onToggleSelect(booking)}
                                />
                            </label>
                            <div className="bkm-bcard-id">
                                <span className="bkm-bcard-id-text">{booking.id}</span>
                                <span className="bkm-bcard-subline">
                                    Booked {booking.bookingDate}
                                </span>
                            </div>
                            <span className={`bkm-bcard-status-text ${getStatusStripClass(booking.status)}`}>
                                {booking.status || 'pending'}
                            </span>
                        </div>

                        <div className="bkm-bcard-details">
                            <span className="bkm-bcard-package-title" title={booking.packageName}>
                                {booking.packageName}
                            </span>

                            <div className="bkm-bcard-detail-row">
                                <span className="bkm-bcard-meta">
                                    <CalendarIcon size={13} /> {booking.travelDate}
                                </span>
                                <span className="guests-cell">
                                    <UsersIcon size={13} />
                                    {booking.guests} pax
                                </span>
                            </div>

                            <div className="bkm-bcard-detail-row">
                                <span className="bkm-bcard-meta">
                                    <MailIcon size={12} /> {booking.email}
                                </span>
                                {(hasTours || hasTransfers) && (
                                    <span className="addon-tag">
                                        ✦ {addOnCount} Add-On{addOnCount !== 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>

                            {isPartial ? (
                                <div className="bkm-bcard-progress-block">
                                    <div className="bkm-bcard-progress-row">
                                        <span className="bkm-bcard-progress-label">Partial payment</span>
                                        <span className="bkm-bcard-progress-amount">
                                            ₱{paidAmount.toLocaleString()} <span className="bkm-bcard-progress-total">/ ₱{booking.totalAmount.toLocaleString()}</span>
                                        </span>
                                    </div>
                                    <div className="bkm-bcard-progress-track">
                                        <div className="bkm-bcard-progress-fill" style={{ width: `${paidPercent}%` }} />
                                    </div>
                                </div>
                            ) : (
                                <div
                                    className={`payment-status-badge ${paymentStatus.class} bkm-bcard-payment-badge`}
                                    title={paymentStatus.title}
                                >
                                    <WalletIcon size={12} />
                                    <span>{paymentStatus.text}</span>
                                </div>
                            )}
                        </div>

                        <div className="bkm-bcard-actions">
                            <button
                                className="bkm-action-btn bkm-view-btn bkm-bcard-view-btn"
                                onClick={() => handleViewDetails(booking)}
                            >
                                View Details
                            </button>
                            <button
                                className="bkm-action-btn bkm-archive-icon-btn"
                                onClick={() => handleArchive(booking)}
                                disabled={actionLoading}
                                title={isArchived ? 'Unarchive booking' : 'Archive booking'}
                            >
                                {isArchived ? <RotateCcwIcon size={15} /> : <ArchiveIcon size={15} />}
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default BookingCards;
