import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, Calendar, Plane, Hotel, Utensils, Bus, Camera, Briefcase, 
  ChevronLeft, ChevronRight, Minus, Plus, X, MessageCircle 
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const BookingRightForm = ({ pkg }) => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(null);
  const [quantities, setQuantities] = useState({ adult: 1 });
  const [currentMonth, setCurrentMonth] = useState(new Date(2025, 10));
  const durationDays = parseInt(pkg.duration?.match(/(\d+)D/)?.[1] || 1);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    message: ''
  });

  const packageTypes = [
    { id: 'adult', label: 'Standard Pax', description: '3+ years old', pricePerPax: pkg.price, discount: 'Best Value' }
  ];

  const totalAmount = Object.entries(quantities).reduce((sum, [type, qty]) => {
    const pType = packageTypes.find(p => p.id === type);
    return sum + (pType?.pricePerPax || 0) * qty;
  }, 0);

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
    const newDate = new Date(currentMonth.setMonth(currentMonth.getMonth() + offset));
    setCurrentMonth(new Date(newDate));
  };

  const handleBookClick = () => {
    if (!selectedDate) {
      toast.error("Please select a travel date first!", {
        style: { border: '1px solid #ef4444', color: '#ef4444' },
        iconTheme: { primary: '#ef4444', secondary: '#fff' },
      });
      return;
    }
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    
    const endDate = getEndDate();
    const bookingData = {
      packageName: pkg.name,
      startDate: `${monthNames[currentMonth.getMonth()]} ${selectedDate}, ${currentMonth.getFullYear()}`,
      endDate: `${monthNames[currentMonth.getMonth()]} ${endDate}, ${currentMonth.getFullYear()}`,
      duration: pkg.duration,
      pax: quantities,
      totalAmount: totalAmount,
      fullName: formData.fullName,
      email: formData.email,
      message: formData.message
    };

    setShowModal(false);
    toast.loading("Redirecting to payment...", { duration: 1500 });
    setTimeout(() => {
      navigate('/payment', { state: { bookingData } });
    }, 1500);
  };

  const handleContactSales = () => {
    toast.loading("Connecting to sales representative...", {
      duration: 3000,
      style: {
        background: '#333',
        color: '#fff',
      }
    });
  };

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
            <button onClick={() => changeMonth(-1)} style={{background:'none', border:'none', cursor:'pointer'}}>
              <ChevronLeft size={20} color="#4b5563"/>
            </button>
            <span style={{fontWeight:'600'}}>{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
            <button onClick={() => changeMonth(1)} style={{background:'none', border:'none', cursor:'pointer'}}>
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
              const isStartDate = selectedDate === day;
              const isInRange = isInSelectedRange(day);
              const isEndDate = selectedDate && day === getEndDate();
              
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(day)}
                  className={`calendar-day ${isStartDate ? 'selected' : ''} ${isInRange && !isStartDate ? 'in-range' : ''} ${isEndDate ? 'end-date' : ''}`}
                  style={{
                    background: isStartDate ? '#fc9c1b' : isEndDate ? '#22c55e' : isInRange ? '#fef3c7' : 'white',
                    color: isStartDate || isEndDate ? 'white' : isInRange ? '#92400e' : '#374151',
                    fontWeight: isStartDate || isEndDate ? '600' : '400'
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
        {packageTypes.map((type) => (
          <div key={type.id} className="quantity-item">
            <div>
              <div style={{display:'flex', alignItems:'center'}}>
                <span className="quantity-label">{type.label}</span>
                <span className="quantity-discount-badge">{type.discount}</span>
              </div>
              <div style={{fontSize:'0.8rem', color:'#6b7280', marginTop:'4px'}}>{type.description}</div>
            </div>
            
            <div className="quantity-controls">
              <button onClick={() => handleQuantity(type.id, -1)} className="quantity-btn">
                <Minus size={16} />
              </button>
              <span className="quantity-value">{quantities[type.id]}</span>
              <button onClick={() => handleQuantity(type.id, 1)} className="quantity-btn">
                <Plus size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="booking-footer">
        <div className="total-row">
          <span className="total-label">Total Amount</span>
          <span className="total-amount">₱{totalAmount.toLocaleString()}</span>
        </div>
        
        <button className="book-now-btn" onClick={handleBookClick}>
          Book This Trip
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
                    <span className="summary-label">Travel Dates</span>
                    <strong className="summary-value">
                      {monthNames[currentMonth.getMonth()]} {selectedDate} - {getEndDate()}, {currentMonth.getFullYear()}
                    </strong>
                    <span style={{fontSize:'0.85rem', color:'#6b7280'}}>({durationDays} days trip)</span>
                </div>
                <div className="summary-divider"></div>
                <div className="summary-item">
                    <span className="summary-label">Total Amount</span>
                    <strong className="summary-value price">₱{totalAmount.toLocaleString()}</strong>
                </div>
              </div>
            </div>

            <form className="modal-form" onSubmit={handleFinalSubmit}>
              <div className="form-group">
                <label>FULL NAME</label>
                <input 
                  type="text" 
                  name="fullName"
                  placeholder="e.g. Juan dela Cruz" 
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required 
                />
              </div>

              <div className="form-group">
                <label>EMAIL ADDRESS</label>
                <input 
                  type="email" 
                  name="email"
                  placeholder="name@email.com" 
                  value={formData.email}
                  onChange={handleInputChange}
                  required 
                />
              </div>

              <div className="form-group">
                <label>MESSAGE (OPTIONAL)</label>
                <textarea 
                  name="message"
                  placeholder="Any special requests or questions?"
                  rows="3"
                  value={formData.message}
                  onChange={handleInputChange}
                ></textarea>
              </div>

              <button type="submit" className="modal-submit-btn">
                Confirm Booking
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default BookingRightForm;