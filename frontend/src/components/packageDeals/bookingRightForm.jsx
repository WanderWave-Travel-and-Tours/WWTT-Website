import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, Calendar, Plane, Hotel, Utensils, Bus, Camera, Briefcase, 
  ChevronLeft, ChevronRight, Minus, Plus, X, MessageCircle, Upload, CheckCircle 
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import FlightSearch from '../flightSearch/flightSearch';
import HotelRoomSelector from './hotelRoomSelector';
import axios from 'axios';
//import './BookingRightColumn.css';

const BookingRightForm = ({ pkg }) => {
  const navigate = useNavigate();
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to start of today for comparison
  const oneYearFromNow = new Date(today);
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

  const [selectedDate, setSelectedDate] = useState(null);
  const [quantities, setQuantities] = useState({ adult: 1 });
  // Set initial month to today's month
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth()));
  const durationDays = parseInt(pkg.duration?.match(/(\d+)D/)?.[1] || 1);
  const durationNights = parseInt(pkg.duration?.match(/(\d+)N/)?.[1] || durationDays - 1); // Extract nights from "4D3N"
  const [showModal, setShowModal] = useState(false);
  const [showFlightSearchModal, setShowFlightSearchModal] = useState(false);
  
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [bookingWithAirfare, setBookingWithAirfare] = useState(false);
  
  const [selectedRoomType, setSelectedRoomType] = useState(null);
  const [hotelData, setHotelData] = useState(null);
  const [loadingHotelData, setLoadingHotelData] = useState(false);
  
  const [passengerStep, setPassengerStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const totalPassengers = quantities.adult || 1;
  
  const isInternationalFlight = selectedFlight && 
    selectedFlight.departure.iataCode.substring(0, 2) !== selectedFlight.arrival.iataCode.substring(0, 2);
  const requiresPassport = isInternationalFlight;
  const requiresID = selectedFlight && !isInternationalFlight;

  const calculateRoomsNeeded = () => {
    if (!selectedRoomType) return 1;
    return Math.ceil(totalPassengers / (selectedRoomType.capacity || 4));
  };

  const numberOfRooms = calculateRoomsNeeded();

  useEffect(() => {
  const fetchHotelData = async () => {
    const destination = pkg.destination || pkg.location;
    
    if (!destination) {
      console.log('❌ No destination or location found in package');
      return;
    }
    
    try {
      setLoadingHotelData(true);
      const city = destination.split(',')[0].trim();
      const response = await fetch(`http://localhost:5000/api/hotels/location/${encodeURIComponent(city)}/rooms`);
      const data = await response.json();
      
      if (data.success && data.data && data.data.length > 0) {
        const roomTypes = data.data;
        
        console.log('🛏️ All room types:', roomTypes);
        
        setHotelData({
          name: `${city} Hotels`,
          location: city,
          roomTypes: roomTypes
        });
        
        const sortedRooms = [...roomTypes].sort((a, b) => a.price - b.price);
        console.log('✅ Auto-selecting cheapest room:', sortedRooms[0]);
        setSelectedRoomType(sortedRooms[0]);
      } else {
        console.log('⚠️ No room types found for:', city);
      }
    } catch (error) {
      console.error('❌ Error:', error);
    } finally {
      setLoadingHotelData(false);
    }
  };

  fetchHotelData();
}, [pkg.destination, pkg.location]);

  const [passengers, setPassengers] = useState(
    Array.from({ length: totalPassengers }, (_, idx) => ({
      passengerNumber: idx + 1,
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      age: '',
      gender: '',
      address: '',
      nationality: 'Filipino',
      idFile: null,
      idFileName: '',
      passportFile: null,
      passportFileName: ''
    }))
  );
  React.useEffect(() => {
    const newTotal = quantities.adult || 1;
    setPassengers(prevPassengers => {
        if (newTotal === prevPassengers.length) {
            return prevPassengers; 
        }
        
        return Array.from({ length: newTotal }, (_, idx) => 
          prevPassengers[idx] || {
            passengerNumber: idx + 1,
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            dateOfBirth: '',
            age: '',
            gender: '',
            address: '',
            nationality: 'Filipino',
            idFile: null,
            idFileName: '',
            passportFile: null,
            passportFileName: ''
          }
        );
    });
    
  }, [quantities.adult]);

  const packageTotal = (() => {
    const basePax = quantities.adult || 1;
    const basePackagePrice = pkg.price * basePax;
    
    // If no room type selected, return 0
    if (!selectedRoomType) return 0;
    
    // Room upgrade pricing per NIGHT per pax
    const roomUpgradePricing = {
      'BUDGET': 0,          // No additional charge (default)
      'STANDARD': 750,      // +₱750/night/pax
      '4 STAR': 1200,       // +₱1,200/night/pax
      '5 STAR': 2040        // +₱2,040/night/pax
    };
    
    // Get the room type key
    const roomTypeKey = selectedRoomType.type?.toUpperCase() || '';
    
    // Find matching upgrade price
    let upgradePerDayPerPax = 0;
    for (const [key, price] of Object.entries(roomUpgradePricing)) {
      if (roomTypeKey.includes(key)) {
        upgradePerDayPerPax = price;
        break;
      }
    }
    
    // Calculate total upgrade cost: upgrade price × NIGHTS × pax
    const totalUpgradeCost = upgradePerDayPerPax * durationNights * basePax;
    
    // Final price = base package price + upgrade cost
    const finalPrice = basePackagePrice + totalUpgradeCost;
    
    console.log('💰 === PRICE CALCULATION ===');
    console.log('Base Package Price:', basePackagePrice);
    console.log('Room Type:', selectedRoomType.type);
    console.log('Upgrade per night per pax:', upgradePerDayPerPax);
    console.log('Duration (nights):', durationNights);
    console.log('Number of pax:', basePax);
    console.log('Total Upgrade Cost:', totalUpgradeCost);
    console.log('FINAL PRICE:', finalPrice);
    console.log('💰 ========================');
    
    return finalPrice;
  })();

  const airfareTotal = selectedFlight ? selectedFlight.price.amount : 0;
  const totalAmount = packageTotal + airfareTotal;

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const isInSelectedRange = (day) => {
    if (!selectedDate) return false;
    const endDate = selectedDate + durationDays - 1;
    return day >= selectedDate && day <= endDate;
  };

  const getEndDate = () => {
    if (!selectedDate) return null;
    return selectedDate + durationDays - 1;
  };

  const handleQuantity = (type, delta) => {
    setQuantities(prev => ({
      ...prev,
      [type]: Math.max(1, Math.min(20, (prev[type] || 1) + delta))
    }));
  };

  const changeMonth = (offset) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1);
    
    // Prevent going back beyond today's month
    const todayMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const maxMonth = new Date(oneYearFromNow.getFullYear(), oneYearFromNow.getMonth(), 1);

    if (offset < 0 && newDate < todayMonth) {
      newDate.setTime(todayMonth.getTime());
    }
    
    if (offset > 0 && newDate > maxMonth) {
      newDate.setTime(maxMonth.getTime());
    }

    setCurrentMonth(newDate);
  };

  const isDaySelectable = (day) => {
    const checkDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    
    // Must be today or later (minimum date)
    const isPast = checkDate < today;
    
    // Must be within one year from now (maximum date)
    const isFutureLimit = checkDate > oneYearFromNow;
    
    return !isPast && !isFutureLimit;
  };

  const handleSelectDate = (day) => {
    if (isDaySelectable(day)) {
      setSelectedDate(day);
    } else {
      toast.error("Invalid date: Please select a date from today up to 1 year from now.", {
        style: { border: '1px solid #ef4444', color: '#ef4444' },
        iconTheme: { primary: '#ef4444', secondary: '#fff' },
      });
    }
  };

  const handleRoomTypeChange = (roomType) => {
    console.log('🛏️ Room type changed to:', roomType);
    setSelectedRoomType(roomType);
    toast.success(`Room upgraded to ${roomType.type}`, { duration: 2000 });
  };

  const handleBookClick = () => {
    if (!selectedDate) {
      toast.error("Please select a travel date first!", {
        style: { border: '1px solid #ef4444', color: '#ef4444' },
        iconTheme: { primary: '#ef4444', secondary: '#fff' },
      });
      return;
    }
    setBookingWithAirfare(false);
    setPassengerStep(1);
    setShowModal(true);
  };

  const handleBookWithAirfare = () => {
    if (!selectedDate) {
      toast.error("Please select a travel date first!", {
        style: { border: '1px solid #ef4444', color: '#ef4444' },
        iconTheme: { primary: '#ef4444', secondary: '#fff' },
      });
      return;
    }
    setShowFlightSearchModal(true);
  };

  const handleFlightSelected = (flight) => {
    setSelectedFlight(flight);
    setShowFlightSearchModal(false);
    setBookingWithAirfare(true);
    
    toast.success(
      `✈️ Flight Added! ${flight.airline.name} - ${flight.price.formatted}`,
      { duration: 3000 }
    );
    
    setTimeout(() => {
      setPassengerStep(1);
      setShowModal(true);
    }, 500);
  };

  const handleRemoveFlight = () => {
    setSelectedFlight(null);
    setBookingWithAirfare(false);
    toast.success("Flight removed from booking", { duration: 2000 });
  };

  const handlePassengerChange = (index, field, value) => {
    const updated = [...passengers];
    updated[index][field] = value;
    setPassengers(updated);
  };

  const handleFileUpload = (index, fileType, event) => {
    const file = event.target.files[0];
    if (file) {
      const updated = [...passengers];
      if (fileType === 'id') {
        updated[index].idFile = file;
        updated[index].idFileName = file.name;
      } else if (fileType === 'passport') {
        updated[index].passportFile = file;
        updated[index].passportFileName = file.name;
      }
      setPassengers(updated);
    }
  };

  const removeFile = (index, fileType) => {
    const updated = [...passengers];
    if (fileType === 'id') {
      updated[index].idFile = null;
      updated[index].idFileName = '';
    } else if (fileType === 'passport') {
      updated[index].passportFile = null;
      updated[index].passportFileName = '';
    }
    setPassengers(updated);
  };

  const validateCurrentPassenger = () => {
    const p = passengers[passengerStep - 1];
    if (!p.firstName || !p.lastName || !p.email || !p.phone || !p.dateOfBirth || 
        !p.age || !p.gender || !p.address || !p.nationality) {
      toast.error(`Please fill in all required fields for Passenger ${passengerStep}`);
      return false;
    }

    if (bookingWithAirfare) {
      if (requiresID && !p.idFile) {
        toast.error(`Please upload a valid ID for Passenger ${passengerStep}`);
        return false;
      }
      if (requiresPassport && !p.passportFile) {
        toast.error(`Please upload passport for Passenger ${passengerStep}`);
        return false;
      }
    }
    return true;
  };

  const handleNextPassenger = (e) => {
    e.preventDefault();
    if (validateCurrentPassenger()) {
      if (passengerStep < totalPassengers) {
        setPassengerStep(passengerStep + 1);
      } else {
        handleFinalSubmit(e);
      }
    }
  };

  const handleBackPassenger = () => {
    if (passengerStep > 1) setPassengerStep(passengerStep - 1);
  };

  const handleFinalSubmit = async (e) => {
  if (e) e.preventDefault();
  if (!validateCurrentPassenger()) return;
  
  setLoading(true);

  try {
    const formData = new FormData();
    
    const endDate = getEndDate();
    
    const bookingData = {
      packageName: pkg.name,
      startDate: `${monthNames[currentMonth.getMonth()]} ${selectedDate}, ${currentMonth.getFullYear()}`,
      endDate: `${monthNames[currentMonth.getMonth()]} ${endDate}, ${currentMonth.getFullYear()}`,
      duration: pkg.duration,
      pax: quantities,
      packageTotal: packageTotal,
      includesAirfare: bookingWithAirfare,
      flightDetails: selectedFlight ? {
        airline: selectedFlight.airline.name,
        flightNumber: selectedFlight.airline.flightNumber || 'N/A',
        route: `${selectedFlight.departure.iataCode} → ${selectedFlight.arrival.iataCode}`,
        departureTime: selectedFlight.departure.time,
        arrivalTime: selectedFlight.arrival.time,
        price: selectedFlight.price.amount,
        formatted: selectedFlight.price.formatted,
        isInternational: isInternationalFlight
      } : null,
      airfareTotal: airfareTotal,
      totalAmount: totalAmount,
      primaryContact: {
        fullName: `${passengers[0].firstName} ${passengers[0].lastName}`,
        email: passengers[0].email,
        phone: passengers[0].phone
      }
    };

    formData.append('bookingData', JSON.stringify(bookingData));

    console.log('📤 Appending', passengers.length, 'passengers to FormData');
    
    passengers.forEach((passenger, index) => {
      console.log(`  Passenger ${index + 1}:`, {
        firstName: passenger.firstName,
        lastName: passenger.lastName,
        email: passenger.email
      });
      
      formData.append(`passengers[${index}][passengerNumber]`, (index + 1).toString());
      formData.append(`passengers[${index}][firstName]`, passenger.firstName || '');
      formData.append(`passengers[${index}][lastName]`, passenger.lastName || '');
      formData.append(`passengers[${index}][email]`, passenger.email || '');
      formData.append(`passengers[${index}][phone]`, passenger.phone || '');
      formData.append(`passengers[${index}][dateOfBirth]`, passenger.dateOfBirth || '');
      formData.append(`passengers[${index}][age]`, (passenger.age || 0).toString());
      formData.append(`passengers[${index}][gender]`, passenger.gender || '');
      formData.append(`passengers[${index}][address]`, passenger.address || '');
      formData.append(`passengers[${index}][nationality]`, passenger.nationality || 'Filipino');
      
      if (passenger.idFile) {
        formData.append(`passenger_${index}_id`, passenger.idFile);
        console.log(`    ✅ ID file attached: ${passenger.idFile.name}`);
      }
      
      if (passenger.passportFile) {
        formData.append(`passenger_${index}_passport`, passenger.passportFile);
        console.log(`    ✅ Passport file attached: ${passenger.passportFile.name}`);
      }
    });

    console.log('📋 Complete FormData contents:');
    let fieldCount = 0;
    for (let [key, value] of formData.entries()) {
      fieldCount++;
      if (value instanceof File) {
        console.log(`  ${key}: [File] ${value.name} (${value.size} bytes)`);
      } else {
        console.log(`  ${key}: ${value}`);
      }
    }

    let passengerFieldCount = 0;
    for (let [key, value] of formData.entries()) {
      if (key.startsWith('passengers[')) passengerFieldCount++;
    }

    const bookingRes = await axios.post(
      'http://localhost:5000/api/bookings', 
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    if (!bookingRes.data.success) {
      throw new Error(bookingRes.data.message || 'Booking creation failed');
    }

    if (!bookingRes.data.data || !bookingRes.data.data._id) {
      console.error('❌ Invalid response structure');
      throw new Error('Booking ID not found in response');
    }

    const createdBooking = bookingRes.data.data;
    const bookingId = createdBooking._id;

    const paymentRes = await axios.post(
      'http://localhost:5000/api/payment/create-intent',
      { bookingId: bookingId.toString() },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

    if (!paymentRes.data.success) {
      throw new Error(paymentRes.data.message || 'Payment link creation failed');
    }

    if (!paymentRes.data.checkoutUrl) {
      throw new Error('Checkout URL not found in response');
    }

    // STEP 3: Redirect
    toast.success('✅ Booking confirmed! Redirecting to payment...', { duration: 2000 });
    setShowModal(false);
    
    setTimeout(() => {
      console.log('🌐 Redirecting to PayMongo...');
      window.location.href = paymentRes.data.checkoutUrl;
    }, 2000);

  } catch (error) {
    console.error('❌ ERROR:', error);
    console.error('❌ Error message:', error.message);
    
    if (error.response) {
      console.error('❌ Response status:', error.response.status);
      console.error('❌ Response data:', error.response.data);
    }

    const errorMsg = error.response?.data?.message || error.message || 'Booking failed. Please try again.';
    
    toast.error(`❌ ${errorMsg}`, {
      duration: 5000,
      style: {
        background: '#fee2e2',
        color: '#dc2626',
        border: '1px solid #fca5a5'
      }
    });
    
  } finally {
    setLoading(false);
  }
};

  const handleContactSales = () => {
    toast.loading("Connecting to sales representative...", {
      duration: 3000,
      style: { background: '#333', color: '#fff' }
    });
  };

  const currentPassenger = passengers[passengerStep - 1];
  const progressPercent = Math.round((passengerStep / totalPassengers) * 100);

  useEffect(() => {
    console.log('📊 Component State:', {
      hotelData: hotelData ? 'Found' : 'Not found',
      hotelName: hotelData?.name || 'N/A',
      roomTypes: hotelData?.roomTypes?.length || 0,  // ✅ ROOT LEVEL
      selectedRoomType: selectedRoomType?.type || 'None',
      loadingHotelData
    });
  }, [hotelData, selectedRoomType, loadingHotelData]);

  // Determine if the currentMonth is the today's month for back button
  const isCurrentMonthToday = currentMonth.getFullYear() === today.getFullYear() && currentMonth.getMonth() === today.getMonth();
  // Determine if the currentMonth is the max allowed month for forward button
  const isCurrentMonthMax = currentMonth.getFullYear() === oneYearFromNow.getFullYear() && currentMonth.getMonth() === oneYearFromNow.getMonth();

  return (
    <div className="booking-form-content">
      <Toaster position="top-center" reverseOrder={false} />
      <div className="form-header">
        <h1 className="package-title">{pkg.name}</h1>
        <div className="price-row">
          <span className="price-amount">₱{pkg.price.toLocaleString()}</span>
          <span className="starts-at">/ pax</span>
        </div>
        
        <div style={{ display: 'flex', gap: '16px', color: '#4b5563', fontSize: '0.9rem' }}>
          <div style={{display:'flex', alignItems:'center', gap:'6px'}}>
            <MapPin size={16} color="#fc9c1b"/> {pkg.location}
          </div>
          <div style={{display:'flex', alignItems:'center', gap:'6px'}}>
            <Calendar size={16} color="#fc9c1b"/> {pkg.duration} / {pkg.nights}
          </div>
        </div>
      </div>

      <div className="service-icons">
        {[Plane, Hotel, Bus, Utensils, Camera, Briefcase].map((Icon, i) => (
          <Icon key={i} size={20} className="service-icon" />
        ))}
      </div>

      <div className="calendar-section">
        <label style={{display:'block', marginBottom:'12px', fontWeight:'600', color:'#374151'}}>
          Select Travel Date
        </label>
        {selectedDate && (
          <div style={{
            padding: '12px',
            background: '#f0fdf4',
            border: '1px solid #86efac',
            borderRadius: '8px',
            marginBottom: '12px',
            fontSize: '0.9rem',
            color: '#166534'
          }}>
            <strong>Selected Trip:</strong> {monthNames[currentMonth.getMonth()]} {selectedDate} - {getEndDate()}, {currentMonth.getFullYear()} ({durationDays} days)
          </div>
        )}
        <div className="calendar-wrapper">
          <div className="calendar-header">
            <button 
              onClick={() => changeMonth(-1)} 
              disabled={isCurrentMonthToday}
              style={{background:'none', border:'none', cursor: isCurrentMonthToday ? 'not-allowed' : 'pointer', opacity: isCurrentMonthToday ? 0.5 : 1}}
            >
              <ChevronLeft size={20} color="#4b5563"/>
            </button>
            <span style={{fontWeight:'600'}}>{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
            <button 
              onClick={() => changeMonth(1)} 
              disabled={isCurrentMonthMax}
              style={{background:'none', border:'none', cursor: isCurrentMonthMax ? 'not-allowed' : 'pointer', opacity: isCurrentMonthMax ? 0.5 : 1}}
            >
              <ChevronRight size={20} color="#4b5563"/>
            </button>
          </div>
          
          <div className="calendar-grid">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={i} className="calendar-day-label">{d}</div>
            ))}
            {[...Array(firstDay)].map((_, i) => <div key={`empty-${i}`} />)}
            {[...Array(daysInMonth)].map((_, i) => {
              const day = i + 1;
              const isSelectable = isDaySelectable(day);
              const isStartDate = selectedDate === day;
              const isInRange = isInSelectedRange(day);
              const isEndDate = selectedDate && day === getEndDate();
              
              return (
                <button
                  key={day}
                  onClick={() => handleSelectDate(day)}
                  disabled={!isSelectable}
                  className={`calendar-day ${isStartDate ? 'selected' : ''} ${isInRange && !isStartDate ? 'in-range' : ''} ${isEndDate ? 'end-date' : ''} ${!isSelectable ? 'disabled' : ''}`}
                  style={{
                    background: isStartDate ? '#fc9c1b' : isEndDate ? '#22c55e' : isInRange ? '#fef3c7' : 'white',
                    color: isStartDate || isEndDate ? 'white' : isInRange ? '#92400e' : isSelectable ? '#374151' : '#ccc',
                    fontWeight: isStartDate || isEndDate ? '600' : '400',
                    cursor: isSelectable ? 'pointer' : 'not-allowed',
                    opacity: isSelectable ? 1 : 0.4 
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="quantity-section">
        <div className="quantity-item">
          <div>
            <div style={{display:'flex', alignItems:'center'}}>
              <span className="quantity-label">Standard Pax</span>
              <span className="quantity-discount-badge">Best Value</span>
            </div>
            <div style={{fontSize:'0.8rem', color:'#6b7280', marginTop:'4px'}}>3+ years old</div>
          </div>
          
          <div className="quantity-controls">
            <button onClick={() => handleQuantity('adult', -1)} className="quantity-btn">
              <Minus size={16} />
            </button>
            <span className="quantity-value">{quantities.adult}</span>
            <button onClick={() => handleQuantity('adult', 1)} className="quantity-btn">
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>

      {loadingHotelData && (
        <div style={{padding:'1rem', background:'#fef3c7', borderRadius:'8px', marginBottom:'1rem'}}>
          Loading hotel data...
        </div>
      )}

      {!loadingHotelData && (!hotelData || !hotelData.roomTypes || hotelData.roomTypes.length === 0) && (
        <div style={{padding:'1rem', background:'#fee2e2', borderRadius:'8px', marginBottom:'1rem', fontSize:'0.85rem'}}>
          ⚠️ No room types available for {pkg.destination || pkg.location || 'this destination'}
        </div>
      )}

      {hotelData && hotelData.roomTypes && hotelData.roomTypes.length > 0 && (
        <HotelRoomSelector
          roomTypes={hotelData.roomTypes}
          selectedRoomType={selectedRoomType}
          onRoomTypeChange={handleRoomTypeChange}
          numberOfRooms={numberOfRooms}
          numberOfPax={quantities.adult || 1}
          durationDays={durationDays}
          durationNights={durationNights}
        />
      )}

      {selectedFlight && (
        <div style={{
          background: '#fff7ed',
          border: '2px solid #fc9c1b',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'10px'}}>
            <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
              <Plane size={20} color="#fc9c1b"/>
              <strong style={{color:'#1f2937', fontSize:'0.95rem'}}>Flight Added to Package</strong>
            </div>
            <button 
              onClick={handleRemoveFlight}
              style={{
                background:'none', 
                border:'none', 
                color:'#ef4444', 
                cursor:'pointer',
                fontSize:'0.85rem',
                textDecoration:'underline'
              }}
            >
              Remove
            </button>
          </div>
          
          <div style={{fontSize:'0.9rem', color:'#374151', lineHeight:'1.6'}}>
            <div><strong>{selectedFlight.airline.name}</strong> • {selectedFlight.airline.flightNumber || 'Flight'}</div>
            <div>{selectedFlight.departure.iataCode} → {selectedFlight.arrival.iataCode}</div>
            <div style={{color:'#6b7280', fontSize:'0.85rem'}}>{selectedFlight.departure.displayTime} - {selectedFlight.arrival.displayTime}</div>
            <div style={{marginTop:'8px', fontWeight:'700', color:'#fc9c1b', fontSize:'1rem'}}>
              +{selectedFlight.price.formatted}
            </div>
          </div>
        </div>
      )}

      <div className="booking-footer">
        <div className="total-row">
          <span className="total-label">
            {selectedFlight ? 'Package Total' : 'Total Amount'}
          </span>
          <span className="total-amount">
            {packageTotal === 0 ? 'Select Room Type' : `₱${packageTotal.toLocaleString()}`}
          </span>
        </div>
        
        {selectedFlight && (
          <>
            <div className="total-row" style={{fontSize:'0.9rem', color:'#6b7280'}}>
              <span>+ Airfare</span>
              <span>₱{airfareTotal.toLocaleString()}</span>
            </div>
            <div className="total-row" style={{
              borderTop:'2px solid #fc9c1b', 
              paddingTop:'12px', 
              marginTop:'8px',
              fontSize:'1.1rem', 
              fontWeight:'800',
              color:'#1f2937'
            }}>
              <span>GRAND TOTAL</span>
              <span style={{color:'#fc9c1b'}}>₱{totalAmount.toLocaleString()}</span>
            </div>
          </>
        )}
        
        <button 
          className="book-now-btn" 
          onClick={handleBookClick}
          disabled={!selectedRoomType}
          style={{
            opacity: !selectedRoomType ? 0.5 : 1,
            cursor: !selectedRoomType ? 'not-allowed' : 'pointer'
          }}
        >
          {selectedFlight ? '🎫 Book Package + Flight' : 'Book This Trip'}
        </button>

        <button className="book-with-airfare-btn" onClick={handleBookWithAirfare}>
          <Plane size={20} />
          {selectedFlight ? 'Change Flight' : 'Add Airfare'}
        </button>

        <button className="contact-sales-footer-btn" onClick={handleContactSales}>
           <MessageCircle size={20} />
           Contact Sales
        </button>

        <p style={{textAlign:'center', fontSize:'0.8rem', color:'#9ca3af', marginTop:'12px'}}>
          No payment required today.
        </p>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            
            <button 
              className="modal-close-btn" 
              onClick={() => setShowModal(false)}
              aria-label="Close Modal"
            >
              <X size={44} strokeWidth={3} />
            </button>
            
            <div className="modal-header">
              <img 
                src="https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/6911894edaa4e3fb6cfb8afe.png" 
                alt="Wanderwave Logo" 
                className="modal-logo"
              />
              
              <h2 className="modal-title">Your Adventure Awaits!</h2>
              <p className="modal-subtitle">
                Please complete your details below. We'll secure your spot for <strong>{pkg.name}</strong> instantly.
              </p>
              
              <div className="modal-trip-summary">
                <div className="summary-item">
                    <span className="summary-label">TRAVEL DATES</span>
                    <strong className="summary-value">
                      {monthNames[currentMonth.getMonth()]} {selectedDate} - {getEndDate()}, {currentMonth.getFullYear()}
                    </strong>
                    <span style={{fontSize:'0.85rem', color:'#6b7280'}}>({durationDays} days trip)</span>
                </div>
                <div className="summary-divider"></div>
                <div className="summary-item">
                    <span className="summary-label">PACKAGE PRICE</span>
                    <strong className="summary-value price">₱{packageTotal.toLocaleString()}</strong>
                </div>
                
                {selectedFlight && (
                  <>
                    <div className="summary-divider"></div>
                    <div className="summary-item">
                      <span className="summary-label">
                        <Plane size={14} style={{display:'inline', marginRight:'4px'}}/>
                        AIRFARE ({selectedFlight.airline.name})
                      </span>
                      <strong className="summary-value" style={{color:'#fc9c1b'}}>
                        ₱{airfareTotal.toLocaleString()}
                      </strong>
                      <span style={{fontSize:'0.85rem', color:'#6b7280'}}>
                        {selectedFlight.departure.iataCode} → {selectedFlight.arrival.iataCode}
                      </span>
                    </div>
                    <div className="summary-divider"></div>
                    <div className="summary-item" style={{background:'#fff7ed', padding:'12px', borderRadius:'8px'}}>
                      <span className="summary-label">GRAND TOTAL</span>
                      <strong className="summary-value" style={{fontSize:'1.4rem', color:'#fc9c1b'}}>
                        ₱{totalAmount.toLocaleString()}
                      </strong>
                    </div>
                  </>
                )}
              </div>

              {bookingWithAirfare && (
                <div style={{
                  background: isInternationalFlight ? '#eff6ff' : '#fef3c7',
                  border: `1px solid ${isInternationalFlight ? '#3b82f6' : '#f59e0b'}`,
                  borderRadius: '8px',
                  padding: '10px 14px',
                  marginTop: '16px',
                  fontSize: '0.85rem',
                  color: isInternationalFlight ? '#1e40af' : '#92400e',
                  fontWeight: 500
                }}>
                  <strong>📋 Required Documents:</strong>
                  {isInternationalFlight ? ' Passport for all passengers' : ' Valid ID for all passengers'}
                </div>
              )}

              <div style={{marginTop: '16px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
                  <span style={{fontSize: '0.85rem', fontWeight: '600', color: '#64748b'}}>
                    Passenger {passengerStep} of {totalPassengers}
                    {passengerStep === 1 && <span style={{color:'#f97316', marginLeft:'6px'}}>(Primary)</span>}
                  </span>
                  <span style={{fontSize: '0.85rem', color: '#94a3b8'}}>
                    {progressPercent}% Complete
                  </span>
                </div>
                <div style={{
                  width: '100%',
                  height: '6px',
                  background: '#e2e8f0',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${progressPercent}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #f97316, #ea580c)',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            </div>

            <form className="modal-form" onSubmit={handleNextPassenger}>
              <h3 style={{
                color: '#334155',
                fontSize: '1rem',
                fontWeight: '700',
                marginBottom: '20px',
                paddingBottom: '10px',
                borderBottom: '2px solid #e2e8f0'
              }}>
                Passenger {passengerStep}
                {passengerStep === 1 && <span style={{fontSize:'0.85rem', color:'#f97316', marginLeft:'8px'}}>(Primary Contact)</span>}
              </h3>

              <div className="form-grid">
                
                <div className="form-group">
                  <label>FIRST NAME <span style={{color:'#ef4444'}}>*</span></label>
                  <input 
                    required 
                    type="text" 
                    value={currentPassenger.firstName}
                    onChange={(e) => handlePassengerChange(passengerStep - 1, 'firstName', e.target.value)}
                    placeholder="Juan"
                  />
                </div>

                <div className="form-group">
                  <label>LAST NAME <span style={{color:'#ef4444'}}>*</span></label>
                  <input 
                    required 
                    type="text"
                    value={currentPassenger.lastName}
                    onChange={(e) => handlePassengerChange(passengerStep - 1, 'lastName', e.target.value)}
                    placeholder="Dela Cruz"
                  />
                </div>

                <div className="form-group">
                  <label>EMAIL ADDRESS <span style={{color:'#ef4444'}}>*</span></label>
                  <input 
                    required 
                    type="email"
                    value={currentPassenger.email}
                    onChange={(e) => handlePassengerChange(passengerStep - 1, 'email', e.target.value)}
                    placeholder="juan@example.com"
                  />
                </div>

                <div className="form-group">
                  <label>PHONE NUMBER <span style={{color:'#ef4444'}}>*</span></label>
                  <input 
                    required 
                    type="tel"
                    value={currentPassenger.phone}
                    onChange={(e) => handlePassengerChange(passengerStep - 1, 'phone', e.target.value)}
                    placeholder="0917 123 4567"
                  />
                </div>

                <div className="form-group">
                  <label>DATE OF BIRTH <span style={{color:'#ef4444'}}>*</span></label>
                  <input 
                    required 
                    type="date"
                    value={currentPassenger.dateOfBirth}
                    onChange={(e) => handlePassengerChange(passengerStep - 1, 'dateOfBirth', e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="form-group">
                  <label>AGE <span style={{color:'#ef4444'}}>*</span></label>
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

                <div className="form-group">
                  <label>GENDER <span style={{color:'#ef4444'}}>*</span></label>
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

                <div className="form-group">
                  <label>NATIONALITY <span style={{color:'#ef4444'}}>*</span></label>
                  <input 
                    required 
                    type="text"
                    value={currentPassenger.nationality}
                    onChange={(e) => handlePassengerChange(passengerStep - 1, 'nationality', e.target.value)}
                    placeholder="Filipino"
                  />
                </div>

                <div className="form-group full-width">
                  <label>COMPLETE ADDRESS <span style={{color:'#ef4444'}}>*</span></label>
                  <input 
                    required 
                    type="text"
                    value={currentPassenger.address}
                    onChange={(e) => handlePassengerChange(passengerStep - 1, 'address', e.target.value)}
                    placeholder="123 Main St, Makati City, Metro Manila"
                  />
                </div>

                {bookingWithAirfare && requiresID && (
                  <div className="form-group full-width">
                    <label>
                      UPLOAD VALID ID <span style={{color:'#ef4444'}}>*</span>
                      <span style={{fontSize:'0.75rem', color:'#6b7280', marginLeft:'8px', fontWeight:400}}>
                        (Driver's License, UMID, SSS, Postal ID, etc.)
                      </span>
                    </label>
                    
                    {currentPassenger.idFileName ? (
                      <div className="file-uploaded">
                        <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                          <CheckCircle size={18} color="#22c55e"/>
                          <span>{currentPassenger.idFileName}</span>
                        </div>
                        <button 
                          type="button"
                          onClick={() => removeFile(passengerStep - 1, 'id')}
                          style={{
                            background: '#fef2f2',
                            color: '#dc2626',
                            border: '1px solid #fecaca',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="file-upload-box">
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleFileUpload(passengerStep - 1, 'id', e)}
                          id={`id-upload-${passengerStep}`}
                          style={{display: 'none'}}
                        />
                        <label htmlFor={`id-upload-${passengerStep}`} className="file-upload-label">
                          <Upload size={32} color="#94a3b8"/>
                          <span style={{fontWeight:600, color:'#475569'}}>Click to upload ID</span>
                          <span style={{fontSize:'0.8rem', color:'#94a3b8'}}>PNG, JPG or PDF (Max 5MB)</span>
                        </label>
                      </div>
                    )}
                  </div>
                )}

                {bookingWithAirfare && requiresPassport && (
                  <div className="form-group full-width">
                    <label>
                      UPLOAD PASSPORT <span style={{color:'#ef4444'}}>*</span>
                      <span style={{fontSize:'0.75rem', color:'#6b7280', marginLeft:'8px', fontWeight:400}}>
                        (Bio-data page with photo)
                      </span>
                    </label>
                    
                    {currentPassenger.passportFileName ? (
                      <div className="file-uploaded">
                        <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                          <CheckCircle size={18} color="#22c55e"/>
                          <span>{currentPassenger.passportFileName}</span>
                        </div>
                        <button 
                          type="button"
                          onClick={() => removeFile(passengerStep - 1, 'passport')}
                          style={{
                            background: '#fef2f2',
                            color: '#dc2626',
                            border: '1px solid #fecaca',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="file-upload-box">
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleFileUpload(passengerStep - 1, 'passport', e)}
                          id={`passport-upload-${passengerStep}`}
                          style={{display: 'none'}}
                        />
                        <label htmlFor={`passport-upload-${passengerStep}`} className="file-upload-label">
                          <Upload size={32} color="#94a3b8"/>
                          <span style={{fontWeight:600, color:'#475569'}}>Click to upload Passport</span>
                          <span style={{fontSize:'0.8rem', color:'#94a3b8'}}>PNG, JPG or PDF (Max 5MB)</span>
                        </label>
                      </div>
                    )}
                  </div>
                )}

              </div>

              <div style={{display:'flex', gap:'12px', marginTop:'24px'}}>
                {passengerStep > 1 && (
                  <button 
                    type="button" 
                    onClick={handleBackPassenger}
                    style={{
                      flex: 1,
                      padding: '16px',
                      background: '#f1f5f9',
                      color: '#64748b',
                      border: 'none',
                      borderRadius: '12px',
                      fontWeight: 700,
                      fontSize: '1rem',
                      cursor: 'pointer'
                    }}
                  >
                    ← BACK
                  </button>
                )}
                
                <button 
                  type="submit" 
                  disabled={loading}
                  className="modal-submit-btn"
                  style={{
                    flex: passengerStep > 1 ? 2 : 1,
                    width: passengerStep === 1 ? '100%' : 'auto'
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
      )}

      {showFlightSearchModal && (
        <div className="flight-search-modal-overlay" onClick={() => setShowFlightSearchModal(false)}>
          <div className="flight-search-modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="flight-modal-close-btn" 
              onClick={() => setShowFlightSearchModal(false)}
              aria-label="Close Flight Search"
            >
              <X size={32} strokeWidth={3} />
            </button>
            
            <div className="flight-modal-header">
              <Plane size={28} color="#fc9c1b" />
              <h2>Search Flights for Your Trip</h2>
              <p>Package: <strong>{pkg.name}</strong></p>
              {selectedDate && (
                <p>Travel Date: <strong>{monthNames[currentMonth.getMonth()]} {selectedDate}, {currentMonth.getFullYear()}</strong></p>
              )}
            </div>

            <div className="flight-search-wrapper">
              <FlightSearch 
                onFlightSelect={handleFlightSelected}
                prefilledDepartureDate={selectedDate ? `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}` : null}
                prefilledDestination={pkg.location}
                prefilledPassengers={{
                  adults: quantities.adult || 1,
                  children: 0,
                  infants: 0
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingRightForm;