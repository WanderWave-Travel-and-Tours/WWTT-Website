import React, { useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import BookingCustomizer from './BookingCustomizer';
import './BookingDetails.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://wanderwaveph.onrender.com';

const BookingDetails = ({ booking, onUpdate }) => {
    const [showPassengers, setShowPassengers] = useState(false);
    const [isPayingBalance, setIsPayingBalance] = useState(false);
    const [editingPassenger, setEditingPassenger] = useState(null);
    const [passengerFormData, setPassengerFormData] = useState(null);
    const [isSavingPassenger, setIsSavingPassenger] = useState(false);

    if (!booking) return null;

    // ✅ FIX: Extract destination from packageName
    const getDestination = () => {
        if (booking.packageId?.destination) {
            return booking.packageId.destination;
        }
        if (booking.packageName) {
            // Extract destination from packageName (e.g., "BORACAY 4D3N (solo)" -> "BORACAY")
            return booking.packageName.split(/\d+D\d+N/i)[0].trim();
        }
        return booking.destination || 'N/A';
    };

    // Toast notification functions
    const showSuccessToast = (message) => {
        toast.success(message, {
            position: 'top-center',
            style: { 
                border: '1px solid #10b981',
                color: '#10b981',
                backgroundColor: '#d1fae5', 
            },
            iconTheme: { 
                primary: '#10b981', 
                secondary: '#fff' 
            },
        });
    };

    const showErrorToast = (message) => {
        toast.error(message, {
            position: 'top-center', 
            style: { 
                border: '1px solid #ef4444', 
                color: '#ef4444',
                backgroundColor: '#fee2e2', 
            },
            iconTheme: { 
                primary: '#ef4444', 
                secondary: '#fff' 
            },
        });
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
    };

    const getStatusClass = (status) => {
        const map = {
            'pending': 'status-pending',
            'confirmed': 'status-confirmed',
            'fully_paid': 'status-confirmed',
            'partial_paid': 'status-partial',
            'failed': 'status-failed',
            'cancelled': 'status-cancelled'
        };
        return map[status?.toLowerCase()] || 'status-default';
    };

    const handlePayBalance = async () => {
        if (!booking.remainingBalance || booking.remainingBalance <= 0) {
            showErrorToast('No balance remaining to pay.');
            return;
        }

        try {
            setIsPayingBalance(true);
            const response = await fetch(`${API_BASE_URL}/api/bookings/${booking._id}/create-balance-payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success && data.checkoutUrl) {
                window.location.href = data.checkoutUrl;
            } else {
                showErrorToast('Failed to create payment link. Please try again.');
                setIsPayingBalance(false);
            }
        } catch (error) {
            console.error('Error creating balance payment:', error);
            showErrorToast('Failed to process payment. Please try again.');
            setIsPayingBalance(false);
        }
    };

    const handleCustomizerUpdate = (updatedBooking) => {
        if (onUpdate) {
            onUpdate(updatedBooking);
        }
        showSuccessToast('Booking customization saved successfully!');
    };

    const getTotalPax = () => {
        const { adult = 0, children = 0, infants = 0 } = booking.pax || {};
        return adult + children + infants;
    };

    const handleEditPassenger = (passenger) => {
        setEditingPassenger(passenger.passengerNumber);
        setPassengerFormData({...passenger});
    };

    const handleCancelEdit = () => {
        setEditingPassenger(null);
        setPassengerFormData(null);
    };

    const handlePassengerFormChange = (field, value) => {
        setPassengerFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSavePassenger = async () => {
        // 🐛 DEBUG: Check what API_BASE_URL actually is
        console.log('');
        console.log('🔍 ==================== API DEBUG ====================');
        console.log('🌐 API_BASE_URL:', API_BASE_URL);
        console.log('🔧 VITE_API_BASE_URL from .env:', import.meta.env.VITE_API_BASE_URL);
        console.log('📍 Environment MODE:', import.meta.env.MODE);
        console.log('📍 Is DEV?:', import.meta.env.DEV);
        console.log('📍 Is PROD?:', import.meta.env.PROD);
        console.log('====================================================');
        console.log('');

        if (!passengerFormData) {
            showErrorToast('No data to save');
            return;
        }

        // Validation
        if (!passengerFormData.firstName || !passengerFormData.lastName) {
            showErrorToast('First name and last name are required');
            return;
        }

        if (!passengerFormData.email || !passengerFormData.email.includes('@')) {
            showErrorToast('Please enter a valid email address');
            return;
        }

        if (!passengerFormData.phone) {
            showErrorToast('Phone number is required');
            return;
        }

        try {
            setIsSavingPassenger(true);

            // Find the passenger index
            const passengerIndex = booking.passengers.findIndex(
                p => p.passengerNumber === editingPassenger
            );

            if (passengerIndex === -1) {
                showErrorToast('Passenger not found');
                setIsSavingPassenger(false);
                return;
            }

            // Create updated passengers array
            const updatedPassengers = [...booking.passengers];
            updatedPassengers[passengerIndex] = {
                ...updatedPassengers[passengerIndex],
                ...passengerFormData
            };

            // 🐛 DEBUG: Show what we're about to send
            console.log('');
            console.log('🚀 ==================== API REQUEST ====================');
            console.log('📍 Full URL:', `${API_BASE_URL}/api/bookings/${booking._id}`);
            console.log('🆔 Booking ID:', booking._id);
            console.log('👤 Passenger #:', editingPassenger);
            console.log('📦 Updating fields:', Object.keys(passengerFormData));
            console.log('======================================================');
            console.log('');

            // ✅ Make the API call
            const url = `${API_BASE_URL}/api/bookings/${booking._id}`;
            
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    passengers: updatedPassengers
                })
            });

            // 🐛 DEBUG: Log response details
            console.log('');
            console.log('📡 ==================== API RESPONSE ====================');
            console.log('📡 Status Code:', response.status);
            console.log('📡 Status Text:', response.statusText);
            console.log('📡 Response OK?:', response.ok);
            console.log('📡 Content-Type:', response.headers.get('content-type'));
            console.log('=======================================================');
            console.log('');

            // ✅ Check if response is HTML (404 error page)
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('text/html')) {
                const htmlText = await response.text();
                console.error('');
                console.error('❌ ==================== ERROR ====================');
                console.error('❌ Received HTML instead of JSON!');
                console.error('❌ This means the backend route does not exist');
                console.error('❌ Response preview:', htmlText.substring(0, 200));
                console.error('==================================================');
                console.error('');
                
                throw new Error('🚨 Route not found! Backend is returning 404 HTML page instead of JSON. Check: 1) Backend server is running, 2) Route is registered in server.js, 3) Correct URL/port');
            }

            if (!response.ok) {
                const errorText = await response.text();
                console.error('');
                console.error('❌ ==================== ERROR ====================');
                console.error('❌ Response Status:', response.status);
                console.error('❌ Error Text:', errorText);
                console.error('==================================================');
                console.error('');
                
                // Try to parse as JSON for better error message
                try {
                    const errorJson = JSON.parse(errorText);
                    throw new Error(errorJson.message || `HTTP ${response.status}: Failed to update passenger`);
                } catch (parseError) {
                    throw new Error(`HTTP ${response.status}: ${errorText}`);
                }
            }

            const data = await response.json();
            
            console.log('');
            console.log('✅ ==================== SUCCESS ====================');
            console.log('✅ Response:', data);
            console.log('===================================================');
            console.log('');

            if (!data.success) {
                throw new Error(data.message || 'Failed to update passenger');
            }

            console.log('✅ Passenger updated successfully!');

            // Update parent with the booking from response
            if (onUpdate && data.booking) {
                onUpdate(data.booking);
            }

            // Clear edit mode
            setEditingPassenger(null);
            setPassengerFormData(null);
            
            showSuccessToast('Passenger details updated successfully!');

        } catch (error) {
            console.error('');
            console.error('❌ ==================== CATCH ERROR ====================');
            console.error('❌ Error Message:', error.message);
            console.error('❌ Error Stack:', error.stack);
            console.error('=======================================================');
            console.error('');
            
            // More helpful error messages based on error type
            let errorMessage = 'Failed to update passenger details';
            
            if (error.message.includes('404') || error.message.includes('Route not found')) {
                errorMessage = '🚨 Backend route not found!\n\n' +
                              'Possible fixes:\n' +
                              '1. Make sure backend server is running\n' +
                              '2. Check server.js has PUT /api/bookings/:id route\n' +
                              '3. Verify route is registered BEFORE app.use middleware\n' +
                              '4. Check .env file has correct VITE_API_BASE_URL';
            } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
                errorMessage = '🚨 Cannot connect to server!\n\n' +
                              'Is your backend running?\n' +
                              'Check: npm start in backend folder';
            } else if (error.message.includes('CORS')) {
                errorMessage = '🚨 CORS error!\n\n' +
                              'Check your backend CORS configuration';
            } else {
                errorMessage = error.message || errorMessage;
            }
            
            showErrorToast(errorMessage);
        } finally {
            setIsSavingPassenger(false);
        }
    };

    return (
        <div className="bd-container">
            <Toaster />

            {/* Main Grid */}
            <div className="bd-grid">
                {/* Left Column - Booking Info */}
                <div className="bd-card">
                    <h3 className="bd-card-title">Booking Information</h3>
                    <div className="bd-info-section">
                        <div className="bd-row">
                            <span className="bd-label">Destination</span>
                            <span className="bd-value">{getDestination()}</span>
                        </div>

                        <div className="bd-row">
                            <span className="bd-label">Travel Dates</span>
                            <span className="bd-value">
                                {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                            </span>
                        </div>

                        <div className="bd-row">
                            <span className="bd-label">Number of Travelers</span>
                            <span className="bd-value">
                                {getTotalPax()} person{getTotalPax() > 1 ? 's' : ''}
                                {booking.pax && (
                                    <span className="bd-pax-breakdown">
                                        ({booking.pax.adult} Adult{booking.pax.adult > 1 ? 's' : ''}
                                        {booking.pax.children > 0 && `, ${booking.pax.children} Child${booking.pax.children > 1 ? 'ren' : ''}`}
                                        {booking.pax.infants > 0 && `, ${booking.pax.infants} Infant${booking.pax.infants > 1 ? 's' : ''}`})
                                    </span>
                                )}
                            </span>
                        </div>

                        {booking.flightDetails && (
                            <div className="bd-flight-section">
                                <div className="bd-flight-header">
                                    <span className="bd-flight-icon">✈️</span>
                                    <h4>Flight Details</h4>
                                </div>
                                <div className="bd-flight-info">
                                    <p><strong>Airline:</strong> {booking.flightDetails.airline || 'N/A'}</p>
                                    <p><strong>Flight Number:</strong> {booking.flightDetails.flightNumber || 'N/A'}</p>
                                    <p><strong>Route:</strong> {booking.flightDetails.route || 'N/A'}</p>
                                </div>
                            </div>
                        )}

                        <div className="bd-booking-date">
                            Booked on {formatDate(booking.createdAt)}
                        </div>
                    </div>
                </div>

                {/* Right Column - Payment Info */}
                <div className="bd-card">
                    <h3 className="bd-card-title">Payment Details</h3>
                    <div className="bd-payment-breakdown">
                        <div className="bd-price-row">
                            <span>Base Price</span>
                            <span>₱{(booking.finalPackageTotal || booking.packageTotal || 0).toLocaleString()}</span>
                        </div>

                        {booking.customizationAdditionalPrice > 0 && (
                            <div className="bd-price-row bd-highlight">
                                <span>Customization</span>
                                <span className="bd-price-added">+₱{booking.customizationAdditionalPrice.toLocaleString()}</span>
                            </div>
                        )}

                        {booking.airfareTotal > 0 && (
                            <div className="bd-price-row bd-highlight">
                                <span>Airfare</span>
                                <span className="bd-price-added">+₱{booking.airfareTotal.toLocaleString()}</span>
                            </div>
                        )}

                        {booking.discountAmount > 0 && (
                            <div className="bd-price-row bd-discount">
                                <span>Discount {booking.promoCode && `(${booking.promoCode})`}</span>
                                <span className="bd-price-discount">-₱{booking.discountAmount.toLocaleString()}</span>
                            </div>
                        )}

                        <div className="bd-divider"></div>

                        <div className="bd-price-row bd-total">
                            <span>Total Amount</span>
                            <span className="bd-price-total">₱{(booking.totalAmount || 0).toLocaleString()}</span>
                        </div>

                        {booking.paymentType === 'partial' && (
                            <>
                                <div className="bd-divider" style={{ margin: '8px 0' }}></div>
                                
                                <div className="bd-price-row">
                                    <span>Initial Payment</span>
                                    <span>₱{(booking.initialPaymentAmount || 0).toLocaleString()}</span>
                                </div>

                                {booking.balancePaidAmount > 0 && (
                                    <div className="bd-price-row">
                                        <span>Balance Paid</span>
                                        <span>₱{booking.balancePaidAmount.toLocaleString()}</span>
                                    </div>
                                )}

                                {booking.remainingBalance > 0 && (
                                    <div className="bd-price-row">
                                        <span>Remaining Balance</span>
                                        <span className="bd-remaining">₱{booking.remainingBalance.toLocaleString()}</span>
                                    </div>
                                )}
                            </>
                        )}

                        {booking.remainingBalance > 0 && (
                            <button 
                                onClick={handlePayBalance}
                                className="bd-pay-balance-btn"
                                disabled={isPayingBalance}
                            >
                                {isPayingBalance ? 'Processing...' : `Pay Balance (₱${booking.remainingBalance.toLocaleString()})`}
                            </button>
                        )}

                        <div className={`bd-payment-status ${
                            booking.status === 'confirmed' || booking.status === 'fully_paid' ? 'bd-payment-success' :
                            booking.status === 'partial_paid' ? 'bd-payment-partial' :
                            booking.status === 'cancelled' ? 'bd-payment-cancelled' :
                            'bd-payment-pending'
                        }`}>
                            <span className="bd-status-icon">
                                {booking.status === 'confirmed' || booking.status === 'fully_paid' ? '✅' :
                                 booking.status === 'partial_paid' ? '⏳' :
                                 booking.status === 'cancelled' ? '❌' : '⏱️'}
                            </span>
                            <span>
                                {booking.status === 'confirmed' || booking.status === 'fully_paid' ? 'Confirmed' :
                                 booking.status === 'partial_paid' ? 'Partially Paid' :
                                 booking.status === 'cancelled' ? 'Cancelled' :
                                 'Payment Pending'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Passengers Section */}
            {booking.passengers && booking.passengers.length > 0 && (
                <div className="bd-card bd-passengers-card">
                    <div className="bd-passengers-header">
                        <h3 className="bd-card-title">Passenger Information</h3>
                        <button 
                            className="bd-toggle-btn"
                            onClick={() => setShowPassengers(!showPassengers)}
                        >
                            {showPassengers ? 'Hide' : 'Show'} Details
                            <svg 
                                width="16" 
                                height="16" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2"
                                style={{ 
                                    transform: showPassengers ? 'rotate(180deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.2s'
                                }}
                            >
                                <polyline points="6 9 12 15 18 9"/>
                            </svg>
                        </button>
                    </div>
                    
                    {showPassengers && (
                        <div className="bd-passengers-list">
                            {booking.passengers.map((passenger) => (
                                <div key={passenger.passengerNumber} className="bd-passenger-card">
                                    {editingPassenger === passenger.passengerNumber ? (
                                        // Edit Form
                                        <div className="bd-passenger-edit-form">
                                            <div className="bd-form-header">
                                                <h4>Edit Passenger {passenger.passengerNumber}</h4>
                                            </div>

                                            <div className="bd-form-grid">
                                                <div className="bd-form-group">
                                                    <label>First Name *</label>
                                                    <input
                                                        type="text"
                                                        value={passengerFormData?.firstName || ''}
                                                        onChange={(e) => handlePassengerFormChange('firstName', e.target.value)}
                                                        placeholder="First name"
                                                        required
                                                    />
                                                </div>

                                                <div className="bd-form-group">
                                                    <label>Last Name *</label>
                                                    <input
                                                        type="text"
                                                        value={passengerFormData?.lastName || ''}
                                                        onChange={(e) => handlePassengerFormChange('lastName', e.target.value)}
                                                        placeholder="Last name"
                                                        required
                                                    />
                                                </div>

                                                <div className="bd-form-group">
                                                    <label>Email *</label>
                                                    <input
                                                        type="email"
                                                        value={passengerFormData?.email || ''}
                                                        onChange={(e) => handlePassengerFormChange('email', e.target.value)}
                                                        placeholder="email@example.com"
                                                        required
                                                    />
                                                </div>

                                                <div className="bd-form-group">
                                                    <label>Phone *</label>
                                                    <input
                                                        type="tel"
                                                        value={passengerFormData?.phone || ''}
                                                        onChange={(e) => handlePassengerFormChange('phone', e.target.value)}
                                                        placeholder="09XXXXXXXXX"
                                                        required
                                                    />
                                                </div>

                                                <div className="bd-form-group">
                                                    <label>Date of Birth</label>
                                                    <input
                                                        type="date"
                                                        value={passengerFormData?.dateOfBirth || ''}
                                                        onChange={(e) => handlePassengerFormChange('dateOfBirth', e.target.value)}
                                                    />
                                                </div>

                                                <div className="bd-form-group">
                                                    <label>Gender</label>
                                                    <select
                                                        value={passengerFormData?.gender || ''}
                                                        onChange={(e) => handlePassengerFormChange('gender', e.target.value)}
                                                    >
                                                        <option value="">Select Gender</option>
                                                        <option value="Male">Male</option>
                                                        <option value="Female">Female</option>
                                                        <option value="Other">Other</option>
                                                    </select>
                                                </div>

                                                <div className="bd-form-group">
                                                    <label>Nationality</label>
                                                    <input
                                                        type="text"
                                                        value={passengerFormData?.nationality || ''}
                                                        onChange={(e) => handlePassengerFormChange('nationality', e.target.value)}
                                                        placeholder="Nationality"
                                                    />
                                                </div>

                                                <div className="bd-form-group bd-full-width">
                                                    <label>Address</label>
                                                    <input
                                                        type="text"
                                                        value={passengerFormData?.address || ''}
                                                        onChange={(e) => handlePassengerFormChange('address', e.target.value)}
                                                        placeholder="Complete address"
                                                    />
                                                </div>
                                            </div>

                                            <div className="bd-form-actions">
                                                <button 
                                                    className="bd-btn-save"
                                                    onClick={handleSavePassenger}
                                                    disabled={isSavingPassenger}
                                                >
                                                    {isSavingPassenger ? (
                                                        <>
                                                            <span className="bd-spinner-small"></span>
                                                            Saving...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <polyline points="20 6 9 17 4 12"/>
                                                            </svg>
                                                            Save Changes
                                                        </>
                                                    )}
                                                </button>
                                                <button 
                                                    className="bd-btn-cancel"
                                                    onClick={handleCancelEdit}
                                                    disabled={isSavingPassenger}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <line x1="18" y1="6" x2="6" y2="18"/>
                                                        <line x1="6" y1="6" x2="18" y2="18"/>
                                                    </svg>
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        // Display View
                                        <>
                                            <div className="bd-passenger-header">
                                                <h4>Passenger {passenger.passengerNumber}</h4>
                                                <button 
                                                    className="bd-edit-btn"
                                                    onClick={() => handleEditPassenger(passenger)}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                                    </svg>
                                                    Edit
                                                </button>
                                            </div>

                                            <div className="bd-passenger-details">
                                                <div className="bd-detail-row">
                                                    <span className="bd-detail-label">Name:</span>
                                                    <span className="bd-detail-value">
                                                        {passenger.firstName} {passenger.lastName}
                                                    </span>
                                                </div>

                                                <div className="bd-detail-row">
                                                    <span className="bd-detail-label">Email:</span>
                                                    <span className="bd-detail-value">{passenger.email}</span>
                                                </div>

                                                <div className="bd-detail-row">
                                                    <span className="bd-detail-label">Phone:</span>
                                                    <span className="bd-detail-value">{passenger.phone}</span>
                                                </div>

                                                <div className="bd-detail-row">
                                                    <span className="bd-detail-label">Date of Birth:</span>
                                                    <span className="bd-detail-value">
                                                        {formatDate(passenger.dateOfBirth)} ({passenger.age} years old)
                                                    </span>
                                                </div>

                                                <div className="bd-detail-row">
                                                    <span className="bd-detail-label">Gender:</span>
                                                    <span className="bd-detail-value">{passenger.gender}</span>
                                                </div>

                                                <div className="bd-detail-row">
                                                    <span className="bd-detail-label">Nationality:</span>
                                                    <span className="bd-detail-value">{passenger.nationality}</span>
                                                </div>

                                                <div className="bd-detail-row">
                                                    <span className="bd-detail-label">Address:</span>
                                                    <span className="bd-detail-value">{passenger.address}</span>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Package Inclusions Section */}
            {booking.customizedInclusions && booking.customizedInclusions.length > 0 && (
                <div className="bd-card bd-inclusions-card">
                    <div className="bd-inclusions-header">
                        <h3 className="bd-card-title">Package Inclusions</h3>
                        {booking.isCustomized && (
                            <span className="bd-customized-badge">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                </svg>
                                Customized
                            </span>
                        )}
                    </div>
                    
                    <div className="bd-inclusions-grid">
                        {booking.customizedInclusions
                            .filter(inc => inc.isChecked)
                            .map((inclusion, index) => (
                                <div key={index} className="bd-inclusion-item">
                                    <svg className="bd-check-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="20 6 9 17 4 12"/>
                                    </svg>
                                    <div>
                                        <span className="bd-inclusion-name">{inclusion.name}</span>
                                        {inclusion.price > 0 && !inclusion.isOriginal && (
                                            <span className="bd-inclusion-price">
                                                +₱{inclusion.price.toLocaleString()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {/* Customize Your Booking - Inline Component */}
            <BookingCustomizer 
                booking={booking}
                onUpdate={handleCustomizerUpdate}
            />

            {/* Additional Message */}
            {booking.message && (
                <div className="bd-card bd-message-card">
                    <h3 className="bd-card-title">Your Message</h3>
                    <div className="bd-message-content">
                        {booking.message}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookingDetails;