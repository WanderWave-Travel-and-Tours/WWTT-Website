import React from 'react';

const TransferDetailsModal = ({
  transfer: t,
  transferTypes,
  formData,
  departureDate,
  selectedDestination,
  selectedPackage,
  paxCount,
  getDurationDays,
  transferDetailsForm,
  setTransferDetailsForm,
  setTransferDetailsMap,
  setSelectedTransferAddOns,
  setShowTransferDetailsModal,
}) => {
  const type        = transferTypes[t._id] || 'oneway';
  const isRoundtrip = type === 'roundtrip';
  const primaryPax  = formData.passengers[0] || {};
  const fullName    = `${primaryPax.firstName || ''} ${primaryPax.lastName || ''}`.trim() || '—';
  const email       = primaryPax.email || '—';

  const returnDate  = (() => {
    if (!departureDate || !selectedPackage) return '—';
    const s    = new Date(departureDate);
    const days = getDurationDays(selectedPackage.duration);
    s.setDate(s.getDate() + days - 1);
    return s.toISOString().split('T')[0];
  })();

  const isConfirmDisabled =
    !transferDetailsForm.arrivalTime ||
    !transferDetailsForm.pickupLocation ||
    (isRoundtrip && (!transferDetailsForm.departureTime || !transferDetailsForm.dropoffLocation));

  return (
    <div
      className="nbm-tdm-overlay"
      onClick={e => { if (e.target === e.currentTarget) setShowTransferDetailsModal(null); }}
    >
      <div className="nbm-tdm-modal">

        {/* Header */}
        <div className="nbm-tdm-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="nbm-tdm-header-icon">🚐</div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{t.title}</h3>
              <div style={{ fontSize: '0.82rem', opacity: 0.85, marginTop: '2px' }}>
                Fill in scheduling details for this transfer
              </div>
            </div>
          </div>
          <button
            className="nbm-tdm-close"
            onClick={() => setShowTransferDetailsModal(null)}
          >×</button>
        </div>

        {/* Body */}
        <div className="nbm-tdm-body">

          {/* Pre-filled summary */}
          <div className="nbm-tdm-prefill">
            <div className="nbm-tdm-prefill-title">📋 Pre-filled from Booking</div>
            <div className="nbm-tdm-prefill-grid">
              <div className="nbm-tdm-prefill-item">
                <span className="nbm-tdm-prefill-label">Travel Date</span>
                <span className="nbm-tdm-prefill-val">{departureDate || '—'}</span>
              </div>
              {isRoundtrip && (
                <div className="nbm-tdm-prefill-item">
                  <span className="nbm-tdm-prefill-label">Return Date</span>
                  <span className="nbm-tdm-prefill-val">{returnDate}</span>
                </div>
              )}
              <div className="nbm-tdm-prefill-item">
                <span className="nbm-tdm-prefill-label">Destination</span>
                <span className="nbm-tdm-prefill-val">{selectedDestination || '—'}</span>
              </div>
              <div className="nbm-tdm-prefill-item">
                <span className="nbm-tdm-prefill-label">Transfer Type</span>
                <span className={`nbm-tdm-type-badge${isRoundtrip ? ' roundtrip' : ''}`}>
                  {isRoundtrip ? '🔄 Roundtrip' : '➡️ One Way'}
                </span>
              </div>
              <div className="nbm-tdm-prefill-item">
                <span className="nbm-tdm-prefill-label">Full Name</span>
                <span className="nbm-tdm-prefill-val">{fullName}</span>
              </div>
              <div className="nbm-tdm-prefill-item">
                <span className="nbm-tdm-prefill-label">Email</span>
                <span className="nbm-tdm-prefill-val">{email}</span>
              </div>
              <div className="nbm-tdm-prefill-item">
                <span className="nbm-tdm-prefill-label">Passengers</span>
                <span className="nbm-tdm-prefill-val">{paxCount} pax</span>
              </div>
            </div>
          </div>

          {/* Form fields */}
          <div className="nbm-tdm-fields">

            {/* Arrival Time */}
            <div className="nbm-tdm-field">
              <label>
                Arrival Time <span style={{ color: '#ef4444' }}>*</span>
                <span className="nbm-tdm-field-hint">When the customer arrives at the destination</span>
              </label>
              <input
                type="time"
                value={transferDetailsForm.arrivalTime}
                onChange={e => setTransferDetailsForm(prev => ({ ...prev, arrivalTime: e.target.value }))}
              />
            </div>

            {/* Departure Time — roundtrip only */}
            {isRoundtrip && (
              <div className="nbm-tdm-field">
                <label>
                  Departure Time <span style={{ color: '#ef4444' }}>*</span>
                  <span className="nbm-tdm-field-hint">Return departure time on {returnDate}</span>
                </label>
                <input
                  type="time"
                  value={transferDetailsForm.departureTime}
                  onChange={e => setTransferDetailsForm(prev => ({ ...prev, departureTime: e.target.value }))}
                />
              </div>
            )}

            {/* Pickup Location */}
            <div className="nbm-tdm-field">
              <label>
                Pickup Location <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Manila Airport Terminal 3"
                value={transferDetailsForm.pickupLocation}
                onChange={e => setTransferDetailsForm(prev => ({ ...prev, pickupLocation: e.target.value }))}
              />
            </div>

            {/* Drop-off Location — roundtrip only */}
            {isRoundtrip && (
              <div className="nbm-tdm-field">
                <label>
                  Drop-off Location <span style={{ color: '#ef4444' }}>*</span>
                  <span className="nbm-tdm-field-hint">Where the customer returns to</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Manila Airport Terminal 3"
                  value={transferDetailsForm.dropoffLocation}
                  onChange={e => setTransferDetailsForm(prev => ({ ...prev, dropoffLocation: e.target.value }))}
                />
              </div>
            )}

            {/* Message */}
            <div className="nbm-tdm-field">
              <label>
                Message / Special Requests
                <span className="nbm-tdm-field-hint">(optional)</span>
              </label>
              <textarea
                className="nbm-tdm-textarea"
                placeholder="Any special instructions or requests..."
                value={transferDetailsForm.message}
                onChange={e => setTransferDetailsForm(prev => ({ ...prev, message: e.target.value }))}
                rows={3}
              />
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="nbm-tdm-footer">
          <button
            className="nbm-btn nbm-btn-back"
            onClick={() => setShowTransferDetailsModal(null)}
            style={{ flex: '0 0 auto', padding: '14px 28px' }}
          >
            Cancel
          </button>
          <button
            className="nbm-btn nbm-btn-next"
            disabled={isConfirmDisabled}
            onClick={() => {
              setTransferDetailsMap(prev => ({ ...prev, [t._id]: { ...transferDetailsForm } }));
              setSelectedTransferAddOns(prev =>
                prev.some(x => x._id === t._id) ? prev : [...prev, t]
              );
              setShowTransferDetailsModal(null);
            }}
          >
            ✓ Confirm &amp; Add Transfer
          </button>
        </div>

      </div>
    </div>
  );
};

export default TransferDetailsModal;
