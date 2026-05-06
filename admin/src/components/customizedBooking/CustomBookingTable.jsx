import React from 'react';
import { Eye, Archive, RotateCcw, Mail, Users, Wallet } from 'lucide-react';
import './CustomBookingTable.css';

const getStatusBadgeClass = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'confirmed': return 'cbk-badge-confirmed';
    case 'cancelled': return 'cbk-badge-cancelled';
    default:          return 'cbk-badge-pending';
  }
};

const getPaymentBadge = (booking) => {
  if (booking.paymentType === 'full') {
    if (booking.status === 'confirmed' || booking.status === 'fully_paid') {
      return { text: 'Paid in Full', cls: 'cbk-payment-full' };
    }
    return { text: 'Pending Payment', cls: 'cbk-payment-pending' };
  }

  const totalAmount      = booking.totalAmount      || 0;
  const remainingBalance = booking.remainingBalance || 0;
  const balancePaid      = booking.balancePaidAmount || 0;
  const initialPaid      = totalAmount - remainingBalance;

  if (balancePaid > 0 && remainingBalance <= 0) {
    return { text: 'Fully Paid', cls: 'cbk-payment-full' };
  }
  if (initialPaid > 0 && balancePaid === 0 && remainingBalance > 0) {
    return { text: `Partial (₱${remainingBalance.toLocaleString()} due)`, cls: 'cbk-payment-partial' };
  }
  return { text: 'Pending Payment', cls: 'cbk-payment-pending' };
};

const CustomBookingTable = ({
  loading,
  filteredBookingsCount,
  currentBookings,
  handleViewDetails,
  handleArchive,
  actionLoading,
  selectedBookings,
  onToggleSelect,
  onSelectAll,
  startIndex,
}) => {

  if (loading) {
    return (
      <tbody>
        <tr>
          <td colSpan="12" style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div className="cbk-spinner" style={{ display: 'inline-block', width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#059669', borderRadius: '50%', animation: 'cbk-spin 0.75s linear infinite' }} />
              <span>Loading bookings...</span>
            </div>
          </td>
        </tr>
      </tbody>
    );
  }

  if (filteredBookingsCount === 0) {
    return (
      <tbody>
        <tr>
          <td colSpan="12" style={{ textAlign: 'center', padding: '60px', color: '#94a3b8', fontSize: '15px' }}>
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
        const paymentBadge = getPaymentBadge(booking);
        const isSelected = selectedBookings.some(b => b.mongoId === booking.mongoId);
        const isSales = booking.isWalkin || booking.createdByType === 'sales';

        const addOns = booking.rawData?.addOns;
        const addOnCount = (addOns?.tours?.length || 0) + (addOns?.transfers?.length || 0);

        return (
          <tr
            key={booking.mongoId || booking.id}
            className={isSelected ? 'cbk-row-selected' : ''}
          >
            {/* Checkbox */}
            <td style={{ textAlign: 'center' }}>
              <input
                type="checkbox"
                className="cbk-checkbox"
                checked={isSelected}
                onChange={() => onToggleSelect(booking)}
              />
            </td>

            {/* Row # */}
            <td>
              <div className="cbk-number-cell">{startIndex + index + 1}</div>
            </td>

            {/* Booking ID */}
            <td>
              <div className="cbk-cell-id">{booking.id}</div>
              <div className="cbk-cell-date">📅 {booking.bookingDate}</div>
            </td>

            {/* Customer */}
            <td>
              <div className="cbk-cell-name">{booking.customerName}</div>
              <div className="cbk-cell-email">
                <Mail size={12} />
                <span>{booking.email}</span>
              </div>
            </td>

            {/* Package */}
            <td>
              <div className="cbk-pkg-cell">
                <span className="cbk-pkg-badge">BK</span>
                <div>
                  <div>{booking.packageName}</div>
                  {addOnCount > 0 && (
                    <span className="cbk-addon-tag">
                      ✦ {addOnCount} Add-On{addOnCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            </td>

            {/* Travel Date */}
            <td>{booking.travelDate}</td>

            {/* Guests */}
            <td>
              <div className="cbk-guests-cell">
                <Users size={14} />
                {booking.guests}
              </div>
            </td>

            {/* Amount */}
            <td>
              {booking.paymentType === 'partial' ? (
                <>
                  <div className="cbk-amount-main">
                    ₱{(booking.totalAmount - booking.remainingBalance).toLocaleString()}
                  </div>
                  <div className="cbk-amount-of">
                    of ₱{booking.totalAmount.toLocaleString()}
                  </div>
                </>
              ) : (
                <div className="cbk-amount-main">₱{booking.totalAmount.toLocaleString()}</div>
              )}
            </td>

            {/* Payment Status */}
            <td>
              <span className={`cbk-payment-badge ${paymentBadge.cls}`}>
                <Wallet size={12} />
                {paymentBadge.text}
              </span>
            </td>

            {/* Booking Status */}
            <td>
              <span className={`cbk-badge ${getStatusBadgeClass(booking.status)}`}>
                {booking.status || 'pending'}
              </span>
            </td>

            {/* Created By */}
            <td>
              <span className={`cbk-badge ${isSales ? 'cbk-badge-sales' : 'cbk-badge-user'}`}>
                {isSales ? 'Sales' : 'User'}
              </span>
            </td>

            {/* Actions */}
            <td>
              <div className="cbk-actions">
                <button
                  className="cbk-btn-view"
                  onClick={() => handleViewDetails(booking)}
                  title="View Details"
                >
                  <Eye size={14} />
                  View
                </button>

                <button
                  className={`cbk-btn-archive ${isArchived ? 'cbk-btn-unarchive' : ''}`}
                  onClick={() => handleArchive(booking)}
                  disabled={actionLoading}
                  title={isArchived ? 'Unarchive' : 'Archive'}
                >
                  {isArchived ? (
                    <><RotateCcw size={14} /> Restore</>
                  ) : (
                    <><Archive size={14} /> Archive</>
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

export default CustomBookingTable;