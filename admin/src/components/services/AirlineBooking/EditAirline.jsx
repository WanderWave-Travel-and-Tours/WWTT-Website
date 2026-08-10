import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, User, Plane, MessageSquare, Users, Trash2 } from "lucide-react";
import Sidebar from "../../sidebar/sidebar"; 
import { useToast } from '../../toast/ToastManager'; // Integrated Toast
import CustomConfirmModal from "../../confirmationModal/CustomConfirmModal"; // Integrated Modal
import "./EditAirline.css";

const getAdminData = () => {
    try {
        const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
        return {
            userEmail: adminData.email || adminData.username || 'Unknown Admin',
            adminId: adminData._id || adminData.id || null
        };
    } catch (error) {
        console.error('Error getting admin data:', error);
        return { userEmail: 'Unknown Admin', adminId: null };
    }
};

const EditAirline = () => {
  const navigate = useNavigate();
  const { id: airlineId } = useParams();
  const toast = useToast(); // Initialize Toast

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // MODAL STATE
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    type: "primary"
  });

  // STATE FOR PASSENGERS
  const [passengers, setPassengers] = useState([{
    firstName: "",
    lastName: "",
    type: "Adult",
    age: 0,
    nationality: "Filipino",
    email: "",
    contactNumber: ""
  }]);

  // FORM DATA
  // UPDATED FORM DATA - SUPPORTS ROUND-TRIP
const [formData, setFormData] = useState({
  fullName: "",
  email: "",
  contactNumber: "",
  estimatedPrice: "",
  message: "",
  journeyType: "round-trip",        // ← NEW
  origin: "",
  destination: "",
  departureDate: "",
  airline: "",
  flightNumber: "",

  // Round-trip specific fields
  outbound: {
    origin: "",
    destination: "",
    departureDate: "",
    arrivalDate: "",
    airline: "",
    flightNumber: "",
    duration: "",
    stops: 0,
    price: 0
  },
  return: {
    origin: "",
    destination: "",
    departureDate: "",
    arrivalDate: "",
    airline: "",
    flightNumber: "",
    duration: "",
    stops: 0,
    price: 0
  },
  totalAmount: 0,
  cabinClass: "Economy"
});

  const API_BASE_URL = "/api/inquiries"; 

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  const closeModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }));

  // FETCH DATA
  // FETCH DATA - UPDATED (Step 1)
useEffect(() => {
  const fetchAirlineDetails = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/${airlineId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const result = await res.json();
      if (!result.success || !result.data) throw new Error("Invalid response format");

      // === UPDATED FETCH LOGIC FOR ROUND-TRIP ===
const data = result.data;

setFormData({
  fullName: data.fullName || "",
  email: data.email || "",
  contactNumber: data.contactNumber || "",
  estimatedPrice: data.flightDetails?.totalAmount || data.estimatedPrice || "",
  message: data.message || "",
  
  // Journey Type
  journeyType: data.flightDetails?.type || "one-way",

  // Legacy fallback (for old one-way)
  origin: data.flightDetails?.origin || data.flightDetails?.outbound?.origin || "",
  destination: data.flightDetails?.destination || data.flightDetails?.outbound?.destination || "",
  departureDate: data.flightDetails?.departureDate || data.flightDetails?.outbound?.departureDate || "",

  // ROUND-TRIP STRUCTURE — preserve all fields from DB
  outbound: data.flightDetails?.outbound ? {
    origin: data.flightDetails.outbound.origin || "",
    destination: data.flightDetails.outbound.destination || "",
    departureDate: data.flightDetails.outbound.departureDate || "",
    arrivalDate: data.flightDetails.outbound.arrivalDate || "",
    airline: data.flightDetails.outbound.airline || "",
    flightNumber: data.flightDetails.outbound.flightNumber || "",
    duration: data.flightDetails.outbound.duration || "",
    stops: data.flightDetails.outbound.stops ?? 0,
    price: data.flightDetails.outbound.price || 0
  } : {
    origin: "",
    destination: "",
    departureDate: "",
    arrivalDate: "",
    airline: "",
    flightNumber: "",
    duration: "",
    stops: 0,
    price: 0
  },
  return: data.flightDetails?.return ? {
    origin: data.flightDetails.return.origin || "",
    destination: data.flightDetails.return.destination || "",
    departureDate: data.flightDetails.return.departureDate || "",
    arrivalDate: data.flightDetails.return.arrivalDate || "",
    airline: data.flightDetails.return.airline || "",
    flightNumber: data.flightDetails.return.flightNumber || "",
    duration: data.flightDetails.return.duration || "",
    stops: data.flightDetails.return.stops ?? 0,
    price: data.flightDetails.return.price || 0
  } : {
    origin: "",
    destination: "",
    departureDate: "",
    arrivalDate: "",
    airline: "",
    flightNumber: "",
    duration: "",
    stops: 0,
    price: 0
  },
  totalAmount: data.flightDetails?.totalAmount || data.estimatedPrice || 0,
  cabinClass: data.flightDetails?.cabinClass || "Economy",
  airline: data.flightDetails?.outbound?.airline || data.flightDetails?.airline || "",
  flightNumber: data.flightDetails?.outbound?.flightNumber || ""
});

      // === PASSENGERS - FIXED PARSING (very important) ===
      let processedPassengers = [];

      if (Array.isArray(data.passengers) && data.passengers.length > 0) {
        processedPassengers = data.passengers.map(p => ({
          firstName: p.firstName || "",
          lastName: p.lastName || "",
          type: p.type || "Adult",
          age: p.age || 0,
          nationality: p.nationality || "Filipino",
          email: p.email || "",
          contactNumber: p.contactNumber || ""
        }));
      } 
      // Fallback kung walang passengers
      else {
        processedPassengers = [{
          firstName: "",
          lastName: "",
          type: "Adult",
          age: 0,
          nationality: "Filipino",
          email: "",
          contactNumber: ""
        }];
      }

      setPassengers(processedPassengers);

    } catch (err) {
      console.error("Fetch error:", err);
      toast.error(`Failed to load booking: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (airlineId) fetchAirlineDetails();
  else setLoading(false);
}, [airlineId, toast]);

  const handleInputChange = (e) => {
  const { name, value } = e.target;
  setFormData((prev) => ({ ...prev, [name]: value }));
};

// NEW HELPER: Para sa outbound at return fields
const handleNestedChange = (leg, field, value) => {
  setFormData(prev => ({
    ...prev,
    [leg]: { ...prev[leg], [field]: value }
  }));
};

  const handlePassengerChange = (index, field, value) => {
    setPassengers((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // ADD PASSENGER WITH MODAL
  const addPassenger = () => {
    setModalConfig({
      isOpen: true,
      title: "Add New Passenger",
      message: "Are you sure you want to add a new passenger field?",
      type: "primary",
      onConfirm: () => {
        setPassengers(prev => [...prev, {
          firstName: "",
          lastName: "",
          type: "Adult",
          age: 0,
          nationality: "Filipino",
          email: "",
          contactNumber: ""
        }]);
        closeModal();
      }
    });
  };

  const removePassenger = (index) => {
    if (passengers.length > 1) {
      setModalConfig({
        isOpen: true,
        title: "Remove Passenger",
        message: "Are you sure you want to remove this passenger?",
        type: "danger",
        onConfirm: () => {
          setPassengers(prev => prev.filter((_, i) => i !== index));
          closeModal();
        }
      });
    } else {
      toast.warning("At least one passenger is required"); 
    }
  };

  // CANCEL WITH MODAL
  const handleCancel = () => {
    setModalConfig({
      isOpen: true,
      title: "Discard Changes",
      message: "Are you sure you want to cancel? Any unsaved changes will be lost.",
      type: "danger",
      onConfirm: () => {
        closeModal();
        navigate(-1);
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    setModalConfig({
      isOpen: true,
      title: "Save Changes",
      message: "Do you want to save the changes made to this booking?",
      type: "primary",
      onConfirm: () => {
        closeModal();
        processSubmit();
      }
    });
  };

const processSubmit = async () => {
  setSubmitting(true);
  const { userEmail, adminId } = getAdminData();

  const validPassengers = passengers
    .filter(p => (p.firstName && p.firstName.trim()) || (p.lastName && p.lastName.trim()))
    .map(p => ({
      firstName: String(p.firstName || "").trim(),
      lastName: String(p.lastName || "").trim(),
      type: p.type || "Adult",
      age: p.age ? parseInt(p.age) : 0,
      nationality: String(p.nationality || "Filipino").trim(),
      email: String(p.email || "").trim(),
      contactNumber: String(p.contactNumber || "").trim()
    }));

  if (validPassengers.length === 0) {
    toast.error("Please add at least one passenger with a name.");
    setSubmitting(false);
    return;
  }

  // === BUILD FLIGHT DETAILS (Round-trip safe) ===
  let flightDetailsPayload = {};

  if (formData.journeyType === 'round-trip') {
    flightDetailsPayload = {
      type: "round-trip",
      outbound: {
        origin: formData.outbound.origin || "",
        destination: formData.outbound.destination || "",
        departureDate: formData.outbound.departureDate || "",
        arrivalDate: formData.outbound.arrivalDate || "",
        airline: formData.outbound.airline || "",
        flightNumber: formData.outbound.flightNumber || "",
        duration: formData.outbound.duration || "",
        stops: parseInt(formData.outbound.stops) || 0,
        price: parseFloat(formData.outbound.price) || 0
      },
      return: {
        origin: formData.return.origin || "",
        destination: formData.return.destination || "",
        departureDate: formData.return.departureDate || "",
        arrivalDate: formData.return.arrivalDate || "",
        airline: formData.return.airline || "",
        flightNumber: formData.return.flightNumber || "",
        duration: formData.return.duration || "",
        stops: parseInt(formData.return.stops) || 0,
        price: parseFloat(formData.return.price) || 0
      },
      totalAmount: parseFloat(formData.totalAmount) || 
                   (parseFloat(formData.outbound.price || 0) + parseFloat(formData.return.price || 0)),
      cabinClass: formData.cabinClass || "Economy"
    };
  } else {
    flightDetailsPayload = {
      type: formData.journeyType || "one-way",
      origin: formData.origin || "",
      destination: formData.destination || "",
      departureDate: formData.departureDate || "",
      airline: formData.airline || "",
      flightNumber: formData.flightNumber || "",
      cabinClass: formData.cabinClass || "Economy"
    };
  }

  const data = new FormData();
  data.append("fullName", formData.fullName);
  data.append("email", formData.email);
  data.append("contactNumber", formData.contactNumber);
  data.append("estimatedPrice", formData.totalAmount || formData.estimatedPrice || 0);
  data.append("message", formData.message || "");
  data.append("flightDetails", JSON.stringify(flightDetailsPayload));   // ← CRITICAL
  data.append("passengers", JSON.stringify(validPassengers));
  data.append("userEmail", userEmail);
  data.append("adminId", adminId);

  try {
    const res = await fetch(`${API_BASE_URL}/update/${airlineId}`, {
      method: "PUT",
      body: data,
    });

    const result = await res.json();

    if (result.success) {
      toast.success("Booking Updated Successfully!");
      navigate("/services/airlinebooking");
    } else {
      toast.error(`Error: ${result.message || 'Failed to update'}`);
    }
  } catch (err) {
    console.error(err);
    toast.error("Server Error: Connection Failed");
  } finally {
    setSubmitting(false);
  }
};

  if (loading) return (
    <div className="ea-page">
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
      <main className={`ea-main ${isSidebarCollapsed ? "ea-main--collapsed" : ""}`}>
        <div className="ea-loading">
          <div className="spinner"></div>
          <p>Loading booking data...</p>
        </div>
      </main>
    </div>
  );

  return (
    <div className="ea-page">
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
      <main className={`ea-main ${isSidebarCollapsed ? "ea-main--collapsed" : ""}`}>
        <div className="ea-container">
          
          <header className="ea-header">
            <div className="ea-header-content">
              <button className="ea-back-btn" onClick={handleCancel}>
                <ArrowLeft size={18} /> Back
              </button>
              <h1 className="ea-title">Edit Airline Booking</h1>
              <p className="ea-subtitle">Modify passenger and flight details</p>
            </div>
          </header>

          <form onSubmit={handleSubmit} className="ea-form">
            <div className="ea-grid-layout">
              
              <div className="ea-form-left">
                
                <section className="ea-section">
                  <div className="ea-section-header">
                    <User size={20} className="ea-section-icon" />
                    <h3>Client Information</h3>
                  </div>
                  <div className="ea-fields-grid">
                    <div className="ea-input-group">
                      <label>Full Name</label>
                      <input 
                        type="text" 
                        name="fullName" 
                        value={formData.fullName} 
                        onChange={handleInputChange} 
                        className="ea-input" 
                        required 
                      />
                    </div>
                    <div className="ea-input-group">
                      <label>Email Address</label>
                      <input 
                        type="email" 
                        name="email" 
                        value={formData.email} 
                        onChange={handleInputChange} 
                        className="ea-input" 
                        required 
                      />
                    </div>
                    <div className="ea-input-group">
                      <label>Contact Number</label>
                      <input 
                        type="text" 
                        name="contactNumber" 
                        value={formData.contactNumber} 
                        onChange={handleInputChange} 
                        className="ea-input" 
                      />
                    </div>
                    <div className="ea-input-group">
                      <label>Fare Amount (PHP)</label>
                      <input 
                        type="number" 
                        name="estimatedPrice" 
                        value={formData.estimatedPrice} 
                        onChange={handleInputChange} 
                        className="ea-input" 
                        required 
                      />
                    </div>
                  </div>
                </section>

                {/* FLIGHT DETAILS SECTION - UPDATED WITH ROUND-TRIP UI */}
{/* FLIGHT DETAILS - FIXED FOR ROUND-TRIP */}
<section className="ea-section">
  <div className="ea-section-header">
    <Plane size={20} className="ea-section-icon" />
    <h3>
      Flight Details 
      <span style={{marginLeft:'12px', fontSize:'13px', padding:'4px 12px', borderRadius:'20px', background:'#fff7ed', color:'#f59e0b', fontWeight:'700'}}>
        {formData.journeyType === 'round-trip' ? 'ROUND-TRIP' : 'ONE-WAY'}
      </span>
    </h3>
  </div>

  {formData.journeyType === 'round-trip' ? (
    <>
      {/* OUTBOUND LEG */}
      <div style={{marginBottom: '24px', padding: '16px', background:'#f8fafc', borderRadius:'10px', border:'1px solid #fed7aa'}}>
        <div style={{fontWeight:'800', color:'#f59e0b', marginBottom:'10px'}}>DEPARTURE (Outbound)</div>
        <div className="ea-fields-grid">
          <div className="ea-input-group">
            <label>Origin</label>
            <input type="text" value={formData.outbound.origin} 
              onChange={(e) => handleNestedChange('outbound', 'origin', e.target.value)} className="ea-input" />
          </div>
          <div className="ea-input-group">
            <label>Destination</label>
            <input type="text" value={formData.outbound.destination} 
              onChange={(e) => handleNestedChange('outbound', 'destination', e.target.value)} className="ea-input" />
          </div>
          <div className="ea-input-group">
            <label>Departure Time/Date</label>
            <input type="text" value={formData.outbound.departureDate} 
              onChange={(e) => handleNestedChange('outbound', 'departureDate', e.target.value)} className="ea-input" />
          </div>
          <div className="ea-input-group">
            <label>Airline</label>
            <input type="text" value={formData.outbound.airline} 
              onChange={(e) => handleNestedChange('outbound', 'airline', e.target.value)} className="ea-input" />
          </div>
          <div className="ea-input-group">
            <label>Price (₱)</label>
            <input type="number" value={formData.outbound.price} 
              onChange={(e) => handleNestedChange('outbound', 'price', e.target.value)} className="ea-input" />
          </div>
        </div>
      </div>

      {/* RETURN LEG */}
      <div style={{padding: '16px', background:'#f8fafc', borderRadius:'10px', border:'1px solid #a3e4b8'}}>
        <div style={{fontWeight:'800', color:'#10b981', marginBottom:'10px'}}>RETURN</div>
        <div className="ea-fields-grid">
          <div className="ea-input-group">
            <label>Origin</label>
            <input type="text" value={formData.return.origin} 
              onChange={(e) => handleNestedChange('return', 'origin', e.target.value)} className="ea-input" />
          </div>
          <div className="ea-input-group">
            <label>Destination</label>
            <input type="text" value={formData.return.destination} 
              onChange={(e) => handleNestedChange('return', 'destination', e.target.value)} className="ea-input" />
          </div>
          <div className="ea-input-group">
            <label>Departure Time/Date</label>
            <input type="text" value={formData.return.departureDate} 
              onChange={(e) => handleNestedChange('return', 'departureDate', e.target.value)} className="ea-input" />
          </div>
          <div className="ea-input-group">
            <label>Airline</label>
            <input type="text" value={formData.return.airline} 
              onChange={(e) => handleNestedChange('return', 'airline', e.target.value)} className="ea-input" />
          </div>
          <div className="ea-input-group">
            <label>Price (₱)</label>
            <input type="number" value={formData.return.price} 
              onChange={(e) => handleNestedChange('return', 'price', e.target.value)} className="ea-input" />
          </div>
        </div>
      </div>

      {/* TOTAL */}
      <div style={{marginTop:'20px', padding:'16px', background:'#fffbeb', borderRadius:'10px', border:'2px solid #fcd34d', fontSize:'18px', fontWeight:'800', display:'flex', justifyContent:'space-between'}}>
        <span>TOTAL ROUND-TRIP</span>
        <span style={{color:'#f59e0b'}}>₱{(formData.totalAmount || formData.estimatedPrice || 0).toLocaleString()}</span>
      </div>
    </>
  ) : (
    /* ONE-WAY FALLBACK */
    <div className="ea-fields-grid">
      <div className="ea-input-group">
        <label>Origin</label>
        <input type="text" name="origin" value={formData.origin} onChange={handleInputChange} className="ea-input" />
      </div>
      <div className="ea-input-group">
        <label>Destination</label>
        <input type="text" name="destination" value={formData.destination} onChange={handleInputChange} className="ea-input" />
      </div>
      <div className="ea-input-group">
        <label>Departure Date</label>
        <input type="date" name="departureDate" value={formData.departureDate} onChange={handleInputChange} className="ea-input" />
      </div>
      <div className="ea-input-group">
        <label>Airline</label>
        <input type="text" name="airline" value={formData.airline} onChange={handleInputChange} className="ea-input" />
      </div>
    </div>
  )}
</section>

                <section className="ea-section">
                  <div className="ea-section-header row-between">
                    <div className="flex-center">
                      <Users size={20} className="ea-section-icon" />
                      <h3>Passengers ({passengers.length})</h3>
                    </div>
                    <button type="button" onClick={addPassenger} className="ea-add-pax-btn">
                      + Add Passenger
                    </button>
                  </div>
                  
                  <div className="ea-passengers-list">
                    {passengers.map((pax, index) => (
                      <div key={index} className="ea-pax-row">
                        <div className="ea-input-group">
                           <input 
                            type="text" 
                            placeholder="First Name" 
                            value={pax.firstName} 
                            onChange={(e) => handlePassengerChange(index, 'firstName', e.target.value)} 
                            className="ea-input" 
                            required 
                          />
                        </div>
                        <div className="ea-input-group">
                          <input 
                            type="text" 
                            placeholder="Last Name" 
                            value={pax.lastName} 
                            onChange={(e) => handlePassengerChange(index, 'lastName', e.target.value)} 
                            className="ea-input" 
                            required 
                          />
                        </div>
                        <div className="ea-input-group">
                           <select 
                            value={pax.type} 
                            onChange={(e) => handlePassengerChange(index, 'type', e.target.value)} 
                            className="ea-input ea-select"
                          >
                            <option value="Adult">Adult</option>
                            <option value="Child">Child</option>
                            <option value="Infant">Infant</option>
                          </select>
                        </div>
                        <div className="ea-input-group">
                          <input 
                            type="number" 
                            placeholder="Age" 
                            value={pax.age || ""} 
                            onChange={(e) => handlePassengerChange(index, 'age', e.target.value)} 
                            className="ea-input" 
                          />
                        </div>
                        <button 
                          type="button" 
                          className="ea-delete-btn"
                          onClick={() => removePassenger(index)} 
                          disabled={passengers.length === 1}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="ea-section">
                  <div className="ea-section-header">
                    <MessageSquare size={20} className="ea-section-icon" />
                    <h3>Notes / Instructions</h3>
                  </div>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    className="ea-input ea-textarea"
                    placeholder="Add special requests or notes here..."
                  />
                </section>

              </div>

              <div className="ea-form-right">
                <div className="ea-sticky-sidebar">
                  <div className="ea-card-sidebar ea-actions-card">
                    <button 
                      type="submit" 
                      className="ea-btn ea-btn--submit" 
                      disabled={submitting}
                    >
                      {submitting ? "Updating..." : "Save Changes"}
                    </button>

                    <button 
                      type="button" 
                      className="ea-btn ea-btn--cancel" 
                      onClick={handleCancel}
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </form>
        </div>
      </main>

      {/* Confirmation Modal Component */}
      <CustomConfirmModal 
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onConfirm={modalConfig.onConfirm}
        onCancel={closeModal}
      />
    </div>
  );
};

export default EditAirline;