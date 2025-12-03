import React, { useRef, useState, useEffect } from "react";
import {
  Plane,
  Hotel,
  Map,
  Ship,
  BookUser,
  Baby,
  HeartHandshake,
  FileCheck,
  Globe,
  ShieldCheck,
  Receipt,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle,
  Phone,
  Mail,
} from "lucide-react";
import "./OtherServices.css";
import VisaTable from "./VisaTable";

const UniversalInquiryForm = ({
  pkgTitle,
  formData,
  handleInputChange,
  handleSubmit,
}) => {
  return (
    <form className="modal-form" onSubmit={handleSubmit}>
      <h3 className="form-header-title">Contact & Inquiry Details</h3>

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
        <label>MESSAGE (SPECIFY REQUEST FOR {pkgTitle.toUpperCase()})</label>
        <textarea
          name="message"
          placeholder={`e.g. I need assistance with my ${pkgTitle} for three people and my target date is October 15, 2026. (Include all details from the requirements checklist)`}
          rows="5"
          value={formData.message}
          onChange={handleInputChange}
          required
        ></textarea>
      </div>

      <button type="submit" className="modal-submit-btn">
        Send Inquiry Request
      </button>

      <div className="modal-footer-contact-inline">
        <div className="footer-contact-item">
          <Phone size={18} />
          <span>+63 912 345 6789</span>
        </div>
        <div className="footer-contact-divider"></div>
        <div className="footer-contact-item">
          <Mail size={18} />
          <span>info@wanderwave.com</span>
        </div>
      </div>
    </form>
  );
};

const OtherServices = ({ setAuthPage }) => {
  const sliderRef = useRef(null);

  // NEW: Add services state and loading
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [showRequirementsModal, setShowRequirementsModal] = useState(false);
  const [showVisaCountries, setShowVisaCountries] = useState(false);
  const [isVisaService, setIsVisaService] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState({
    title: "",
    desc: "",
    requirements: [],
    price: 3599.99,
  });

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    message: "",
  });

  // Icon mapping - Match database icon names to React components
  const iconMap = {
    Plane: <Plane size={24} />,
    Hotel: <Hotel size={24} />,
    Map: <Map size={24} />,
    Ship: <Ship size={24} />,
    BookUser: <BookUser size={24} />,
    Baby: <Baby size={24} />,
    HeartHandshake: <HeartHandshake size={24} />,
    FileCheck: <FileCheck size={24} />,
    Globe: <Globe size={24} />,
    ShieldCheck: <ShieldCheck size={24} />,
    Receipt: <Receipt size={24} />
  };

  const currentMonth = new Date();
  const selectedDate = 15;
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const backgroundImage =
    "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format&fit=crop";

  // NEW: Fetch services from database
  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/services');
      const data = await response.json();
      
      if (data.success) {
        // Transform data to include icon components
        const transformedServices = data.data.map(service => ({
          ...service,
          icon: iconMap[service.icon] || <Globe size={24} />,
          img: service.image,
          desc: service.description
        }));
        setServices(transformedServices);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      // Fallback to empty array on error
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const scroll = (direction) => {
    if (sliderRef.current) {
      const { current } = sliderRef;
      const scrollAmount = 350;

      if (direction === "left") {
        current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
      } else {
        current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      }
    }
  };

  const handleInquireClick = (item) => {
    if (item.title === "Visa Assistance") {
      setIsVisaService(true);
      setSelectedPackage({
        title: item.title,
        desc: item.desc,
        requirements: [],
        price: item.price || 3599.99,
      });
      setFormData({
        fullName: "",
        email: "",
        message: "",
      });
      setShowModal(false);
      setShowVisaCountries(true);
      return;
    }

    // Handle normal services - use requirements from database
    setIsVisaService(false);
    setSelectedPackage({
      title: item.title,
      desc: item.desc,
      requirements: item.requirements || [],
      price: item.price || 3599.99,
    });
    setFormData({
      fullName: "",
      email: "",
      message: "",
    });
    setShowModal(true);
    setShowRequirementsModal(false);
  };

  const handleViewRequirements = () => {
    if (isVisaService) {
      setShowModal(false);
      setShowVisaCountries(true);
    } else {
      setShowRequirementsModal(true);
    }
  };

  const handleSelectVisa = (visa) => {
    setShowVisaCountries(false);

    const packageTitle = visa.description || visa.country || "Visa Assistance";
    const packageRequirements = visa.requirements
      ? visa.requirements.flatMap((section) => section.items || [])
      : [];

    setSelectedPackage({
      title: packageTitle,
      desc: `Visa assistance for ${visa.country}`,
      requirements: packageRequirements,
      price: visa.price || 3749.00,
    });

    setFormData({
      fullName: "",
      email: "",
      message: `I would like to inquire about ${packageTitle}. `,
    });

    setIsVisaService(true);
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleInquirySubmit = (e) => {
    e.preventDefault();
    console.log("Inquiry submitted:", formData);

    setFormData({ fullName: "", email: "", message: "" });
    setShowModal(false);
    setIsVisaService(false);
    
    if (setAuthPage) {
      setAuthPage("login");
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="os-section" style={{ backgroundImage: `url(${backgroundImage})` }}>
        <div className="os-overlay"></div>
        <div className="os-content-wrapper">
          <div style={{ textAlign: 'center', padding: '100px', color: 'white' }}>
            <h2>Loading services...</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="os-section"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="os-overlay"></div>
      <div className="os-content-wrapper">
        <div className="os-header">
          <h2 className="os-title">WANDERWAVE SERVICES</h2>
          <p className="os-subtitle">
            Your One-Stop Travel & Documentation Solution
          </p>
        </div>

        <div className="os-carousel-wrapper">
          <button
            className="os-nav-btn os-prev"
            onClick={() => scroll("left")}
            aria-label="Scroll Left"
          >
            <ChevronLeft size={28} />
          </button>

          <div className="os-scroll-container" ref={sliderRef}>
            {services.map((item) => (
              <div key={item._id} className="os-glass-card">
                <div className="os-card-img-box">
                  <img src={item.img} alt={item.title} loading="lazy" />
                  <div className="os-floating-icon">{item.icon}</div>
                </div>

                <div className="os-card-body">
                  <h3 className="os-card-title">{item.title}</h3>
                  <p className="os-card-desc">{item.desc}</p>
                  <button
                    onClick={() => handleInquireClick(item)}
                    className="os-card-link"
                  >
                    Inquire Now <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            className="os-nav-btn os-next"
            onClick={() => scroll("right")}
            aria-label="Scroll Right"
          >
            <ChevronRight size={28} />
          </button>
        </div>

        <div className="os-swipe-hint">Swipe to explore services</div>
      </div>

      {/* Main Inquiry Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card modal-two-column">
            <button
              className="modal-close-btn"
              onClick={() => {
                setShowModal(false);
                setIsVisaService(false);
              }}
              aria-label="Close Modal"
            >
              <X size={44} strokeWidth={3} />
            </button>

            <div className="modal-requirements-col">
              <div className="modal-requirements-content">
                <div
                  className="modal-header-image"
                  style={{
                    backgroundImage: `url(${
                      services.find((s) => s.title === selectedPackage.title)?.img ||
                      "https://images.unsplash.com/photo-1473163928189-364b2c4e1135?w=600&auto=format&fit=crop&q=60"
                    })`,
                  }}
                >
                  <div className="header-image-overlay">
                    <h2 className="header-title-overlay">WanderWave Services</h2>
                  </div>
                </div>

                <div className="modal-header-small">
                  <img
                    src="https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/6911894edaa4e3fb6cfb8afe.png"
                    alt="Wanderwave Logo"
                    className="modal-logo"
                  />
                  <h2 className="modal-title">
                    Inquire about {selectedPackage.title}
                  </h2>
                  <p className="modal-subtitle">
                    Please review the necessary documents/information below.
                  </p>
                </div>

                <div className="modal-trip-summary">
                  <div className="summary-item">
                    <span className="summary-label">Estimated Price</span>
                    <strong className="summary-value price">
                      ₱{selectedPackage.price.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </strong>
                  </div>
                  <div className="summary-divider"></div>
                  <div className="summary-item">
                    <span className="summary-label">Process Started</span>
                    <strong className="summary-value">
                      {monthNames[currentMonth.getMonth()]} {selectedDate},{" "}
                      {currentMonth.getFullYear()}
                    </strong>
                  </div>
                </div>

                <div className="requirements-button-container">
                  <button
                    className="view-requirements-btn"
                    onClick={handleViewRequirements}
                  >
                    <CheckCircle size={20} /> View Requirements
                  </button>
                </div>
              </div>

              <p className="modal-contact-note">
                We will contact you via email within 24 hours.
              </p>
            </div>

            <div className="modal-form-col">
              <UniversalInquiryForm
                pkgTitle={selectedPackage.title}
                formData={formData}
                handleInputChange={handleInputChange}
                handleSubmit={handleInquirySubmit}
              />
            </div>
          </div>
        </div>
      )}

      {/* Regular Service Requirements Modal */}
      {showRequirementsModal && !isVisaService && (
        <div
          className="modal-overlay"
          onClick={() => setShowRequirementsModal(false)}
        >
          <div
            className="requirements-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close-btn"
              onClick={() => setShowRequirementsModal(false)}
              aria-label="Close Requirements"
            >
              <X size={24} strokeWidth={3} />
            </button>

            <div className="requirements-modal-header">
              <h2 className="requirements-modal-title">
                Requirements for {selectedPackage.title}
              </h2>
              <p className="requirements-modal-subtitle">
                Please prepare the following documents/information
              </p>
            </div>

            <ul className="requirements-modal-list">
              {selectedPackage.requirements.length > 0 ? (
                selectedPackage.requirements.map((req, index) => (
                  <li key={index} className="requirement-modal-item">
                    <span className="req-number">{index + 1}</span>
                    <span className="req-text">{req}</span>
                  </li>
                ))
              ) : (
                <li className="requirement-modal-item">
                   <span className="req-text">No specific requirements listed.</span>
                </li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Visa Countries Grid Modal */}
      {showVisaCountries && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowVisaCountries(false);
          }}
        >
          <div
            className="visa-countries-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close-btn"
              onClick={() => {
                setShowVisaCountries(false);
              }}
              aria-label="Close Visa Countries"
            >
              <X size={32} strokeWidth={3} />
            </button>
            <VisaTable onSelectVisa={handleSelectVisa} />
          </div>
        </div>
      )}
    </div>
  );
};

export default OtherServices;