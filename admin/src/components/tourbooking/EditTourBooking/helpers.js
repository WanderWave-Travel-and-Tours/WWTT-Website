// ─────────────────────────────────────────────────────────────────────────────
// Reads admin session info from localStorage
// ─────────────────────────────────────────────────────────────────────────────
export const getAdminData = () => {
  try {
    const adminData = JSON.parse(localStorage.getItem("adminData") || "{}");
    return {
      userEmail: adminData.email || adminData.username || "Unknown Admin",
      adminId:   adminData._id  || adminData.id        || null,
    };
  } catch {
    return { userEmail: "Unknown Admin", adminId: null };
  }
};
