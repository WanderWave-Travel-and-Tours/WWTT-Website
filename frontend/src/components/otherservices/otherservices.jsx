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
  Calendar,
  Briefcase,
  AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./otherservices.css";
import MascotGif from "../MascotGif/MascotGif";
import VisaTable from "./VisaTable";
import PSATable from "./PsaTable";
import CenomarTable from "./CenomarTable";
import PassportTable from "./PassportTable";
import PassportWizard from "./PassportWizard";
// Import the Toast Manager hook
import { useToast } from "../toast/ToastManager";
// Import the Custom Confirm Modal
import CustomConfirmModal from "../confirmationModal/CustomConfirmModal";
import { usePageTracker } from '../../hooks/usePageTracker';
import { useGHLTrigger } from '../../hooks/useGHLTrigger';

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
          <span>info@wanderwavetravelandtours.com</span>
        </div>
      </div>
    </form>
  );
};

const OtherServices = ({ setAuthPage }) => {
  // ── Refs ────────────────────────────────────────────────────────────────────
  const sliderRef = useRef(null);
  const wrapperRef = useRef(null); // ref for the SCROLLABLE carousel wrapper only

  // ── Navigation ──────────────────────────────────────────────────────────────
  const navigate = useNavigate();

  // ── State ───────────────────────────────────────────────────────────────────
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showRequirementsModal, setShowRequirementsModal] = useState(false);
  const [showVisaCountries, setShowVisaCountries] = useState(false);
  const [isVisaService, setIsVisaService] = useState(false);
  const [showPSADocuments, setShowPSADocuments] = useState(false);
  const [isPSAService, setIsPSAService] = useState(false);
  const [showCENOMARDocuments, setShowCENOMARDocuments] = useState(false);
  const [isCENOMARService, setIsCENOMARService] = useState(false);
  const [showPassportService, setShowPassportService] = useState(false);
  const [isPassportService, setIsPassportService] = useState(false);

  // ── CustomConfirmModal state ─────────────────────────────────────────────────
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "primary",
    onConfirm: null,
  });

  // ── Toast hook ───────────────────────────────────────────────────────────────
  const toast = useToast();

  const [selectedPackage, setSelectedPackage] = useState({
    title: "",
    desc: "",
    requirements: [],
    price: 3599.99,
    visaCountry: null,
    psaDocument: null,
    cenomarDocument: null,
    serviceId: null,
  });

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    message: "",
  });

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
    Receipt: <Receipt size={24} />,
    Calendar: <Calendar size={24} />,
    Briefcase: <Briefcase size={24} />,
  };

  const currentMonth = new Date();
  const selectedDate = 15;
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const backgroundImage =
    "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format&fit=crop";

  useEffect(() => {
    fetchServices();
  }, []);

  // ── Page View Tracker ────────────────────────────────────────────
  // Fires once on mount — permanent dedup per visitor IP.
  usePageTracker({ page: 'services', path: '/services', label: 'Other Services Page' });

  // ── GHL session guard — computed once per session mount ──────────
  const [ghlEnabled] = useState(() => !sessionStorage.getItem('ww_exit_shown'));

  // ── GHL Trigger — fires after 1 minute OR on exit intent ────────
  useGHLTrigger({
    enabled: ghlEnabled,
    delayMinutes: 1,
    triggerOnExit: true
  });

  // ── Stamp sessionStorage the moment the GHL form would appear ───
  useEffect(() => {
    if (!ghlEnabled) return;

    const markShown = () => sessionStorage.setItem('ww_exit_shown', 'true');

    const timer = setTimeout(markShown, 60 * 1000);

    const handleExitIntent = (e) => {
      if (e.clientY <= 0) markShown();
    };
    document.addEventListener('mouseleave', handleExitIntent);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mouseleave', handleExitIntent);
    };
  }, [ghlEnabled]);

  const fetchServices = async () => {
    try {
      const response = await fetch('https://wanderwaveph.onrender.com/api/services');
      const data = await response.json();

      if (data.success) {
        const transformedServices = data.data.map(service => {
          return {
            _id: service._id,
            icon: iconMap[service.icon] || <Globe size={24} />,
            title: service.title,
            desc: service.description,
            img: service.image.startsWith('http') ? service.image : `https://wanderwaveph.onrender.com/uploads/${service.image}`,
            price: service.price,
            requirements: service.requirements || [],
            order: service.order || 999,
            isComingSoon: !service.isActive,
          };
        });

        transformedServices.sort((a, b) => {
          if (a.isComingSoon !== b.isComingSoon) {
            return a.isComingSoon ? 1 : -1;
          }
          return (a.order || 999) - (b.order || 999);
        });

        setServices(transformedServices);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  // ── FIX: scroll wrapperRef (the overflow-x:auto element, now separate from buttons) ──
  const scroll = (direction) => {
    if (wrapperRef.current) {
      const scrollAmount = 350;
      if (direction === "left") {
        wrapperRef.current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
      } else {
        wrapperRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      }
    }
  };

  // ── Helper: open confirm modal ────────────────────────────────────────────────
  const openConfirm = ({ title, message, type = "primary", onConfirm }) => {
    setConfirmModal({ isOpen: true, title, message, type, onConfirm });
  };

  const closeConfirm = () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false, onConfirm: null }));
  };

  const handleConfirmAction = () => {
    if (confirmModal.onConfirm) confirmModal.onConfirm();
    closeConfirm();
  };

  // ── Service card click handler ────────────────────────────────────────────────
  const handleInquireClick = (item) => {
    if (item.isComingSoon) {
      toast.info(
        `The service "${item.title}" is coming soon! We will announce the launch date shortly.`,
        "Coming Soon"
      );
      return;
    }

    // ── Tour Arrangements: redirect to dedicated tours page ──────────────────
    if (
      item.title === "Tour Arrangements" ||
      item.title.toLowerCase().includes("tour arrangement")
    ) {
      navigate("/tours");
      return;
    }

    // ── Tourist Transfers: redirect to dedicated transfers page ──────────────
    if (
      item.title === "Tourist Transfers" ||
      item.title.toLowerCase().includes("transfer")
    ) {
      navigate("/transfers");
      return;
    }

    if (item.title === "Visa Assistance") {
      setIsVisaService(true);
      setIsPSAService(false);
      setIsCENOMARService(false);
      setIsPassportService(false);
      setSelectedPackage({
        title: item.title,
        desc: item.desc,
        requirements: [],
        price: item.price || 4999.99,
        visaCountry: null,
        psaDocument: null,
        cenomarDocument: null,
        serviceId: item._id,
      });
      setFormData({ fullName: "", email: "", message: "" });
      setShowModal(false);
      setShowVisaCountries(true);
      return;
    }

    if (item.title === "PSA Assistance" || item.title.includes("PSA")) {
      setIsPSAService(true);
      setIsVisaService(false);
      setIsCENOMARService(false);
      setIsPassportService(false);
      setSelectedPackage({
        title: item.title,
        desc: item.desc,
        requirements: [],
        price: item.price || 350,
        visaCountry: null,
        psaDocument: null,
        cenomarDocument: null,
        serviceId: item._id,
      });
      setFormData({ fullName: "", email: "", message: "" });
      setShowModal(false);
      setShowPSADocuments(true);
      return;
    }

    if (item.title === "CENOMAR Assistance" || item.title.includes("CENOMAR")) {
      setIsCENOMARService(true);
      setIsVisaService(false);
      setIsPSAService(false);
      setIsPassportService(false);
      setSelectedPackage({
        title: item.title,
        desc: item.desc,
        requirements: [],
        price: item.price || 450,
        visaCountry: null,
        psaDocument: null,
        cenomarDocument: null,
        serviceId: item._id,
      });
      setFormData({ fullName: "", email: "", message: "" });
      setShowModal(false);
      setShowCENOMARDocuments(true);
      return;
    }

    if (item.title === "Passport Assistance" || item.title.includes("Passport")) {
      setIsPassportService(true);
      setIsVisaService(false);
      setIsPSAService(false);
      setIsCENOMARService(false);
      setSelectedPackage({
        title: item.title,
        desc: item.desc,
        requirements: [],
        price: item.price || 1500,
        visaCountry: null,
        psaDocument: null,
        cenomarDocument: null,
        serviceId: item._id,
      });
      setFormData({ fullName: "", email: "", message: "" });
      setShowModal(false);
      setShowPassportService(true);
      return;
    }

    setIsVisaService(false);
    setIsPSAService(false);
    setIsCENOMARService(false);
    setIsPassportService(false);
    setSelectedPackage({
      title: item.title,
      desc: item.desc,
      requirements: item.requirements || [],
      price: item.price,
      visaCountry: null,
      psaDocument: null,
      cenomarDocument: null,
      serviceId: item._id,
    });
    setFormData({ fullName: "", email: "", message: "" });
    setShowModal(true);
  };

  const handleSelectVisa = (visaData) => {
    setSelectedPackage((prev) => ({
      ...prev,
      title: visaData.description || `${visaData.country} Visa Assistance`,
      visaCountry: visaData.country,
      requirements: visaData.requirements,
      price: visaData.price || visaData.estimatedPrice,
    }));
    setShowVisaCountries(false);
    setShowModal(true);
  };

  const handleSelectPSA = (psaData) => {
    setSelectedPackage(prev => ({
      ...prev,
      title: psaData.documentName || "PSA Assistance",
      psaDocument: psaData.documentName,
      requirements: psaData.requirements || [],
      price: psaData.estimatedPrice,
    }));
    setShowPSADocuments(false);
    setShowModal(true);
  };

  const handleSelectCENOMAR = (cenomarData) => {
    setSelectedPackage(prev => ({
      ...prev,
      title: cenomarData.documentName || "CENOMAR Assistance",
      cenomarDocument: cenomarData.documentName,
      requirements: cenomarData.requirements || [],
      price: cenomarData.estimatedPrice,
    }));
    setShowCENOMARDocuments(false);
    setShowModal(true);
  };

  const handlePassportSelect = (passportData) => {
    setSelectedPackage(prev => ({
      ...prev,
      title: passportData.serviceName || 'Passport Appointment',
      requirements: [],
      price: passportData.estimatedPrice || 1500,
      serviceId: passportData.serviceId,
      serviceType: passportData.serviceType
    }));
    setShowPassportService(false);
    setShowModal(true);
  };

  const handleViewRequirements = () => {
    if (isVisaService) {
      setShowModal(false);
      setShowVisaCountries(true);
    } else if (isPSAService) {
      setShowModal(false);
      setShowPSADocuments(true);
    } else if (isCENOMARService) {
      setShowModal(false);
      setShowCENOMARDocuments(true);
    } else if (isPassportService) {
      setShowModal(false);
      setShowPassportService(true);
    } else {
      setShowRequirementsModal(true);
    }
  };

  const handlePassportWizardSubmit = async (wizardData) => {
    try {
      let appType = 'NEW';
      const selectedType = selectedPackage.serviceType ? selectedPackage.serviceType.toUpperCase() : 'NEW';

      if (selectedType.includes('RENEWAL')) appType = 'RENEWAL';
      else if (selectedType.includes('LOST')) appType = 'LOST';

      const inquiryData = {
        serviceId: selectedPackage.serviceId,
        serviceName: selectedPackage.title,
        fullName: wizardData.applicants[0]?.name || 'Group Booking',
        email: wizardData.applicants[0]?.email || '',
        message: `Passport Booking (${appType}) for ${wizardData.paxCount} pax. Type: ${wizardData.bookingType}.`,
        estimatedPrice: selectedPackage.price * wizardData.paxCount,
        inquiryType: 'PASSPORT',
        status: 'PENDING',
        passportDetails: {
          applicationType: appType,
          processingType: 'REGULAR',
          dfaLocation: 'To be discussed',
          appointmentDate: 'TBD',
          isGroup: wizardData.bookingType === 'GROUP',
          groupSize: wizardData.paxCount,
          applicants: wizardData.applicants
        }
      };

      const response = await fetch('https://wanderwaveph.onrender.com/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inquiryData)
      });

      const result = await response.json();

      if (result.success) {
        toast.success(
          `Passport Applications Received! Ref: ${result.data._id}. If you're a new user, check your email for login credentials.`,
          "Success"
        );
        setShowModal(false);
        setIsPassportService(false);
      } else {
        throw new Error(result.message || 'Failed to submit booking');
      }
    } catch (error) {
      console.error("Booking Error", error);
      toast.error("Failed to submit booking. Please try again.", "Error");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleInquirySubmit = async (e) => {
    e.preventDefault();

    // Use CustomConfirmModal to confirm before sending
    openConfirm({
      title: "Send Inquiry?",
      message: `Are you sure you want to submit your inquiry for "${selectedPackage.title}"? We will contact you within 24 hours.`,
      type: "primary",
      onConfirm: async () => {
        try {
          const inquiryData = {
            serviceId: selectedPackage.serviceId,
            serviceName: selectedPackage.title,
            fullName: formData.fullName,
            email: formData.email,
            message: formData.message,
            estimatedPrice: selectedPackage.price,
            inquiryType: isVisaService ? 'VISA'
              : isPSAService ? 'PSA'
              : isCENOMARService ? 'CENOMAR'
              : isPassportService ? 'PASSPORT'
              : 'OTHER',
            visaCountry: selectedPackage.visaCountry,
            psaDocument: selectedPackage.psaDocument,
            cenomarDocument: selectedPackage.cenomarDocument,
            status: 'PENDING'
          };

          if (isPassportService) {
            inquiryData.passportDetails = {
              applicationType: 'NEW',
              processingType: 'REGULAR',
              dfaLocation: 'To be discussed',
              appointmentDate: 'TBD'
            };
          }

          const response = await fetch('https://wanderwaveph.onrender.com/api/inquiries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(inquiryData)
          });

          const result = await response.json();

          if (result.success) {
            toast.success(
              `Your inquiry for "${selectedPackage.title}" has been submitted successfully! If you're a new user, check your email for login credentials.`,
              "Inquiry Sent"
            );

            setShowModal(false);
            setIsVisaService(false);
            setIsPSAService(false);
            setIsCENOMARService(false);
            setIsPassportService(false);
            setFormData({ fullName: "", email: "", message: "" });
            setSelectedPackage({
              title: "",
              desc: "",
              requirements: [],
              price: 3599.99,
              visaCountry: null,
              psaDocument: null,
              cenomarDocument: null,
              serviceId: null,
            });
          } else {
            throw new Error(result.message || 'Failed to submit inquiry');
          }
        } catch (error) {
          console.error('Error submitting inquiry:', error);
          toast.error(`Error: ${error.message || 'Failed to submit inquiry'}. Please try again.`, "Error");
        }
      },
    });
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="os-section" style={{ backgroundImage: `url(${backgroundImage})` }}>
      <div className="os-overlay"></div>
      <div className="os-content-wrapper">
        <div className="os-header">
          <h1 className="os-title">WANDERWAVE SERVICES</h1>
          <p className="os-subtitle">Your One-Stop Travel & Documentation Solution</p>
        </div>

        {/* ── FIX: Buttons are now SIBLINGS of the scrollable wrapper, not children ── */}
        <div className="os-carousel-outer">
          <button
            className="os-nav-btn os-prev"
            onClick={() => scroll("left")}
            aria-label="Scroll Left"
          >
            <ChevronLeft size={28} />
          </button>

          {/* wrapperRef is on the SCROLLABLE element only */}
          <div className="os-carousel-wrapper" ref={wrapperRef}>
            <div className="os-slider" ref={sliderRef}>
              {loading ? (
                <div style={{ color: 'white', textAlign: 'center', width: '100%', padding: '2rem' }}>
                  Loading services...
                </div>
              ) : (
                services.map((item, index) => (
                  <div
                    className={`os-card ${item.isComingSoon ? 'os-card--coming-soon' : ''}`}
                    key={index}
                  >
                    <div
                      className="os-card-img"
                      style={{ backgroundImage: `url(${item.img})` }}
                    >
                      <div className="os-card-overlay"></div>
                      {item.isComingSoon && <span className="os-card-soon-tag">Coming Soon</span>}
                      <div className="os-card-icon-wrapper">
                        <div className="os-card-icon">{item.icon}</div>
                      </div>
                    </div>
                    <div className="os-card-content">
                      <h3 className="os-card-title">{item.title}</h3>
                      <p className="os-card-description">{item.desc}</p>
                      <button
                        className={`os-card-btn ${item.isComingSoon ? 'os-card-btn--disabled' : ''}`}
                        onClick={() => handleInquireClick(item)}
                        disabled={item.isComingSoon}
                      >
                        {item.isComingSoon ? 'Check Back Soon' : 'Inquire Now'} <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
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

      {/* ── Main Inquiry Modal ─────────────────────────────────────────────── */}
      {showModal && (
        <div className="modal-overlay">
          {isPassportService ? (
            <div className="modal-card" style={{ maxWidth: '900px', height: '90vh', padding: '0', overflow: 'hidden' }}>
              <button
                className="modal-close-btn"
                onClick={() => { setShowModal(false); setIsPassportService(false); }}
                style={{ zIndex: 999 }}
              >
                <X size={24} />
              </button>
              <PassportWizard
                onClose={() => setShowModal(false)}
                onSubmit={handlePassportWizardSubmit}
              />
            </div>
          ) : (
            <div className="modal-card modal-two-column">
              <button
                className="modal-close-btn"
                onClick={() => {
                  setShowModal(false);
                  setIsVisaService(false);
                  setIsPSAService(false);
                  setIsCENOMARService(false);
                  setIsPassportService(false);
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
                        ₱{(selectedPackage.price || 3599.99).toLocaleString("en-US", {
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
          )}
        </div>
      )}

      {/* ── Requirements Modal (non-visa/psa/cenomar) ─────────────────────── */}
      {showRequirementsModal && !isVisaService && !isPSAService && !isCENOMARService && !isPassportService && (
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

      {/* ── Visa Countries Modal ───────────────────────────────────────────── */}
      {showVisaCountries && (
        <div
          className="modal-overlay"
          onClick={() => setShowVisaCountries(false)}
        >
          <div
            className="visa-countries-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close-btn"
              onClick={() => setShowVisaCountries(false)}
              aria-label="Close Visa Countries"
            >
              <X size={32} strokeWidth={3} />
            </button>
            <VisaTable onSelectVisa={handleSelectVisa} />
          </div>
        </div>
      )}

      {/* ── PSA Documents Modal ────────────────────────────────────────────── */}
      {showPSADocuments && (
        <div
          className="modal-overlay"
          onClick={() => setShowPSADocuments(false)}
        >
          <div
            className="psa-documents-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close-btn"
              onClick={() => setShowPSADocuments(false)}
              aria-label="Close PSA Documents"
            >
              <X size={32} strokeWidth={3} />
            </button>
            <PSATable
              onSelectPSA={handleSelectPSA}
              onClose={() => setShowPSADocuments(false)}
            />
          </div>
        </div>
      )}

      {/* ── CENOMAR Documents Modal ────────────────────────────────────────── */}
      {showCENOMARDocuments && (
        <div
          className="modal-overlay"
          onClick={() => setShowCENOMARDocuments(false)}
        >
          <div
            className="cenomar-documents-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close-btn"
              onClick={() => setShowCENOMARDocuments(false)}
              aria-label="Close CENOMAR Documents"
            >
              <X size={32} strokeWidth={3} />
            </button>
            <CenomarTable
              onSelectCENOMAR={handleSelectCENOMAR}
              onClose={() => setShowCENOMARDocuments(false)}
            />
          </div>
        </div>
      )}

      {/* ── Passport Service Modal ─────────────────────────────────────────── */}
      {showPassportService && (
        <div
          className="modal-overlay"
          onClick={() => setShowPassportService(false)}
        >
          <div
            className="passport-service-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close-btn"
              onClick={() => setShowPassportService(false)}
              aria-label="Close Passport Service"
            >
              <X size={32} strokeWidth={3} />
            </button>
            <PassportTable onSelectPassport={handlePassportSelect} />
          </div>
        </div>
      )}

      {/* ── CustomConfirmModal ─────────────────────────────────────────────── */}
      <CustomConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        onConfirm={handleConfirmAction}
        onCancel={closeConfirm}
      />

      <MascotGif />
    </div>
  );
};

export default OtherServices;