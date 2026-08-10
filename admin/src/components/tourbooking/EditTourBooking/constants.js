// ─────────────────────────────────────────────────────────────────────────────
// API endpoints
// ─────────────────────────────────────────────────────────────────────────────
export const API_BASE_URL = "/api/tour-bookings";
export const TOURS_API    = "/api/tours";

// ─────────────────────────────────────────────────────────────────────────────
// Inline styles for searchable dropdowns
// ─────────────────────────────────────────────────────────────────────────────
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
  item: (highlighted) => ({
    padding: "10px 14px",
    cursor: "pointer",
    fontSize: "0.875rem",
    color: "#374151",
    background: highlighted ? "#eff6ff" : "transparent",
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
