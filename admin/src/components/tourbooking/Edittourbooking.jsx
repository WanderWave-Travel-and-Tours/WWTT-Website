import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  User,
  MessageSquare,
  Calendar,
  CreditCard,
  Package,
  Plane,
} from "lucide-react";
import Sidebar from "../sidebar/sidebar";
import { useToast } from "../toast/ToastManager";
import CustomConfirmModal from "../confirmationModal/CustomConfirmModal";
import "./Edittourbooking.css";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const getAdminData = () => {
  try {
    const adminData = JSON.parse(localStorage.getItem("adminData") || "{}");
    return {
      userEmail: adminData.email || adminData.username || "Unknown Admin",
      adminId: adminData._id || adminData.id || null,
    };
  } catch {
    return { userEmail: "Unknown Admin", adminId: null };
  }
};

const API_BASE_URL = "https://wanderwaveph.onrender.com/api/tour-bookings";
const TOURS_API    = "https://wanderwaveph.onrender.com/api/tours";

// ── Inline dropdown styles ─────────────────────────────────────────────────
const ddStyle = {
  list: {
    position: "absolute",
    top: "calc(100% + 4px)",
    left: 0,
    right: 0,
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
    zIndex: 9999,
    maxHeight: "220px",
    overflowY: "auto",
    padding: "4px 0",
    listStyle: "none",
    margin: 0,
  },
  item: (hi) => ({
    padding: "10px 14px",
    cursor: "pointer",
    fontSize: "0.875rem",
    color: "#374151",
    background: hi ? "#eff6ff" : "transparent",
    borderBottom: "1px solid #f3f4f6",
    lineHeight: 1.4,
  }),
  empty: {
    padding: "10px 14px",
    fontSize: "0.85rem",
    color: "#6b7280",
    fontStyle: "italic",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
const EditTourBooking = () => {
  const navigate   = useNavigate();
  const { id: bookingId } = useParams();
  const toast      = useToast();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // ── Tours listing (for package name dropdown) ─────────────────────────────
  const [tours, setTours] = useState([]);

  // ── Package name searchable dropdown ─────────────────────────────────────
  const [pkgOpen,  setPkgOpen]  = useState(false);
  const [pkgQuery, setPkgQuery] = useState("");
  const [pkgHi,    setPkgHi]    = useState(-1);
  const pkgRef = useRef(null);

  // ── Destination searchable dropdown ──────────────────────────────────────
  const [destOpen,  setDestOpen]  = useState(false);
  const [destQuery, setDestQuery] = useState("");
  const [destHi,    setDestHi]    = useState(-1);
  const destRef = useRef(null);

  // Modal state
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    type: "primary",
  });

  // ── Form state — mirrors TourBooking schema ───────────────────────────────
  const [formData, setFormData] = useState({
    // Tour reference
    packageName:  "",
    destination:  "",
    duration:     "",

    // Dates
    startDate: "",
    endDate:   "",

    // PAX
    paxAdult:    1,
    paxChildren: 0,
    paxInfants:  0,

    // Contact
    fullName: "",
    email:    "",
    message:  "",

    // Pricing
    packagePrice:      0,
    discountAmount:    0,
    airfareTotal:      0,
    totalAmount:       0,
    sellerPrice:       0,
    markup:            0,

    // Airfare
    includesAirfare: false,

    // Payment
    paymentType:          "full",
    initialPaymentAmount: 0,
    remainingBalance:     0,
    paymentStatus:        "pending",

    // Status
    status: "pending",
  });

  // ── Sidebar ───────────────────────────────────────────────────────────────
  const toggleSidebar = () => setIsSidebarCollapsed((p) => !p);

  // ── Modal helpers ─────────────────────────────────────────────────────────
  const closeModal = () => setModalConfig((p) => ({ ...p, isOpen: false }));

  // ── Fetch tours listing once ──────────────────────────────────────────────
  useEffect(() => {
    const fetchTours = async () => {
      try {
        const res    = await fetch(`${TOURS_API}/all?limit=200&isArchive=No`);
        const result = await res.json();
        const list   = result.data || result.tours || result || [];
        if (Array.isArray(list)) setTours(list);
      } catch (err) {
        console.warn("Could not load tours listing:", err.message);
      }
    };
    fetchTours();
  }, []);

  // ── Close package dropdown on outside click ───────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (pkgRef.current && !pkgRef.current.contains(e.target)) {
        setPkgOpen(false);
        setPkgHi(-1);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Close destination dropdown on outside click ───────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (destRef.current && !destRef.current.contains(e.target)) {
        setDestOpen(false);
        setDestHi(-1);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Unique destinations from tours list ──────────────────────────────────
  const allDestinations = useMemo(() => {
    const seen = new Set();
    const list = [];
    tours.forEach((t) => {
      const d = (t.destination || "").trim();
      if (d && !seen.has(d.toLowerCase())) {
        seen.add(d.toLowerCase());
        list.push(d);
      }
    });
    return list.sort();
  }, [tours]);

  const filteredDestinations = useMemo(
    () =>
      allDestinations.filter((d) =>
        d.toLowerCase().includes(destQuery.toLowerCase())
      ),
    [allDestinations, destQuery]
  );

  // ── Filtered tours list for package dropdown ──────────────────────────────
  // If a destination is selected, only show tours matching that destination
  const filteredTours = useMemo(() => {
    const byDest = formData.destination
      ? tours.filter(
          (t) =>
            (t.destination || "").toLowerCase() ===
            formData.destination.toLowerCase()
        )
      : tours;
    return byDest.filter((t) =>
      (t.title || "").toLowerCase().includes(pkgQuery.toLowerCase())
    );
  }, [tours, formData.destination, pkgQuery]);

  // ── Fetch booking ─────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/${bookingId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const result = await res.json();
        if (!result.success || !result.data)
          throw new Error("Invalid response format");

        const d = result.data;

        setFormData({
          packageName:  d.packageName  || "",
          destination:  d.destination  || "",
          duration:     d.duration     || "",

          startDate: d.startDate ? d.startDate.split("T")[0] : "",
          endDate:   d.endDate   ? d.endDate.split("T")[0]   : "",

          paxAdult:    d.pax?.adult    ?? 1,
          paxChildren: d.pax?.children ?? 0,
          paxInfants:  d.pax?.infants  ?? 0,

          fullName: d.fullName || "",
          email:    d.email    || "",
          message:  d.message  || "",

          packagePrice:   d.packagePrice   ?? 0,
          discountAmount: d.discountAmount  ?? 0,
          airfareTotal:   d.airfareTotal    ?? 0,
          totalAmount:    d.totalAmount     ?? 0,
          sellerPrice:    d.sellerPrice     ?? 0,
          markup:         d.markup          ?? 0,

          includesAirfare: d.includesAirfare ?? false,

          paymentType:          d.paymentType          || "full",
          initialPaymentAmount: d.initialPaymentAmount ?? 0,
          remainingBalance:     d.remainingBalance      ?? 0,
          paymentStatus:        d.paymentStatus         || "pending",

          status: d.status || "pending",
        });

        setPkgQuery(d.packageName || "");
        setDestQuery(d.destination || "");
      } catch (err) {
        console.error("Fetch error:", err);
        toast.error(`Failed to load booking: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) fetchBooking();
    else setLoading(false);
  }, [bookingId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Generic input handler ─────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // ── Package dropdown handlers ─────────────────────────────────────────────
  const handlePackageSelect = (tour) => {
    setFormData((prev) => ({
      ...prev,
      packageName:  tour.title,
      destination:  tour.destination  || prev.destination,
      duration:     tour.duration     || prev.duration,
      packagePrice: tour.price        ?? prev.packagePrice,
      sellerPrice:  tour.sellerPrice  ?? prev.sellerPrice,
      markup:       tour.markup       ?? prev.markup,
      totalAmount:  tour.price        ?? prev.totalAmount,
    }));
    setPkgQuery(tour.title);
    setPkgOpen(false);
    setPkgHi(-1);
  };

  const handlePkgKeyDown = (e) => {
    if (!pkgOpen) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setPkgHi((h) => Math.min(h + 1, filteredTours.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setPkgHi((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter" && pkgHi >= 0) {
      e.preventDefault();
      handlePackageSelect(filteredTours[pkgHi]);
    } else if (e.key === "Escape") {
      setPkgOpen(false);
    }
  };

  const handleDestKeyDown = (e) => {
    if (!destOpen) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setDestHi((h) => Math.min(h + 1, filteredDestinations.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setDestHi((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter" && destHi >= 0) {
      e.preventDefault();
      handleDestinationSelect(filteredDestinations[destHi]);
    } else if (e.key === "Escape") {
      setDestOpen(false);
    }
  };

  const handleDestinationSelect = (dest) => {
    setFormData((prev) => ({
      ...prev,
      destination: dest,
      // clear package selection when destination changes
      packageName: "",
      duration:    "",
      packagePrice: 0,
      sellerPrice:  0,
      markup:       0,
      totalAmount:  0,
    }));
    setDestQuery(dest);
    setDestOpen(false);
    setDestHi(-1);
    setPkgQuery("");
  };

  // ── Cancel ────────────────────────────────────────────────────────────────
  const handleCancel = () => {
    setModalConfig({
      isOpen: true,
      title: "Discard Changes",
      message:
        "Are you sure you want to cancel? Any unsaved changes will be lost.",
      type: "danger",
      onConfirm: () => {
        closeModal();
        navigate(-1);
      },
    });
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    setModalConfig({
      isOpen: true,
      title: "Save Changes",
      message: "Do you want to save the changes made to this tour booking?",
      type: "primary",
      onConfirm: () => {
        closeModal();
        processSubmit();
      },
    });
  };

  const processSubmit = async () => {
    setSubmitting(true);

    if (!formData.packageName.trim()) {
      toast.error("Package name is required.");
      setSubmitting(false);
      return;
    }

    const payload = {
      packageName:  formData.packageName,
      destination:  formData.destination,
      duration:     formData.duration,

      startDate: formData.startDate || null,
      endDate:   formData.endDate   || null,

      pax: {
        adult:    parseInt(formData.paxAdult)    || 1,
        children: parseInt(formData.paxChildren) || 0,
        infants:  parseInt(formData.paxInfants)  || 0,
      },

      fullName: formData.fullName,
      email:    formData.email,
      message:  formData.message,

      packagePrice:   parseFloat(formData.packagePrice)   || 0,
      discountAmount: parseFloat(formData.discountAmount)  || 0,
      airfareTotal:   parseFloat(formData.airfareTotal)    || 0,
      totalAmount:    parseFloat(formData.totalAmount)     || 0,
      sellerPrice:    parseFloat(formData.sellerPrice)     || 0,
      markup:         parseFloat(formData.markup)          || 0,

      includesAirfare: formData.includesAirfare,

      paymentType:          formData.paymentType,
      initialPaymentAmount: parseFloat(formData.initialPaymentAmount) || 0,
      remainingBalance:     parseFloat(formData.remainingBalance)      || 0,
      paymentStatus:        formData.paymentStatus,

      status:    formData.status,
      updatedAt: new Date(),
    };

    try {
      const res = await fetch(`${API_BASE_URL}/${bookingId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });

      const result = await res.json();

      if (result.success) {
        toast.success("Tour Booking Updated Successfully!");
        navigate(-1);
      } else {
        toast.error(`Error: ${result.message || "Failed to update"}`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Server Error: Connection Failed");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading)
    return (
      <div className="ea-page">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          toggleSidebar={toggleSidebar}
        />
        <main
          className={`ea-main ${isSidebarCollapsed ? "ea-main--collapsed" : ""}`}
        >
          <div className="ea-loading">
            <div className="spinner" />
            <p>Loading booking data...</p>
          </div>
        </main>
      </div>
    );

  // ── Derived values for summary ────────────────────────────────────────────
  const totalPax =
    parseInt(formData.paxAdult || 0) +
    parseInt(formData.paxChildren || 0) +
    parseInt(formData.paxInfants || 0);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="ea-page">
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />

      <main
        className={`ea-main ${isSidebarCollapsed ? "ea-main--collapsed" : ""}`}
      >
        <div className="ea-container">

          {/* ── HEADER ────────────────────────────────────────────────────── */}
          <header className="ea-header etbk-header">
            <div className="ea-header-content">
              <button className="ea-back-btn" onClick={handleCancel}>
                <ArrowLeft size={18} /> Back
              </button>
              <h1 className="ea-title">Edit Tour Booking</h1>
              <p className="ea-subtitle">
                Modify tour package, schedule, pax, and payment details
              </p>
            </div>
          </header>

          <form onSubmit={handleSubmit}>
            <div className="ea-grid-layout">

              {/* ── LEFT COLUMN ─────────────────────────────────────────── */}
              <div className="ea-form-left">

                {/* ── CLIENT INFORMATION ─────────────────────────────────── */}
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
                        onChange={handleChange}
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
                        onChange={handleChange}
                        className="ea-input"
                        required
                      />
                    </div>
                  </div>
                </section>

                {/* ── TOUR DETAILS ─────────────────────────────────────────── */}
                <section className="ea-section">
                  <div className="ea-section-header">
                    <Package size={20} className="ea-section-icon" />
                    <h3>Tour Package Details</h3>
                  </div>
                  <div className="ea-fields-grid">

                    {/* Destination — searchable dropdown */}
                    <div className="ea-input-group">
                      <label>Destination</label>
                      <div style={{ position: "relative" }} ref={destRef}>
                        <input
                          type="text"
                          className="ea-input"
                          value={destQuery}
                          placeholder="Search destination..."
                          onChange={(e) => {
                            setDestQuery(e.target.value);
                            setFormData((prev) => ({
                              ...prev,
                              destination: e.target.value,
                              packageName: "",
                              duration:    "",
                            }));
                            setPkgQuery("");
                            setDestOpen(true);
                            setDestHi(-1);
                          }}
                          onFocus={() => setDestOpen(true)}
                          onKeyDown={handleDestKeyDown}
                          autoComplete="off"
                        />
                        {destOpen && (
                          <ul style={ddStyle.list}>
                            {filteredDestinations.length === 0 ? (
                              <li style={ddStyle.empty}>
                                {destQuery
                                  ? "No matching destinations — you can still type a custom one"
                                  : "No destinations available"}
                              </li>
                            ) : (
                              filteredDestinations.map((d, i) => (
                                <li
                                  key={d}
                                  style={{
                                    ...ddStyle.item(i === destHi),
                                    ...(i === filteredDestinations.length - 1
                                      ? { borderBottom: "none" }
                                      : {}),
                                  }}
                                  onMouseDown={() => handleDestinationSelect(d)}
                                  onMouseEnter={() => setDestHi(i)}
                                >
                                  <div style={{ fontWeight: 600 }}>📍 {d}</div>
                                </li>
                              ))
                            )}
                          </ul>
                        )}
                      </div>
                    </div>

                    {/* Package Name — searchable dropdown, filtered by destination */}
                    <div className="ea-input-group">
                      <label>Package Name</label>
                      <div style={{ position: "relative" }} ref={pkgRef}>
                        <input
                          type="text"
                          className="ea-input"
                          value={pkgQuery}
                          placeholder={
                            formData.destination
                              ? "Search packages for this destination..."
                              : "Select a destination first..."
                          }
                          onChange={(e) => {
                            setPkgQuery(e.target.value);
                            setFormData((prev) => ({
                              ...prev,
                              packageName: e.target.value,
                            }));
                            setPkgOpen(true);
                            setPkgHi(-1);
                          }}
                          onFocus={() => setPkgOpen(true)}
                          onKeyDown={handlePkgKeyDown}
                          autoComplete="off"
                          required
                        />
                        {pkgOpen && (
                          <ul style={ddStyle.list}>
                            {filteredTours.length === 0 ? (
                              <li style={ddStyle.empty}>
                                {formData.destination
                                  ? pkgQuery
                                    ? "No matching packages — you can still type a custom name"
                                    : `No packages for "${formData.destination}"`
                                  : "Select a destination to filter packages"}
                              </li>
                            ) : (
                              filteredTours.map((t, i) => (
                                <li
                                  key={t._id}
                                  style={{
                                    ...ddStyle.item(i === pkgHi),
                                    ...(i === filteredTours.length - 1
                                      ? { borderBottom: "none" }
                                      : {}),
                                  }}
                                  onMouseDown={() => handlePackageSelect(t)}
                                  onMouseEnter={() => setPkgHi(i)}
                                >
                                  <div style={{ fontWeight: 600 }}>{t.title}</div>
                                  {(t.destination || t.duration || t.category) && (
                                    <div
                                      style={{
                                        fontSize: "0.75rem",
                                        color: "#6b7280",
                                        marginTop: "2px",
                                      }}
                                    >
                                      {[t.destination, t.duration, t.category]
                                        .filter(Boolean)
                                        .join(" · ")}
                                    </div>
                                  )}
                                </li>
                              ))
                            )}
                          </ul>
                        )}
                      </div>
                    </div>

                  </div>
                </section>

                {/* ── SCHEDULE ─────────────────────────────────────────────── */}
                <section className="ea-section">
                  <div className="ea-section-header">
                    <Calendar size={20} className="ea-section-icon" />
                    <h3>Tour Schedule</h3>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    {/* Start Date */}
                    <div style={{
                      padding: "16px",
                      background: "#fffbeb",
                      border: "1px solid #fde68a",
                      borderRadius: "10px",
                    }}>
                      <div style={{
                        fontSize: "11px", fontWeight: 900, letterSpacing: "1.2px",
                        textTransform: "uppercase", color: "#f59e0b", marginBottom: "12px",
                        display: "flex", alignItems: "center", gap: "6px",
                      }}>
                        <Calendar size={13} /> Start Date
                      </div>
                      <div className="ea-input-group" style={{ margin: 0 }}>
                        <label>Start / Travel Date</label>
                        <input
                          type="date"
                          name="startDate"
                          value={formData.startDate}
                          onChange={handleChange}
                          className="ea-input"
                          required
                        />
                      </div>
                    </div>

                    {/* End Date */}
                    <div style={{
                      padding: "16px",
                      background: "#f0fdf4",
                      border: "1px solid #a7f3d0",
                      borderRadius: "10px",
                    }}>
                      <div style={{
                        fontSize: "11px", fontWeight: 900, letterSpacing: "1.2px",
                        textTransform: "uppercase", color: "#10b981", marginBottom: "12px",
                        display: "flex", alignItems: "center", gap: "6px",
                      }}>
                        <Calendar size={13} /> End Date
                      </div>
                      <div className="ea-input-group" style={{ margin: 0 }}>
                        <label>End Date</label>
                        <input
                          type="date"
                          name="endDate"
                          value={formData.endDate}
                          onChange={handleChange}
                          className="ea-input"
                          min={formData.startDate || undefined}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Duration pill — auto-computed display only */}
                  {formData.startDate && formData.endDate && (
                    <div style={{
                      marginTop: "12px",
                      display: "inline-flex", alignItems: "center", gap: "6px",
                      background: "#eff6ff", border: "1px solid #bfdbfe",
                      borderRadius: "20px", padding: "5px 14px",
                      fontSize: "12px", fontWeight: 700, color: "#1d4ed8",
                    }}>
                      <Calendar size={13} />
                      {(() => {
                        const diff = Math.round(
                          (new Date(formData.endDate) - new Date(formData.startDate))
                          / (1000 * 60 * 60 * 24)
                        );
                        const nights = diff > 0 ? diff : 0;
                        const days   = nights + 1;
                        return diff >= 0 ? `${days}D ${nights}N` : "Invalid range";
                      })()}
                    </div>
                  )}
                </section>

                {/* ── PRICING ──────────────────────────────────────────────── */}
                <section className="ea-section">
                  <div className="ea-section-header">
                    <CreditCard size={20} className="ea-section-icon" />
                    <h3>Pricing & Payment</h3>
                  </div>

                  {/* Airfare toggle */}
                  <div className="etbk-airfare-row">
                    <div className="etbk-airfare-icon">✈️</div>
                    <div className="etbk-airfare-info">
                      <div className="etbk-airfare-title">Includes Airfare</div>
                      <div className="etbk-airfare-desc">
                        Toggle if this booking includes airfare
                      </div>
                    </div>
                    <label className="etbk-toggle-wrap">
                      <input
                        type="checkbox"
                        name="includesAirfare"
                        checked={formData.includesAirfare}
                        onChange={handleChange}
                        className="etbk-toggle-input"
                      />
                      <span className="etbk-toggle-slider" />
                    </label>
                  </div>

                  <div className="ea-fields-grid">
                    <div className="ea-input-group">
                      <label>Package Price (₱)</label>
                      <input
                        type="number"
                        name="packagePrice"
                        value={formData.packagePrice}
                        onChange={handleChange}
                        className="ea-input"
                        min="0"
                      />
                    </div>
                    <div className="ea-input-group">
                      <label>Discount Amount (₱)</label>
                      <input
                        type="number"
                        name="discountAmount"
                        value={formData.discountAmount}
                        onChange={handleChange}
                        className="ea-input"
                        min="0"
                      />
                    </div>
                    {formData.includesAirfare && (
                      <div className="ea-input-group">
                        <label>Airfare Total (₱)</label>
                        <input
                          type="number"
                          name="airfareTotal"
                          value={formData.airfareTotal}
                          onChange={handleChange}
                          className="ea-input"
                          min="0"
                        />
                      </div>
                    )}
                    <div className="ea-input-group">
                      <label>Seller Price (₱)</label>
                      <input
                        type="number"
                        name="sellerPrice"
                        value={formData.sellerPrice}
                        onChange={handleChange}
                        className="ea-input"
                        min="0"
                      />
                    </div>
                    <div className="ea-input-group">
                      <label>Markup (₱)</label>
                      <input
                        type="number"
                        name="markup"
                        value={formData.markup}
                        onChange={handleChange}
                        className="ea-input"
                        min="0"
                      />
                    </div>
                    <div className="ea-input-group">
                      <label>Total Amount (₱)</label>
                      <input
                        type="number"
                        name="totalAmount"
                        value={formData.totalAmount}
                        onChange={handleChange}
                        className="ea-input"
                        min="0"
                      />
                    </div>
                    <div className="ea-input-group">
                      <label>Payment Type</label>
                      <select
                        name="paymentType"
                        value={formData.paymentType}
                        onChange={handleChange}
                        className="ea-input ea-select"
                      >
                        <option value="full">Full</option>
                        <option value="partial">Partial</option>
                      </select>
                    </div>
                    <div className="ea-input-group">
                      <label>Payment Status</label>
                      <select
                        name="paymentStatus"
                        value={formData.paymentStatus}
                        onChange={handleChange}
                        className="ea-input ea-select"
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="partial">Partial</option>
                        <option value="failed">Failed</option>
                        <option value="refunded">Refunded</option>
                      </select>
                    </div>
                    <div className="ea-input-group">
                      <label>Initial Payment (₱)</label>
                      <input
                        type="number"
                        name="initialPaymentAmount"
                        value={formData.initialPaymentAmount}
                        onChange={handleChange}
                        className="ea-input"
                        min="0"
                      />
                    </div>
                    <div className="ea-input-group">
                      <label>Remaining Balance (₱)</label>
                      <input
                        type="number"
                        name="remainingBalance"
                        value={formData.remainingBalance}
                        onChange={handleChange}
                        className="ea-input"
                        min="0"
                      />
                    </div>
                  </div>

                  {/* Total strip */}
                  <div className="etbk-total-strip">
                    <span>TOTAL AMOUNT</span>
                    <span className="etbk-total-amount">
                      ₱{Number(formData.totalAmount || 0).toLocaleString()}
                    </span>
                  </div>
                </section>

                {/* ── NOTES / MESSAGE ──────────────────────────────────────── */}
                <section className="ea-section">
                  <div className="ea-section-header">
                    <MessageSquare size={20} className="ea-section-icon" />
                    <h3>Notes / Message</h3>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div className="ea-input-group">
                      <label>Client Message / Notes</label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        className="ea-input ea-textarea"
                        placeholder="Add notes or client message here..."
                      />
                    </div>
                  </div>
                </section>

              </div>{/* end ea-form-left */}

              {/* ── RIGHT SIDEBAR ──────────────────────────────────────────── */}
              <div className="ea-form-right">
                <div className="ea-sticky-sidebar">

                  {/* Summary card */}
                  <div className="ea-card-sidebar">
                    <div
                      className="ea-section-header"
                      style={{ marginBottom: "14px" }}
                    >
                      <h3>Booking Summary</h3>
                    </div>
                    <div className="etbk-summary-list">
                      <div className="etbk-summary-row">
                        <span>Package</span>
                        <strong style={{ maxWidth: "180px", textAlign: "right", wordBreak: "break-word" }}>
                          {formData.packageName || "—"}
                        </strong>
                      </div>
                      <div className="etbk-summary-row">
                        <span>Duration</span>
                        <strong>{formData.duration || "—"}</strong>
                      </div>
                      <div className="etbk-summary-row">
                        <span>Start Date</span>
                        <strong>{formData.startDate || "—"}</strong>
                      </div>
                      {formData.endDate && (
                        <div className="etbk-summary-row">
                          <span>End Date</span>
                          <strong>{formData.endDate}</strong>
                        </div>
                      )}
                      <div className="etbk-summary-row">
                        <span>PAX</span>
                        <strong>
                          {totalPax} pax
                          {parseInt(formData.paxAdult) > 0 &&
                            ` (${formData.paxAdult}A`}
                          {parseInt(formData.paxChildren) > 0 &&
                            ` · ${formData.paxChildren}C`}
                          {parseInt(formData.paxInfants) > 0 &&
                            ` · ${formData.paxInfants}I`}
                          {parseInt(formData.paxAdult) > 0 && ")"}
                        </strong>
                      </div>

                      {/* Price rows */}
                      <div className="etbk-summary-row">
                        <span>Package Price</span>
                        <strong>
                          ₱{Number(formData.packagePrice || 0).toLocaleString()}
                        </strong>
                      </div>

                      {Number(formData.discountAmount) > 0 && (
                        <div className="etbk-summary-row etbk-summary-row--discount">
                          <span>🏷️ Discount</span>
                          <strong>
                            −₱{Number(formData.discountAmount).toLocaleString()}
                          </strong>
                        </div>
                      )}

                      {formData.includesAirfare && (
                        <div className="etbk-summary-row etbk-summary-row--airfare">
                          <span>✈️ Airfare</span>
                          <strong>
                            +₱{Number(formData.airfareTotal || 0).toLocaleString()}
                          </strong>
                        </div>
                      )}

                      <div className="etbk-summary-row etbk-summary-row--total">
                        <span>Total</span>
                        <strong>
                          ₱{Number(formData.totalAmount || 0).toLocaleString()}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
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

      {/* Confirmation Modal */}
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

export default EditTourBooking;