import React, { useRef, useState } from "react";
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
  PlusCircle,
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

  const [showModal, setShowModal] = useState(false);
  const [showRequirementsModal, setShowRequirementsModal] = useState(false);
  const [showVisaCountries, setShowVisaCountries] = useState(false);
  const [selectedVisa, setSelectedVisa] = useState(null);
  const [isVisaService, setIsVisaService] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState({
    title: "",
    desc: "",
    requirements: [],
  });

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    message: "",
  });

  const currentMonth = new Date();
  const selectedDate = 15;
  const totalAmount = 3599.99;
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const getRequirements = (title) => {
    switch (title) {
      case "Airline Booking":
        return [
          "Valid ID (Passport for international; any acceptable Gov't ID for domestic).",
          "Target travel dates and cities/airports.",
          "Confirmation/Voucher from the airline (if booking assistance is for existing ticket).",
        ];
      case "Hotel Booking":
        return [
          "Valid ID of the primary guest (Passport or other Gov't ID).",
          "Booking Confirmation/Voucher (if assistance is for an existing reservation).",
        ];
      case "Tour Arrangements":
        return [
          "Valid ID (often a copy of Passport for international tours).",
          "Signed Booking Form or Agreement.",
          "Confirmed Travel Dates/Itinerary.",
        ];
      case "Ferry Booking":
        return [
          "Valid ID of the passenger(s).",
          "Booking Confirmation (if assistance is for an existing reservation).",
        ];
      case "Passport Assist":
        return [
          "Confirmed Online Appointment Slip (DFA).",
          "Personal Appearance (Mandatory).",
          "Original PSA-issued Birth Certificate (on security paper).",
          "One (1) Acceptable Primary ID with 1 photocopy.",
          "PSA-issued Marriage Certificate (Original & photocopy) if married female using spouse's surname.",
        ];
      case "PSA Birth Cert":
        return [
          "Requestor's Valid ID (to be presented upon receipt).",
          "Complete Personal Details of Subject (Full name, DoB, Parents' names).",
          "Authorization Letter and Valid IDs of both parties (if requested by a representative).",
        ];
      case "Marriage Cert":
        return [
          "Requestor's Valid ID.",
          "Complete Personal Details of Couple (Full names, Date of Marriage, Location).",
          "Authorization Letter and Valid IDs of both parties (if requested by a representative).",
        ];
      case "CENOMAR":
        return [
          "Requestor's Valid ID.",
          "Complete Personal Details of Subject (Full name, Date of Birth, Place of Birth).",
          "Authorization Letter and Valid IDs of both parties (if requested by a representative).",
        ];
      case "Visa Assistance":
        return [
          "Valid Passport (usually 6 months validity beyond travel date).",
          "Duly Accomplished Visa Application Form.",
          "Passport-size Photo(s) (specifications vary by embassy).",
          "Proof of Financial Capacity (Bank Certificate/Statement, ITR).",
          "Proof of Travel (Flight/Hotel Reservations, Itinerary).",
          "Proof of Strong Ties to Home Country (Employment/Business/School docs).",
        ];
      case "Travel Insurance":
        return ["Valid ID or Passport.", "Confirmed Travel Dates/Itinerary."];
      case "Bills Payment":
        return [
          "Actual Billing Statement or Account Details.",
          "Exact Payment Amount.",
        ];
      default:
        return [
          "Contact details (phone/email).",
          "Detailed description of your needs.",
          "Any relevant existing documents or references.",
        ];
    }
  };

  const backgroundImage =
    "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format&fit=crop";

  const services = [
    {
      icon: <Plane size={24} />,
      title: "Airline Booking",
      desc: "Domestic & International flights at the best rates.",
      img: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&auto=format&fit=crop&q=60",
    },
    {
      icon: <Hotel size={24} />,
      title: "Hotel Booking",
      desc: "Affordable stays and luxury accommodations worldwide.",
      img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&auto=format&fit=crop&q=60",
    },
    {
      icon: <Map size={24} />,
      title: "Tour Arrangements",
      desc: "Complete tour packages for solo or group travelers.",
      img: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&auto=format&fit=crop&q=60",
    },
    {
      icon: <Ship size={24} />,
      title: "Ferry Booking",
      desc: "Convenient sea travel ticket reservations.",
      img: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&auto=format&fit=crop&q=60",
    },
    {
      icon: <BookUser size={24} />,
      title: "Passport Assist",
      desc: "New application and renewal processing assistance.",
      img: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=600&auto=format&fit=crop&q=60",
    },
    {
      icon: <Baby size={24} />,
      title: "PSA Birth Cert",
      desc: "Hassle-free request for PSA authenticated documents.",
      img: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&auto=format&fit=crop&q=60",
    },
    {
      icon: <HeartHandshake size={24} />,
      title: "Marriage Cert",
      desc: "PSA Marriage Certificate processing support.",
      img: "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=600&auto=format&fit=crop&q=60",
    },
    {
      icon: <FileCheck size={24} />,
      title: "CENOMAR",
      desc: "Certificate of No Marriage (CENOMAR) requests.",
      img: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&auto=format&fit=crop&q=60",
    },
    {
      icon: <Globe size={24} />,
      title: "Visa Assistance",
      desc: "Expert guidance for tourist and travel visa applications.",
      img: "https://images.unsplash.com/photo-1473163928189-364b2c4e1135?w=600&auto=format&fit=crop&q=60",
    },
    {
      icon: <ShieldCheck size={24} />,
      title: "Travel Insurance",
      desc: "Comprehensive coverage for safe and worry-free trips.",
      img: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&auto=format&fit=crop&q=60",
    },
    {
      icon: <Receipt size={24} />,
      title: "Bills Payment",
      desc: "One-stop shop for paying your utilities and bills.",
      img: "https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=600&auto=format&fit=crop&q=60",
    },
  ];

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

    setIsVisaService(false);
    setSelectedPackage({
      title: item.title,
      desc: item.desc,
      requirements: getRequirements(item.title),
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
    
    setSelectedPackage({
      title: visa.subtitle || visa.title,
      desc: `Visa assistance for ${visa.country}`,
      requirements: visa.requirements.flatMap(section => section.items),
    });
    
    setFormData({
      fullName: "",
      email: "",
      message: `I would like to inquire about ${visa.subtitle || visa.title}. `,
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
    } else {
      console.error("setAuthPage is still undefined.");
    }
  };

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
            {services.map((item, idx) => (
              <div key={idx} className="os-glass-card">
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
                      ₱
                      {totalAmount.toLocaleString("en-US", {
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
              {selectedPackage.requirements.map((req, index) => (
                <li key={index} className="requirement-modal-item">
                  <span className="req-number">{index + 1}</span>
                  <span className="req-text">{req}</span>
                </li>
              ))}
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