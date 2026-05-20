import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "../../toast/ToastManager";
import {
  API_BASE_URL,
  TRANSFERS_API,
  DEFAULT_FORM_STATE,
  recalculatePrice,
  isLateNight,
  LATE_NIGHT_CHARGE,
} from "./transferBookingUtils";

// ─────────────────────────────────────────────────────────────────────────────
// useEditTransferBooking
// Encapsulates all state, API calls, and event handlers for the edit form.
// ─────────────────────────────────────────────────────────────────────────────
const useEditTransferBooking = () => {
  const navigate   = useNavigate();
  const { id: bookingId } = useParams();
  const toast      = useToast();

  // ── UI state ───────────────────────────────────────────────────────────────
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

  // ── Modal state ───────────────────────────────────────────────────────────
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    type: "primary",
  });

  // ── Form state ────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState(DEFAULT_FORM_STATE);

  // ── Sidebar ───────────────────────────────────────────────────────────────
  const toggleSidebar = () => setIsSidebarCollapsed((p) => !p);

  // ── Modal helpers ─────────────────────────────────────────────────────────
  const closeModal = () => setModalConfig((p) => ({ ...p, isOpen: false }));

  // ── Fetch transfers listing once ──────────────────────────────────────────
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

  // ── Derived: unique destinations ──────────────────────────────────────────
  const destinations = useMemo(() => {
    const set = new Set();
    transfers.forEach((t) => {
      if (t.packageDestination) set.add(t.packageDestination);
    });
    return Array.from(set).sort();
  }, [transfers]);

  // ── Derived: filtered destinations ───────────────────────────────────────
  const filteredDestinations = useMemo(
    () =>
      destinations.filter((d) =>
        d.toLowerCase().includes(destQuery.toLowerCase())
      ),
    [destinations, destQuery]
  );

  // ── Derived: filtered activities ─────────────────────────────────────────
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

  // ── Transfer type change ──────────────────────────────────────────────────
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
      activityName: "",
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

      passengerCount:       parseInt(formData.passengerCount)         || 1,
      oneWayPrice:          parseFloat(formData.oneWayPrice)          || 0,
      roundtripPrice:       parseFloat(formData.roundtripPrice)       || 0,
      sellingPrice:         parseFloat(formData.sellingPrice)         || 0,
      totalAmount:          parseFloat(formData.totalAmount)          || 0,

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

  // ── Derived display values ─────────────────────────────────────────────────
  const isRoundtrip = formData.transferType === "roundtrip";

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

  return {
    // state
    isSidebarCollapsed,
    loading,
    submitting,
    formData,
    setFormData,
    modalConfig,
    // dropdown state & refs
    destOpen, setDestOpen, destQuery, setDestQuery, destHi, setDestHi, destRef,
    actOpen,  setActOpen,  actQuery,  setActQuery,  actHi,  setActHi,  actRef,
    // derived
    filteredDestinations,
    filteredActivities,
    isRoundtrip,
    summaryLateNightCharge,
    summaryLateNightReasons,
    // handlers
    toggleSidebar,
    closeModal,
    handleChange,
    handleTransferTypeChange,
    handleDestinationSelect,
    handleDestKeyDown,
    handleActivitySelect,
    handleActKeyDown,
    handleCancel,
    handleSubmit,
  };
};

export default useEditTransferBooking;
