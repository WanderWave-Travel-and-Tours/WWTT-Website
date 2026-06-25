// cbf/steps/Step4Summary.jsx
import React from 'react';
import { MapPin, User, Mail, Phone, Calendar, Users, FileText, CreditCard, Wallet, Clock, Mountain, Bus, ArrowRight, RefreshCw, Moon } from 'lucide-react';
import { fmt, fmtDate } from '../utils';

/**
 * Step 4 — Booking Summary + Payment Option selection.
 *
 * Props:
 *   info               – basic info object
 *   selectedTours      – Tour[]
 *   selectedTransfers  – Transfer[]
 *   transferTypes      – { [id]: 'oneway' | 'roundtrip' }
 *   detailsMap         – { [transferId]: details }
 *   tourDates          – { [tourId]: 'YYYY-MM-DD' }
 *   toursTotal         – number
 *   transfersTotal     – number
 *   nightSurcharge     – number
 *   grandTotal         – number
 *   partialAmount      – number
 *   isPartialPaymentAllowed – boolean
 *   paymentType        – 'full' | 'partial'
 *   setPaymentType     – (type) => void
 *   submitError        – string
 *   onChangeTours      – () => void  (navigate back to tour selection)
 *   onChangeTransfers  – () => void  (navigate back to transfer selection)
 */
export default function Step4Summary({
  info,
  selectedTours,
  selectedTransfers,
  transferTypes,
  detailsMap,
  tourDates,
  toursTotal,
  transfersTotal,
  nightSurcharge,
  grandTotal,
  partialAmount,
  isPartialPaymentAllowed,
  paymentType,
  setPaymentType,
  submitError,
  onChangeTours,
  onChangeTransfers,
}) {
  return (
    <div className="cbf-section">
      <div className="cbf-section-title">
        <FileText size={16} /> Booking Summary
      </div>

      {/* ── Your Information ── */}
      <div className="cbf-summary-block cbf-summary-block-info">
        <div className="cbf-summary-block-title"><User size={15} /> Your Information</div>
        <div className="cbf-info-card-grid">
          <div className="cbf-info-card">
            <div className="cbf-ic-icon-wrap destination"><MapPin size={13} /></div>
            <div className="cbf-ic-body">
              <span className="cbf-ic-label">Destination</span>
              <strong className="cbf-ic-value">{info.destination}</strong>
            </div>
          </div>
          <div className="cbf-info-card">
            <div className="cbf-ic-icon-wrap name"><User size={13} /></div>
            <div className="cbf-ic-body">
              <span className="cbf-ic-label">Full Name</span>
              <strong className="cbf-ic-value">{info.fullName}</strong>
            </div>
          </div>
          <div className="cbf-info-card">
            <div className="cbf-ic-icon-wrap email"><Mail size={13} /></div>
            <div className="cbf-ic-body">
              <span className="cbf-ic-label">Email</span>
              <strong className="cbf-ic-value">{info.email}</strong>
            </div>
          </div>
          {info.phone && (
            <div className="cbf-info-card">
              <div className="cbf-ic-icon-wrap phone"><Phone size={13} /></div>
              <div className="cbf-ic-body">
                <span className="cbf-ic-label">Phone</span>
                <strong className="cbf-ic-value">{info.phone}</strong>
              </div>
            </div>
          )}
          <div className="cbf-info-card">
            <div className="cbf-ic-icon-wrap date"><Calendar size={13} /></div>
            <div className="cbf-ic-body">
              <span className="cbf-ic-label">Travel Date</span>
              <strong className="cbf-ic-value">{fmtDate(info.travelDate)}</strong>
            </div>
          </div>
          {info.returnDate && (
            <div className="cbf-info-card">
              <div className="cbf-ic-icon-wrap date"><Calendar size={13} /></div>
              <div className="cbf-ic-body">
                <span className="cbf-ic-label">Return Date</span>
                <strong className="cbf-ic-value">{fmtDate(info.returnDate)}</strong>
              </div>
            </div>
          )}
          <div className="cbf-info-card">
            <div className="cbf-ic-icon-wrap pax"><Users size={13} /></div>
            <div className="cbf-ic-body">
              <span className="cbf-ic-label">Passengers</span>
              <strong className="cbf-ic-value">{info.paxCount} pax</strong>
            </div>
          </div>
          {info.message && (
            <div className="cbf-info-card cbf-info-card-full">
              <div className="cbf-ic-icon-wrap note"><FileText size={13} /></div>
              <div className="cbf-ic-body">
                <span className="cbf-ic-label">Notes</span>
                <strong className="cbf-ic-value">{info.message}</strong>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Tours summary ── */}
      {selectedTours.length > 0 && (
        <div className="cbf-summary-block">
          <div className="cbf-summary-block-title">
            <Mountain size={15} /> Selected Tours
            <button type="button" className="cbf-change-type-btn" onClick={onChangeTours}>
              Change
            </button>
          </div>
          {selectedTours.map(t => (
            <div key={t._id} className="cbf-service-summary-row">
              {(t.imageUrl || t.image) && (
                <img src={t.imageUrl || t.image} alt={t.title || t.name} className="cbf-ssr-img" />
              )}
              <div className="cbf-ssr-info">
                <div className="cbf-ssr-title">{t.title || t.name}</div>
                <div className="cbf-ssr-badges">
                  {t.destination && <span className="cbf-ssr-badge location"><MapPin size={10} /> {t.destination.split(',')[0]}</span>}
                  {t.duration    && <span className="cbf-ssr-badge duration"><Clock size={10} /> {t.duration}</span>}
                  {t.category    && <span className="cbf-ssr-badge category">{t.category}</span>}
                  {tourDates[t._id] && (
                    <span className="cbf-ssr-badge duration"><Calendar size={10} /> {fmtDate(tourDates[t._id])}</span>
                  )}
                </div>
                <div className="cbf-ssr-pax-line">
                  <span className="cbf-ssr-unit">₱{fmt(t.price)} × {info.paxCount} pax</span>
                </div>
              </div>
              <div className="cbf-ssr-price">
                <div className="cbf-ssr-total">₱{fmt((t.price || 0) * info.paxCount)}</div>
              </div>
            </div>
          ))}
          <div className="cbf-subtotal-row">
            <span>Tours subtotal</span>
            <strong>₱{fmt(toursTotal)}</strong>
          </div>
        </div>
      )}

      {/* ── Transfers summary ── */}
      {selectedTransfers.length > 0 && (
        <div className="cbf-summary-block">
          <div className="cbf-summary-block-title">
            <Bus size={15} /> Selected Transfers
            <button type="button" className="cbf-change-type-btn" onClick={onChangeTransfers}>
              Change
            </button>
          </div>
          {selectedTransfers.map(t => {
            const type       = transferTypes[t._id] || 'oneway';
            const details    = detailsMap[t._id] || {};
            const price      = type === 'roundtrip' ? (t.roundtripPrice || 0) : (t.oneWayPrice || 0);
            const hasDetails = details.arrivalTime || details.pickupLocation ||
                               details.departureTime || details.dropoffLocation || details.message;
            return (
              <div key={t._id} className="cbf-transfer-summary-card">
                <div className="cbf-tsc-header">
                  {t.imageUrl && (
                    <img src={t.imageUrl} alt={t.title} className="cbf-tsc-img" />
                  )}
                  <div className="cbf-tsc-title-wrap">
                    <div className="cbf-ssr-title">{t.title}</div>
                    <div className="cbf-ssr-badges">
                      <span className={`cbf-ssr-badge ${type === 'roundtrip' ? 'roundtrip' : 'oneway'}`}>
                        {type === 'roundtrip'
                          ? <><RefreshCw size={10} /> Roundtrip</>
                          : <><ArrowRight size={10} /> One Way</>}
                      </span>
                      {t.category && (
                        <span className="cbf-ssr-badge category">{t.category}</span>
                      )}
                    </div>
                  </div>
                  <div className="cbf-ssr-total">₱{fmt(price)}</div>
                </div>
                {hasDetails && (
                  <div className="cbf-tsc-detail-box">
                    <div className="cbf-tsc-detail-grid">
                      {details.arrivalTime && (
                        <div className="cbf-tsc-dg-item">
                          <div className="cbf-tsc-dg-label"><Clock size={10} /> Arrival Time</div>
                          <div className="cbf-tsc-dg-value">{details.arrivalTime}</div>
                        </div>
                      )}
                      {details.pickupLocation && (
                        <div className="cbf-tsc-dg-item">
                          <div className="cbf-tsc-dg-label"><MapPin size={10} /> Pickup Location</div>
                          <div className="cbf-tsc-dg-value">{details.pickupLocation}</div>
                        </div>
                      )}
                      {type === 'roundtrip' && details.departureTime && (
                        <div className="cbf-tsc-dg-item">
                          <div className="cbf-tsc-dg-label"><Clock size={10} /> Departure Time</div>
                          <div className="cbf-tsc-dg-value">{details.departureTime}</div>
                        </div>
                      )}
                      {type === 'roundtrip' && details.dropoffLocation && (
                        <div className="cbf-tsc-dg-item">
                          <div className="cbf-tsc-dg-label"><MapPin size={10} /> Drop-off Location</div>
                          <div className="cbf-tsc-dg-value">{details.dropoffLocation}</div>
                        </div>
                      )}
                      {details.message && (
                        <div className="cbf-tsc-dg-item cbf-tsc-dg-full">
                          <div className="cbf-tsc-dg-label"><FileText size={10} /> Notes</div>
                          <div className="cbf-tsc-dg-value">{details.message}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <div className="cbf-subtotal-row">
            <span>Transfers subtotal</span>
            <strong>₱{fmt(transfersTotal)}</strong>
          </div>
          {nightSurcharge > 0 && (
            <div className="cbf-subtotal-row cbf-night-surcharge-row">
              <span><Moon size={12} /> Late Night Surcharge</span>
              <strong>+₱{fmt(nightSurcharge)}</strong>
            </div>
          )}
        </div>
      )}

      {/* ── Grand Total ── */}
      <div className="cbf-grand-total-box">
        <span>Grand Total</span>
        <strong className="cbf-grand-total-amount">₱{fmt(grandTotal)}</strong>
      </div>

      {/* ── Payment Options ── */}
      <div className="bfm-payment-section">
        <div className="bfm-payment-header">
          <Wallet size={18} />
          <h3>Select Payment Option</h3>
        </div>

        {/* Full-payment-only banner */}
        {!isPartialPaymentAllowed && (
          <div className="bfm-full-payment-banner">
            <CreditCard size={16} className="bfm-fpb-icon" />
            <div>
              <strong>Full Payment Required</strong>
              <span>
                Partial payment is unavailable for travel dates of{' '}
                <strong>today</strong> or <strong>tomorrow</strong>.
              </span>
            </div>
          </div>
        )}

        <div
          className="bfm-payment-options"
          style={!isPartialPaymentAllowed ? { gridTemplateColumns: '1fr' } : {}}
        >
          {/* Pay in Full */}
          <div
            className={`bfm-payment-card ${paymentType === 'full' ? 'active' : ''}`}
            onClick={() => setPaymentType('full')}
          >
            <div
              className="bfm-payment-card-header"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: '8px', marginBottom: '12px', flexWrap: 'nowrap',
              }}
            >
              <div
                className="bfm-pch-left"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}
              >
                <div className="bfm-payment-radio">
                  <div className={`bfm-radio-dot ${paymentType === 'full' ? 'active' : ''}`} />
                </div>
                <CreditCard size={16} className="bfm-pif-icon" />
                <span className="bfm-pif-label">Pay in Full</span>
                <span className="bfm-recommended-badge">Most Popular</span>
              </div>
              {!isPartialPaymentAllowed && (
                <div
                  className="bfm-card-header-price"
                  style={{
                    textAlign: 'right', flexShrink: 0,
                    display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
                  }}
                >
                  <span className="bfm-chp-amount">₱{fmt(grandTotal)}</span>
                  <span className="bfm-chp-label">TOTAL AMOUNT</span>
                </div>
              )}
            </div>
            <div className="bfm-payment-card-body" style={{ paddingLeft: 0, paddingTop: 0 }}>
              {isPartialPaymentAllowed && (
                <div className="bfm-payment-amount">₱{fmt(grandTotal)}</div>
              )}
              <div className="bfm-payment-description">
                Complete payment now and secure your booking instantly.
              </div>
              <ul className="bfm-payment-benefits">
                <li>Instant confirmation</li>
                <li>No further payments needed</li>
                <li>Priority processing</li>
              </ul>
            </div>
          </div>

          {/* Partial Payment */}
          {isPartialPaymentAllowed && (
            <div
              className={`bfm-payment-card ${paymentType === 'partial' ? 'active' : ''}`}
              onClick={() => setPaymentType('partial')}
            >
              <div className="bfm-payment-card-header">
                <div className="bfm-payment-radio">
                  <div className={`bfm-radio-dot ${paymentType === 'partial' ? 'active' : ''}`} />
                </div>
                <Wallet size={16} className="bfm-pif-icon" />
                <span className="bfm-pif-label">Partial Payment</span>
                <span className="bfm-flexible-badge">Flexible</span>
              </div>
              <div className="bfm-payment-card-body">
                <div className="bfm-payment-amount">
                  ₱{fmt(partialAmount)}
                  <span className="bfm-payment-percentage">50% Down Payment</span>
                </div>
                <div className="bfm-payment-description">
                  Pay 50% now, remaining balance before departure
                </div>
                <div className="bfm-payment-breakdown">
                  <div className="bfm-breakdown-row">
                    <span>Now (50%):</span>
                    <strong>₱{fmt(partialAmount)}</strong>
                  </div>
                  <div className="bfm-breakdown-row">
                    <span>Later (50%):</span>
                    <strong>₱{fmt(grandTotal - partialAmount)}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Payment Summary */}
        <div className="bfm-payment-summary">
          <div className="bfm-summary-row">
            <span>Amount to pay now:</span>
            <strong className="bfm-amount-highlight">
              ₱{fmt(paymentType === 'full' ? grandTotal : partialAmount)}
            </strong>
          </div>
          {paymentType === 'partial' && (
            <div className="bfm-summary-row bfm-remaining">
              <span>Remaining balance:</span>
              <span>₱{fmt(grandTotal - partialAmount)}</span>
            </div>
          )}
        </div>
      </div>

      {submitError && (
        <div className="cbf-error-banner">{submitError}</div>
      )}
    </div>
  );
}
