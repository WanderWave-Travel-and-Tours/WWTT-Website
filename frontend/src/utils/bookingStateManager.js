export const BookingStateManager = {
  saveBookingState: (packageCode, formData, customizationData = null) => {
    const state = {
      formData,
      customizationData,
      timestamp: Date.now(),
      packageCode
    };
    localStorage.setItem(`booking_${packageCode}`, JSON.stringify(state));
  },

  getBookingState: (packageCode) => {
    const saved = localStorage.getItem(`booking_${packageCode}`);
    if (!saved) return null;
    
    const state = JSON.parse(saved);
    const hoursPassed = (Date.now() - state.timestamp) / (1000 * 60 * 60);
    if (hoursPassed > 24) {
      localStorage.removeItem(`booking_${packageCode}`);
      return null;
    }
    return state;
  },

  clearBookingState: (packageCode) => {
    localStorage.removeItem(`booking_${packageCode}`);
  },

  setFlightSearchContext: (packageCode, packageData) => {
    sessionStorage.setItem('flight_search_context', JSON.stringify({
      returnTo: `/packages/${packageCode}`,
      packageData,
      timestamp: Date.now()
    }));
  },

  getFlightSearchContext: () => {
    const context = sessionStorage.getItem('flight_search_context');
    return context ? JSON.parse(context) : null;
  },

  clearFlightSearchContext: () => {
    sessionStorage.removeItem('flight_search_context');
  }
};