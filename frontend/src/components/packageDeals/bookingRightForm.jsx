import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, ChevronRight, Minus, Plus, MessageCircle, Plane 
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios';
import HotelRoomSelector from './hotelRoomSelector';
import BookingFormModal from './BookingFormModal';
import './BookingRightForm.css';

const BookingRightForm = ({ pkg }) => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(null);
  const [quantities, setQuantities] = useState({ adult: 1 });
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const durationDays = parseInt(pkg.duration?.match(/(\d+)D/)?.[1] || 1);
  const durationNights = parseInt(pkg.duration?.match(/(\d+)N/)?.[1] || durationDays - 1); 
  const [showModal, setShowModal] = useState(false);
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
    const bookingData = sessionStorage.getItem('pendingBookingData');
    console.log('Checking for pending booking data:', bookingData);
    
    if (bookingData) {
      const data = JSON.parse(bookingData);
      console.log('Parsed booking data:', data);
      
      if (data.selectedFlight && data.packageId === pkg._id) {
        console.log('Found selected flight for this package:', data.selectedFlight);
        
        setSelectedFlight(data.selectedFlight);
        setBookingWithAirfare(true);
        setSelectedDate(data.selectedDate);
        setQuantities(data.quantities);
        setCurrentMonth(new Date(data.currentMonth));
        sessionStorage.removeItem('pendingBookingData');
        
        toast.success(`✈️ Flight Added! ${data.selectedFlight.airline.name}`, { duration: 3000 });
        
        setTimeout(() => {
          setPassengerStep(1);
          setShowModal(true);
        }, 500);
      }
    }
  }, [pkg._id]);

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
        const response = await fetch(`https://wanderwaveph-backend.onrender.com/api/hotels/location/${encodeURIComponent(city)}/rooms`);
        const data = await response.json();
        
        if (data.success && data.data && data.data.length > 0) {
          const roomTypes = data.data;
          
          setHotelData({
            name: `${city} Hotels`,
            location: city,
            roomTypes: roomTypes
          });
          
          const sortedRooms = [...roomTypes].sort((a, b) => a.price - b.price);
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
      firstName: '', lastName: '', email: '', phone: '',
      dateOfBirth: '', age: '', gender: '', address: '',
      nationality: 'Filipino',
      idFile: null, idFileName: '',
      passportFile: null, passportFileName: ''
    }))
  );

  useEffect(() => {
    const newTotal = quantities.adult || 1;
    setPassengers(prevPassengers => {
        if (newTotal === prevPassengers.length) return prevPassengers; 
        
        return Array.from({ length: newTotal }, (_, idx) => 
          prevPassengers[idx] || {
            passengerNumber: idx + 1,
            firstName: '', lastName: '', email: '', phone: '',
            dateOfBirth: '', age: '', gender: '', address: '',
            nationality: 'Filipino',
            idFile: null, idFileName: '',
            passportFile: null, passportFileName: ''
          }
        );
    });
  }, [quantities.adult]);

  const packageTotal = (() => {
    const basePax = quantities.adult || 1;
    const basePackagePrice = pkg.price * basePax;
    if (!selectedRoomType) return basePackagePrice;
    
    const roomUpgradePricing = {
      'BUDGET': 0, 'STANDARD': 750, '4 STAR': 1200, '5 STAR': 2040
    };
    
    const roomTypeKey = selectedRoomType.type?.toUpperCase() || '';
    let upgradePerDayPerPax = 0;
    for (const [key, price] of Object.entries(roomUpgradePricing)) {
      if (roomTypeKey.includes(key)) {
        upgradePerDayPerPax = price;
        break;
      }
    }
    
    const totalUpgradeCost = upgradePerDayPerPax * durationNights * basePax;
    return basePackagePrice + totalUpgradeCost;
  })();

  const airfareTotal = selectedFlight ? selectedFlight.price.amount : 0;
  const totalAmount = packageTotal + airfareTotal;
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const isInSelectedRange = (day) => {
    if (!selectedDate) return false;
    
    const { start, end } = getCalculatedDates();
    const currentCheckDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    
    currentCheckDate.setHours(0,0,0,0);
    if(start) start.setHours(0,0,0,0);
    if(end) end.setHours(0,0,0,0);

    return currentCheckDate >= start && currentCheckDate <= end;
  };

  const getCalculatedDates  = () => {
    if (!selectedDate) return { start: null, end: null };
    const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), selectedDate);
    
    const end = new Date(start);
    end.setDate(start.getDate() + durationDays - 1);

    return { start, end };
  };

  const formatDateRangeDisplay = () => {
    const { start, end } = getCalculatedDates();
    if (!start || !end) return '';

    const startMonth = monthNames[start.getMonth()];
    const endMonth = monthNames[end.getMonth()];
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();
    const startDay = start.getDate();
    const endDay = end.getDate();

    if (startMonth === endMonth && startYear === endYear) {
      return `${startMonth} ${startDay} - ${endDay}, ${startYear}`;
    }

    if (startMonth !== endMonth && startYear === endYear) {
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${startYear}`;
    }

    return `${startMonth} ${startDay}, ${startYear} - ${endMonth} ${endDay}, ${endYear}`;
  };

  const handleQuantity = (type, delta) => {
    setQuantities(prev => ({
      ...prev,
      [type]: Math.max(1, Math.min(20, (prev[type] || 1) + delta))
    }));
  };

  const changeMonth = (offset) => {
    const newDate = new Date(currentMonth.setMonth(currentMonth.getMonth() + offset));
    setCurrentMonth(new Date(newDate));
  };

  const handleRoomTypeChange = (roomType) => {
    setSelectedRoomType(roomType);
    toast.success(`Selected: ${roomType.type} at ${roomType.hotelName}`, { duration: 2000 });
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

    const { start, end } = getCalculatedDates();

    const formatDate = (date) => {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };

    const departureDateStr = formatDate(start);
    const returnDateStr = formatDate(end);    

    const bookingData = {
      packageId: pkg._id || pkg.id,
      packageName: pkg.name,
      packageData: pkg, 
      selectedDate: selectedDate,
      quantities: quantities,
      currentMonth: currentMonth.toISOString(),
      destination: pkg.location || pkg.destination,
      departureDate: departureDateStr, 
      returnToBooking: true,
      returnPath: `/packages/book`
    };

    sessionStorage.setItem('pendingBookingData', JSON.stringify(bookingData));
    
    console.log('Saving booking data with returnPath:', bookingData.returnPath);

    navigate('/flights', {
      state: {
        fromBooking: true,
        packageData: {
          packageId: pkg._id || pkg.id,
          packageName: pkg.name,
          departureDate: departureDateStr, 
          returnDate: returnDateStr,
          destination: pkg.location || pkg.destination,
          passengers: {
            adults: quantities.adult || 1,
            children: 0,
            infants: 0
          }
        }
      }
    });
  };

  const handleRemoveFlight = () => {
    setSelectedFlight(null);
    setBookingWithAirfare(false);
    toast.success('Flight removed from package', { duration: 2000 });
  };

  const handleContactSales = () => {
    window.open('https://www.facebook.com/wanderwaveph', '_blank');
  };

  const handlePassengerChange = (index, field, value) => {
    setPassengers(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleFileUpload = (index, type, event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      event.target.value = null;
      return;
    }

    setPassengers(prev => {
      const updated = [...prev];
      if (type === 'id') {
        updated[index].idFile = file;
        updated[index].idFileName = file.name;
      } else if (type === 'passport') {
        updated[index].passportFile = file;
        updated[index].passportFileName = file.name;
      }
      return updated;
    });
  };

  const removeFile = (index, type) => {
    setPassengers(prev => {
      const updated = [...prev];
      if (type === 'id') {
        updated[index].idFile = null;
        updated[index].idFileName = '';
      } else if (type === 'passport') {
        updated[index].passportFile = null;
        updated[index].passportFileName = '';
      }
      return updated;
    });
  };

  const handleNextPassenger = async (e) => {
    e.preventDefault();
    
    const currentPassengerData = passengers[passengerStep - 1];
    
    if (bookingWithAirfare && requiresID && !currentPassengerData.idFile) {
      toast.error('Please upload a valid ID for this passenger');
      return;
    }
    
    if (bookingWithAirfare && requiresPassport && !currentPassengerData.passportFile) {
      toast.error('Please upload a valid passport for this passenger');
      return;
    }

    if (passengerStep < totalPassengers) {
      setPassengerStep(prev => prev + 1);
      return;
    }

    setLoading(true);
    
    try {
      const formData = new FormData();
      const { start, end } = getCalculatedDates(); 

      const formatDate = (date) => {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      };

      const startDateFormatted = formatDate(start);
      const endDateFormatted = formatDate(end);

      const baseBookingData = {
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
        totalAmount: totalAmount,
        primaryContact: {
          fullName: `${passengers[0].firstName} ${passengers[0].lastName}`,
          email: passengers[0].email,
        },
        
        selectedRoomType: selectedRoomType ? selectedRoomType.type : null,
        hotelName: selectedRoomType ? selectedRoomType.hotelName : null,
        numberOfRooms: numberOfRooms,
        sellerPrice: pkg.price || 0, 
        markup: 0, 
        price: pkg.price || 0,
        passengers: passengers.map(p => ({
            passengerNumber: p.passengerNumber || 1,
            firstName: p.firstName || '',
            lastName: p.lastName || '',
            email: p.email || '',
            phone: p.phone || '',
            dateOfBirth: p.dateOfBirth || '',
            age: p.age || 0,
            gender: p.gender || '',
            address: p.address || '',
            nationality: p.nationality || 'Filipino',
        }))
      };
      
      formData.append('bookingData', JSON.stringify(baseBookingData));

      passengers.forEach((passenger, idx) => {
        if (passenger.idFile) {
          formData.append(`idFile_${idx}`, passenger.idFile);
        }
        if (passenger.passportFile) {
          formData.append(`passportFile_${idx}`, passenger.passportFile);
        }
      });

      console.log('Submitting Booking Data to backend...');
      
      const bookingResponse = await axios.post('https://wanderwaveph-backend.onrender.com/api/bookings', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (bookingResponse.data.success) {
        const bookingId = bookingResponse.data.bookingId;
        
        console.log(`✅ Booking saved. Initiating PayMongo link creation for ID: ${bookingId}`);
        toast.success('Booking saved! Preparing payment link...', { duration: 3000 });
        
        const paymentResponse = await axios.post('https://wanderwaveph-backend.onrender.com/api/payment/create-intent', {
            bookingId: bookingId
        });
        
        if (paymentResponse.data.success && paymentResponse.data.checkoutUrl) {
            const checkoutUrl = paymentResponse.data.checkoutUrl;
            toast.success('💰 Redirecting to PayMongo...', { duration: 1500 });
            setShowModal(false);
            
            window.location.href = checkoutUrl; 
            return;
            
        } else {
             const redirectId = bookingResponse.data.bookingId || bookingResponse.data.data._id; 
             toast.error('Payment link failed. Please pay manually on your dashboard.', { duration: 4000 });
             setTimeout(() => {
                 navigate('/dashboard');
             }, 1500);
        }
      } else {
         throw new Error(bookingResponse.data.message || 'Booking submission failed on server.');
      }
    } catch (error) {
      console.error('Booking/Payment Error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit booking. Please try again.';
      
      if (error.response?.data?.error) {
          console.error("Payment API Error Details:", error.response.data.error);
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBackPassenger = () => {
    if (passengerStep > 1) {
      setPassengerStep(prev => prev - 1);
    }
  };

  return (
    <div className="brf-container">
      <Toaster position="top-center" />
      
      <div className="brf-header">
        <h2>Book Your Journey</h2>
        <p className="brf-subtitle">Select your preferred dates and customize your trip</p>
      </div>

      <div className="brf-calendar-wrapper">
        <div className="brf-calendar-box">
          <div className="brf-calendar-header">
            <button onClick={() => changeMonth(-1)} className="brf-month-nav">
              <ChevronLeft size={20} />
            </button>
            <h3 className="brf-month-year">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            <button onClick={() => changeMonth(1)} className="brf-month-nav">
              <ChevronRight size={20} />
            </button>
          </div>

          {selectedDate && (
            <div className="brf-selected-date-display">
              <div className="brf-date-icon">📅</div>
              <div>
                <div style={{fontWeight:'600', color:'#1f2937'}}>
                  {formatDateRangeDisplay()}
                </div>
                <div style={{fontSize:'0.85rem', color:'#6b7280', marginTop:'4px'}}>
                  {durationDays} days • {durationNights} {durationNights === 1 ? 'night' : 'nights'}
                </div>
              </div>
            </div>
          )}

          <div className="brf-calendar-grid">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={i} className="brf-calendar-day-label">{d}</div>
            ))}
            {[...Array(firstDay)].map((_, i) => <div key={`empty-${i}`} />)}
            {[...Array(daysInMonth)].map((_, i) => {
              const day = i + 1;
              const dateToCheck = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
              dateToCheck.setHours(0, 0, 0, 0);
              
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const isPastDate = dateToCheck < today;

              const isStartDate = selectedDate === day;
              const isInRange = isInSelectedRange(day);
              const isEndDate = selectedDate && day === getCalculatedDates ();
              
              return (
                <button
                  key={day}
                  disabled={isPastDate} 
                  onClick={() => !isPastDate && setSelectedDate(day)}
                  className={`brf-calendar-day 
                    ${isStartDate ? 'brf-selected' : ''} 
                    ${isInRange && !isStartDate ? 'brf-in-range' : ''} 
                    ${isEndDate ? 'brf-end-date' : ''} 
                    ${isPastDate ? 'brf-disabled-date' : ''} 
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="brf-quantity-section">
        <div className="brf-quantity-item">
          <div>
            <div style={{display:'flex', alignItems:'center'}}>
              <span className="brf-quantity-label">Standard Pax</span>
            </div>
            <div style={{fontSize:'0.8rem', color:'#6b7280', marginTop:'4px'}}>3+ years old</div>
          </div>
          
          <div className="brf-quantity-controls">
            <button 
              onClick={() => handleQuantity('adult', -1)} 
              className="brf-quantity-btn"
              type="button"
            >
              <Minus 
                size={18} 
                color="#000000" 
                strokeWidth={3}
                style={{minWidth: '18px', minHeight: '18px', stroke: '#000000'}}
              />
            </button>
            <span className="brf-quantity-value">{quantities.adult}</span>
            <button 
              onClick={() => handleQuantity('adult', 1)} 
              className="brf-quantity-btn"
              type="button"
            >
              <Plus 
                size={18} 
                color="#000000" 
                strokeWidth={3}
                style={{minWidth: '18px', minHeight: '18px', stroke: '#000000'}}
              />
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
          background: '#fff7ed', border: '2px solid #fc9c1b', borderRadius: '12px',
          padding: '16px', marginBottom: '20px'
        }}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'10px'}}>
            <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
              <Plane size={20} color="#fc9c1b"/>
              <strong style={{color:'#1f2937', fontSize:'0.95rem'}}>Flight Added to Package</strong>
            </div>
            <button 
              onClick={handleRemoveFlight}
              style={{
                background:'none', border:'none', color:'#ef4444', 
                cursor:'pointer', fontSize:'0.85rem', textDecoration:'underline'
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

      <div className="brf-booking-footer">
        <div className="brf-total-row">
          <span className="brf-total-label">{selectedFlight ? 'Package Total' : 'Total Amount'}</span>
          <span className="brf-total-amount">{packageTotal === 0 ? 'Select Room Type' : `₱${packageTotal.toLocaleString()}`}</span>
        </div>
        
        {selectedFlight && (
          <>
            <div className="brf-total-row" style={{fontSize:'0.9rem', color:'#6b7280'}}>
              <span>+ Airfare</span>
              <span>₱{airfareTotal.toLocaleString()}</span>
            </div>
            <div className="brf-total-row" style={{
              borderTop:'2px solid #fc9c1b', paddingTop:'12px', marginTop:'8px',
              fontSize:'1.1rem', fontWeight:'800', color:'#1f2937'
            }}>
              <span>GRAND TOTAL</span>
              <span style={{color:'#fc9c1b'}}>₱{totalAmount.toLocaleString()}</span>
            </div>
          </>
        )}
        
        <button 
          className="brf-book-now-btn" 
          onClick={handleBookClick}
          disabled={!selectedRoomType}
        >
          {selectedFlight ? '🎫 Book Package + Flight' : 'Book This Trip'}
        </button>

        <button className="brf-book-with-airfare-btn" onClick={handleBookWithAirfare}>
          <Plane size={20} />
          {selectedFlight ? 'Change Flight' : 'Add Airfare'}
        </button>

        <button className="brf-contact-sales-btn" onClick={handleContactSales}>
            <MessageCircle size={20} />
            Contact Sales
        </button>

        <p style={{textAlign:'center', fontSize:'0.8rem', color:'#9ca3af', marginTop:'12px'}}>
          No payment required today.
        </p>
      </div>

      <BookingFormModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        pkg={pkg}
        currentMonth={currentMonth}
        selectedDate={selectedDate}
        getCalculatedDates ={getCalculatedDates }
        monthNames={monthNames}
        packageTotal={packageTotal}
        selectedFlight={selectedFlight}
        airfareTotal={airfareTotal}
        totalAmount={totalAmount}
        bookingWithAirfare={bookingWithAirfare}
        isInternationalFlight={isInternationalFlight}
        requiresID={requiresID}
        requiresPassport={requiresPassport}
        passengerStep={passengerStep}
        totalPassengers={totalPassengers}
        progressPercent={Math.round((passengerStep / totalPassengers) * 100)}
        currentPassenger={passengers[passengerStep - 1]}
        passengers={passengers}
        handlePassengerChange={handlePassengerChange}
        handleFileUpload={handleFileUpload}
        removeFile={removeFile}
        handleNextPassenger={handleNextPassenger}
        handleBackPassenger={handleBackPassenger}
        loading={loading}
      />
      
    </div>
  );
};

export default BookingRightForm;