import React, { useState } from 'react';
import { 
  MapPin, Calendar, Plane, Hotel, Utensils, Bus, Camera, Briefcase, 
  ChevronLeft, ChevronRight, Minus, Plus, X, MessageCircle 
} from 'lucide-react';
// 1. IMPORT TOAST
import toast, { Toaster } from 'react-hot-toast';

const BookingRightForm = ({ pkg }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [quantities, setQuantities] = useState({ adult: 1 });
  const [currentMonth, setCurrentMonth] = useState(new Date(2025, 10)); // Nov 2025
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    message: ''
  });

  // Package Definitions
  const packageTypes = [
    { id: 'adult', label: 'Standard Pax', description: '3+ years old', pricePerPax: pkg.price, discount: 'Best Value' }
  ];

  // Calculation Logic
  const totalAmount = Object.entries(quantities).reduce((sum, [type, qty]) => {
    const pType = packageTypes.find(p => p.id === type);
    return sum + (pType?.pricePerPax || 0) * qty;
  }, 0);

  // Calendar Helpers
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

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
      // 2. REPLACED ALERT WITH ERROR TOAST
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

  const handleFinalSubmit = (e) => {
    e.preventDefault();
    console.log("Booking Request Sent:", {
      package: pkg.name,
      date: `${monthNames[currentMonth.getMonth()]} ${selectedDate}, ${currentMonth.getFullYear()}`,
      pax: quantities,
      total: totalAmount,
      contact: formData
    });
    
    // 3. REPLACED ALERT WITH SUCCESS TOAST
    toast.success("Request Sent! Wait for our confirmation.", {
      duration: 5000,
      style: {
        border: '1px solid #10b981',
        padding: '16px',
        color: '#064e3b',
      },
      iconTheme: {
        primary: '#10b981',
        secondary: '#FFFAEE',
      },
    });
    
    setShowModal(false);
  };

  const handleContactSales = () => {
    // 4. REPLACED ALERT WITH CUSTOM LOADING TOAST
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
      {/* 5. ADD TOASTER COMPONENT HERE (Para lumabas ang toast) */}
      <Toaster position="top-center" reverseOrder={false} />

      {/* Title & Price */}
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

      {/* Service Icons */}
      <div className="service-icons">
        {[Plane, Hotel, Bus, Utensils, Camera, Briefcase].map((Icon, i) => (
          <Icon key={i} size={20} className="service-icon" />
        ))}
      </div>

      {/* Calendar Section */}
      <div className="calendar-section">
        <label style={{display:'block', marginBottom:'12px', fontWeight:'600', color:'#374151'}}>
          Select Travel Date
        </label>
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
              const isSelected = selectedDate === day;
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(day)}
                  className={`calendar-day ${isSelected ? 'selected' : ''}`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quantity Section */}
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

      {/* Bottom: Total & Buttons */}
      <div className="booking-footer">
        <div className="total-row">
          <span className="total-label">Total Amount</span>
          <span className="total-amount">₱{totalAmount.toLocaleString()}</span>
        </div>
        
        {/* Main CTA */}
        <button className="book-now-btn" onClick={handleBookClick}>
          Book This Trip
        </button>

        {/* Secondary CTA (Below Book Now) */}
        <button className="contact-sales-footer-btn" onClick={handleContactSales}>
           <MessageCircle size={20} />
           Contact Sales
        </button>

        <p style={{textAlign:'center', fontSize:'0.8rem', color:'#9ca3af', marginTop:'12px'}}>
          No payment required today.
        </p>
      </div>

      {/* ================= MODAL START ================= */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            
            {/* SUPER LARGE CLOSE BUTTON */}
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
              
              {/* Trip Summary */}
              <div className="modal-trip-summary">
                <div className="summary-item">
                    <span className="summary-label">Selected Date</span>
                    <strong className="summary-value">{monthNames[currentMonth.getMonth()]} {selectedDate}, {currentMonth.getFullYear()}</strong>
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

              {/* Just One Confirm Button Inside Modal Now */}
              <button type="submit" className="modal-submit-btn">
                Confirm Booking
              </button>

            </form>
          </div>
        </div>
      )}
      {/* ================= MODAL END ================= */}

    </div>
  );
};

export default BookingRightForm;