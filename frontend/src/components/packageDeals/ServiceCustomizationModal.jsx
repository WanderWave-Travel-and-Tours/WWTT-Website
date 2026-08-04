import React, { useState, useEffect } from 'react';
import './newBookingModal.css';

const API_BASE = 'https://wanderwaveph.onrender.com';

// ─────────────────────────────────────────────────────────────────────────────
// ServiceCustomizationModal
//
// A standalone floating modal for selecting Tour and Transfer add-ons.
// Mirrors the Step 3 UI from NewBookingModal but works independently.
//
// Props:
//   isOpen          – boolean to show/hide
//   onClose         – () => void
//   onConfirm       – ({ tours, transfers, transferTypes, detailsMap, total }) => void
//   destination     – string (optional) — filters tours/transfers by destination
//   paxCount        – number (default 1) — used for tour pricing
//   travelDate      – string "YYYY-MM-DD" — pre-fills transfer details
//   returnDate      – string "YYYY-MM-DD" — pre-fills roundtrip return date
//   primaryPassenger – { firstName, lastName, email } — pre-fills transfer details
// ─────────────────────────────────────────────────────────────────────────────
const ServiceCustomizationModal = ({
  isOpen,
  onClose,
  onConfirm,
  destination = '',
  paxCount = 1,
  travelDate = '',
  returnDate = '',
  primaryPassenger = { firstName: '', lastName: '', email: '' },
}) => {

  // ── Add-on lists fetched from API ─────────────────────────────────────────
  const [availableTours, setAvailableTours]         = useState([]);
  const [availableTransfers, setAvailableTransfers] = useState([]);
  const [loadingAddOns, setLoadingAddOns]           = useState(false);

  // ── Selections ────────────────────────────────────────────────────────────
  const [selectedTours, setSelectedTours]                 = useState([]);
  const [selectedTransfers, setSelectedTransfers]         = useState([]);
  // { [transferId]: 'oneway' | 'roundtrip' }
  const [transferTypes, setTransferTypes]                 = useState({});
  // { [transferId]: { arrivalTime, departureTime, pickupLocation, dropoffLocation, message } }
  const [transferDetailsMap, setTransferDetailsMap]       = useState({});

  // ── Transfer Details sub-modal ────────────────────────────────────────────
  // null | <transfer object>
  const [detailsModalTransfer, setDetailsModalTransfer]   = useState(null);
  const [detailsForm, setDetailsForm]                     = useState({
    arrivalTime: '', departureTime: '',
    pickupLocation: '', dropoffLocation: '', message: '',
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Fetch tours + transfers whenever the modal opens or destination changes
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    const fetchAddOns = async () => {
      setLoadingAddOns(true);
      try {
        const normalise = (str) =>
          (str || '').toLowerCase().replace(/[^a-z0-9]/g, ' ').trim().replace(/\s+/g, ' ');

        const normDest      = normalise((destination || '').split(',')[0]);
        const destKeyword   = (destination || '').split(',')[0].trim().toLowerCase();

        // ── Tours ──────────────────────────────────────────────────────────
        const toursRes  = await fetch(`${API_BASE}/api/tours/all`);
        const toursData = await toursRes.json();
        const allTours  = toursData.data || toursData.tours || (Array.isArray(toursData) ? toursData : []);

        const filteredTours = destination
          ? allTours.filter(t => {
              if (t.isArchive === 'Yes') return false;
              const normTourDest = normalise((t.destination || '').split(',')[0]);
              return normTourDest.includes(normDest) || normDest.includes(normTourDest);
            })
          : allTours.filter(t => t.isArchive !== 'Yes');

        setAvailableTours(filteredTours);

        // ── Transfers ──────────────────────────────────────────────────────
        const transfersRes  = await fetch(`${API_BASE}/api/transfers?all=true`);
        const transfersData = await transfersRes.json();
        const allTransfers  = transfersData.data || [];

        const filteredTransfers = destination
          ? allTransfers.filter(t => {
              if (!t.isActive) return false;
              if (!t.packageDestination) return true;
              const tDest = (t.packageDestination || '').toLowerCase().split(',')[0].trim();
              return tDest.includes(destKeyword) || destKeyword.includes(tDest);
            })
          : allTransfers.filter(t => t.isActive);

        setAvailableTransfers(filteredTransfers);
      } catch (err) {
      } finally {
        setLoadingAddOns(false);
      }
    };

    fetchAddOns();
  }, [isOpen, destination]);

  // ─────────────────────────────────────────────────────────────────────────
  // Reset state when modal closes
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      setSelectedTours([]);
      setSelectedTransfers([]);
      setTransferTypes({});
      setTransferDetailsMap({});
      setDetailsModalTransfer(null);
    }
  }, [isOpen]);

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────
  const calcToursTotal = () =>
    selectedTours.reduce((sum, t) => sum + (t.price || 0) * paxCount, 0);

  const calcTransfersTotal = () =>
    selectedTransfers.reduce((sum, t) => {
      const type  = transferTypes[t._id] || 'oneway';
      const price = type === 'roundtrip' ? (t.roundtripPrice || 0) : (t.oneWayPrice || 0);
      return sum + price;
    }, 0);

  const calcGrandTotal = () => calcToursTotal() + calcTransfersTotal();

  // ─────────────────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────────────────
  const handleToggleTour = (tour) => {
    setSelectedTours(prev =>
      prev.some(t => t._id === tour._id)
        ? prev.filter(t => t._id !== tour._id)
        : [...prev, tour]
    );
  };

  const handleOpenTransferDetails = (transfer) => {
    setDetailsForm(
      transferDetailsMap[transfer._id] || {
        arrivalTime: '', departureTime: '',
        pickupLocation: '', dropoffLocation: '', message: '',
      }
    );
    setDetailsModalTransfer(transfer);
  };

  const handleRemoveTransfer = (transfer) => {
    setSelectedTransfers(prev => prev.filter(t => t._id !== transfer._id));
    setTransferDetailsMap(prev => {
      const next = { ...prev };
      delete next[transfer._id];
      return next;
    });
  };

  const handleConfirmTransferDetails = () => {
    const t = detailsModalTransfer;
    setTransferDetailsMap(prev => ({ ...prev, [t._id]: { ...detailsForm } }));
    setSelectedTransfers(prev =>
      prev.some(x => x._id === t._id) ? prev : [...prev, t]
    );
    setDetailsModalTransfer(null);
  };

  const handleConfirm = () => {
    onConfirm?.({
      tours:          selectedTours,
      transfers:      selectedTransfers,
      transferTypes,
      detailsMap:     transferDetailsMap,
      total:          calcGrandTotal(),
    });
    onClose?.();
  };

  if (!isOpen) return null;

  // ─────────────────────────────────────────────────────────────────────────
  // Transfer Details sub-modal helpers
  // ─────────────────────────────────────────────────────────────────────────
  const detailsIsRoundtrip = detailsModalTransfer
    ? (transferTypes[detailsModalTransfer._id] || 'oneway') === 'roundtrip'
    : false;

  const detailsDisabled =
    !detailsForm.arrivalTime ||
    !detailsForm.pickupLocation ||
    (detailsIsRoundtrip && (!detailsForm.departureTime || !detailsForm.dropoffLocation));

  const primaryName = `${primaryPassenger?.firstName || ''} ${primaryPassenger?.lastName || ''}`.trim() || '—';
  const primaryEmail = primaryPassenger?.email || '—';

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ══════════════════════ MAIN MODAL ══════════════════════ */}
      <div
        className="nbm-overlay scm-overlay"
        onClick={e => { if (e.target === e.currentTarget) onClose?.(); }}
      >
        <div className="nbm-modal scm-modal" onClick={e => e.stopPropagation()}>

          {/* ── Header ── */}
          <div className="nbm-header">
            <div className="scm-header-flex">
              <div className="scm-header-icon">
                🎭
              </div>
              <div>
                <h2 className="scm-header-title">
                  Customize Services
                </h2>
                <p className="scm-header-subtitle">
                  Select optional tours and transfers
                  {destination ? ` for ${destination}` : ''}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="scm-close-btn"
              onMouseEnter={e => (e.currentTarget.style.color = '#0f172a')}
              onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
            >
              ×
            </button>
          </div>

          {/* ── Body ── */}
          <div className="nbm-body">

            {loadingAddOns ? (
              <div className="nbm-addon-loading">
                <div className="scm-loading-icon">⏳</div>
                Loading available services{destination ? ` for ${destination}` : ''}…
              </div>
            ) : (
              <>
                {/* ── Selected summary bar ── */}
                {(selectedTours.length > 0 || selectedTransfers.length > 0) && (
                  <div className="nbm-addon-summary-bar">
                    <span>
                      🛒 {selectedTours.length + selectedTransfers.length} service(s) selected
                    </span>
                    <span className="nbm-addon-summary-total">
                      +₱{calcGrandTotal().toLocaleString()}
                    </span>
                  </div>
                )}

                {/* ════════ TOURS ════════ */}
                {availableTours.length > 0 && (
                  <div className="nbm-addon-section">
                    <div className="nbm-addon-section-title">🗺️ Available Tours</div>
                    <div className="nbm-addon-grid">
                      {availableTours.map(tour => {
                        const isSelected = selectedTours.some(t => t._id === tour._id);
                        return (
                          <div
                            key={tour._id}
                            className={`nbm-addon-card${isSelected ? ' selected' : ''}`}
                          >
                            {tour.image && (
                              <img
                                src={tour.image}
                                alt={tour.title}
                                className="nbm-addon-image"
                              />
                            )}
                            <div className="nbm-addon-body">
                              <div className="nbm-addon-title">{tour.title}</div>
                              <div className="nbm-addon-meta">
                                {tour.duration    && <span>⏱ {tour.duration}</span>}
                                {tour.destination && <span>📍 {tour.destination}</span>}
                                {tour.category    && <span>🏷 {tour.category}</span>}
                                {tour.tourType    && (
                                  <span className={tour.tourType === 'joiners' ? 'scm-tourtype-badge-joiners' : 'scm-tourtype-badge-private'}>
                                    {tour.tourType === 'joiners'
                                      ? `👥 Joiners${tour.minPax ? ` (min ${tour.minPax})` : ''}`
                                      : '🔒 Private'}
                                  </span>
                                )}
                              </div>
                              <div className="nbm-addon-price">
                                ₱{(tour.price || 0).toLocaleString()}
                                <span className="nbm-addon-per"> / person</span>
                              </div>
                              {paxCount > 1 && (
                                <div className="nbm-addon-subtotal">
                                  {paxCount} pax total: ₱{((tour.price || 0) * paxCount).toLocaleString()}
                                </div>
                              )}
                              <button
                                className={`nbm-addon-btn${isSelected ? ' selected' : ''}`}
                                onClick={() => handleToggleTour(tour)}
                              >
                                {isSelected ? '✓ Added' : '+ Add Tour'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ════════ TRANSFERS ════════ */}
                {availableTransfers.length > 0 && (
                  <div className="nbm-addon-section">
                    <div className="nbm-addon-section-title">🚐 Available Transfers</div>
                    <div className="nbm-addon-grid">
                      {availableTransfers.map(transfer => {
                        const isSelected     = selectedTransfers.some(t => t._id === transfer._id);
                        const selectedType   = transferTypes[transfer._id] || 'oneway';
                        const displayPrice   = selectedType === 'roundtrip'
                          ? (transfer.roundtripPrice || 0)
                          : (transfer.oneWayPrice    || 0);
                        const hasRoundtrip   = (transfer.roundtripPrice || 0) > 0;
                        const hasDetails     = !!transferDetailsMap[transfer._id];

                        return (
                          <div
                            key={transfer._id}
                            className={`nbm-addon-card${isSelected ? ' selected' : ''}`}
                          >
                            {transfer.imageUrl && (
                              <img
                                src={transfer.imageUrl}
                                alt={transfer.title}
                                className="nbm-addon-image"
                              />
                            )}
                            <div className="nbm-addon-body">
                              <div className="nbm-addon-title">{transfer.title}</div>
                              {transfer.category && (
                                <div className="nbm-addon-meta">
                                  <span>🏷 {transfer.category}</span>
                                  {transfer.pax && <span>👥 Max {transfer.pax} pax</span>}
                                </div>
                              )}

                              {/* One Way / Roundtrip toggle */}
                              <div className="nbm-addon-type-toggle">
                                <button
                                  className={`nbm-addon-type-btn${selectedType === 'oneway' ? ' active' : ''}`}
                                  onClick={() =>
                                    setTransferTypes(prev => ({ ...prev, [transfer._id]: 'oneway' }))
                                  }
                                >
                                  One Way · ₱{(transfer.oneWayPrice || 0).toLocaleString()}
                                </button>
                                {hasRoundtrip && (
                                  <button
                                    className={`nbm-addon-type-btn${selectedType === 'roundtrip' ? ' active' : ''}`}
                                    onClick={() =>
                                      setTransferTypes(prev => ({ ...prev, [transfer._id]: 'roundtrip' }))
                                    }
                                  >
                                    Roundtrip · ₱{(transfer.roundtripPrice || 0).toLocaleString()}
                                  </button>
                                )}
                              </div>

                              <div className="nbm-addon-price">
                                ₱{displayPrice.toLocaleString()}
                                <span className="nbm-addon-per"> flat rate</span>
                              </div>

                              {/* Details badge — shown when transfer is selected */}
                              {isSelected && hasDetails && (
                                <div className="scm-details-saved-badge">
                                  ✓ Details saved
                                  <button
                                    onClick={() => handleOpenTransferDetails(transfer)}
                                    className="scm-details-edit-btn"
                                  >
                                    (edit)
                                  </button>
                                </div>
                              )}

                              {isSelected ? (
                                <button
                                  className="nbm-addon-btn selected"
                                  onClick={() => handleRemoveTransfer(transfer)}
                                >
                                  ✕ Remove
                                </button>
                              ) : (
                                <button
                                  className="nbm-addon-btn"
                                  onClick={() => handleOpenTransferDetails(transfer)}
                                >
                                  + Add Transfer
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── Empty state ── */}
                {availableTours.length === 0 && availableTransfers.length === 0 && (
                  <div className="nbm-addon-empty">
                    <div className="scm-empty-icon">🏖️</div>
                    <div className="scm-empty-title">
                      No Services Available
                    </div>
                    <div className="scm-empty-subtext">
                      {destination
                        ? `No tours or transfers are currently listed for ${destination}.`
                        : 'No tours or transfers are currently available.'}
                    </div>
                  </div>
                )}

                {/* ── Grand Total Summary ── */}
                {(selectedTours.length > 0 || selectedTransfers.length > 0) && (
                  <div className="nbm-total-box scm-total-box">
                    <div className="scm-breakdown-label">
                      Selected Services Breakdown
                    </div>

                    {selectedTours.map(t => (
                      <div key={t._id} className="nbm-total-row scm-total-row">
                        <span>🗺️ {t.title} × {paxCount} pax</span>
                        <span>₱{((t.price || 0) * paxCount).toLocaleString()}</span>
                      </div>
                    ))}

                    {selectedTransfers.map(t => {
                      const type  = transferTypes[t._id] || 'oneway';
                      const price = type === 'roundtrip' ? (t.roundtripPrice || 0) : (t.oneWayPrice || 0);
                      return (
                        <div key={t._id} className="nbm-total-row scm-total-row">
                          <span>🚐 {t.title} ({type === 'roundtrip' ? 'Roundtrip' : 'One Way'})</span>
                          <span>₱{price.toLocaleString()}</span>
                        </div>
                      );
                    })}

                    <div className="nbm-total-row nbm-total-final">
                      <strong>SERVICES TOTAL</strong>
                      <strong>₱{calcGrandTotal().toLocaleString()}</strong>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>{/* end nbm-body */}

          {/* ── Footer ── */}
          <div className="nbm-footer">
            <button
              className="nbm-btn nbm-btn-back"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="nbm-btn nbm-btn-next"
              onClick={handleConfirm}
              disabled={selectedTours.length === 0 && selectedTransfers.length === 0}
            >
              {selectedTours.length === 0 && selectedTransfers.length === 0
                ? 'Select a Service to Continue'
                : `✓ Confirm ${selectedTours.length + selectedTransfers.length} Service(s) — ₱${calcGrandTotal().toLocaleString()}`}
            </button>
          </div>

        </div>
      </div>

      {/* ══════════════════════ TRANSFER DETAILS SUB-MODAL ══════════════════════ */}
      {detailsModalTransfer && (() => {
        const t = detailsModalTransfer;
        return (
          <div
            className="nbm-tdm-overlay"
            onClick={e => { if (e.target === e.currentTarget) setDetailsModalTransfer(null); }}
          >
            <div className="nbm-tdm-modal">

              {/* Header */}
              <div className="nbm-tdm-header">
                <div className="scm-header-flex">
                  <div className="nbm-tdm-header-icon">🚐</div>
                  <div>
                    <h3 className="scm-tdm-title">{t.title}</h3>
                    <div className="scm-tdm-subtitle">
                      Fill in scheduling details for this transfer
                    </div>
                  </div>
                </div>
                <button
                  className="nbm-tdm-close"
                  onClick={() => setDetailsModalTransfer(null)}
                >
                  ×
                </button>
              </div>

              {/* Body */}
              <div className="nbm-tdm-body">

                {/* Pre-filled summary (read-only) */}
                <div className="nbm-tdm-prefill">
                  <div className="nbm-tdm-prefill-title">📋 Booking Info</div>
                  <div className="nbm-tdm-prefill-grid">
                    {travelDate && (
                      <div className="nbm-tdm-prefill-item">
                        <span className="nbm-tdm-prefill-label">Travel Date</span>
                        <span className="nbm-tdm-prefill-val">{travelDate}</span>
                      </div>
                    )}
                    {detailsIsRoundtrip && returnDate && (
                      <div className="nbm-tdm-prefill-item">
                        <span className="nbm-tdm-prefill-label">Return Date</span>
                        <span className="nbm-tdm-prefill-val">{returnDate}</span>
                      </div>
                    )}
                    {destination && (
                      <div className="nbm-tdm-prefill-item">
                        <span className="nbm-tdm-prefill-label">Destination</span>
                        <span className="nbm-tdm-prefill-val">{destination}</span>
                      </div>
                    )}
                    <div className="nbm-tdm-prefill-item">
                      <span className="nbm-tdm-prefill-label">Transfer Type</span>
                      <span className={`nbm-tdm-type-badge${detailsIsRoundtrip ? ' roundtrip' : ''}`}>
                        {detailsIsRoundtrip ? '🔄 Roundtrip' : '➡️ One Way'}
                      </span>
                    </div>
                    {primaryName !== '—' && (
                      <div className="nbm-tdm-prefill-item">
                        <span className="nbm-tdm-prefill-label">Full Name</span>
                        <span className="nbm-tdm-prefill-val">{primaryName}</span>
                      </div>
                    )}
                    {primaryEmail !== '—' && (
                      <div className="nbm-tdm-prefill-item">
                        <span className="nbm-tdm-prefill-label">Email</span>
                        <span className="nbm-tdm-prefill-val">{primaryEmail}</span>
                      </div>
                    )}
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
                      Arrival Time <span className="scm-required-asterisk">*</span>
                      <span className="nbm-tdm-field-hint"> When the customer arrives at the destination</span>
                    </label>
                    <input
                      type="time"
                      value={detailsForm.arrivalTime}
                      onChange={e => setDetailsForm(prev => ({ ...prev, arrivalTime: e.target.value }))}
                    />
                  </div>

                  {/* Departure Time — roundtrip only */}
                  {detailsIsRoundtrip && (
                    <div className="nbm-tdm-field">
                      <label>
                        Departure Time <span className="scm-required-asterisk">*</span>
                        {returnDate && (
                          <span className="nbm-tdm-field-hint"> Return departure on {returnDate}</span>
                        )}
                      </label>
                      <input
                        type="time"
                        value={detailsForm.departureTime}
                        onChange={e => setDetailsForm(prev => ({ ...prev, departureTime: e.target.value }))}
                      />
                    </div>
                  )}

                  {/* Pickup Location */}
                  <div className="nbm-tdm-field">
                    <label>
                      Pickup Location <span className="scm-required-asterisk">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Manila Airport Terminal 3"
                      value={detailsForm.pickupLocation}
                      onChange={e => setDetailsForm(prev => ({ ...prev, pickupLocation: e.target.value }))}
                    />
                  </div>

                  {/* Drop-off Location — roundtrip only */}
                  {detailsIsRoundtrip && (
                    <div className="nbm-tdm-field">
                      <label>
                        Drop-off Location <span className="scm-required-asterisk">*</span>
                        <span className="nbm-tdm-field-hint"> Where the customer returns to</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Manila Airport Terminal 3"
                        value={detailsForm.dropoffLocation}
                        onChange={e => setDetailsForm(prev => ({ ...prev, dropoffLocation: e.target.value }))}
                      />
                    </div>
                  )}

                  {/* Message / Special Requests */}
                  <div className="nbm-tdm-field">
                    <label>
                      Message / Special Requests
                      <span className="nbm-tdm-field-hint"> (optional)</span>
                    </label>
                    <textarea
                      className="nbm-tdm-textarea"
                      placeholder="Any special instructions or requests..."
                      value={detailsForm.message}
                      onChange={e => setDetailsForm(prev => ({ ...prev, message: e.target.value }))}
                      rows={3}
                    />
                  </div>

                </div>
              </div>

              {/* Footer */}
              <div className="nbm-tdm-footer">
                <button
                  className="nbm-btn nbm-btn-back scm-tdm-cancel-btn"
                  onClick={() => setDetailsModalTransfer(null)}
                >
                  Cancel
                </button>
                <button
                  className="nbm-btn nbm-btn-next"
                  disabled={detailsDisabled}
                  onClick={handleConfirmTransferDetails}
                >
                  ✓ Confirm &amp; Add Transfer
                </button>
              </div>

            </div>
          </div>
        );
      })()}
    </>
  );
};

export default ServiceCustomizationModal;