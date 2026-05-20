// ─────────────────────────────────────────────────────────────────────────────
// transferBookingUtils.js
// Shared constants, helpers, and dropdown styles for EditTransferBooking
// ─────────────────────────────────────────────────────────────────────────────

export const API_BASE_URL  = "https://wanderwaveph.onrender.com/api/transfer-bookings";
export const TRANSFERS_API = "https://wanderwaveph.onrender.com/api/transfers";

export const LATE_NIGHT_CHARGE = 500;

/**
 * Reads admin credentials from localStorage.
 */
export const getAdminData = () => {
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

/**
 * Returns true if the time string (HH:MM, 24-hr) falls between 12:00 AM and 4:59 AM.
 */
export const isLateNight = (timeStr) => {
  if (!timeStr) return false;
  const [hours] = timeStr.split(":").map(Number);
  return hours >= 0 && hours < 5;
};

/**
 * Computes sellingPrice and totalAmount from the current form data snapshot.
 * Called whenever activity, transferType, oneWayPrice, roundtripPrice,
 * arrivalTime, or departureTime changes.
 */
export const recalculatePrice = (data) => {
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

/**
 * Inline dropdown styles shared by Destination & Activity dropdowns.
 */
export const ddStyle = {
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

/**
 * Default / blank form state — mirrors TransferBookingOrder schema.
 */
export const DEFAULT_FORM_STATE = {
  // Booking meta
  activityName: "",
  destination:  "",
  category:     "",
  supplierName: "",
  promoCode:    "",
  pax:          "",

  // Trip type
  transferType: "oneway",

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
};
