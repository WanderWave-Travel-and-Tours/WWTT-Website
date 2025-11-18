import React, { useState } from 'react';
import { 
  MapPin, Calendar, Plane, Hotel, Utensils, Bus, Camera, Briefcase, 
  ChevronLeft, ChevronRight, Minus, Plus 
} from 'lucide-react';

const BookingRightForm = ({ pkg }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [quantities, setQuantities] = useState({ adult: 1 });
  const [currentMonth, setCurrentMonth] = useState(new Date(2025, 10)); // Nov 2025

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

  return (
    <div className="booking-form-content">
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

      {/* Service Icons (Visual Divider) */}
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

      {/* Bottom: Total & Button */}
      <div className="booking-footer">
        <div className="total-row">
          <span className="total-label">Total Amount</span>
          <span className="total-amount">₱{totalAmount.toLocaleString()}</span>
        </div>
        <button className="book-now-btn">
          Book This Trip
        </button>
        <p style={{textAlign:'center', fontSize:'0.8rem', color:'#9ca3af', marginTop:'12px'}}>
          No payment required today.
        </p>
      </div>
    </div>
  );
};

export default BookingRightForm;