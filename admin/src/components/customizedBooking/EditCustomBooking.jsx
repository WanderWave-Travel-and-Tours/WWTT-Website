import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  User,
  MapPin,
  Calendar,
  CreditCard,
  MessageSquare,
  Package,
  Car,
  RefreshCw,
  Search,
  Plus,
  ChevronDown,
  X,
} from "lucide-react";
import Sidebar from "../sidebar/sidebar";
import { useToast } from "../toast/ToastManager";
import CustomConfirmModal from "../confirmationModal/CustomConfirmModal";
import LocationSelect from '../location/LocationSelect';
import CustomTimePicker from '../timePicker/Clock';
import "./EditCustomBooking.css";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const API_BASE = "https://wanderwaveph.onrender.com/api/customized-bookings";

const NIGHT_SURCHARGE = 500; // ₱500 surcharge for 12am–5am picks

// Returns true if time string "HH:MM" falls between 12:00am and 5:00am (exclusive).
// Clock.jsx fires onChange({ target: { value: "HH:MM" } }) so timeStr is always a string.
const isNightSurchargeHour = (timeStr) => {
  if (!timeStr || typeof timeStr !== "string") return false;
  const [h] = timeStr.split(":").map(Number);
  return h >= 0 && h < 5;
};

// ─────────────────────────────────────────────────────────────────────────────
// SearchableSelect — combobox: type to filter, click to select
// options: string[] | { label: string, value: any }[]
// ─────────────────────────────────────────────────────────────────────────────
const SearchableSelect = ({
  options = [],
  value = "",
  onChange,
  placeholder = "Search or select…",
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  // Sync display text when value changes externally
  useEffect(() => {
    if (!value) { setSearch(""); return; }
    const match = options.find((o) =>
      typeof o === "string" ? o === value : o.value === value
    );
    setSearch(match ? (typeof match === "string" ? match : match.label) : value);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = options.filter((o) => {
    const lbl = typeof o === "string" ? o : o.label;
    return lbl.toLowerCase().includes(search.toLowerCase());
  });

  const handleSelect = (o) => {
    const lbl = typeof o === "string" ? o : o.label;
    const val = typeof o === "string" ? o : o.value;
    setSearch(lbl);
    onChange(val);
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
            if (value) onChange(""); // clear selection when user types
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="ea-input"
          disabled={disabled}
          autoComplete="off"
          style={{ paddingRight: 32 }}
        />
        <ChevronDown
          size={14}
          style={{
            position: "absolute", right: 10, top: "50%",
            transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none",
          }}
        />
      </div>

      {open && (
        <ul className="ecb-searchdrop">
          {filtered.length > 0 ? (
            filtered.map((o, idx) => {
              const lbl = typeof o === "string" ? o : o.label;
              const val = typeof o === "string" ? o : o.value;
              return (
                <li
                  key={idx}
                  className={`ecb-searchdrop-item${val === value ? " ecb-searchdrop-item--active" : ""}`}
                  onMouseDown={() => handleSelect(o)}
                >
                  {lbl}
                </li>
              );
            })
          ) : (
            <li className="ecb-searchdrop-empty">
              {search ? "No results found" : "No options available"}
            </li>
          )}
        </ul>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
const EditCustomBooking = () => {
  const navigate = useNavigate();
  const { id: bookingId } = useParams();
  const toast = useToast();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    type: "primary",
  });

  // ── Available inventory (for Change pickers) ──────────────────────────────
  const [availableTours,     setAvailableTours]     = useState([]);
  const [availableTransfers, setAvailableTransfers] = useState([]);

  // ── Change-mode flags ──────────────────────────────────────────────────────
  const [changingTours,     setChangingTours]     = useState(false);
  const [changingTransfers, setChangingTransfers] = useState(false);

  // ── Tour picker state ──────────────────────────────────────────────────────
  const [tourPickDestination, setTourPickDestination] = useState("");
  const [tourPickTour,        setTourPickTour]        = useState(null); // full tour object

  // ── Transfer picker state ──────────────────────────────────────────────────
  const [transferPickDestination, setTransferPickDestination] = useState("");
  const [transferPickTransfer,    setTransferPickTransfer]    = useState(null); // full transfer object

  const [formData, setFormData] = useState({

    destination: "",
    fullName: "",
    email: "",
    phone: "",
    travelDate: "",
    returnDate: "",
    paxCount: 1,
    message: "",
    notes: "",
    promoCode: "",

    // Services
    tours: [],
    transfers: [],

    // Computed totals
    toursTotal: 0,
    transfersTotal: 0,
    totalAmount: 0,

    // Payment
    currency: "PHP",
    paymentType: "full",
    initialPaymentAmount: 0,
    remainingBalance: 0,
    paymentStatus: "pending",

    // Status
    status: "pending",
  });

  // ── Sidebar ───────────────────────────────────────────────────────────────
  const toggleSidebar = () => setIsSidebarCollapsed((p) => !p);

  // ── Modal helpers ─────────────────────────────────────────────────────────
  const closeModal = () => setModalConfig((p) => ({ ...p, isOpen: false }));

  // ── Fetch booking ─────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await fetch(`${API_BASE}/${bookingId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const result = await res.json();
        if (!result.success || !result.data)
          throw new Error("Invalid response format");

        const d = result.data;

        setFormData({
          destination: d.destination || "",
          fullName: d.fullName || "",
          email: d.email || "",
          phone: d.phone || "",
          travelDate: d.travelDate || "",
          returnDate: d.returnDate || "",
          paxCount: d.paxCount ?? 1,
          message: d.message || "",
          notes: d.notes || "",
          promoCode: d.promoCode || "",

          tours: Array.isArray(d.tours) ? d.tours : [],
          transfers: Array.isArray(d.transfers) ? d.transfers : [],

          toursTotal: d.toursTotal ?? 0,
          transfersTotal: d.transfersTotal ?? 0,
          totalAmount: d.totalAmount ?? 0,

          currency: d.currency || "PHP",
          paymentType: d.paymentType || "full",
          initialPaymentAmount: d.initialPaymentAmount ?? 0,
          remainingBalance: d.remainingBalance ?? 0,
          paymentStatus: d.paymentStatus || "pending",

          status: d.status || "pending",
        });
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

  // ── Fetch available tours & transfers for Change pickers ──────────────────
  useEffect(() => {
    fetch("https://wanderwaveph.onrender.com/api/tours/all")
      .then((r) => r.json())
      .then((data) => {
        const arr = Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : []);
        setAvailableTours(arr.filter((t) => t.isArchive !== "Yes"));
      })
      .catch((err) => console.error("Failed to load available tours:", err));

    fetch("https://wanderwaveph.onrender.com/api/transfers?all=true&limit=500")
      .then((r) => r.json())
      .then((data) => {
        const arr = Array.isArray(data.data) ? data.data : [];
        setAvailableTransfers(arr.filter((t) => t.isArchive !== "Yes"));
      })
      .catch((err) => console.error("Failed to load available transfers:", err));
  }, []);

  // ── Generic top-level field change ────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ── Tour item field change + auto-recalculate subtotal & totals ───────────
  const handleTourChange = (index, field, rawValue) => {
    setFormData((prev) => {
      const tours = prev.tours.map((t, i) => {
        if (i !== index) return t;
        const updated = { ...t, [field]: rawValue };

        // Recalculate subtotal whenever price or paxCount changes
        if (field === "price" || field === "paxCount") {
          const price = field === "price" ? Number(rawValue) : Number(t.price);
          const pax = field === "paxCount" ? Number(rawValue) : Number(t.paxCount);
          updated.subtotal = price * pax;
        }
        return updated;
      });

      const toursTotal = tours.reduce((s, t) => s + (Number(t.subtotal) || 0), 0);
      const totalAmount = toursTotal + Number(prev.transfersTotal);
      return { ...prev, tours, toursTotal, totalAmount };
    });
  };

  // ── Transfer item field change + auto-recalculate selectedPrice & totals ──
  const handleTransferChange = (index, field, rawValue) => {
    setFormData((prev) => {
      const transfers = prev.transfers.map((tr, i) => {
        if (i !== index) return tr;
        const updated = { ...tr, [field]: rawValue };

        if (field === "transferType") {
          updated.selectedPrice =
            rawValue === "roundtrip"
              ? Number(tr.roundtripPrice)
              : Number(tr.oneWayPrice);
          updated.subtotal = updated.selectedPrice;
          // Clear roundtrip-only fields when switching to one-way
          if (rawValue === "oneway") {
            updated.returnDate = "";
            updated.departureTime = "";
            updated.dropoffLocation = "";
          }
        }

        if (
          field === "oneWayPrice" &&
          (updated.transferType || tr.transferType) === "oneway"
        ) {
          updated.selectedPrice = Number(rawValue);
          updated.subtotal = Number(rawValue);
        }

        if (
          field === "roundtripPrice" &&
          (updated.transferType || tr.transferType) === "roundtrip"
        ) {
          updated.selectedPrice = Number(rawValue);
          updated.subtotal = Number(rawValue);
        }

        // ── Night surcharge (₱500) for 12am–5am time slots ──────────────────
        if (field === "arrivalTime" || field === "departureTime") {
          const basePrice = Number(updated.selectedPrice) || Number(updated.subtotal) || 0;
          // Determine if either time field will be in surcharge range
          const checkArrival   = field === "arrivalTime"   ? rawValue : (updated.arrivalTime   || "");
          const checkDeparture = field === "departureTime" ? rawValue : (updated.departureTime || "");
          const hasSurcharge   = isNightSurchargeHour(checkArrival) || isNightSurchargeHour(checkDeparture);

          // Strip previously applied surcharge before recalculating
          const prevHadSurcharge = isNightSurchargeHour(tr.arrivalTime) || isNightSurchargeHour(tr.departureTime);
          const cleanBase = prevHadSurcharge ? basePrice - NIGHT_SURCHARGE : basePrice;
          updated.subtotal = cleanBase + (hasSurcharge ? NIGHT_SURCHARGE : 0);
          updated.nightSurcharge = hasSurcharge ? NIGHT_SURCHARGE : 0;
        }

        return updated;
      });

      const transfersTotal = transfers.reduce(
        (s, t) => s + (Number(t.subtotal) || 0),
        0
      );
      const totalAmount = Number(prev.toursTotal) + transfersTotal;
      return { ...prev, transfers, transfersTotal, totalAmount };
    });
  };

  // ── Unique destinations for pickers ──────────────────────────────────────
  const tourDestinations = useMemo(
    () => [...new Set(availableTours.map((t) => t.destination).filter(Boolean))].sort(),
    [availableTours]
  );

  const transferDestinations = useMemo(
    () => [...new Set(availableTransfers.map((t) => t.packageDestination).filter(Boolean))].sort(),
    [availableTransfers]
  );

  // ── Packages filtered by selected destination ─────────────────────────────
  const toursForDestination = useMemo(
    () => (tourPickDestination
      ? availableTours.filter((t) => t.destination === tourPickDestination)
      : []),
    [availableTours, tourPickDestination]
  );

  const transfersForDestination = useMemo(
    () => (transferPickDestination
      ? availableTransfers.filter((t) => t.packageDestination === transferPickDestination)
      : []),
    [availableTransfers, transferPickDestination]
  );

  // ── Initiate change for Booked Tours ──────────────────────────────────────
  const handleInitiateChangeTours = () => {
    setModalConfig({
      isOpen: true,
      title: "Change Booked Tours",
      message:
        "Are you sure you want to change the booked tours? All current tour data in this booking will be cleared and cannot be recovered.",
      type: "danger",
      onConfirm: () => {
        closeModal();
        setFormData((prev) => ({
          ...prev,
          tours: [],
          toursTotal: 0,
          totalAmount: Number(prev.transfersTotal),
        }));
        setTourPickDestination("");
        setTourPickTour(null);
        setChangingTours(true);
      },
    });
  };

  // ── Add the tour selected in the picker to formData.tours ─────────────────
  const handleAddPickedTour = () => {
    if (!tourPickTour) return;
    const newItem = {
      title:         tourPickTour.title,
      destination:   tourPickTour.destination,
      category:      tourPickTour.category    || "",
      duration:      tourPickTour.duration    || "",
      price:         tourPickTour.price       || 0,
      sellerPrice:   tourPickTour.sellerPrice || 0,
      paxCount:      1,
      scheduledDate: "",
      subtotal:      tourPickTour.price       || 0,
    };
    setFormData((prev) => {
      const tours = [...prev.tours, newItem];
      const toursTotal = tours.reduce((s, t) => s + (Number(t.subtotal) || 0), 0);
      const totalAmount = toursTotal + Number(prev.transfersTotal);
      return { ...prev, tours, toursTotal, totalAmount };
    });
    // Reset picker so admin can add another tour if needed
    setTourPickDestination("");
    setTourPickTour(null);
  };

  // ── Initiate change for Booked Transfers ──────────────────────────────────
  const handleInitiateChangeTransfers = () => {
    setModalConfig({
      isOpen: true,
      title: "Change Booked Transfers",
      message:
        "Are you sure you want to change the booked transfers? All current transfer data in this booking will be cleared and cannot be recovered.",
      type: "danger",
      onConfirm: () => {
        closeModal();
        setFormData((prev) => ({
          ...prev,
          transfers: [],
          transfersTotal: 0,
          totalAmount: Number(prev.toursTotal),
        }));
        setTransferPickDestination("");
        setTransferPickTransfer(null);
        setChangingTransfers(true);
      },
    });
  };

  // ── Add the transfer selected in the picker to formData.transfers ─────────
  const handleAddPickedTransfer = () => {
    if (!transferPickTransfer) return;
    const t = transferPickTransfer;
    const newItem = {
      title:           t.title,
      category:        t.category        || "",
      transferType:    "oneway",
      oneWayPrice:     t.oneWayPrice     || 0,
      roundtripPrice:  t.roundtripPrice  || 0,
      selectedPrice:   t.oneWayPrice     || 0,
      subtotal:        t.oneWayPrice     || 0,
      passengerCount:  t.pax             || 1,
      travelDate:      "",
      arrivalTime:     "",
      pickupLocation:  "",
      returnDate:      "",
      departureTime:   "",
      dropoffLocation: "",
      message:         "",
    };
    setFormData((prev) => {
      const transfers = [...prev.transfers, newItem];
      const transfersTotal = transfers.reduce((s, tr) => s + (Number(tr.subtotal) || 0), 0);
      const totalAmount = Number(prev.toursTotal) + transfersTotal;
      return { ...prev, transfers, transfersTotal, totalAmount };
    });
    // Reset picker so admin can add another transfer if needed
    setTransferPickDestination("");
    setTransferPickTransfer(null);
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
      message: "Do you want to save the changes made to this custom booking?",
      type: "primary",
      onConfirm: () => {
        closeModal();
        processSubmit();
      },
    });
  };

  const processSubmit = async () => {
    setSubmitting(true);

    const payload = {
      destination: formData.destination,
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      travelDate: formData.travelDate,
      returnDate: formData.returnDate,
      paxCount: parseInt(formData.paxCount) || 1,
      message: formData.message,
      notes: formData.notes,
      promoCode: formData.promoCode || null,

      tours: formData.tours.map((t) => ({
        ...t,
        price: parseFloat(t.price) || 0,
        sellerPrice: parseFloat(t.sellerPrice) || 0,
        paxCount: parseInt(t.paxCount) || 1,
        subtotal: parseFloat(t.subtotal) || 0,
      })),

      transfers: formData.transfers.map((tr) => ({
        ...tr,
        oneWayPrice: parseFloat(tr.oneWayPrice) || 0,
        roundtripPrice: parseFloat(tr.roundtripPrice) || 0,
        selectedPrice: parseFloat(tr.selectedPrice) || 0,
        subtotal: parseFloat(tr.subtotal) || 0,
        passengerCount: parseInt(tr.passengerCount) || 1,
      })),

      toursTotal: parseFloat(formData.toursTotal) || 0,
      transfersTotal: parseFloat(formData.transfersTotal) || 0,
      totalAmount: parseFloat(formData.totalAmount) || 0,

      currency: formData.currency,
      paymentType: formData.paymentType,
      initialPaymentAmount: parseFloat(formData.initialPaymentAmount) || 0,
      remainingBalance: parseFloat(formData.remainingBalance) || 0,
      paymentStatus: formData.paymentStatus,

      status: formData.status,
    };

    try {
      const res = await fetch(`${API_BASE}/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (result.success) {
        toast.success("Custom Booking Updated Successfully!");
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
          className={`ea-main ${
            isSidebarCollapsed ? "ea-main--collapsed" : ""
          }`}
        >
          <div className="ea-loading">
            <div className="spinner" />
            <p>Loading booking data...</p>
          </div>
        </main>
      </div>
    );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="ea-page">
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />

      <main
        className={`ea-main ${isSidebarCollapsed ? "ea-main--collapsed" : ""}`}
      >
        <div className="ea-container">

          {/* ── HEADER ──────────────────────────────────────────────────── */}
          <header className="ea-header ecb-header">
            <div className="ea-header-content">
              <button className="ea-back-btn" onClick={handleCancel}>
                <ArrowLeft size={18} /> Back
              </button>
              <h1 className="ea-title">Edit Custom Booking</h1>
              <p className="ea-subtitle">
                Modify customer details, services, and payment information
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
                      <label>Full Name *</label>
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
                      <label>Email Address *</label>
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
                      <label>Pax Count</label>
                      <input
                        type="number"
                        name="paxCount"
                        value={formData.paxCount}
                        onChange={handleChange}
                        className="ea-input"
                        min="1"
                      />
                    </div>
                  </div>
                </section>

                {/* ── TRIP INFORMATION ───────────────────────────────── */}
                <section className="ea-section">
                  <div className="ea-section-header">
                    <MapPin size={20} className="ea-section-icon" />
                    <h3>Trip Information</h3>
                  </div>
                  <div className="ea-fields-grid">
                    <div className="ea-input-group">
                      <label>Destination *</label>
                      <input
                        type="text"
                        name="destination"
                        value={formData.destination}
                        onChange={handleChange}
                        className="ea-input"
                        required
                      />
                    </div>
                    <div className="ea-input-group">
                      <label>Promo Code</label>
                      <input
                        type="text"
                        name="promoCode"
                        value={formData.promoCode}
                        onChange={handleChange}
                        className="ea-input"
                        placeholder="Optional"
                      />
                    </div>
                    <div className="ea-input-group">
                      <label>Travel Date</label>
                      <input
                        type="date"
                        name="travelDate"
                        value={formData.travelDate}
                        onChange={handleChange}
                        className="ea-input"
                      />
                    </div>
                    <div className="ea-input-group">
                      <label>Return Date</label>
                      <input
                        type="date"
                        name="returnDate"
                        value={formData.returnDate}
                        onChange={handleChange}
                        className="ea-input"
                      />
                    </div>
                  </div>
                </section>

                {/* ── BOOKED TOURS ───────────────────────────────────── */}
                {(formData.tours.length > 0 || changingTours) && (
                  <section className="ea-section">
                    <div className="ea-section-header">
                      <Package size={20} className="ea-section-icon" />
                      <h3>
                        Booked Tours
                        <span className="ecb-count-badge">
                          {formData.tours.length}
                        </span>
                      </h3>
                      {!changingTours && (
                        <button
                          type="button"
                          className="ecb-change-btn"
                          onClick={handleInitiateChangeTours}
                        >
                          <RefreshCw size={11} /> Change
                        </button>
                      )}
                    </div>

                    {/* ── Tour Picker (active when changingTours) ───────── */}
                    {changingTours && (
                      <div className="ecb-change-picker">
                        <div className="ecb-change-picker-title">
                          <Search size={12} /> Select a New Tour to Add
                          <button
                            type="button"
                            className="ecb-picker-close-btn"
                            onClick={() => setChangingTours(false)}
                            title="Close picker"
                          >
                            <X size={13} />
                          </button>
                        </div>
                        <div className="ea-fields-grid">
                          <div className="ea-input-group">
                            <label>Destination</label>
                            <SearchableSelect
                              options={tourDestinations}
                              value={tourPickDestination}
                              onChange={(val) => {
                                setTourPickDestination(val);
                                setTourPickTour(null);
                              }}
                              placeholder="Search destination…"
                            />
                          </div>
                          <div className="ea-input-group">
                            <label>Tour Package</label>
                            <SearchableSelect
                              options={toursForDestination.map((t) => ({
                                label: `${t.title} — ₱${Number(t.price).toLocaleString()}`,
                                value: t._id,
                              }))}
                              value={tourPickTour?._id || ""}
                              onChange={(val) => {
                                const found = toursForDestination.find((t) => t._id === val);
                                setTourPickTour(found || null);
                              }}
                              placeholder={
                                tourPickDestination
                                  ? "Search tour package…"
                                  : "Select destination first"
                              }
                              disabled={!tourPickDestination}
                            />
                          </div>
                        </div>

                        {/* Preview + Add button */}
                        {tourPickTour && (
                          <div className="ecb-picker-preview">
                            <div>
                              <strong className="ecb-picker-preview-name">
                                {tourPickTour.title}
                              </strong>
                              <span className="ecb-picker-preview-meta">
                                {[tourPickTour.duration, tourPickTour.category]
                                  .filter(Boolean)
                                  .join(" · ")}{" "}
                                · ₱{Number(tourPickTour.price).toLocaleString()}/pax
                              </span>
                            </div>
                            <button
                              type="button"
                              className="ecb-change-add-btn"
                              onClick={handleAddPickedTour}
                            >
                              <Plus size={13} /> Add Tour
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {formData.tours.length > 0 && (
                      <>
                        <div className="ecb-service-list">
                          {formData.tours.map((tour, i) => (
                            <div key={i} className="ecb-service-card">
                              <div className="ecb-service-card-header">
                                <div className="ecb-service-title">{tour.title}</div>
                                <div className="ecb-service-meta">
                                  {[tour.destination, tour.category, tour.duration]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </div>
                              </div>

                              <div className="ea-fields-grid">
                                <div className="ea-input-group">
                                  <label>Price / Person (₱)</label>
                                  <input
                                    type="number"
                                    value={tour.price ?? 0}
                                    onChange={(e) =>
                                      handleTourChange(i, "price", e.target.value)
                                    }
                                    className="ea-input"
                                    min="0"
                                  />
                                </div>
                                <div className="ea-input-group">
                                  <label>Pax Count</label>
                                  <input
                                    type="number"
                                    value={tour.paxCount ?? 1}
                                    onChange={(e) =>
                                      handleTourChange(i, "paxCount", e.target.value)
                                    }
                                    className="ea-input"
                                    min="1"
                                  />
                                </div>
                                <div className="ea-input-group">
                                  <label>Scheduled Date</label>
                                  <input
                                    type="date"
                                    value={tour.scheduledDate || ""}
                                    onChange={(e) =>
                                      handleTourChange(i, "scheduledDate", e.target.value)
                                    }
                                    className="ea-input"
                                  />
                                </div>
                                <div className="ea-input-group">
                                  <label>Subtotal (₱)</label>
                                  <input
                                    type="number"
                                    value={tour.subtotal ?? 0}
                                    onChange={(e) =>
                                      handleTourChange(i, "subtotal", e.target.value)
                                    }
                                    className="ea-input ecb-subtotal-input"
                                    min="0"
                                  />
                                </div>
                              </div>

                              <div className="ecb-service-subtotal-row">
                                <span>Tour Subtotal</span>
                                <strong>
                                  ₱{Number(tour.subtotal || 0).toLocaleString()}
                                </strong>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="ecb-section-total">
                          <span>Tours Total</span>
                          <strong>
                            ₱{Number(formData.toursTotal || 0).toLocaleString()}
                          </strong>
                        </div>
                      </>
                    )}
                  </section>
                )}

                {/* ── BOOKED TRANSFERS ───────────────────────────────── */}
                {(formData.transfers.length > 0 || changingTransfers) && (
                  <section className="ea-section">
                    <div className="ea-section-header">
                      <Car size={20} className="ea-section-icon" />
                      <h3>
                        Booked Transfers
                        <span className="ecb-count-badge">
                          {formData.transfers.length}
                        </span>
                      </h3>
                      {!changingTransfers && (
                        <button
                          type="button"
                          className="ecb-change-btn"
                          onClick={handleInitiateChangeTransfers}
                        >
                          <RefreshCw size={11} /> Change
                        </button>
                      )}
                    </div>

                    {/* ── Transfer Picker (active when changingTransfers) ── */}
                    {changingTransfers && (
                      <div className="ecb-change-picker">
                        <div className="ecb-change-picker-title">
                          <Search size={12} /> Select a New Transfer to Add
                          <button
                            type="button"
                            className="ecb-picker-close-btn"
                            onClick={() => setChangingTransfers(false)}
                            title="Close picker"
                          >
                            <X size={13} />
                          </button>
                        </div>
                        <div className="ea-fields-grid">
                          <div className="ea-input-group">
                            <label>Destination</label>
                            <SearchableSelect
                              options={transferDestinations}
                              value={transferPickDestination}
                              onChange={(val) => {
                                setTransferPickDestination(val);
                                setTransferPickTransfer(null);
                              }}
                              placeholder="Search destination…"
                            />
                          </div>
                          <div className="ea-input-group">
                            <label>Transfer Package</label>
                            <SearchableSelect
                              options={transfersForDestination.map((t) => ({
                                label: `${t.title} — ₱${Number(t.oneWayPrice).toLocaleString()} OW`,
                                value: t._id,
                              }))}
                              value={transferPickTransfer?._id || ""}
                              onChange={(val) => {
                                const found = transfersForDestination.find((t) => t._id === val);
                                setTransferPickTransfer(found || null);
                              }}
                              placeholder={
                                transferPickDestination
                                  ? "Search transfer package…"
                                  : "Select destination first"
                              }
                              disabled={!transferPickDestination}
                            />
                          </div>
                        </div>

                        {/* Preview + Add button */}
                        {transferPickTransfer && (
                          <div className="ecb-picker-preview">
                            <div>
                              <strong className="ecb-picker-preview-name">
                                {transferPickTransfer.title}
                              </strong>
                              <span className="ecb-picker-preview-meta">
                                {transferPickTransfer.category || "Transfer"} ·
                                OW ₱{Number(transferPickTransfer.oneWayPrice).toLocaleString()} ·
                                RT ₱{Number(transferPickTransfer.roundtripPrice).toLocaleString()}
                              </span>
                            </div>
                            <button
                              type="button"
                              className="ecb-change-add-btn"
                              onClick={handleAddPickedTransfer}
                            >
                              <Plus size={13} /> Add Transfer
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {formData.transfers.length > 0 && (
                      <>
                        <div className="ecb-service-list">
                          {formData.transfers.map((tr, i) => {
                            const isRoundtrip = tr.transferType === "roundtrip";
                            return (
                              <div key={i} className="ecb-service-card">
                            <div className="ecb-service-card-header">
                              <div className="ecb-service-title">{tr.title}</div>
                              <div className="ecb-service-meta">
                                {tr.category}
                              </div>
                              <span
                                className={`ecb-trip-badge ecb-trip-badge--${
                                  isRoundtrip ? "roundtrip" : "oneway"
                                }`}
                              >
                                {isRoundtrip ? "ROUNDTRIP" : "ONE WAY"}
                              </span>
                            </div>

                            {/* Transfer Type */}
                            <div className="ea-fields-grid">
                              <div className="ea-input-group">
                                <label>Transfer Type</label>
                                <select
                                  value={tr.transferType || "oneway"}
                                  onChange={(e) =>
                                    handleTransferChange(
                                      i,
                                      "transferType",
                                      e.target.value
                                    )
                                  }
                                  className="ea-input ea-select"
                                >
                                  <option value="oneway">One Way</option>
                                  <option value="roundtrip">Roundtrip</option>
                                </select>
                              </div>
                              <div className="ea-input-group">
                                <label>One Way Price (₱)</label>
                                <input
                                  type="number"
                                  value={tr.oneWayPrice ?? 0}
                                  onChange={(e) =>
                                    handleTransferChange(
                                      i,
                                      "oneWayPrice",
                                      e.target.value
                                    )
                                  }
                                  className="ea-input"
                                  min="0"
                                />
                              </div>
                              <div className="ea-input-group">
                                <label>Roundtrip Price (₱)</label>
                                <input
                                  type="number"
                                  value={tr.roundtripPrice ?? 0}
                                  onChange={(e) =>
                                    handleTransferChange(
                                      i,
                                      "roundtripPrice",
                                      e.target.value
                                    )
                                  }
                                  className="ea-input"
                                  min="0"
                                />
                              </div>
                              <div className="ea-input-group">
                                <label>Passenger Count</label>
                                <input
                                  type="number"
                                  value={tr.passengerCount ?? 1}
                                  onChange={(e) =>
                                    handleTransferChange(
                                      i,
                                      "passengerCount",
                                      e.target.value
                                    )
                                  }
                                  className="ea-input"
                                  min="1"
                                />
                              </div>
                            </div>

                            {/* Schedule leg — outbound */}
                            <div className="ecb-leg-block" style={{ marginTop: 14, marginBottom: isRoundtrip ? 14 : 0 }}>
                              {isRoundtrip && (
                                <div className="ecb-leg-label ecb-leg-label--outbound">
                                  OUTBOUND
                                </div>
                              )}
                              <div className="ea-fields-grid">
                                <div className="ea-input-group">
                                  <label>Travel Date</label>
                                  <input
                                    type="date"
                                    value={tr.travelDate || ""}
                                    onChange={(e) =>
                                      handleTransferChange(
                                        i,
                                        "travelDate",
                                        e.target.value
                                      )
                                    }
                                    className="ea-input"
                                  />
                                </div>
                                <div className="ea-input-group">
                                  <label>Arrival Time</label>
                                  <CustomTimePicker
                                    value={tr.arrivalTime || ""}
                                    onChange={(e) =>
                                      handleTransferChange(i, "arrivalTime", e.target.value)
                                    }
                                  />
                                </div>
                                <div className="ea-input-group">
                                  <label>Pickup Location</label>
                                  <LocationSelect
                                    value={tr.pickupLocation || ""}
                                    onChange={(val) =>
                                      handleTransferChange(i, "pickupLocation", val)
                                    }
                                    placeholder="e.g. Hotel lobby, Airport terminal"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Schedule leg — return (roundtrip only) */}
                            {isRoundtrip && (
                              <div className="ecb-leg-block">
                                <div className="ecb-leg-label ecb-leg-label--return">
                                  RETURN
                                </div>
                                <div className="ea-fields-grid">
                                  <div className="ea-input-group">
                                    <label>Return Date</label>
                                    <input
                                      type="date"
                                      value={tr.returnDate || ""}
                                      onChange={(e) =>
                                        handleTransferChange(
                                          i,
                                          "returnDate",
                                          e.target.value
                                        )
                                      }
                                      className="ea-input"
                                    />
                                  </div>
                                  <div className="ea-input-group">
                                    <label>Departure Time</label>
                                    <CustomTimePicker
                                      value={tr.departureTime || ""}
                                      onChange={(e) =>
                                        handleTransferChange(i, "departureTime", e.target.value)
                                      }
                                    />
                                  </div>
                                  <div className="ea-input-group">
                                    <label>Dropoff Location</label>
                                    <LocationSelect
                                      value={tr.dropoffLocation || ""}
                                      onChange={(val) =>
                                        handleTransferChange(i, "dropoffLocation", val)
                                      }
                                      placeholder="e.g. Airport terminal"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Transfer message */}
                            <div className="ea-input-group" style={{ marginTop: 14 }}>
                              <label>Transfer Notes</label>
                              <textarea
                                value={tr.message || ""}
                                onChange={(e) =>
                                  handleTransferChange(
                                    i,
                                    "message",
                                    e.target.value
                                  )
                                }
                                className="ea-input ea-textarea"
                                placeholder="Notes for this transfer..."
                                rows={2}
                              />
                            </div>

                            <div className="ecb-service-subtotal-row">
                              <span>
                                Transfer Subtotal
                                {tr.nightSurcharge > 0 && (
                                  <span className="ecb-surcharge-badge">+₱500 Night</span>
                                )}
                              </span>
                              <strong>
                                ₱{Number(tr.subtotal || 0).toLocaleString()}
                              </strong>
                            </div>
                          </div>
                        );
                      })}
                        </div>

                        <div className="ecb-section-total">
                          <span>Transfers Total</span>
                          <strong>
                            ₱{Number(formData.transfersTotal || 0).toLocaleString()}
                          </strong>
                        </div>
                      </>
                    )}
                  </section>
                )}

                {/* ── PRICING & PAYMENT ──────────────────────────────── */}
                <section className="ea-section">
                  <div className="ea-section-header">
                    <CreditCard size={20} className="ea-section-icon" />
                    <h3>Pricing & Payment</h3>
                  </div>

                  <div className="ea-fields-grid">
                    <div className="ea-input-group">
                      <label>Booking Status</label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="ea-input ea-select"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                    <div className="ea-input-group">
                      <label>Tours Total (₱)</label>
                      <input
                        type="number"
                        name="toursTotal"
                        value={formData.toursTotal}
                        onChange={handleChange}
                        className="ea-input"
                        min="0"
                      />
                    </div>
                    <div className="ea-input-group">
                      <label>Transfers Total (₱)</label>
                      <input
                        type="number"
                        name="transfersTotal"
                        value={formData.transfersTotal}
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
                  <div className="ecb-total-strip">
                    <span>TOTAL AMOUNT</span>
                    <span className="ecb-total-amount">
                      ₱{Number(formData.totalAmount || 0).toLocaleString()}
                    </span>
                  </div>
                </section>

                {/* ── NOTES ─────────────────────────────────────────── */}
                <section className="ea-section">
                  <div className="ea-section-header">
                    <MessageSquare size={20} className="ea-section-icon" />
                    <h3>Notes</h3>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div className="ea-input-group">
                      <label>Customer Message</label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        className="ea-input ea-textarea"
                        placeholder="Customer's message or special requests..."
                      />
                    </div>
                    <div className="ea-input-group">
                      <label>Admin Notes</label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        className="ea-input ea-textarea"
                        placeholder="Internal notes for this booking..."
                      />
                    </div>
                  </div>
                </section>

              </div>{/* end ea-form-left */}

              {/* ── RIGHT SIDEBAR ─────────────────────────────────── */}
              <div className="ea-form-right">
                <div className="ea-sticky-sidebar">

                  {/* Summary card */}
                  <div className="ea-card-sidebar">
                    <div
                      className="ea-section-header"
                      style={{ marginBottom: 14 }}
                    >
                      <h3>Booking Summary</h3>
                    </div>

                    <div className="ecb-summary-list">
                      <div className="ecb-summary-row">
                        <span>Destination</span>
                        <strong>{formData.destination || "—"}</strong>
                      </div>
                      <div className="ecb-summary-row">
                        <span>Travel Date</span>
                        <strong>{formData.travelDate || "—"}</strong>
                      </div>
                      {formData.returnDate && (
                        <div className="ecb-summary-row">
                          <span>Return Date</span>
                          <strong>{formData.returnDate}</strong>
                        </div>
                      )}
                      <div className="ecb-summary-row">
                        <span>Pax</span>
                        <strong>{formData.paxCount}</strong>
                      </div>

                      {formData.tours.length > 0 && (
                        <div className="ecb-summary-row">
                          <span>
                            Tours{" "}
                            <span className="ecb-summary-count">
                              ×{formData.tours.length}
                            </span>
                          </span>
                          <strong>
                            ₱{Number(formData.toursTotal || 0).toLocaleString()}
                          </strong>
                        </div>
                      )}

                      {formData.transfers.length > 0 && (
                        <div className="ecb-summary-row">
                          <span>
                            Transfers{" "}
                            <span className="ecb-summary-count">
                              ×{formData.transfers.length}
                            </span>
                          </span>
                          <strong>
                            ₱{Number(
                              formData.transfersTotal || 0
                            ).toLocaleString()}
                          </strong>
                        </div>
                      )}

                      {/* Night surcharge row — only shown when at least one transfer has it */}
                      {formData.transfers.some((tr) => tr.nightSurcharge > 0) && (
                        <div className="ecb-summary-row ecb-summary-row--surcharge">
                          <span>Night Surcharge <span className="ecb-summary-count">(12am–5am)</span></span>
                          <strong>
                            +₱{formData.transfers
                              .reduce((s, tr) => s + (Number(tr.nightSurcharge) || 0), 0)
                              .toLocaleString()}
                          </strong>
                        </div>
                      )}

                      <div className="ecb-summary-row ecb-summary-row--total">
                        <span>Total</span>
                        <strong>
                          ₱{Number(formData.totalAmount || 0).toLocaleString()}
                        </strong>
                      </div>
                    </div>

                    {/* Status row */}
                    <div className="ecb-status-row">
                      <span
                        className={`ecb-status-dot ecb-status-dot--${formData.status}`}
                      />
                      <span className="ecb-status-label">
                        {formData.status.charAt(0).toUpperCase() +
                          formData.status.slice(1)}
                      </span>
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

export default EditCustomBooking;