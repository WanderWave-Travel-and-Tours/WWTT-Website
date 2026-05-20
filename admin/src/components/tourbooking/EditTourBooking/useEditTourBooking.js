import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "../../toast/ToastManager";
import { API_BASE_URL, TOURS_API } from "./constants";

// ─────────────────────────────────────────────────────────────────────────────
// Default form state matching the TourBooking schema
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_FORM = {
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
};

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────
const useEditTourBooking = () => {
  const navigate             = useNavigate();
  const { id: bookingId }    = useParams();
  const toast                = useToast();

  // ── UI state ────────────────────────────────────────────────────────────────
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // ── Tours list ──────────────────────────────────────────────────────────────
  const [tours, setTours] = useState([]);

  // ── Package name dropdown ───────────────────────────────────────────────────
  const [pkgOpen,  setPkgOpen]  = useState(false);
  const [pkgQuery, setPkgQuery] = useState("");
  const [pkgHi,    setPkgHi]    = useState(-1);
  const pkgRef = useRef(null);

  // ── Destination dropdown ────────────────────────────────────────────────────
  const [destOpen,  setDestOpen]  = useState(false);
  const [destQuery, setDestQuery] = useState("");
  const [destHi,    setDestHi]    = useState(-1);
  const destRef = useRef(null);

  // ── Confirmation modal ──────────────────────────────────────────────────────
  const [modalConfig, setModalConfig] = useState({
    isOpen:    false,
    title:     "",
    message:   "",
    onConfirm: () => {},
    type:      "primary",
  });

  // ── Form data ───────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState(DEFAULT_FORM);

  // ── Sidebar toggle ──────────────────────────────────────────────────────────
  const toggleSidebar = () => setIsSidebarCollapsed((p) => !p);

  // ── Modal helpers ────────────────────────────────────────────────────────────
  const closeModal = () => setModalConfig((p) => ({ ...p, isOpen: false }));

  // ── Fetch tours listing (for dropdowns) ─────────────────────────────────────
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

  // ── Close package dropdown on outside click ──────────────────────────────────
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

  // ── Close destination dropdown on outside click ──────────────────────────────
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

  // ── Unique destinations derived from tours ───────────────────────────────────
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

  // ── Tours filtered by destination + search query ─────────────────────────────
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

  // ── Fetch booking data ───────────────────────────────────────────────────────
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

        setPkgQuery(d.packageName  || "");
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

  // ── Generic input handler ─────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // ── Package dropdown handlers ─────────────────────────────────────────────────
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

  // ── Destination dropdown handlers ─────────────────────────────────────────────
  const handleDestinationSelect = (dest) => {
    setFormData((prev) => ({
      ...prev,
      destination:  dest,
      packageName:  "",
      duration:     "",
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

  // ── Cancel ────────────────────────────────────────────────────────────────────
  const handleCancel = () => {
    setModalConfig({
      isOpen: true,
      title:  "Discard Changes",
      message:
        "Are you sure you want to cancel? Any unsaved changes will be lost.",
      type:      "danger",
      onConfirm: () => {
        closeModal();
        navigate(-1);
      },
    });
  };

  // ── Submit ─────────────────────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    setModalConfig({
      isOpen:  true,
      title:   "Save Changes",
      message: "Do you want to save the changes made to this tour booking?",
      type:    "primary",
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

  // ── Derived values ─────────────────────────────────────────────────────────────
  const totalPax =
    parseInt(formData.paxAdult    || 0) +
    parseInt(formData.paxChildren || 0) +
    parseInt(formData.paxInfants  || 0);

  return {
    // UI
    isSidebarCollapsed, toggleSidebar,
    loading, submitting,
    // Form
    formData, handleChange,
    // Package dropdown
    pkgOpen, setPkgOpen,
    pkgQuery, setPkgQuery,
    pkgHi,   setPkgHi,
    pkgRef,
    filteredTours,
    handlePackageSelect, handlePkgKeyDown,
    // Destination dropdown
    destOpen, setDestOpen,
    destQuery, setDestQuery,
    destHi,   setDestHi,
    destRef,
    filteredDestinations,
    handleDestinationSelect, handleDestKeyDown,
    // Actions
    handleChange, handleCancel, handleSubmit,
    // Modal
    modalConfig, closeModal,
    // Derived
    totalPax,
  };
};

export default useEditTourBooking;
