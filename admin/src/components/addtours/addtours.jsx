import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../sidebar/sidebar";
import "./addtours.css";
import { useToast } from "../toast/ToastManager"; 

// Import the renamed sub-components
import TourBasicInfo from "./TourBasicInfo";
import TourImageUpload from "./TourImageUpload";
import TourPricing from "./TourPricing";
import TourInclusions from "./TourInclusions";
import TourPreview from "./TourPreview";

// ✅ Imports for Draft Functionality
import useAutoDraft from '../../hooks/useAutoDraft';
import RestoreDraftModal from '../../components/RestoreDraftModal/RestoreDraftModal';

const AddTour = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  // Toast hook
  const toast = useToast();
  const navigate = useNavigate();

  // --- STATE MANAGEMENT ---
  const [tourTitle, setTourTitle] = useState("");
  const [tourDest, setTourDest] = useState("");
  const [tourSupplier, setTourSupplier] = useState("");
  const [tourMarkup, setTourMarkup] = useState("");
  const [tourMarkupType, setTourMarkupType] = useState("peso");
  const [tourPrice, setTourPrice] = useState("");
  const [tourDuration, setTourDuration] = useState("");
  const [tourCat, setTourCat] = useState("Local"); // Default value
  const [tourFile, setTourFile] = useState(null);
  const [tourPreviewUrl, setTourPreviewUrl] = useState(null);
  const [tourIncs, setTourIncs] = useState([""]);
  const [isTourPasteActive, setIsTourPasteActive] = useState(false);

  const tourPasteRef = useRef(null);

  // =========================================================
  // ✅ AUTO-DRAFT LOGIC START (FIXED)
  // =========================================================

  // 1. Helper: File <-> Base64 Converters
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

  // 2. Draft Payload State
  const [draftPayload, setDraftPayload] = useState(null);

  // 3. Listen to state changes and update Draft Payload
  useEffect(() => {
    const updateDraft = async () => {
      // 🛑 FIX: Check if form is completely empty/default before saving
      // This prevents the modal from appearing if the user cleared the form
      const isFormEmpty = 
        !tourTitle && 
        !tourDest && 
        !tourSupplier && 
        !tourMarkup && 
        !tourPrice && 
        !tourDuration && 
        tourCat === "Local" && // Check against default value
        (tourIncs.length === 1 && tourIncs[0] === "") && // Check empty inclusions
        !tourFile;

      if (isFormEmpty) {
        setDraftPayload(null); // Don't save anything if empty
        return;
      }

      let imageBase64 = null;
      let imageMeta = null;

      // Handle Image Conversion
      if (tourFile) {
        try {
          // Limit draft image size (~3MB limit safety)
          if (tourFile.size < 3 * 1024 * 1024) { 
            imageBase64 = await fileToBase64(tourFile);
            imageMeta = { name: tourFile.name, type: tourFile.type };
          }
        } catch (err) {
          console.warn("Image too large for draft, saving text only.");
        }
      }

      setDraftPayload({
        title: tourTitle,
        destination: tourDest,
        supplierRate: tourSupplier,
        markup: tourMarkup,
        markupType: tourMarkupType,
        price: tourPrice,
        duration: tourDuration,
        category: tourCat,
        inclusions: tourIncs,
        image: imageBase64,
        imageMeta: imageMeta
      });
    };

    const timeoutId = setTimeout(() => {
      updateDraft();
    }, 500); // Debounce

    return () => clearTimeout(timeoutId);
  }, [tourTitle, tourDest, tourSupplier, tourMarkup, tourMarkupType, tourPrice, tourDuration, tourCat, tourIncs, tourFile]);

  // 4. Restore Function
  const restoreDraftData = async (data) => {
    if (!data) return;

    setTourTitle(data.title || "");
    setTourDest(data.destination || "");
    setTourSupplier(data.supplierRate || "");
    setTourMarkup(data.markup || "");
    setTourMarkupType(data.markupType || "peso");
    setTourPrice(data.price || "");
    setTourDuration(data.duration || "");
    setTourCat(data.category || "Local");
    setTourIncs(data.inclusions || [""]);

    if (data.image && data.imageMeta) {
      try {
        const restoredFile = await base64ToFile(data.image, data.imageMeta.name, data.imageMeta.type);
        setTourFile(restoredFile);
        setTourPreviewUrl(URL.createObjectURL(restoredFile));
      } catch (err) {
        console.error("Failed to restore image:", err);
      }
    }
  };

  // 5. Initialize Hook
  const { 
    clearDraft, 
    hasDraft, 
    restoreDraft, 
    discardDraft, 
    draftInfo 
  } = useAutoDraft({
    module: 'add-tour',
    formData: draftPayload,
    setFormData: restoreDraftData,
    imagePreview: tourPreviewUrl, 
    autoRestore: false
  });

  // 6. Modal State
  const [showRestoreModal, setShowRestoreModal] = useState(false);

  useEffect(() => {
    if (hasDraft) {
      setShowRestoreModal(true);
    }
  }, [hasDraft]);

  const handleRestoreDraft = () => {
    restoreDraft();
    setShowRestoreModal(false);
    toast.success("Draft restored successfully", "Welcome Back");
  };

  const handleDiscardDraft = async () => {
    await discardDraft(); // Ensure storage is cleared
    setShowRestoreModal(false);
    // Note: State is already empty/default here, so the useEffect loop won't trigger a new save
  };

  // =========================================================
  // ✅ AUTO-DRAFT LOGIC END
  // =========================================================

  const calculateTourTotal = useCallback((supp, mark, type) => {
    const sVal = parseFloat(supp) || 0;
    const mVal = parseFloat(mark) || 0;
    if (sVal > 0) {
      let total =
        type === "percentage" ? sVal + sVal * (mVal / 100) : sVal + mVal;
      setTourPrice(total.toFixed(2));
    } else {
      setTourPrice("");
    }
  }, []);

  const handleTourSuppChange = (val) => {
    setTourSupplier(val);
    calculateTourTotal(val, tourMarkup, tourMarkupType);
  };

  const handleTourMarkChange = (val) => {
    setTourMarkup(val);
    calculateTourTotal(tourSupplier, val, tourMarkupType);
  };

  const toggleTourMarkType = () => {
    const nextType = tourMarkupType === "percentage" ? "peso" : "percentage";
    setTourMarkupType(nextType);
    setTourMarkup("");
    setTourPrice(tourSupplier ? parseFloat(tourSupplier).toFixed(2) : "");
  };

  const handleTourFile = (e) => {
    const sel = e.target.files[0];
    if (sel) {
      setTourFile(sel);
      setTourPreviewUrl(URL.createObjectURL(sel));
      setIsTourPasteActive(false);
    }
  };

  useEffect(() => {
    const handleGlobalTourPaste = (e) => {
      if (isTourPasteActive) {
        const items = e.clipboardData?.items;
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf("image") !== -1) {
            const blob = items[i].getAsFile();
            setTourFile(blob);
            setTourPreviewUrl(URL.createObjectURL(blob));
            setIsTourPasteActive(false);
            break;
          }
        }
      }
    };
    document.addEventListener("paste", handleGlobalTourPaste);
    return () => document.removeEventListener("paste", handleGlobalTourPaste);
  }, [isTourPasteActive]);

  const handleTourInclusionPaste = (index, e) => {
    const pastedText = e.clipboardData.getData('text');
    const lines = pastedText.split(/\r?\n/).filter(line => line.trim());
    
    if (lines.length > 1) {
      e.preventDefault();
      const cleanedLines = lines.map(line => {
        return line.replace(/^[✓✔️☑️•\s]+/, '').trim();
      });
      
      const newTourIncs = [...tourIncs];
      newTourIncs[index] = cleanedLines[0];
      
      cleanedLines.slice(1).forEach(line => {
        newTourIncs.splice(index + 1, 0, line);
        index++;
      });
      
      setTourIncs(newTourIncs);
    }
  };

  const handleCancel = async () => {
    if (window.confirm("Are you sure you want to cancel? All unsaved changes will be lost.")) {
        await clearDraft(); // Clears storage properly
        navigate(-1);
    }
  };

  const handleSubmitTour = async (e) => {
    e.preventDefault();
    
    if (!tourFile) {
      toast.error("Please upload an image for the tour.", "Missing Image");
      return;
    }

    if (!tourTitle.trim() || !tourDest.trim() || !tourDuration.trim()) {
      toast.error("Please fill in all required fields.", "Incomplete Form");
      return;
    }

    if (!tourSupplier || !tourMarkup) {
      toast.error("Please enter supplier rate and markup.", "Missing Pricing");
      return;
    }

    const finalIncs = tourIncs.filter((item) => item.trim());
    
    const supplierRateNum = parseFloat(tourSupplier) || 0;
    const markupValueNum = parseFloat(tourMarkup) || 0;
    
    let markupInPeso = 0;
    if (tourMarkupType === "percentage") {
      markupInPeso = (supplierRateNum * markupValueNum) / 100;
    } else {
      markupInPeso = markupValueNum;
    }
    
    markupInPeso = Math.round(markupInPeso * 100) / 100;

    const formData = new FormData();
    formData.append("title", tourTitle.trim());
    formData.append("destination", tourDest.trim());
    formData.append("sellerPrice", supplierRateNum.toString());
    formData.append("markup", markupInPeso.toString());
    formData.append("duration", tourDuration.trim());
    formData.append("category", tourCat);
    formData.append("inclusions", JSON.stringify(finalIncs));
    formData.append("image", tourFile);

    const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
    const activeUser = adminData.email || adminData.username || adminData.user || 'Unknown User';
    const activeId = adminData.id || adminData._id || "";

    formData.append("userEmail", activeUser);
    formData.append("adminId", activeId);

    toast.info("Uploading tour package...", "Please Wait", 2000);

    try {
      const res = await fetch("https://wanderwaveph-backend.onrender.com/api/tours/add", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      
      if (res.ok && data.status === 'ok') {
        toast.success(
          `${tourTitle} has been added to ${tourCat} tours!`,
          "Tour Published Successfully",
          6000
        );

        await clearDraft(); // Clears storage

        setTourTitle("");
        setTourDest("");
        setTourSupplier("");
        setTourMarkup("");
        setTourPrice("");
        setTourDuration("");
        setTourCat("Local");
        setTourFile(null);
        setTourPreviewUrl(null);
        setTourIncs([""]);
        setTourMarkupType("peso");

      } else {
        console.error("Server error:", data);
        toast.error(
          data.error || "Failed to add tour. Please try again.",
          "Upload Failed",
          6000
        );
      }
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error(
        "Unable to connect to server. Please check your connection.",
        "Connection Error",
        6000
      );
    }
  };

  return (
    <div className="atour-page">
      
      <RestoreDraftModal
        isOpen={showRestoreModal}
        onRestore={handleRestoreDraft}
        onDiscard={handleDiscardDraft}
        draftInfo={draftInfo}
      />

      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
      <main
        className={`atour-main ${isSidebarCollapsed ? "atour-collapsed" : ""}`}
      >
        <div className="atour-container">
          <header className="atour-header">
            <div className="atour-header-content">
              <h1 className="atour-title">NEW TOUR</h1>
              <p className="atour-subtitle">
                Add a new travel offer to your catalog
              </p>
            </div>
          </header>
          <form onSubmit={handleSubmitTour}>
            <div className="atour-grid">
              <div className="atour-left">
                <TourImageUpload
                  previewUrl={tourPreviewUrl}
                  handleFileChange={handleTourFile}
                  clearImage={() => {
                    setTourFile(null);
                    setTourPreviewUrl(null);
                  }}
                  isPasteActive={isTourPasteActive}
                  activatePasteArea={() => setIsTourPasteActive(true)}
                />
                <TourBasicInfo
                  title={tourTitle}
                  setTitle={setTourTitle}
                  destination={tourDest}
                  setDestination={setTourDest}
                  duration={tourDuration}
                  setDuration={setTourDuration}
                  category={tourCat}
                  setCategory={setTourCat}
                />
                <TourPricing
                  supp={tourSupplier}
                  onSupp={handleTourSuppChange}
                  mark={tourMarkup}
                  onMark={handleTourMarkChange}
                  type={tourMarkupType}
                  onToggle={toggleTourMarkType}
                  price={tourPrice}
                />
                <TourInclusions
                  incs={tourIncs}
                  onChange={(i, v) =>
                    setTourIncs(
                      tourIncs.map((item, idx) => (idx === i ? v : item))
                    )
                  }
                  onAdd={() => setTourIncs([...tourIncs, ""])}
                  onRem={(i) =>
                    setTourIncs(tourIncs.filter((_, idx) => idx !== i))
                  }
                  onPaste={handleTourInclusionPaste}
                />
              </div>
              <aside className="atour-right">
                <TourPreview
                  url={tourPreviewUrl}
                  cat={tourCat}
                  title={tourTitle}
                  dest={tourDest}
                  price={tourPrice}
                  dur={tourDuration}
                  incs={tourIncs}
                />
                <div className="atour-actions">
                  <button
                    type="button"
                    className="atour-btn atour-btn--cancel"
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="atour-btn atour-btn--submit">
                    Publish
                  </button>
                </div>
              </aside>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default AddTour;