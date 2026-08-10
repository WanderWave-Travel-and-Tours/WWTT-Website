import React, { useState } from "react";
import {
  X, CheckCircle, User, Mail, Calendar, MapPin, Users, Phone,
  DollarSign, Archive, AlertCircle, FileText, CreditCard
} from "lucide-react";
import "./TourModals.css";
import VoucherPreviewModal from "./VoucherPreviewModal";

// --- HELPER FUNCTIONS ---
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
};

const buildItinerary = (startDate, endDate, duration) => {
  if (!startDate) return [];
  const start = new Date(startDate);
  let days = 1;
  if (endDate) {
    const end = new Date(endDate);
    days = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
  } else if (duration) {
    const match = duration.match(/(\d+)\s*[Dd]/);
    if (match) days = parseInt(match[1]);
  }
  if (days < 1) days = 1;
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    let activity = `Day ${i + 1} Activities`;
    if (i === 0) activity = "Arrival, Airport Pickup & Hotel Check-in";
    if (i === days - 1 && days > 1) activity = "Hotel Check-out & Transfer to Airport – End of Service";
    return {
      day: i + 1,
      date: date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      activity,
    };
  });
};

// ==========================================
// TOUR DETAILS MODAL
// ==========================================
export const TourModal = ({
  tour, onClose, onConfirm, onCancel, onArchive
}) => {
  const [showVoucherPreview, setShowVoucherPreview] = useState(false);
  const [voucherData, setVoucherData] = useState(null);
  const [isGeneratingVoucher, setIsGeneratingVoucher] = useState(false);

  if (!tour) return null;

  const status = (tour.status || "Pending").toLowerCase();

  const getStatusConfig = (s) => {
    const configs = {
      confirmed: { color: "green", icon: CheckCircle, label: "Confirmed",     description: "Booking is active"      },
      pending:   { color: "amber", icon: AlertCircle, label: "Pending Review", description: "Awaiting confirmation"   },
      cancelled: { color: "red",   icon: X,           label: "Cancelled",      description: "Tour was cancelled"      },
    };
    return configs[s] || configs.pending;
  };

  const statusConfig = getStatusConfig(status);
  const StatusIcon   = statusConfig.icon;

  // ── Generate Voucher (mirrors BookingDetailModal logic) ──────────────
  const generateVoucherData = async () => {
    setIsGeneratingVoucher(true);
    try {
      const res = await fetch(`/api/tour-bookings/${tour.mongoId}`);
      if (!res.ok) throw new Error(`Failed to fetch tour booking: ${res.status}`);
      const data = await res.json();
      const fullBooking = data.data || data;

      // Build guest list from passengers
      let guestList = [];
      if (Array.isArray(fullBooking.passengers) && fullBooking.passengers.length > 0) {
        guestList = fullBooking.passengers.map(p => ({
          name: `${p.firstName || ""} ${p.lastName || ""}`.trim() || fullBooking.fullName || tour.client,
          age: p.age ?? "N/A",
          nationality: p.nationality || "Filipino",
        }));
      }
      if (guestList.length === 0) {
        guestList = [{ name: fullBooking.fullName || tour.client, age: "N/A", nationality: "Filipino" }];
      }

      const itinerary = buildItinerary(fullBooking.startDate, fullBooking.endDate, fullBooking.duration);

      const totalAmount   = fullBooking.totalAmount || 0;
      const remainingBal  = fullBooking.remainingBalance || 0;
      const downPayment   = totalAmount - remainingBal;
      const paxAdult      = fullBooking.pax?.adult || 1;

      const voucher = {
        clientName:     fullBooking.fullName || tour.client,
        clientEmail:    fullBooking.email || "",
        clientPhone:    fullBooking.primaryContact?.phone || "N/A",
        travelDate:     formatDate(fullBooking.startDate) || tour.travelDate,
        packageName:    fullBooking.packageName || tour.package,
        packageRate:    paxAdult > 0 ? totalAmount / paxAdult : totalAmount,
        numberOfGuests: paxAdult,
        guestList,
        inclusions:     fullBooking.customizedInclusions?.length
          ? fullBooking.customizedInclusions
          : ["Package inclusions not specified. Please contact the agency."],
        exclusions:     ["Snorkeling Gears", "Other Entrance fees not included", "Travel Insurance"],
        amenities:      { amenities: ["Free Wi-Fi"], facilities: ["Air conditioning"] },
        itinerary,
        totalAmount,
        downPayment,
        amountDue:      remainingBal,
        referenceNumber: fullBooking.referenceNumber || tour.mongoId,
      };

      setVoucherData(voucher);
      setShowVoucherPreview(true);
    } catch (err) {
      console.error("❌ Error generating tour voucher:", err);
      alert("May error sa pag-load ng voucher data. Please try again.");
    } finally {
      setIsGeneratingVoucher(false);
    }
  };

  const isPending   = status === "pending";
  const isConfirmed = status === "confirmed";
  const isCancelled = status === "cancelled";

  // Parse PAX display
  const paxStr = tour.pax || "";

  return (
    <>
      <div className="tur-overlay" onClick={onClose}>
        <div className="tur-modal tur-modal-lg" onClick={(e) => e.stopPropagation()}>

          {/* HEADER */}
          <div className="tur-header">
            <div className="tur-header-content">
              <div className="tur-title-group">
                <h2 className="tur-title">Tour Booking Details</h2>
                <div className="tur-meta">
                  <span className="tur-ref">ID: {tour.id}</span>
                  <span className="tur-divider">•</span>
                  <span className="tur-date">Booked: {formatDate(new Date())}</span>
                </div>
              </div>
              <div className={`tur-status-badge tur-status-${statusConfig.color}`}>
                <div className="tur-status-icon"><StatusIcon size={16} /></div>
                <div className="tur-status-content">
                  <span className="tur-status-label">{statusConfig.label}</span>
                  <span className="tur-status-desc">{statusConfig.description}</span>
                </div>
              </div>
            </div>
            <button className="tur-close-btn" onClick={onClose} aria-label="Close modal">
              <X size={20} />
            </button>
          </div>

          {/* BODY */}
          <div className="tur-body">

            {/* PENDING ALERT */}
            {isPending && (
              <div className="tur-alert tur-alert-warning">
                <div className="tur-alert-icon"><Calendar size={22} /></div>
                <div className="tur-alert-content">
                  <h4 className="tur-alert-title">Confirmation Required</h4>
                  <p className="tur-alert-desc">
                    This tour booking is awaiting your confirmation. Please review the details below.
                  </p>
                </div>
              </div>
            )}

            {/* CANCELLED NOTICE */}
            {isCancelled && (
              <div className="tur-alert tur-alert-info" style={{
                background: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
                borderColor: "#fecaca",
              }}>
                <div className="tur-alert-icon" style={{ background: "linear-gradient(135deg, #fca5a5, #ef4444)" }}>
                  <X size={22} />
                </div>
                <div className="tur-alert-content">
                  <h4 className="tur-alert-title">Tour Cancelled</h4>
                  <p className="tur-alert-desc">This tour booking has been cancelled and cannot be modified.</p>
                </div>
              </div>
            )}

            {/* PACKAGE BANNER */}
            <div style={{
              background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)",
              borderRadius: "14px",
              padding: "20px 24px",
              marginBottom: "15px",
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}>
              <div style={{
                width: "48px", height: "48px", background: "rgba(255,255,255,0.15)",
                borderRadius: "12px", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: "24px", flexShrink: 0,
              }}>
                🏝️
              </div>
              <div>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>
                  TOUR PACKAGE
                </div>
                <div style={{ fontSize: "18px", fontWeight: 800, color: "white", letterSpacing: "0.5px" }}>
                  {tour.package?.toUpperCase() || "N/A"}
                </div>
              </div>
            </div>

            {/* BOOKING INFORMATION */}
            <div className="tur-card">
              <div className="tur-card-header">
                <h3 className="tur-card-title">Booking Information</h3>
              </div>
              <div className="tur-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="tur-info-item">
                  <div className="tur-info-icon"><User size={18} /></div>
                  <div className="tur-info-content">
                    <label className="tur-info-label">Client Name</label>
                    <span className="tur-info-value">{tour.client}</span>
                  </div>
                </div>
                <div className="tur-info-item">
                  <div className="tur-info-icon"><Mail size={18} /></div>
                  <div className="tur-info-content">
                    <label className="tur-info-label">Email Address</label>
                    <span className="tur-info-value">{tour.email || "N/A"}</span>
                  </div>
                </div>
                <div className="tur-info-item">
                  <div className="tur-info-icon"><MapPin size={18} /></div>
                  <div className="tur-info-content">
                    <label className="tur-info-label">Destination</label>
                    <span className="tur-info-value">{tour.destination || "—"}</span>
                  </div>
                </div>
                <div className="tur-info-item">
                  <div className="tur-info-icon"><Calendar size={18} /></div>
                  <div className="tur-info-content">
                    <label className="tur-info-label">Duration</label>
                    <span className="tur-info-value">{tour.duration || "1"}</span>
                  </div>
                </div>
                <div className="tur-info-item">
                  <div className="tur-info-icon"><Calendar size={18} /></div>
                  <div className="tur-info-content">
                    <label className="tur-info-label">Travel Date</label>
                    <span className="tur-info-value">{tour.startDate || tour.travelDate?.split(" - ")[0] || "N/A"}</span>
                  </div>
                </div>
                <div className="tur-info-item">
                  <div className="tur-info-icon"><Calendar size={18} /></div>
                  <div className="tur-info-content">
                    <label className="tur-info-label">End Date</label>
                    <span className="tur-info-value">{tour.endDate || tour.travelDate?.split(" - ")[1] || "N/A"}</span>
                  </div>
                </div>
                <div className="tur-info-item">
                  <div className="tur-info-icon"><Users size={18} /></div>
                  <div className="tur-info-content">
                    <label className="tur-info-label">Guests</label>
                    <span className="tur-info-value">{paxStr}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* PAYMENT DETAILS */}
            <div className="tur-payment-card">
              <div className="tur-payment-header">
                <div className="tur-payment-title">
                  <CreditCard size={18} />
                  PAYMENT DETAILS
                </div>
                <div className="tur-payment-badge full">FULL PAYMENT</div>
              </div>
              <div className="tur-payment-body">
                <div className="tur-payment-row">
                  <span className="tur-payment-label">Payment Method:</span>
                  <span className="tur-payment-value" style={{ color: "#2563eb" }}>Online Payment</span>
                </div>
                <div className="tur-payment-row">
                  <span className="tur-payment-label">Payment Type:</span>
                  <span className="tur-payment-value">Pay in Full</span>
                </div>
                <div className="tur-payment-row">
                  <span className="tur-payment-label">Total Booking Amount:</span>
                  <span className="tur-payment-value">
                    ₱{(tour.totalAmount || 0).toLocaleString()}
                  </span>
                </div>

                {/* Payment status box */}
                <div className={`tur-payment-status-box ${isConfirmed ? "paid" : "pending"}`}>
                  <div className="tur-payment-status-left">
                    <span className="tur-payment-status-title">
                      {isConfirmed ? "✅ PAYMENT CONFIRMED" : "⚠️ PENDING PAYMENT"}
                    </span>
                    <span className="tur-payment-status-amount">
                      ₱{(tour.totalAmount || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="tur-payment-status-icon">
                    {isConfirmed
                      ? <CheckCircle size={22} />
                      : <AlertCircle size={22} />
                    }
                  </div>
                </div>
              </div>
            </div>

            {/* SPECIAL REQUESTS */}
            <div className="tur-card">
              <div className="tur-card-header">
                <h3 className="tur-card-title">Special Requests / Notes</h3>
              </div>
              <div className="tur-message-box">
                {tour.notes
                  ? tour.notes
                  : <span className="tur-msg-empty">No special requests provided by the guest.</span>
                }
              </div>
            </div>

          </div>

          {/* FOOTER */}
          <div className="tur-footer">
            <button className="tur-btn tur-btn-ghost" onClick={onClose}>Close</button>

            {/* View Voucher — only for confirmed */}
            {isConfirmed && (
              <button
                className="tur-btn tur-btn-primary"
                onClick={generateVoucherData}
                disabled={isGeneratingVoucher}
                style={{ background: "linear-gradient(135deg, #f97316, #ea580c)", boxShadow: "0 4px 12px rgba(249,115,22,0.3)" }}
              >
                <FileText size={16} />
                {isGeneratingVoucher ? "Loading..." : "View Voucher"}
              </button>
            )}

            {/* Archive — always available unless cancelled */}
            {!isCancelled && (
              <button className="tur-btn" onClick={onArchive} style={{
                background: "linear-gradient(135deg, #fde68a, #f59e0b)", color: "#78350f",
                boxShadow: "0 4px 12px rgba(245,158,11,0.25)",
              }}>
                <Archive size={16} /> Archive
              </button>
            )}

            {/* Cancel — only for pending or confirmed (not cancelled) */}
            {!isCancelled && (
              <button className="tur-btn tur-btn-danger" onClick={onCancel} style={{
                background: "linear-gradient(135deg, #ef4444, #dc2626)",
                boxShadow: "0 4px 12px rgba(239,68,68,0.3)",
              }}>
                <X size={16} /> Cancel Booking
              </button>
            )}

            {/* Confirm — only for pending (not confirmed, not cancelled) */}
            {isPending && (
              <button className="tur-btn tur-btn-success" onClick={onConfirm}>
                <CheckCircle size={16} /> Confirm Booking
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Voucher Preview Modal */}
      {showVoucherPreview && voucherData && (
        <VoucherPreviewModal
          voucherData={voucherData}
          onClose={() => setShowVoucherPreview(false)}
          onEdit={(updatedData) => setVoucherData(updatedData)}
        />
      )}
    </>
  );
};