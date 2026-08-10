import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Upload, X, Plus, Trash2, Save } from "lucide-react";
import Sidebar from "../sidebar/sidebar";
import "./editpackage.css";

// Imports for Draft Functionality
import useAutoDraft from '../../hooks/useAutoDraft';
import RestoreDraftModal from '../../components/RestoreDraftModal/RestoreDraftModal';

// Toast Import
import { useToast } from '../toast/ToastManager';

// HELPER FUNCTION - GET ADMIN DATA (Activity Logs)
const getAdminData = () => {
    try {
        const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
        return {
            userEmail: adminData.email || adminData.username || 'Unknown Admin',
            adminId: adminData._id || adminData.id || null
        };
    } catch (error) {
        console.error('Error getting admin data:', error);
        return { userEmail: 'Unknown Admin', adminId: null };
    }
};

// ✅ Predefined tour type tags (mirrors AddPackage / BasicInfo)
const PREDEFINED_TOUR_TYPES = [
  'Solo',
  'Min of 2 pax',
  'Solo/Joiners',
  'With Free City Tour',
  'With City Tour',
  'Min of 2 pax (Exclusive Tour)',
];

// ✅ Local destination list
const LOCAL_DESTINATIONS = [
  { value: 'BAGUIO', label: 'Baguio' },
  { value: 'BATANES', label: 'Batanes' },
  { value: 'BOHOL', label: 'Bohol' },
  { value: 'BOLINAO', label: 'Bolinao' },
  { value: 'BORACAY', label: 'Boracay' },
  { value: 'CEBU', label: 'Cebu' },
  { value: 'CORON', label: 'Coron' },
  { value: 'DAVAO', label: 'Davao' },
  { value: 'EL NIDO', label: 'El Nido' },
  { value: 'LA UNION', label: 'La Union' },
  { value: 'PUERTO PRINCESA', label: 'Puerto Princesa' },
  { value: 'SAGADA', label: 'Sagada' },
  { value: 'SIARGAO', label: 'Siargao' },
  { value: 'SIQUIJOR', label: 'Siquijor' },
];

// ✅ International destination list
const INTERNATIONAL_DESTINATIONS = [
  // East Asia
  { value: 'TOKYO, JAPAN', label: 'Tokyo, Japan' },
  { value: 'OSAKA, JAPAN', label: 'Osaka, Japan' },
  { value: 'KYOTO, JAPAN', label: 'Kyoto, Japan' },
  { value: 'SEOUL, SOUTH KOREA', label: 'Seoul, South Korea' },
  { value: 'BUSAN, SOUTH KOREA', label: 'Busan, South Korea' },
  { value: 'TAIPEI, TAIWAN', label: 'Taipei, Taiwan' },
  { value: 'HONG KONG', label: 'Hong Kong' },
  { value: 'BEIJING, CHINA', label: 'Beijing, China' },
  { value: 'SHANGHAI, CHINA', label: 'Shanghai, China' },
  // Southeast Asia
  { value: 'BANGKOK, THAILAND', label: 'Bangkok, Thailand' },
  { value: 'PHUKET, THAILAND', label: 'Phuket, Thailand' },
  { value: 'CHIANG MAI, THAILAND', label: 'Chiang Mai, Thailand' },
  { value: 'HANOI, VIETNAM', label: 'Hanoi, Vietnam' },
  { value: 'HO CHI MINH CITY, VIETNAM', label: 'Ho Chi Minh City, Vietnam' },
  { value: 'DA NANG, VIETNAM', label: 'Da Nang, Vietnam' },
  { value: 'SINGAPORE', label: 'Singapore' },
  { value: 'KUALA LUMPUR, MALAYSIA', label: 'Kuala Lumpur, Malaysia' },
  { value: 'LANGKAWI, MALAYSIA', label: 'Langkawi, Malaysia' },
  { value: 'KOTA KINABALU, MALAYSIA', label: 'Kota Kinabalu, Malaysia' },
  { value: 'BALI, INDONESIA', label: 'Bali, Indonesia' },
  { value: 'JAKARTA, INDONESIA', label: 'Jakarta, Indonesia' },
  { value: 'SIEM REAP, CAMBODIA', label: 'Siem Reap, Cambodia' },
  { value: 'PHNOM PENH, CAMBODIA', label: 'Phnom Penh, Cambodia' },
  // Middle East
  { value: 'DUBAI, UAE', label: 'Dubai, UAE' },
  { value: 'ABU DHABI, UAE', label: 'Abu Dhabi, UAE' },
  // Europe
  { value: 'PARIS, FRANCE', label: 'Paris, France' },
  { value: 'LONDON, UK', label: 'London, UK' },
  { value: 'ROME, ITALY', label: 'Rome, Italy' },
  { value: 'BARCELONA, SPAIN', label: 'Barcelona, Spain' },
  { value: 'AMSTERDAM, NETHERLANDS', label: 'Amsterdam, Netherlands' },
  // Americas
  { value: 'NEW YORK, USA', label: 'New York, USA' },
  { value: 'LOS ANGELES, USA', label: 'Los Angeles, USA' },
  { value: 'LAS VEGAS, USA', label: 'Las Vegas, USA' },
];

const EditPackage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const packageId = id;

  const toast = useToast();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    destination: "",
    tourType: "Solo",
    pax: "",
    minPax: "",
    sellerPrice: "",
    markup: "",
    markupType: "flat",
    duration: "",
    category: "Local",
    existingImage: "",
    existingImagePublicId: "",
    soloPaxPrice: "",
    multiplePaxPrice: ""
  });

  // Store original data to track changes for Activity Logs
  const [originalData, setOriginalData] = useState(null);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [inclusions, setInclusions] = useState([""]);
  const [itinerary, setItinerary] = useState([
    { day: 1, title: "", activities: [""] },
  ]);

  // ✅ Destination dropdown state
  const [isOtherDestination, setIsOtherDestination] = useState(false);

  // ✅ Tour type tag state
  const [isOtherTourType, setIsOtherTourType] = useState(false);
  const [otherTourTypeValue, setOtherTourTypeValue] = useState('');

  const API_BASE_URL = "/api/packages";
  const getAdminHeaders = () => ({});

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  // ✅ Derived destination list based on category
  const isInternational = formData.category === 'International' || formData.category === 'International Tour';
  const destinationList = isInternational ? INTERNATIONAL_DESTINATIONS : LOCAL_DESTINATIONS;

  // =========================================================
  // AUTO-DRAFT LOGIC START
  // =========================================================

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const base64ToFile = async (base64String, fileName, mimeType) => {
    const res = await fetch(base64String);
    const blob = await res.blob();
    return new File([blob], fileName, { type: mimeType });
  };

  const [draftPayload, setDraftPayload] = useState(null);

  useEffect(() => {
    const updateDraft = async () => {
      if (loading) {
        setDraftPayload(null);
        return;
      }

      const isFormEmpty =
        !formData.title &&
        !formData.destination &&
        !formData.sellerPrice &&
        !formData.markup &&
        !formData.duration &&
        !imageFile;

      if (isFormEmpty) {
        setDraftPayload(null);
        return;
      }

      let imageBase64 = null;
      let imageMeta = null;

      if (imageFile) {
        try {
          if (imageFile.size < 3 * 1024 * 1024) {
            imageBase64 = await fileToBase64(imageFile);
            imageMeta = { name: imageFile.name, type: imageFile.type };
          }
        } catch (err) {
          console.warn("Image too large for draft, saving text only.");
        }
      }

      setDraftPayload({
        ...formData,
        inclusions,
        itinerary,
        image: imageBase64,
        imageMeta: imageMeta,
        originalId: packageId,
        soloPaxPrice: formData.soloPaxPrice,
        multiplePaxPrice: formData.multiplePaxPrice,
        isOtherDestination,
        isOtherTourType,
        otherTourTypeValue,
      });
    };

    const timeoutId = setTimeout(() => {
      updateDraft();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData, inclusions, itinerary, imageFile, loading, packageId, isOtherDestination, isOtherTourType, otherTourTypeValue]);

  const restoreDraftData = async (data) => {
    if (!data) return;

    if (data.originalId && data.originalId !== packageId) {
      console.warn("Draft found but belongs to a different package ID. Ignoring.");
      return;
    }

    setFormData({
      title: data.title || "",
      destination: data.destination || "",
      tourType: data.tourType || "Solo",
      pax: data.pax || "",
      minPax: data.minPax || "",
      sellerPrice: data.sellerPrice || "",
      markup: data.markup || "",
      markupType: data.markupType || "flat",
      duration: data.duration || "",
      category: data.category || "Local",
      existingImage: data.existingImage || "",
      existingImagePublicId: data.existingImagePublicId || "",
      soloPaxPrice: data.soloPaxPrice ?? "",
      multiplePaxPrice: data.multiplePaxPrice ?? ""
    });

    if (data.inclusions) setInclusions(data.inclusions);
    if (data.itinerary) setItinerary(data.itinerary);

    // ✅ Restore destination/tourType UI state
    if (data.isOtherDestination !== undefined) setIsOtherDestination(data.isOtherDestination);
    if (data.isOtherTourType !== undefined) setIsOtherTourType(data.isOtherTourType);
    if (data.otherTourTypeValue !== undefined) setOtherTourTypeValue(data.otherTourTypeValue);

    if (data.image && data.imageMeta) {
      try {
        const restoredFile = await base64ToFile(data.image, data.imageMeta.name, data.imageMeta.type);
        setImageFile(restoredFile);
        setImagePreview(URL.createObjectURL(restoredFile));
      } catch (err) {
        console.error("Failed to restore image:", err);
      }
    }
  };

  const {
    clearDraft,
    hasDraft,
    restoreDraft,
    discardDraft,
    draftInfo
  } = useAutoDraft({
    module: `edit-package-${packageId}`,
    formData: draftPayload,
    setFormData: restoreDraftData,
    imagePreview: imagePreview,
    autoRestore: false
  });

  const [showRestoreModal, setShowRestoreModal] = useState(false);

  useEffect(() => {
    if (hasDraft && !loading) {
      setShowRestoreModal(true);
    }
  }, [hasDraft, loading]);

  const handleRestoreDraft = () => {
    restoreDraft();
    setShowRestoreModal(false);
  };

  const handleDiscardDraft = async () => {
    await discardDraft();
    setShowRestoreModal(false);
  };

  // =========================================================
  // AUTO-DRAFT LOGIC END
  // =========================================================

  useEffect(() => {
    if (!packageId) {
      console.error("No package ID provided");
      navigate("/view-packages");
      return;
    }

    const fetchPackageData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/admin/${packageId}`, { headers: getAdminHeaders() });
        const result = await response.json();

        if (result.status === "ok") {
          const pkg = result.data;

          let sellerPriceValue = 0;
          let markupValue = 0;

          if (pkg.sellerPrice !== undefined && pkg.sellerPrice !== null) {
            sellerPriceValue = pkg.sellerPrice;
            markupValue = pkg.markup !== undefined && pkg.markup !== null ? pkg.markup : 0;
          } else if (pkg.price !== undefined && pkg.price !== null) {
            sellerPriceValue = pkg.price;
            markupValue = 0;
          }

          const currentInclusions = pkg.inclusions && pkg.inclusions.length > 0 ? pkg.inclusions : [""];
          const currentItinerary = pkg.itinerary && pkg.itinerary.length > 0 ? pkg.itinerary : [{ day: 1, title: "", activities: [""] }];

          // ✅ Detect if the loaded destination is in the predefined list
          const loadedDestination = pkg.destination || "";
          const loadedCategory = pkg.category || "Local";
          const destList = (loadedCategory === 'International' || loadedCategory === 'International Tour')
            ? INTERNATIONAL_DESTINATIONS
            : LOCAL_DESTINATIONS;
          const isKnownDest = destList.some(d => d.value === loadedDestination);
          setIsOtherDestination(!!loadedDestination && !isKnownDest);

          // ✅ Detect if the loaded tourType is in the predefined tag list
          const loadedTourType = pkg.tourType || "Solo";
          const isKnownTourType = PREDEFINED_TOUR_TYPES.includes(loadedTourType);
          if (!isKnownTourType && loadedTourType) {
            setIsOtherTourType(true);
            setOtherTourTypeValue(loadedTourType);
          }

          setOriginalData({
            title: pkg.title || "",
            destination: loadedDestination,
            tourType: loadedTourType,
            pax: pkg.pax || "",
            minPax: pkg.minPax || "",
            sellerPrice: sellerPriceValue,
            markup: markupValue,
            markupType: pkg.markupType || "flat",
            duration: pkg.duration || "",
            category: loadedCategory,
            inclusions: currentInclusions,
            itinerary: currentItinerary,
            soloPaxPrice: pkg.soloPaxPrice ?? "",
            multiplePaxPrice: pkg.multiplePaxPrice ?? ""
          });

          setFormData({
            title: pkg.title || "",
            destination: loadedDestination,
            tourType: loadedTourType,
            pax: pkg.pax || "",
            minPax: pkg.minPax || "",
            sellerPrice: sellerPriceValue,
            markup: markupValue,
            markupType: pkg.markupType || "flat",
            duration: pkg.duration || "",
            category: loadedCategory,
            existingImage: pkg.image || "",
            existingImagePublicId: pkg.imagePublicId || "",
            soloPaxPrice: pkg.soloPaxPrice ?? "",
            multiplePaxPrice: pkg.multiplePaxPrice ?? ""
          });

          setInclusions(currentInclusions);
          setItinerary(currentItinerary);

          if (pkg.image) {
            const imgUrl = pkg.image.startsWith('http') ? pkg.image : `/uploads/${pkg.image}`;
            setImagePreview(imgUrl);
          }
        } else {
          console.error("Error in response:", result.error);
          toast.error("Failed to load package data: " + result.error, "Load Error");
          navigate("/view-packages");
        }
      } catch (err) {
        console.error("Error fetching package:", err);
        toast.error("Failed to load package data. Please try again.", "Connection Error");
        navigate("/view-packages");
      } finally {
        setLoading(false);
      }
    };

    fetchPackageData();
  }, [packageId, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Dynamic Price Calculation
  const calculatedPrice = useMemo(() => {
    const price = parseFloat(formData.sellerPrice) || 0;
    const markupVal = parseFloat(formData.markup) || 0;

    if (formData.markupType === 'percentage') {
      return price + (price * (markupVal / 100));
    }
    return price + markupVal;
  }, [formData.sellerPrice, formData.markup, formData.markupType]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select a valid image file.", "Invalid File");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB.", "File Too Large");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // ✅ Destination handlers
  const handleDestinationChange = (e) => {
    const value = e.target.value;
    if (value === 'OTHER') {
      setIsOtherDestination(true);
      setFormData(prev => ({ ...prev, destination: '' }));
    } else {
      setIsOtherDestination(false);
      setFormData(prev => ({ ...prev, destination: value }));
    }
  };

  const handleCategoryChange = (e) => {
    // Reset destination when category changes to avoid list mismatch
    setFormData(prev => ({ ...prev, category: e.target.value, destination: '' }));
    setIsOtherDestination(false);
  };

  // ✅ Tour type tag handlers
  const handleTourTypeTag = (tag) => {
    setIsOtherTourType(false);
    setOtherTourTypeValue('');
    setFormData(prev => ({ ...prev, tourType: tag }));
  };

  const handleOtherTourTypeClick = () => {
    setIsOtherTourType(true);
    setFormData(prev => ({ ...prev, tourType: '' }));
  };

  const handleOtherTourTypeInput = (e) => {
    const value = e.target.value;
    setOtherTourTypeValue(value);
    setFormData(prev => ({ ...prev, tourType: value }));
  };

  const handleInclusionChange = (index, value) => {
    const newInclusions = [...inclusions];
    newInclusions[index] = value;
    setInclusions(newInclusions);
  };

  const handleInclusionPaste = (index, e) => {
    const pastedText = e.clipboardData.getData("text");
    const lines = pastedText.split(/\r?\n/).filter((line) => line.trim());

    if (lines.length > 1) {
      e.preventDefault();
      const cleanedLines = lines.map((line) => {
        return line.replace(/^[✓✔️☑️•\-\s]+/, "").trim();
      });

      const newInclusions = [...inclusions];
      newInclusions[index] = cleanedLines[0];

      let currentIndex = index;
      cleanedLines.slice(1).forEach((line) => {
        newInclusions.splice(++currentIndex, 0, line);
      });

      setInclusions(newInclusions);
    }
  };

  const addInclusion = () => {
    setInclusions([...inclusions, ""]);
  };

  const removeInclusion = (index) => {
    if (inclusions.length > 1) {
      setInclusions(inclusions.filter((_, i) => i !== index));
    }
  };

  const handleItineraryChange = (index, field, value) => {
    const newItinerary = [...itinerary];
    newItinerary[index][field] = value;
    setItinerary(newItinerary);
  };

  const handleActivityChange = (itineraryIndex, activityIndex, value) => {
    const newItinerary = [...itinerary];
    newItinerary[itineraryIndex].activities[activityIndex] = value;
    setItinerary(newItinerary);
  };

  const handleActivityPaste = (dayIndex, actIndex, e) => {
    const pastedText = e.clipboardData.getData("text");
    const lines = pastedText.split(/\r?\n/).filter((line) => line.trim());

    if (lines.length > 1) {
      e.preventDefault();
      const cleanedLines = lines.map((line) => {
        return line.replace(/^[✓✔️☑️•\-\s]+/, "").trim();
      });

      const updatedItinerary = [...itinerary];
      updatedItinerary[dayIndex].activities[actIndex] = cleanedLines[0];

      let currentActIndex = actIndex;
      cleanedLines.slice(1).forEach((line) => {
        updatedItinerary[dayIndex].activities.splice(++currentActIndex, 0, line);
      });

      setItinerary(updatedItinerary);
    }
  };

  const addActivity = (itineraryIndex) => {
    const newItinerary = [...itinerary];
    newItinerary[itineraryIndex].activities.push("");
    setItinerary(newItinerary);
  };

  const removeActivity = (itineraryIndex, activityIndex) => {
    const newItinerary = [...itinerary];
    if (newItinerary[itineraryIndex].activities.length > 1) {
      newItinerary[itineraryIndex].activities = newItinerary[
        itineraryIndex
      ].activities.filter((_, i) => i !== activityIndex);
      setItinerary(newItinerary);
    }
  };

  const addItineraryDay = () => {
    setItinerary([
      ...itinerary,
      { day: itinerary.length + 1, title: "", activities: [""] },
    ]);
  };

  const removeItineraryDay = (index) => {
    if (itinerary.length > 1) {
      const newItinerary = itinerary.filter((_, i) => i !== index);
      newItinerary.forEach((item, i) => {
        item.day = i + 1;
      });
      setItinerary(newItinerary);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.title ||
      !formData.destination ||
      !formData.sellerPrice ||
      !formData.duration
    ) {
      toast.warning("Please fill in all required fields.", "Missing Fields");
      return;
    }

    if (!formData.tourType || !formData.tourType.trim()) {
      toast.warning("Please select a tour type.", "Missing Tour Type");
      return;
    }

    // ✅ Legacy pax validations (only fire for backward-compat values)
    if (formData.tourType === 'private' && (!formData.pax || parseInt(formData.pax) < 1)) {
      toast.warning("Pax is required for private tours and must be at least 1.", "Invalid Pax");
      return;
    }

    if (formData.tourType === 'joiners' && (!formData.minPax || parseInt(formData.minPax) < 1)) {
      toast.warning("Minimum pax is required for joiner tours and must be at least 1.", "Invalid Pax");
      return;
    }

    setSubmitting(true);

    const { userEmail, adminId } = getAdminData();

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("destination", formData.destination);

      formDataToSend.append("tourType", formData.tourType);
      if (formData.tourType === 'private') {
        formDataToSend.append("pax", formData.pax);
      } else if (formData.tourType === 'joiners') {
        formDataToSend.append("minPax", formData.minPax);
      }

      formDataToSend.append("sellerPrice", formData.sellerPrice);
      formDataToSend.append("markup", formData.markup || 0);
      formDataToSend.append("markupType", formData.markupType);

      formDataToSend.append("soloPaxPrice", formData.soloPaxPrice ?? "");
      formDataToSend.append("multiplePaxPrice", formData.multiplePaxPrice ?? "");

      formDataToSend.append("duration", formData.duration);
      formDataToSend.append("category", formData.category);
      formDataToSend.append("existingImage", formData.existingImage);
      if (formData.existingImagePublicId) {
        formDataToSend.append("existingImagePublicId", formData.existingImagePublicId);
      }

      const filteredInclusions = inclusions.filter((inc) => inc.trim() !== "");
      formDataToSend.append("inclusions", JSON.stringify(filteredInclusions));

      const filteredItinerary = itinerary
        .map((day) => ({
          day: day.day,
          title: day.title,
          activities: day.activities.filter((act) => act.trim() !== ""),
        }))
        .filter((day) => day.title.trim() !== "");
      formDataToSend.append("itinerary", JSON.stringify(filteredItinerary));

      if (imageFile) {
        formDataToSend.append("image", imageFile);
      }

      formDataToSend.append("userEmail", userEmail);
      formDataToSend.append("adminId", adminId);

      let changes = [];

      const trackChange = (label, oldVal, newVal) => {
        const cleanOld = String(oldVal || "").trim();
        const cleanNew = String(newVal || "").trim();
        if (cleanOld !== cleanNew) {
          changes.push(`${label} changed from "${cleanOld}" to "${cleanNew}"`);
        }
      };

      if (originalData) {
        trackChange("Title", originalData.title, formData.title);
        trackChange("Destination", originalData.destination, formData.destination);
        trackChange("Tour Type", originalData.tourType, formData.tourType);

        if (formData.tourType === 'private') {
          trackChange("Pax", originalData.pax, formData.pax);
        } else if (formData.tourType === 'joiners') {
          trackChange("Minimum Pax", originalData.minPax, formData.minPax);
        }

        trackChange("Seller Price", originalData.sellerPrice, formData.sellerPrice);
        trackChange("Markup", originalData.markup, formData.markup);
        trackChange("Markup Type", originalData.markupType, formData.markupType);
        trackChange("Solo Pax Price", originalData.soloPaxPrice, formData.soloPaxPrice);
        trackChange("Multiple Pax Price", originalData.multiplePaxPrice, formData.multiplePaxPrice);
        trackChange("Duration", originalData.duration, formData.duration);
        trackChange("Category", originalData.category, formData.category);

        if (JSON.stringify(originalData.inclusions) !== JSON.stringify(filteredInclusions)) {
          changes.push("Package inclusions were updated.");
        }

        if (JSON.stringify(originalData.itinerary) !== JSON.stringify(filteredItinerary)) {
          changes.push("Package itinerary was updated.");
        }

        if (imageFile) {
          changes.push("Package image was replaced.");
        }
      }

      if (changes.length > 0) {
        formDataToSend.append('changes', JSON.stringify(changes));
      }

      const response = await fetch(`${API_BASE_URL}/edit/${packageId}`, {
        method: "PUT",
        body: formDataToSend,
      });

      const result = await response.json();

      if (result.status === "ok") {
        toast.success("Package updated successfully.", "Success");
        await clearDraft();
        navigate("/view-packages");
      } else {
        toast.error("Failed to update package: " + (result.error || "Unknown error"), "Update Failed");
      }
    } catch (err) {
      console.error("Error updating package:", err);
      toast.error("Error updating package. Please try again.", "Server Error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="epa-page">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          toggleSidebar={toggleSidebar}
        />
        <main
          className={`epa-main ${
            isSidebarCollapsed ? "epa-main--collapsed" : ""
          }`}
        >
          <div className="epa-loading">
            <div className="epa-spinner"></div>
            <p>Loading package data...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="epa-page">

      <RestoreDraftModal
        isOpen={showRestoreModal}
        onRestore={handleRestoreDraft}
        onDiscard={handleDiscardDraft}
        draftInfo={draftInfo}
      />

      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
      <main
        className={`epa-main ${isSidebarCollapsed ? "epa-main--collapsed" : ""}`}
      >
        <div className="epa-container">
          <div className="epa-header">
            <div className="epa-header-content">
              <button
                className="epa-back-btn"
                onClick={() => navigate("/view-packages")}
              >
                <ArrowLeft size={20} />
                Back to Packages
              </button>
              <h1 className="epa-title">Edit Package</h1>
              <p className="epa-subtitle">
                Update package information and details
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="epa-form">

            {/* Image Upload */}
            <div className="epa-section">
              <h2 className="epa-section-title">Package Image</h2>
              <div className="epa-upload-area">
                <input
                  type="file"
                  id="image-upload"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="epa-file-input"
                />
                <label htmlFor="image-upload" className="epa-upload-label">
                  {imagePreview ? (
                    <div className="epa-image-preview">
                      <img src={imagePreview} alt="Preview" />
                      <div className="epa-image-overlay">
                        <Upload size={24} />
                        <span>Click to change image</span>
                      </div>
                    </div>
                  ) : (
                    <div className="epa-upload-placeholder">
                      <Upload size={48} />
                      <span>Click to upload image</span>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Basic Information */}
            <div className="epa-section">
              <h2 className="epa-section-title">Basic Information</h2>
              <div className="epa-form-grid">

                <div className="epa-form-group">
                  <label className="epa-label">Package Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="epa-input"
                    placeholder="Enter package title"
                    required
                  />
                </div>

                {/* ✅ Duration — dropdown (matches AddPackage) */}
                <div className="epa-form-group">
                  <label className="epa-label">Duration *</label>
                  <select
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    className="epa-input"
                    required
                  >
                    <option value="">Select Duration</option>
                    <option value="2D1N">2D1N</option>
                    <option value="3D2N">3D2N</option>
                    <option value="4D3N">4D3N</option>
                    <option value="5D4N">5D4N</option>
                  </select>
                </div>

                {/* ✅ Category — updated labels to match AddPackage */}
                <div className="epa-form-group">
                  <label className="epa-label">Tour Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleCategoryChange}
                    className="epa-input"
                    required
                  >
                    <option value="Local">Local Tour</option>
                    <option value="International">International Tour</option>
                  </select>
                </div>

                {/* ✅ Destination — dropdown with predefined list + "Other" */}
                <div className="epa-form-group epa-form-group--full">
                  <label className="epa-label">Destination *</label>
                  <select
                    value={isOtherDestination ? 'OTHER' : formData.destination}
                    onChange={handleDestinationChange}
                    className="epa-input"
                    required={!isOtherDestination}
                  >
                    <option value="">Select Destination</option>
                    {destinationList.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                    <option value="OTHER">Other</option>
                  </select>

                  {isOtherDestination && (
                    <input
                      type="text"
                      placeholder={isInternational ? 'Enter destination (e.g. Zurich, Switzerland)' : 'Enter destination (e.g. Zambales)'}
                      value={formData.destination}
                      onChange={(e) => setFormData(prev => ({ ...prev, destination: e.target.value }))}
                      className="epa-input"
                      style={{ marginTop: '10px' }}
                      required
                    />
                  )}
                </div>

                {/* ✅ Tour Type — tag-based pill buttons (matches AddPackage / BasicInfo) */}
                <div className="epa-form-group epa-form-group--full">
                  <label className="epa-label">Tour Type *</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                    {PREDEFINED_TOUR_TYPES.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleTourTypeTag(tag)}
                        style={{
                          padding: '7px 14px',
                          borderRadius: '20px',
                          border: `1.5px solid ${!isOtherTourType && formData.tourType === tag ? '#001F3F' : '#cbd5e1'}`,
                          background: !isOtherTourType && formData.tourType === tag ? '#001F3F' : '#f8fafc',
                          color: !isOtherTourType && formData.tourType === tag ? '#ffffff' : '#475569',
                          fontWeight: !isOtherTourType && formData.tourType === tag ? '600' : '500',
                          fontSize: '13px',
                          cursor: 'pointer',
                          transition: 'all 0.18s ease',
                          whiteSpace: 'nowrap',
                          fontFamily: 'inherit',
                          boxShadow: !isOtherTourType && formData.tourType === tag ? '0 2px 8px rgba(0,31,63,0.25)' : 'none',
                        }}
                      >
                        {tag}
                      </button>
                    ))}
                    {/* ✅ Other — custom tour type */}
                    <button
                      type="button"
                      onClick={handleOtherTourTypeClick}
                      style={{
                        padding: '7px 14px',
                        borderRadius: '20px',
                        border: `1.5px ${isOtherTourType ? 'solid' : 'dashed'} ${isOtherTourType ? '#0ea5e9' : '#cbd5e1'}`,
                        background: isOtherTourType ? '#0ea5e9' : '#f8fafc',
                        color: isOtherTourType ? '#ffffff' : '#64748b',
                        fontWeight: '500',
                        fontSize: '13px',
                        cursor: 'pointer',
                        transition: 'all 0.18s ease',
                        fontFamily: 'inherit',
                      }}
                    >
                      + Other
                    </button>
                  </div>

                  {/* ✅ Custom tour type text input */}
                  {isOtherTourType && (
                    <input
                      type="text"
                      placeholder="Enter custom tour type (e.g. With Island Hopping)"
                      value={otherTourTypeValue}
                      onChange={handleOtherTourTypeInput}
                      className="epa-input"
                      style={{ marginTop: '10px' }}
                      required
                    />
                  )}

                  {formData.tourType && (
                    <span style={{ display: 'block', marginTop: '6px', fontSize: '12px', color: '#64748b' }}>
                      Selected: <strong>{formData.tourType}</strong>
                    </span>
                  )}
                </div>

              </div>
            </div>

            {/* Pricing */}
            <div className="epa-section">
              <h2 className="epa-section-title">Pricing</h2>
              <div className="epa-form-grid">

                <div className="epa-form-group">
                  <label className="epa-label">Seller Price (PHP) *</label>
                  <input
                    type="number"
                    name="sellerPrice"
                    value={formData.sellerPrice}
                    onChange={handleInputChange}
                    className="epa-input"
                    placeholder="0.00"
                    step="0.01"
                    required
                  />
                </div>

                {/* Markup Type Dropdown */}
                <div className="epa-form-group">
                  <label className="epa-label">Markup Type</label>
                  <select
                    name="markupType"
                    value={formData.markupType}
                    onChange={handleInputChange}
                    className="epa-input"
                  >
                    <option value="flat">Flat Amount (PHP)</option>
                    <option value="percentage">Percentage (%)</option>
                  </select>
                </div>

                <div className="epa-form-group">
                  <label className="epa-label">
                    Markup {formData.markupType === 'percentage' ? '(%)' : '(PHP)'}
                  </label>
                  <input
                    type="number"
                    name="markup"
                    value={formData.markup}
                    onChange={handleInputChange}
                    className="epa-input"
                    placeholder={formData.markupType === 'percentage' ? "e.g., 10" : "0.00"}
                    step="0.01"
                  />
                </div>

                <div className="epa-form-group">
                  <label className="epa-label">Final Price (PHP)</label>
                  <input
                    type="text"
                    value={`${calculatedPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    className="epa-input epa-input--readonly"
                    readOnly
                  />
                </div>
              </div>
            </div>

            {/* Pax Pricing */}
            <div className="epa-section">
              <h2 className="epa-section-title">Pax Pricing</h2>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px', marginTop: '-12px' }}>
                Set the selling price per booking type
              </p>
              <div className="epa-form-grid">
                <div className="epa-form-group">
                  <label className="epa-label">Solo Pax Price (PHP)</label>
                  <input
                    type="number"
                    name="soloPaxPrice"
                    value={formData.soloPaxPrice}
                    onChange={handleInputChange}
                    className="epa-input"
                    placeholder="Price for 1 person"
                    step="0.01"
                    min="0"
                  />
                </div>
                <div className="epa-form-group">
                  <label className="epa-label">Multiple Pax Price (PHP)</label>
                  <input
                    type="number"
                    name="multiplePaxPrice"
                    value={formData.multiplePaxPrice}
                    onChange={handleInputChange}
                    className="epa-input"
                    placeholder="Price for group booking"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Inclusions */}
            <div className="epa-section">
              <div className="epa-section-header">
                <h2 className="epa-section-title">Package Inclusions</h2>
                <button
                  type="button"
                  className="epa-add-btn"
                  onClick={addInclusion}
                >
                  <Plus size={16} /> Add Inclusion
                </button>
              </div>
              <div className="epa-list-items">
                {inclusions.map((inclusion, index) => (
                  <div key={index} className="epa-list-item">
                    <input
                      type="text"
                      value={inclusion}
                      onChange={(e) =>
                        handleInclusionChange(index, e.target.value)
                      }
                      onPaste={(e) => handleInclusionPaste(index, e)}
                      className="epa-input"
                      placeholder="Enter inclusion"
                    />
                    {inclusions.length > 1 && (
                      <button
                        type="button"
                        className="epa-remove-btn"
                        onClick={() => removeInclusion(index)}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Itinerary */}
            <div className="epa-section">
              <div className="epa-section-header">
                <h2 className="epa-section-title">Itinerary</h2>
                <button
                  type="button"
                  className="epa-add-btn"
                  onClick={addItineraryDay}
                >
                  <Plus size={16} /> Add Day
                </button>
              </div>
              <div className="epa-itinerary-list">
                {itinerary.map((day, dayIndex) => (
                  <div key={dayIndex} className="epa-itinerary-day">
                    <div className="epa-itinerary-day-header">
                      <h3 className="epa-day-title">Day {day.day}</h3>
                      {itinerary.length > 1 && (
                        <button
                          type="button"
                          className="epa-remove-day-btn"
                          onClick={() => removeItineraryDay(dayIndex)}
                        >
                          <Trash2 size={16} /> Remove Day
                        </button>
                      )}
                    </div>
                    <div className="epa-form-group">
                      <label className="epa-label">Day Title</label>
                      <input
                        type="text"
                        value={day.title}
                        onChange={(e) =>
                          handleItineraryChange(
                            dayIndex,
                            "title",
                            e.target.value
                          )
                        }
                        className="epa-input"
                        placeholder="Enter day title"
                      />
                    </div>
                    <div className="epa-activities">
                      <div className="epa-activities-header">
                        <label className="epa-label">Activities</label>
                        <button
                          type="button"
                          className="epa-add-activity-btn"
                          onClick={() => addActivity(dayIndex)}
                        >
                          <Plus size={14} /> Add Activity
                        </button>
                      </div>
                      {day.activities.map((activity, actIndex) => (
                        <div key={actIndex} className="epa-list-item">
                          <input
                            type="text"
                            value={activity}
                            onChange={(e) =>
                              handleActivityChange(
                                dayIndex,
                                actIndex,
                                e.target.value
                              )
                            }
                            onPaste={(e) => handleActivityPaste(dayIndex, actIndex, e)}
                            className="epa-input"
                            placeholder="Enter activity"
                          />
                          {day.activities.length > 1 && (
                            <button
                              type="button"
                              className="epa-remove-btn"
                              onClick={() => removeActivity(dayIndex, actIndex)}
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="epa-form-actions">
              <button
                type="button"
                className="epa-btn epa-btn--cancel"
                onClick={async () => {
                  await clearDraft();
                  navigate("/view-packages");
                }}
                disabled={submitting}
              >
                CANCEL
              </button>
              <button
                type="submit"
                className="epa-btn epa-btn--submit"
                disabled={submitting}
              >
                {submitting ? (
                  'UPDATING...'
                ) : (
                  <>
                    <Save size={18} /> UPDATE PACKAGE
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default EditPackage;