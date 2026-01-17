/**
 * Converts a File object to base64 string
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Converts base64 string to File object
 */
export const base64ToFile = async (base64String, fileName, mimeType) => {
  const res = await fetch(base64String);
  const blob = await res.blob();
  return new File([blob], fileName, { type: mimeType });
};

/**
 * Get current formatted date
 */
export const getCurrentFormattedDate = () => {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

/**
 * Validate scheduled date
 */
export const validateScheduledDate = (scheduledAt) => {
  if (!scheduledAt) return { valid: false, message: "Please select a date and time." };
  
  const scheduleDate = new Date(scheduledAt);
  const now = new Date();
  
  if (scheduleDate <= now) {
    return { valid: false, message: "Scheduled time must be in the future." };
  }
  
  return { valid: true };
};

/**
 * Get admin data from localStorage
 */
export const getAdminData = () => {
  try {
    const adminData = JSON.parse(localStorage.getItem("adminData") || "{}");
    return {
      activeUser: adminData.email || adminData.username || adminData.user || "Unknown User",
      activeId: adminData.id || adminData._id || ""
    };
  } catch (err) {
    console.error("Error parsing admin data:", err);
    return {
      activeUser: "Unknown User",
      activeId: ""
    };
  }
};