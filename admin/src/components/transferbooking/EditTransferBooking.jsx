import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Car,
  MessageSquare,
  MapPin,
  CreditCard,
  Calendar,
} from "lucide-react";
import Sidebar from "../sidebar/sidebar";
import { useToast } from "../toast/ToastManager";
import CustomConfirmModal from "../confirmationModal/CustomConfirmModal";
import LocationSelect from "../location/LocationSelect";
import CustomTimePicker from "../timePicker/Clock";
import "./EditTransferBooking.css";

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

const API_BASE_URL  = "https://wanderwaveph.onrender.com/api/transfer-bookings";
const TRANSFERS_API = "https://wanderwaveph.onrender.com/api/transfers";

// ── Late-night surcharge constant ─────────────────────────────────────────────
const LATE_NIGHT_CHARGE = 500;

/**
 * Returns true if the time string (HH:MM, 24-hr) falls between 12:00 AM and 4:59 AM.
 */
const isLateNight = (timeStr) => {
  if (!timeStr) return false;
  const [hours] = timeStr.split(":").map(Number);
  return hours >= 0 && hours < 5;
};

/**
 * Computes sellingPrice and totalAmount from the current form data snapshot.
 * Called whenever activity, transferType, oneWayPrice, roundtripPrice,
 * arrivalTime, or departureTime changes.
 */
const recalculatePrice = (data) => {
  const basePrice =
    data.transferType === "roundtrip"
      ? Number(data.roundtripPrice) || 0
      : Number(data.oneWayPrice) || 0;

  let lateNightCharge = 0;
  if (isLateNight(data.arrivalTime)) lateNightCharge += LATE_NIGHT_CHARGE;
  if (data.transferType === "roundtrip" && isLateNight(data.departureTime))
    lateNightCharge += LATE_NIGHT_CHARGE;

  return {
    sellingPrice: basePrice,
    totalAmount: basePrice + lateNightCharge,
    lateNightCharge,
  };
};

// ── Inline dropdown styles (shared by Destination & Activity dropdowns) ───────
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
const EditTransferBooking = () => {
  const navigate = useNavigate();
  const { id: bookingId } = useParams();
  const toast = useToast();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // ── Transfers listing (for destination & activity dropdowns) ──────────────
  const [transfers, setTransfers] = useState([]);

  // ── Destination dropdown ──────────────────────────────────────────────────
  const [destOpen,  setDestOpen]  = useState(false);
  const [destQuery, setDestQuery] = useState("");
  const [destHi,    setDestHi]    = useState(-1);
  const destRef = useRef(null);

  // ── Activity / Transfer Name dropdown ─────────────────────────────────────
  const [actOpen,  setActOpen]  = useState(false);
  const [actQuery, setActQuery] = useState("");
  const [actHi,    setActHi]    = useState(-1);
  const actRef = useRef(null);

  // Modal state
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    type: "primary",
  });

  // Form state — mirrors TransferBookingOrder schema
  const [formData, setFormData] = useState({
    // Booking meta
    activityName: "",
    destination:  "",
    category:     "",
    supplierName: "",
    promoCode:    "",
    pax:          "",

    // Trip type
    transferType: "oneway", // 'oneway' | 'roundtrip'

    // Schedule
    travelDate:    "",
    returnDate:    "",
    arrivalTime:   "",
    departureTime: "",

    // Locations
    pickupLocation:  "",
    dropoffLocation: "",

    // Contact
    fullName:        "",
    email:           "",
    phone:           "",
    message:         "",
    specialRequests: "",

    // Passengers & pricing
    passengerCount: 1,
    oneWayPrice:    0,
    roundtripPrice: 0,
    sellingPrice:   0,
    totalAmount:    0,

    // Payment
    currency:             "PHP",
    paymentType:          "full",
    initialPaymentAmount: 0,
    remainingBalance:     0,
    paymentStatus:        "pending",

    // Booking status
    status: "pending",
  });

  // ── Sidebar ───────────────────────────────────────────────────────────────
  const toggleSidebar = () => setIsSidebarCollapsed((p) => !p);

  // ── Modal helpers ─────────────────────────────────────────────────────────
  const closeModal = () => setModalConfig((p) => ({ ...p, isOpen: false }));

  // ── Fetch transfers listing once (for destination & activity dropdowns) ───
  useEffect(() => {
    const fetchTransfers = async () => {
      try {
        const res    = await fetch(`${TRANSFERS_API}?all=true&limit=200`);
        const result = await res.json();
        if (result.success) setTransfers(result.data || []);
      } catch (err) {
        console.warn("Could not load transfers listing:", err.message);
      }
    };
    fetchTransfers();
  }, []);

  // ── Close dropdowns on outside click ─────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (destRef.current && !destRef.current.contains(e.target)) {
        setDestOpen(false);
        setDestHi(-1);
      }
      if (actRef.current && !actRef.current.contains(e.target)) {
        setActOpen(false);
        setActHi(-1);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Derived: unique destinations from transfers listing ───────────────────
  const destinations = useMemo(() => {
    const set = new Set();
    transfers.forEach((t) => {
      if (t.packageDestination) set.add(t.packageDestination);
    });
    return Array.from(set).sort();
  }, [transfers]);

  // ── Derived: destinations filtered by current search query ────────────────
  const filteredDestinations = useMemo(
    () =>
      destinations.filter((d) =>
        d.toLowerCase().includes(destQuery.toLowerCase())
      ),
    [destinations, destQuery]
  );

  // ── Derived: activities filtered by selected destination + search query ───
  const filteredActivities = useMemo(
    () =>
      transfers.filter((t) => {
        const matchDest  = !formData.destination || t.packageDestination === formData.destination;
        const matchQuery = t.title.toLowerCase().includes(actQuery.toLowerCase());
        return matchDest && matchQuery;
      }),
    [transfers, formData.destination, actQuery]
  );

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
          activityName: d.activityName || "",
          destination:  d.destination  || "",
          category:     d.category     || "",
          supplierName: d.supplierName || "",
          promoCode:    d.promoCode    || "",
          pax:          d.pax          || "",

          transferType: d.transferType || "oneway",

          travelDate:    d.travelDate    || "",
          returnDate:    d.returnDate    || "",
          arrivalTime:   d.arrivalTime   || "",
          departureTime: d.departureTime || "",

          pickupLocation:  d.pickupLocation  || "",
          dropoffLocation: d.dropoffLocation || "",

          fullName:        d.fullName        || "",
          email:           d.email           || "",
          phone:           d.phone           || "",
          message:         d.message         || "",
          specialRequests: d.specialRequests || "",

          passengerCount: d.passengerCount ?? 1,
          oneWayPrice:    d.oneWayPrice    ?? 0,
          roundtripPrice: d.roundtripPrice ?? 0,
          sellingPrice:   d.sellingPrice   ?? 0,
          totalAmount:    d.totalAmount    ?? 0,

          currency:             d.currency             || "PHP",
          paymentType:          d.paymentType          || "full",
          initialPaymentAmount: d.initialPaymentAmount ?? 0,
          remainingBalance:     d.remainingBalance     ?? 0,
          paymentStatus:        d.paymentStatus        || "pending",

          status: d.status || "pending",
        });

        // Sync searchable dropdown display values with loaded booking data
        setDestQuery(d.destination  || "");
        setActQuery(d.activityName  || "");
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
  // Also recalculates price when oneWayPrice or roundtripPrice is manually edited.
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "oneWayPrice" || name === "roundtripPrice") {
        const { sellingPrice, totalAmount } = recalculatePrice(updated);
        return { ...updated, sellingPrice, totalAmount };
      }
      return updated;
    });
  };

  // When transferType changes, clear roundtrip-only fields and recalculate price.
  const handleTransferTypeChange = (e) => {
    const type = e.target.value;
    setFormData((prev) => {
      const updated = {
        ...prev,
        transferType: type,
        ...(type === "oneway"
          ? { returnDate: "", departureTime: "", dropoffLocation: "" }
          : {}),
      };
      const { sellingPrice, totalAmount } = recalculatePrice(updated);
      return { ...updated, sellingPrice, totalAmount };
    });
  };

  // ── Destination dropdown handlers ─────────────────────────────────────────
  const handleDestinationSelect = (dest) => {
    setDestQuery(dest);
    setFormData((prev) => ({
      ...prev,
      destination:  dest,
      activityName: "",  // clear activity when destination changes
    }));
    setActQuery("");
    setDestOpen(false);
    setDestHi(-1);
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

  // ── Activity dropdown handlers ────────────────────────────────────────────
  // Selecting a new activity/transfer auto-updates prices and recalculates total.
  const handleActivitySelect = (transfer) => {
    setFormData((prev) => {
      const updated = {
        ...prev,
        activityName:   transfer.title,
        category:       transfer.category       || prev.category,
        oneWayPrice:    transfer.oneWayPrice    ?? prev.oneWayPrice,
        roundtripPrice: transfer.roundtripPrice ?? prev.roundtripPrice,
        pax:
          transfer.pax !== null && transfer.pax !== undefined
            ? String(transfer.pax)
            : prev.pax,
      };
      const { sellingPrice, totalAmount } = recalculatePrice(updated);
      return { ...updated, sellingPrice, totalAmount };
    });
    setActQuery(transfer.title);
    setActOpen(false);
    setActHi(-1);
  };

  const handleActKeyDown = (e) => {
    if (!actOpen) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActHi((h) => Math.min(h + 1, filteredActivities.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActHi((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter" && actHi >= 0) {
      e.preventDefault();
      handleActivitySelect(filteredActivities[actHi]);
    } else if (e.key === "Escape") {
      setActOpen(false);
    }
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
      message: "Do you want to save the changes made to this transfer booking?",
      type: "primary",
      onConfirm: () => {
        closeModal();
        processSubmit();
      },
    });
  };

  const processSubmit = async () => {
    setSubmitting(true);

    // Client-side validation for roundtrip required fields
    if (formData.transferType === "roundtrip") {
      if (!formData.arrivalTime) {
        toast.error("Arrival time is required for roundtrip bookings.");
        setSubmitting(false);
        return;
      }
      if (!formData.departureTime) {
        toast.error("Departure time is required for roundtrip bookings.");
        setSubmitting(false);
        return;
      }
      if (!formData.returnDate) {
        toast.error("Return date is required for roundtrip bookings.");
        setSubmitting(false);
        return;
      }
    }

    const payload = {
      activityName: formData.activityName,
      destination:  formData.destination,
      category:     formData.category,
      supplierName: formData.supplierName,
      promoCode:    formData.promoCode || null,
      pax:          formData.pax,

      transferType: formData.transferType,

      travelDate:  formData.travelDate,
      returnDate:
        formData.transferType === "roundtrip" ? formData.returnDate : "",
      arrivalTime: formData.arrivalTime,
      departureTime:
        formData.transferType === "roundtrip" ? formData.departureTime : "",

      pickupLocation: formData.pickupLocation,
      dropoffLocation:
        formData.transferType === "roundtrip" ? formData.dropoffLocation : "",

      fullName:        formData.fullName,
      email:           formData.email,
      phone:           formData.phone,
      message:         formData.message,
      specialRequests: formData.specialRequests,

      passengerCount:       parseInt(formData.passengerCount)        || 1,
      oneWayPrice:          parseFloat(formData.oneWayPrice)         || 0,
      roundtripPrice:       parseFloat(formData.roundtripPrice)      || 0,
      sellingPrice:         parseFloat(formData.sellingPrice)        || 0,
      totalAmount:          parseFloat(formData.totalAmount)         || 0,

      currency:             formData.currency,
      paymentType:          formData.paymentType,
      initialPaymentAmount: parseFloat(formData.initialPaymentAmount) || 0,
      remainingBalance:     parseFloat(formData.remainingBalance)     || 0,
      paymentStatus:        formData.paymentStatus,

      status: formData.status,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/${bookingId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });

      const result = await res.json();

      if (result.success) {
        toast.success("Transfer Booking Updated Successfully!");
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

  const isRoundtrip = formData.transferType === "roundtrip";

  // ── Derived late-night charge for display in summary ──────────────────────
  const summaryLateNightCharge = (() => {
    let charge = 0;
    if (isLateNight(formData.arrivalTime)) charge += LATE_NIGHT_CHARGE;
    if (isRoundtrip && isLateNight(formData.departureTime)) charge += LATE_NIGHT_CHARGE;
    return charge;
  })();

  const summaryLateNightReasons = [];
  if (isLateNight(formData.arrivalTime))
    summaryLateNightReasons.push(`Pickup (${formData.arrivalTime})`);
  if (isRoundtrip && isLateNight(formData.departureTime))
    summaryLateNightReasons.push(`Dropoff (${formData.departureTime})`);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="ea-page">
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />

      <main
        className={`ea-main ${isSidebarCollapsed ? "ea-main--collapsed" : ""}`}
      >
        <div className="ea-container">

          {/* ── HEADER ──────────────────────────────────────────────────── */}
          <header className="ea-header etb-header">
            <div className="ea-header-content">
              <button className="ea-back-btn" onClick={handleCancel}>
                <ArrowLeft size={18} /> Back
              </button>
              <h1 className="ea-title">Edit Transfer Booking</h1>
              <p className="ea-subtitle">
                Modify transfer schedule, route, and payment details
              </p>
            </div>
          </header>

          <form onSubmit={handleSubmit}>
            <div className="ea-grid-layout">

              {/* ── LEFT COLUMN ───────────────────────────────────────── */}
              <div className="ea-form-left">

                {/* ── CLIENT INFORMATION ─────────────────────────────── */}
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
                    <div className="ea-input-group">
                      <label>Phone Number</label>
                      <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="ea-input"
                      />
                    </div>
                    <div className="ea-input-group">
                      <label>Passenger Count</label>
                      <input
                        type="number"
                        name="passengerCount"
                        value={formData.passengerCount}
                        onChange={handleChange}
                        className="ea-input"
                        min="1"
                      />
                    </div>
                  </div>
                </section>

                {/* ── TRANSFER DETAILS ───────────────────────────────── */}
                <section className="ea-section">
                  <div className="ea-section-header">
                    <Car size={20} className="ea-section-icon" />
                    <h3>
                      Transfer Details
                      <span
                        className={`etb-trip-badge ${
                          isRoundtrip
                            ? "etb-trip-badge--roundtrip"
                            : "etb-trip-badge--oneway"
                        }`}
                      >
                        {isRoundtrip ? "ROUNDTRIP" : "ONE WAY"}
                      </span>
                    </h3>
                  </div>

                  <div className="ea-fields-grid">

                    {/* Destination — searchable dropdown from /api/transfers */}
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
                            }));
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
                                  ? "No matching destinations"
                                  : "No destinations available"}
                              </li>
                            ) : (
                              filteredDestinations.map((dest, i) => (
                                <li
                                  key={dest}
                                  style={{
                                    ...ddStyle.item(i === destHi),
                                    ...(i === filteredDestinations.length - 1
                                      ? { borderBottom: "none" }
                                      : {}),
                                  }}
                                  onMouseDown={() =>
                                    handleDestinationSelect(dest)
                                  }
                                  onMouseEnter={() => setDestHi(i)}
                                >
                                  {dest}
                                </li>
                              ))
                            )}
                          </ul>
                        )}
                      </div>
                    </div>

                    {/* Activity / Transfer Name — searchable dropdown filtered by destination */}
                    <div className="ea-input-group">
                      <label>Activity / Transfer Name</label>
                      <div style={{ position: "relative" }} ref={actRef}>
                        <input
                          type="text"
                          className="ea-input"
                          value={actQuery}
                          placeholder="Search transfer..."
                          onChange={(e) => {
                            setActQuery(e.target.value);
                            setFormData((prev) => ({
                              ...prev,
                              activityName: e.target.value,
                            }));
                            setActOpen(true);
                            setActHi(-1);
                          }}
                          onFocus={() => setActOpen(true)}
                          onKeyDown={handleActKeyDown}
                          autoComplete="off"
                          required
                        />
                        {actOpen && (
                          <ul style={ddStyle.list}>
                            {filteredActivities.length === 0 ? (
                              <li style={ddStyle.empty}>
                                {actQuery
                                  ? "No matching transfers"
                                  : "No transfers available"}
                              </li>
                            ) : (
                              filteredActivities.map((t, i) => (
                                <li
                                  key={t._id}
                                  style={{
                                    ...ddStyle.item(i === actHi),
                                    ...(i === filteredActivities.length - 1
                                      ? { borderBottom: "none" }
                                      : {}),
                                  }}
                                  onMouseDown={() => handleActivitySelect(t)}
                                  onMouseEnter={() => setActHi(i)}
                                >
                                  <div style={{ fontWeight: 600 }}>
                                    {t.title}
                                  </div>
                                  {(t.packageDestination || t.category) && (
                                    <div
                                      style={{
                                        fontSize: "0.75rem",
                                        color: "#6b7280",
                                        marginTop: "2px",
                                      }}
                                    >
                                      {[t.packageDestination, t.category]
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

                    <div className="ea-input-group">
                      <label>Transfer Type</label>
                      <select
                        name="transferType"
                        value={formData.transferType}
                        onChange={handleTransferTypeChange}
                        className="ea-input ea-select"
                      >
                        <option value="oneway">One Way</option>
                        <option value="roundtrip">Roundtrip</option>
                      </select>
                    </div>
                    <div className="ea-input-group">
                      <label>Category</label>
                      <input
                        type="text"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="ea-input"
                      />
                    </div>
                  </div>
                </section>

                {/* ── SCHEDULE ───────────────────────────────────────── */}
                <section className="ea-section">
                  <div className="ea-section-header">
                    <Calendar size={20} className="ea-section-icon" />
                    <h3>Schedule</h3>
                  </div>

                  {/* ONE-WAY / OUTBOUND LEG */}
                  <div
                    className="etb-leg-block"
                    style={{ marginBottom: isRoundtrip ? "20px" : "0" }}
                  >
                    {isRoundtrip && (
                      <div className="etb-leg-label etb-leg-label--outbound">
                        OUTBOUND
                      </div>
                    )}
                    <div className="ea-fields-grid">
                      <div className="ea-input-group">
                        <label>Travel Date</label>
                        <input
                          type="date"
                          name="travelDate"
                          value={formData.travelDate}
                          onChange={handleChange}
                          className="ea-input"
                          required
                        />
                      </div>
                      <div className="ea-input-group">
                        <label>
                          Arrival Time
                          {isLateNight(formData.arrivalTime) && (
                            <span className="etb-late-night-badge">
                              🌙 +₱500
                            </span>
                          )}
                        </label>
                        <CustomTimePicker
                          value={formData.arrivalTime}
                          onChange={(e) => {
                            const arrivalTime = e.target.value;
                            setFormData((prev) => {
                              const updated = { ...prev, arrivalTime };
                              const { sellingPrice, totalAmount } =
                                recalculatePrice(updated);
                              return { ...updated, sellingPrice, totalAmount };
                            });
                          }}
                          placeholder="Select arrival time"
                          required={isRoundtrip}
                        />
                      </div>
                    </div>
                  </div>

                  {/* ROUNDTRIP — RETURN LEG */}
                  {isRoundtrip && (
                    <div className="etb-leg-block">
                      <div className="etb-leg-label etb-leg-label--return">
                        RETURN
                      </div>
                      <div className="ea-fields-grid">
                        <div className="ea-input-group">
                          <label>Return Date</label>
                          <input
                            type="date"
                            name="returnDate"
                            value={formData.returnDate}
                            onChange={handleChange}
                            className="ea-input"
                            required
                          />
                        </div>
                        <div className="ea-input-group">
                          <label>
                            Departure Time
                            {isRoundtrip && isLateNight(formData.departureTime) && (
                              <span className="etb-late-night-badge">
                                🌙 +₱500
                              </span>
                            )}
                          </label>
                          <CustomTimePicker
                            value={formData.departureTime}
                            onChange={(e) => {
                              const departureTime = e.target.value;
                              setFormData((prev) => {
                                const updated = { ...prev, departureTime };
                                const { sellingPrice, totalAmount } =
                                  recalculatePrice(updated);
                                return { ...updated, sellingPrice, totalAmount };
                              });
                            }}
                            placeholder="Select departure time"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </section>

                {/* ── ROUTE ──────────────────────────────────────────── */}
                <section className="ea-section">
                  <div className="ea-section-header">
                    <MapPin size={20} className="ea-section-icon" />
                    <h3>Route</h3>
                  </div>

                  <div className="etb-route-visual">
                    <div className="etb-route-dot etb-route-dot--pickup" />
                    <div className="etb-route-info">
                      <div className="ea-input-group">
                        <label>Pickup Location</label>
                        <LocationSelect
                          value={formData.pickupLocation}
                          onChange={(val) =>
                            setFormData((prev) => ({
                              ...prev,
                              pickupLocation: val,
                            }))
                          }
                          placeholder="Enter full pickup address"
                          source="transfer"
                        />
                      </div>
                    </div>
                  </div>

                  {isRoundtrip && (
                    <div
                      className="etb-route-visual"
                      style={{ marginTop: "16px" }}
                    >
                      <div className="etb-route-dot etb-route-dot--dropoff" />
                      <div className="etb-route-info">
                        <div className="ea-input-group">
                          <label>Dropoff Location</label>
                          <LocationSelect
                            value={formData.dropoffLocation}
                            onChange={(val) =>
                              setFormData((prev) => ({
                                ...prev,
                                dropoffLocation: val,
                              }))
                            }
                            placeholder="Enter full dropoff address"
                            source="transfer"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </section>

                {/* ── PRICING & PAYMENT ──────────────────────────────── */}
                <section className="ea-section">
                  <div className="ea-section-header">
                    <CreditCard size={20} className="ea-section-icon" />
                    <h3>Pricing &amp; Payment</h3>
                  </div>

                  <div className="ea-fields-grid">
                    <div className="ea-input-group">
                      <label>One-Way Price (₱)</label>
                      <input
                        type="number"
                        name="oneWayPrice"
                        value={formData.oneWayPrice}
                        onChange={handleChange}
                        className="ea-input"
                        min="0"
                      />
                    </div>
                    <div className="ea-input-group">
                      <label>Roundtrip Price (₱)</label>
                      <input
                        type="number"
                        name="roundtripPrice"
                        value={formData.roundtripPrice}
                        onChange={handleChange}
                        className="ea-input"
                        min="0"
                      />
                    </div>
                    <div className="ea-input-group">
                      <label>Selling Price (₱)</label>
                      <input
                        type="number"
                        name="sellingPrice"
                        value={formData.sellingPrice}
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

                  {/* Total display strip */}
                  <div className="etb-total-strip">
                    <span>TOTAL AMOUNT</span>
                    <span className="etb-total-amount">
                      ₱{Number(formData.totalAmount || 0).toLocaleString()}
                    </span>
                  </div>
                </section>

                {/* ── NOTES / SPECIAL REQUESTS ───────────────────────── */}
                <section className="ea-section">
                  <div className="ea-section-header">
                    <MessageSquare size={20} className="ea-section-icon" />
                    <h3>Notes / Special Requests</h3>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                    }}
                  >
                    <div className="ea-input-group">
                      <label>Message</label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        className="ea-input ea-textarea"
                        placeholder="Add notes or client message here..."
                      />
                    </div>
                    <div className="ea-input-group">
                      <label>Special Requests</label>
                      <textarea
                        name="specialRequests"
                        value={formData.specialRequests}
                        onChange={handleChange}
                        className="ea-input ea-textarea"
                        placeholder="Any special requests or requirements..."
                      />
                    </div>
                  </div>
                </section>

              </div>{/* end ea-form-left */}

              {/* ── RIGHT SIDEBAR ─────────────────────────────────────── */}
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
                    <div className="etb-summary-list">
                      <div className="etb-summary-row">
                        <span>Type</span>
                        <strong>
                          {isRoundtrip ? "Roundtrip" : "One Way"}
                        </strong>
                      </div>
                      <div className="etb-summary-row">
                        <span>Travel Date</span>
                        <strong>{formData.travelDate || "—"}</strong>
                      </div>
                      {isRoundtrip && (
                        <div className="etb-summary-row">
                          <span>Return Date</span>
                          <strong>{formData.returnDate || "—"}</strong>
                        </div>
                      )}
                      <div className="etb-summary-row">
                        <span>Passengers</span>
                        <strong>{formData.passengerCount}</strong>
                      </div>

                      {/* ── Price breakdown ── */}
                      <div className="etb-summary-row">
                        <span>Base Price</span>
                        <strong>
                          ₱{Number(formData.sellingPrice || 0).toLocaleString()}
                        </strong>
                      </div>

                      {summaryLateNightCharge > 0 && (
                        <div className="etb-summary-row etb-summary-row--late-charge">
                          <span>
                            🌙 Late Night
                            <span className="etb-summary-charge-hint">
                              {summaryLateNightReasons.join(", ")}
                            </span>
                          </span>
                          <strong>
                            +₱{summaryLateNightCharge.toLocaleString()}
                          </strong>
                        </div>
                      )}

                      <div className="etb-summary-row etb-summary-row--total">
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

export default EditTransferBooking;