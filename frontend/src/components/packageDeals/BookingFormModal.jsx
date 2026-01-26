import React from 'react';
import { X, Plane, CheckCircle, Upload, Wallet, CreditCard } from 'lucide-react';
// Import the new CSS file
import './BookingFormModal.css';
import './PaymentOption.css'

const BookingFormModal = ({ 
  isOpen, 
  onClose, 
  pkg, 
  currentMonth, 
  selectedDate, 
  getCalculatedDates, 
  monthNames, 
  packageTotal,
  appliedPromo,
  discountAmount,
  finalPackageTotal,
  selectedFlight, 
  airfareTotal, 
  totalAmount, 
  bookingWithAirfare, 
  isInternationalFlight, 
  requiresID,
  requiresPassport,
  passengerStep, 
  totalPassengers, 
  progressPercent, 
  currentPassenger, 
  passengers, 
  handlePassengerChange, 
  handleFileUpload, 
  removeFile, 
  handleNextPassenger, 
  handleBackPassenger,
  // NEW: Payment option props
  paymentType,
  setPaymentType,
  partialAmount,
  loading,
  // ✅ NEW: Currency props
  currency = 'PHP',
  exchangeRate = 58,
  currencySymbol = '₱'
}) => {
  if (!isOpen) return null;

  // ✅ Helper function for consistent number formatting
  const formatCurrency = (amount) => {
    return amount.toLocaleString(undefined, {
      minimumFractionDigits: currency === 'USD' ? 2 : 0,
      maximumFractionDigits: currency === 'USD' ? 2 : 0
    });
  };

  // Check if this is the last passenger (payment options should show)
  const isLastPassenger = passengerStep === totalPassengers;
  const finalAmount = selectedFlight ? totalAmount : finalPackageTotal;
  
  // Dynamic percentage based on airfare
  const partialPercentage = selectedFlight ? 85 : 50;
  const partialPercentageText = selectedFlight ? '85%' : '50%';

  return (
    <div className="bfm-overlay">
      <div className="bfm-modal-card">
        
        {/* Updated Close Button with X Icon */}
        <button 
          className="bfm-close-btn" 
          onClick={onClose}
          aria-label="Close Modal"
        >
          <X size={20} strokeWidth={2.5} />
        </button>
        
        {/* PREMIUM HEADER SECTION */}
        <div className="bfm-modal-header">
          <img 
            src="https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/6911894edaa4e3fb6cfb8afe.png" 
            alt="Wanderwave Logo" 
            className="bfm-modal-logo"
          />
          
          <h2 className="bfm-modal-title">Your Adventure Awaits!</h2>
          <p className="bfm-modal-subtitle">
            Please complete your details below. We'll secure your spot for <strong>{pkg.name}</strong> instantly.
          </p>
           
          {/* TRIP SUMMARY CARDS */}
          <div className="bfm-trip-summary">
            <div className="bfm-summary-item">
              <span className="bfm-summary-label">Travel Dates</span>
              <strong className="bfm-summary-value">
                {monthNames[currentMonth.getMonth()]} {selectedDate} - {getCalculatedDates().end.getDate()}, {currentMonth.getFullYear()}
              </strong>
              <span className="bfm-summary-subtext">
                ({parseInt(pkg.duration?.match(/(\d+)D/)?.[1] || 1)} days trip)
              </span>
            </div>
            
            <div className="bfm-summary-item">
              <span className="bfm-summary-label">Package Price</span>
              <strong className="bfm-summary-value bfm-price">
                {appliedPromo ? (
                  <>
                    <span style={{textDecoration: 'line-through', color: '#9ca3af', fontSize: '0.85rem', marginRight: '8px'}}>
                      {currencySymbol}{formatCurrency(packageTotal)}
                    </span>
                    {currencySymbol}{formatCurrency(finalPackageTotal)}
                  </>
                ) : (
                  `${currencySymbol}${formatCurrency(packageTotal)}`
                )}
              </strong>
              {appliedPromo && (
                <span className="bfm-summary-subtext" style={{color: '#10b981', fontWeight: '600'}}>
                  🎉 {appliedPromo.code} applied (-{currencySymbol}{formatCurrency(discountAmount)})
                </span>
              )}
            </div>
            
            {selectedFlight && (
              <>
                <div className="bfm-summary-item">
                  <span className="bfm-summary-label">
                    <Plane size={12} style={{display:'inline', marginRight:'4px'}}/>
                    Airfare ({selectedFlight.airline.name})
                  </span>
                  <strong className="bfm-summary-value bfm-accent-color">
                    {currencySymbol}{formatCurrency(airfareTotal)}
                  </strong>
                  <span className="bfm-summary-subtext">
                    {selectedFlight.departure.iataCode} → {selectedFlight.arrival.iataCode}
                  </span>
                </div>
                
                <div className="bfm-summary-item bfm-grand-total">
                  <span className="bfm-summary-label">Grand Total</span>
                  <strong className="bfm-summary-value bfm-grand-total-value">
                    {currencySymbol}{formatCurrency(totalAmount)}
                  </strong>
                </div>
              </>
            )}
          </div>

          {/* DOCUMENT REQUIREMENTS */}
          {bookingWithAirfare && (
            <div className={`bfm-doc-req-box ${isInternationalFlight ? '' : 'bfm-domestic'}`}>
              <strong>📋 Required Documents:</strong>
              {isInternationalFlight ? ' Valid Passport for all passengers' : ' Valid ID for all passengers'}
            </div>
          )}
        </div>

        {/* SCROLLABLE FORM CONTENT */}
        <div className="bfm-form-wrapper">
          
          {/* PROGRESS SECTION */}
          <div className="bfm-progress-section">
            <div className="bfm-progress-header">
              <span className="bfm-progress-label">
                Passenger {passengerStep} of {totalPassengers}
                {passengerStep === 1 && <span className="bfm-primary-badge">Primary</span>}
              </span>
              <span className="bfm-progress-percent">{progressPercent}% Complete</span>
            </div>
            <div className="bfm-progress-bar-container">
              <div className="bfm-progress-bar-fill" style={{width: `${progressPercent}%`}} />
            </div>
          </div>

          <form className="bfm-form" onSubmit={handleNextPassenger}>
            <div className="bfm-form-section-header">
              <span className="bfm-passenger-badge">Passenger {passengerStep}</span>
              {passengerStep === 1 && <span className="bfm-primary-contact-label">Primary Contact</span>}
            </div>

            {/* FORM GRID - Responsive via CSS */}
            <div className="bfm-form-grid">
              
              <div className="bfm-form-group">
                <label>First Name <span className="bfm-required">*</span></label>
                <input 
                  required 
                  type="text" 
                  value={currentPassenger.firstName}
                  onChange={(e) => handlePassengerChange(passengerStep - 1, 'firstName', e.target.value)}
                  placeholder="Juan"
                />
              </div>

              <div className="bfm-form-group">
                <label>Last Name <span className="bfm-required">*</span></label>
                <input 
                  required 
                  type="text"
                  value={currentPassenger.lastName}
                  onChange={(e) => handlePassengerChange(passengerStep - 1, 'lastName', e.target.value)}
                  placeholder="Dela Cruz"
                />
              </div>

              <div className="bfm-form-group">
                <label>Email Address <span className="bfm-required">*</span></label>
                <input 
                  required 
                  type="email"
                  value={currentPassenger.email}
                  onChange={(e) => handlePassengerChange(passengerStep - 1, 'email', e.target.value)}
                  placeholder="juan@example.com"
                />
              </div>

              <div className="bfm-form-group">
                <label>Phone Number <span className="bfm-required">*</span></label>
                <input 
                  required 
                  type="tel"
                  value={currentPassenger.phone}
                  onChange={(e) => handlePassengerChange(passengerStep - 1, 'phone', e.target.value)}
                  placeholder="0917 123 4567"
                />
              </div>

              <div className="bfm-form-group">
                <label>Date of Birth <span className="bfm-required">*</span></label>
                <input 
                  required 
                  type="date"
                  value={currentPassenger.dateOfBirth}
                  onChange={(e) => handlePassengerChange(passengerStep - 1, 'dateOfBirth', e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="bfm-form-group">
                <label>Age <span className="bfm-required">*</span></label>
                <input 
                  required 
                  type="number"
                  value={currentPassenger.age}
                  onChange={(e) => handlePassengerChange(passengerStep - 1, 'age', e.target.value)}
                  placeholder="25"
                  min="0"
                  max="120"
                />
              </div>

              <div className="bfm-form-group">
                <label>Gender <span className="bfm-required">*</span></label>
                <select
                  required
                  value={currentPassenger.gender}
                  onChange={(e) => handlePassengerChange(passengerStep - 1, 'gender', e.target.value)}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="bfm-form-group">
                <label>Nationality <span className="bfm-required">*</span></label>
                <input 
                  required 
                  type="text"
                  value={currentPassenger.nationality}
                  onChange={(e) => handlePassengerChange(passengerStep - 1, 'nationality', e.target.value)}
                  placeholder="Filipino"
                />
              </div>

              <div className="bfm-form-group bfm-full-width">
                <label>Complete Address <span className="bfm-required">*</span></label>
                <input 
                  required 
                  type="text"
                  value={currentPassenger.address}
                  onChange={(e) => handlePassengerChange(passengerStep - 1, 'address', e.target.value)}
                  placeholder="123 Main St, Makati City, Metro Manila"
                />
              </div>

              {/* ID UPLOAD */}
              {bookingWithAirfare && requiresID && (
                <div className="bfm-form-group bfm-full-width">
                  <label>
                    Upload Valid ID <span className="bfm-required">*</span>
                    <span className="bfm-upload-hint">
                      (Driver's License, UMID, SSS, Postal ID, etc.)
                    </span>
                  </label>
                  
                  {currentPassenger.idFileName ? (
                    <div className="bfm-file-uploaded">
                      <div className="bfm-file-info">
                        <CheckCircle size={18} color="#22c55e"/>
                        <span className="bfm-file-name">{currentPassenger.idFileName}</span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => removeFile(passengerStep - 1, 'id')}
                        className="bfm-remove-file-btn"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="bfm-file-upload-box">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileUpload(passengerStep - 1, 'id', e)}
                        id={`id-upload-${passengerStep}`}
                        style={{display: 'none'}}
                      />
                      <label htmlFor={`id-upload-${passengerStep}`} className="bfm-file-upload-label">
                        <Upload size={28} color="#94a3b8"/>
                        <span className="bfm-upload-text">Click to upload ID</span>
                        <span className="bfm-upload-subtext">PNG, JPG or PDF (Max 5MB)</span>
                      </label>
                    </div>
                  )}
                </div>
              )}

              {/* PASSPORT UPLOAD */}
              {bookingWithAirfare && requiresPassport && (
                <div className="bfm-form-group bfm-full-width">
                  <label>
                    Upload Passport <span className="bfm-required">*</span>
                    <span className="bfm-upload-hint">
                      (Bio-data page with photo)
                    </span>
                  </label>
                  
                  {currentPassenger.passportFileName ? (
                    <div className="bfm-file-uploaded">
                      <div className="bfm-file-info">
                        <CheckCircle size={18} color="#22c55e"/>
                        <span className="bfm-file-name">{currentPassenger.passportFileName}</span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => removeFile(passengerStep - 1, 'passport')}
                        className="bfm-remove-file-btn"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="bfm-file-upload-box">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileUpload(passengerStep - 1, 'passport', e)}
                        id={`passport-upload-${passengerStep}`}
                        style={{display: 'none'}}
                      />
                      <label htmlFor={`passport-upload-${passengerStep}`} className="bfm-file-upload-label">
                        <Upload size={28} color="#94a3b8"/>
                        <span className="bfm-upload-text">Click to upload Passport</span>
                        <span className="bfm-upload-subtext">PNG, JPG or PDF (Max 5MB)</span>
                      </label>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* ✅ PAYMENT OPTIONS - Show only on last passenger */}
            {isLastPassenger && (
              <div className="bfm-payment-section">
                <div className="bfm-payment-header">
                  <Wallet size={18} />
                  <h3>Select Payment Option</h3>
                </div>
                
                <div className="bfm-payment-options">
                  {/* PAY IN FULL */}
                  <div 
                    className={`bfm-payment-card ${paymentType === 'full' ? 'active' : ''}`}
                    onClick={() => setPaymentType('full')}
                  >
                    <div className="bfm-payment-card-header">
                      <div className="bfm-payment-radio">
                        <div className={`bfm-radio-dot ${paymentType === 'full' ? 'active' : ''}`} />
                      </div>
                      <div className="bfm-payment-card-title">
                        <CreditCard size={16} />
                        <span>Pay in Full</span>
                        <span className="bfm-recommended-badge">Most Popular</span>
                      </div>
                    </div>
                    <div className="bfm-payment-card-body">
                      <div className="bfm-payment-amount">
                        {currencySymbol}{formatCurrency(finalAmount)}
                      </div>
                      <div className="bfm-payment-description">
                        Complete payment now and secure your booking
                      </div>
                      <ul className="bfm-payment-benefits">
                        <li>✓ Instant confirmation</li>
                        <li>✓ No further payments needed</li>
                        <li>✓ Priority processing</li>
                      </ul>
                    </div>
                  </div>

                  {/* PARTIAL PAYMENT */}
                  <div 
                    className={`bfm-payment-card ${paymentType === 'partial' ? 'active' : ''}`}
                    onClick={() => setPaymentType('partial')}
                  >
                    <div className="bfm-payment-card-header">
                      <div className="bfm-payment-radio">
                        <div className={`bfm-radio-dot ${paymentType === 'partial' ? 'active' : ''}`} />
                      </div>
                      <div className="bfm-payment-card-title">
                        <Wallet size={16} />
                        <span>Partial Payment</span>
                        <span className="bfm-flexible-badge">Flexible</span>
                      </div>
                    </div>
                    <div className="bfm-payment-card-body">
                      <div className="bfm-payment-amount">
                        {currencySymbol}{formatCurrency(partialAmount)}
                        <span className="bfm-payment-percentage">{partialPercentageText} Down Payment</span>
                      </div>
                      <div className="bfm-payment-description">
                        Pay {partialPercentageText} now, remaining balance before departure
                      </div>
                      <div className="bfm-payment-breakdown">
                        <div className="bfm-breakdown-row">
                          <span>Now ({partialPercentageText}):</span>
                          <strong>{currencySymbol}{formatCurrency(partialAmount)}</strong>
                        </div>
                        <div className="bfm-breakdown-row">
                          <span>Later ({100 - partialPercentage}%):</span>
                          <strong>{currencySymbol}{formatCurrency(finalAmount - partialAmount)}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Summary */}
                <div className="bfm-payment-summary">
                  <div className="bfm-summary-row">
                    <span>Amount to pay now:</span>
                    <strong className="bfm-amount-highlight">
                      {currencySymbol}{formatCurrency(paymentType === 'full' ? finalAmount : partialAmount)}
                    </strong>
                  </div>
                  {paymentType === 'partial' && (
                    <div className="bfm-summary-row bfm-remaining">
                      <span>Remaining balance:</span>
                      <span>{currencySymbol}{formatCurrency(finalAmount - partialAmount)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ACTION BUTTONS */}
            <div className="bfm-actions">
              {passengerStep > 1 && (
                <button 
                  type="button" 
                  onClick={handleBackPassenger}
                  className="bfm-back-btn"
                >
                  ← Back
                </button>
              )}
              
              <button 
                type="submit" 
                disabled={loading}
                className="bfm-submit-btn"
                style={{
                  flex: passengerStep === 1 ? '1' : '2'
                }}
              >
                {loading ? 'PROCESSING...' : 
                 passengerStep === totalPassengers ? 'CONFIRM BOOKING' : 
                 `NEXT: PASSENGER ${passengerStep + 1}`}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
};

export default BookingFormModal;