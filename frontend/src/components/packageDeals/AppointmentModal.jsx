import React, { useState } from 'react';
import { X, User, Mail, Phone, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import './appointment.css';

const AppointmentModal = ({ 
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
  totalPassengers,
  quantities,
  selectedRoomType,
  numberOfRooms,
  customizationData
}) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const finalAmount = selectedFlight ? totalAmount : finalPackageTotal;

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { start, end } = getCalculatedDates();

      const formatDate = (date) => {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      };

      const startDateFormatted = formatDate(start);
      const endDateFormatted = formatDate(end);

      const bookingData = {
        packageId: pkg._id,
        packageName: pkg.name,
        packagePrice: pkg.price,
        startDate: startDateFormatted,
        endDate: endDateFormatted,
        duration: pkg.duration,
        pax: {
          adult: quantities.adult,
          children: quantities.children || 0,
          infants: quantities.infants || 0,
        },
        packageTotal: packageTotal,
        promoCode: appliedPromo ? appliedPromo.code : null,
        promoId: appliedPromo ? appliedPromo.promoId : null,
        discountAmount: discountAmount,
        finalPackageTotal: finalPackageTotal,
        includesAirfare: !!selectedFlight,
        flightDetails: selectedFlight ? ({
          airline: selectedFlight.airline.name,
          flightNumber: selectedFlight.airline.flightNumber || 'N/A',
          departure: selectedFlight.departure,
          arrival: selectedFlight.arrival,
          duration: selectedFlight.duration,
          stops: selectedFlight.stops,
          price: selectedFlight.price,
          isInternational: isInternationalFlight
        }) : null,
        airfareTotal: airfareTotal,
        totalAmount: finalAmount,
        paymentType: 'full',
        initialPaymentAmount: finalAmount,
        remainingBalance: 0,
        
        fullName: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        message: formData.notes || '',
        
        primaryContact: {
          fullName: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
        },
        
        selectedRoomType: selectedRoomType ? selectedRoomType.type : null,
        hotelName: selectedRoomType ? selectedRoomType.hotelName : null,
        numberOfRooms: numberOfRooms,
        sellerPrice: pkg.price || 0,
        markup: 0,
        price: pkg.price || 0,
        
        isCustomized: customizationData ? true : false,
        customizedInclusions: customizationData ? customizationData.inclusions.map(inc => ({
          id: inc.id,
          name: inc.name,
          price: inc.price || 0,
          supplierRate: inc.supplierRate,
          markup: inc.markup,
          markupType: inc.markupType,
          supplier: inc.supplier,
          destination: inc.destination,
          pax: inc.pax,
          notes: inc.notes,
          isOriginal: inc.isOriginal,
          isChecked: inc.isChecked,
          source: inc.source,
          sellerRateId: inc.sellerRateId
        })) : [],
        customizationAdditionalPrice: customizationData ? customizationData.additionalPrice : 0,
        originalInclusions: customizationData ? (pkg.inclusions || []) : [],
        
        // Walk-in specific - no passengers array needed
        isWalkin: true,
        status: 'pending'
      };

      console.log('Submitting Walk-in Booking Data:', bookingData);

      const response = await axios.post('https://wanderwaveph-backend.onrender.com/api/bookings', {
        bookingData: JSON.stringify(bookingData)
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.data.success) {
        toast.success('✅ Walk-in appointment created successfully!', { duration: 4000 });
        
        // Reset form
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          address: '',
          notes: ''
        });
        
        setTimeout(() => {
          onClose();
          toast.success('Please visit our office to complete your booking. Confirmation email sent!', { 
            duration: 5000,
            icon: '📅'
          });
        }, 1500);
      } else {
        throw new Error(response.data.message || 'Failed to create appointment');
      }
    } catch (error) {
      console.error('Walk-in Appointment Error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create appointment. Please try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bfm-overlay">
      <div className="bfm-modal-card">
        
        <button 
          className="bfm-close-btn" 
          onClick={onClose}
          aria-label="Close Modal"
        >
          <X size={20} strokeWidth={2.5} />
        </button>
        
        {/* HEADER SECTION */}
        <div className="bfm-modal-header">
          <img 
            src="https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/6911894edaa4e3fb6cfb8afe.png" 
            alt="Wanderwave Logo" 
            className="bfm-modal-logo"
          />
          
          <h2 className="bfm-modal-title">Schedule Walk-in Appointment</h2>
          <p className="bfm-modal-subtitle">
            Book your appointment to visit our office and finalize your <strong>{pkg.name}</strong> booking.
          </p>
          
          {/* TRIP SUMMARY */}
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
                      ₱{packageTotal.toLocaleString()}
                    </span>
                    ₱{finalPackageTotal.toLocaleString()}
                  </>
                ) : (
                  `₱${packageTotal.toLocaleString()}`
                )}
              </strong>
              {appliedPromo && (
                <span className="bfm-summary-subtext" style={{color: '#10b981', fontWeight: '600'}}>
                  🎉 {appliedPromo.code} applied (-₱{discountAmount.toLocaleString()})
                </span>
              )}
            </div>
            
            {selectedFlight && (
              <>
                <div className="bfm-summary-item">
                  <span className="bfm-summary-label">Airfare</span>
                  <strong className="bfm-summary-value bfm-accent-color">
                    ₱{airfareTotal.toLocaleString()}
                  </strong>
                </div>
                
                <div className="bfm-summary-item bfm-grand-total">
                  <span className="bfm-summary-label">Grand Total</span>
                  <strong className="bfm-summary-value bfm-grand-total-value">
                    ₱{totalAmount.toLocaleString()}
                  </strong>
                </div>
              </>
            )}
          </div>

          {/* WALK-IN INFO BOX */}
          <div className="bfm-doc-req-box" style={{background: 'rgba(239, 246, 255, 0.95)', borderColor: '#3b82f6', color: '#1e40af'}}>
            <strong>🏢 Walk-in Service:</strong> Visit our office to complete booking. Bring valid ID and payment.
          </div>
        </div>

        {/* FORM CONTENT */}
        <div className="bfm-form-wrapper">
          <form className="bfm-form" onSubmit={handleSubmit}>
            <div className="bfm-form-section-header">
              <span className="bfm-passenger-badge" style={{background: '#3b82f6'}}>Contact Information</span>
            </div>

            <div className="bfm-form-grid">
              <div className="bfm-form-group">
                <label>
                  <User size={14} style={{display: 'inline', marginRight: '4px'}} />
                  First Name <span className="bfm-required">*</span>
                </label>
                <input 
                  required 
                  type="text" 
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="Juan"
                />
              </div>

              <div className="bfm-form-group">
                <label>
                  <User size={14} style={{display: 'inline', marginRight: '4px'}} />
                  Last Name <span className="bfm-required">*</span>
                </label>
                <input 
                  required 
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Dela Cruz"
                />
              </div>

              <div className="bfm-form-group">
                <label>
                  <Mail size={14} style={{display: 'inline', marginRight: '4px'}} />
                  Email Address <span className="bfm-required">*</span>
                </label>
                <input 
                  required 
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="juan@example.com"
                />
              </div>

              <div className="bfm-form-group">
                <label>
                  <Phone size={14} style={{display: 'inline', marginRight: '4px'}} />
                  Phone Number <span className="bfm-required">*</span>
                </label>
                <input 
                  required 
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="0917 123 4567"
                />
              </div>

              <div className="bfm-form-group bfm-full-width">
                <label>
                  <MapPin size={14} style={{display: 'inline', marginRight: '4px'}} />
                  Complete Address <span className="bfm-required">*</span>
                </label>
                <input 
                  required 
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="123 Main St, Makati City, Metro Manila"
                />
              </div>

              <div className="bfm-form-group bfm-full-width">
                <label>Additional Notes (Optional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Any special requests or questions..."
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="bfm-actions">
              <button 
                type="button" 
                onClick={onClose}
                className="bfm-back-btn"
              >
                Cancel
              </button>
              
              <button 
                type="submit" 
                disabled={loading}
                className="bfm-submit-btn"
                style={{
                  background: loading ? '#94a3b8' : '#3b82f6',
                  flex: 2
                }}
              >
                {loading ? 'PROCESSING...' : 'CONFIRM APPOINTMENT'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AppointmentModal;