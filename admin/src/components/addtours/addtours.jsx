import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../sidebar/sidebar";
import "./addtours.css";
import { useToast } from "../toast/ToastManager";
import { HelpCircle } from "lucide-react"; 
import CustomConfirmModal from "../../components/confirmationModal/CustomConfirmModal";

// Import the renamed sub-components
import TourBasicInfo from "./TourBasicInfo";
import TourImageUpload from "./TourImageUpload";
import TourPricing from "./TourPricing";
import TourInclusions from "./TourInclusions";
import TourPreview from "./TourPreview";

// ✅ Imports for Draft Functionality
import useAutoDraft from "../../hooks/useAutoDraft";
import RestoreDraftModal from "../../components/RestoreDraftModal/RestoreDraftModal";

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
  const [tourCat, setTourCat] = useState("Local");
  const [tourFile, setTourFile] = useState(null);
  const [tourPreviewUrl, setTourPreviewUrl] = useState(null);
  const [tourIncs, setTourIncs] = useState([""]);
  const [isTourPasteActive, setIsTourPasteActive] = useState(false);
  const [tourType, setTourType] = useState("private"); // "private" or "joiners"
  const [minPax, setMinPax] = useState(""); // Only for joiners

  // --- MODAL CONFIG STATE ---
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    type: "primary",
  });

  const tourPasteRef = useRef(null);

  // Helper for Modal
  const askConfirmation = (title, message, onConfirm, type = "primary") => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
      },
      type,
    });
  };

  // =========================================================
  // ✅ AUTO-DRAFT LOGIC START
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
      const isFormEmpty = 
        !tourTitle && 
        !tourDest && 
        !tourSupplier && 
        !tourMarkup && 
        !tourPrice && 
        !tourDuration && 
        tourCat === "Local" &&
        tourType === "private" &&
        !minPax &&
        (tourIncs.length === 1 && tourIncs[0] === "") && 
        !tourFile;

      if (isFormEmpty) {
        setDraftPayload(null);
        return;
      }

      let imageBase64 = null;
      let imageMeta = null;

      if (tourFile) {
        try {
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
        tourType: tourType,      
        minPax: minPax,     
        inclusions: tourIncs,
        image: imageBase64,
        imageMeta: imageMeta,
      });
    };

    const timeoutId = setTimeout(() => {
      updateDraft();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [tourTitle, tourDest, tourSupplier, tourMarkup, tourMarkupType, tourPrice, tourDuration, tourCat, tourIncs, tourFile, tourType, minPax]);

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
    setTourType(data.tourType || "private");
    setMinPax(data.minPax || "");
    setTourIncs(data.inclusions || [""]);

    if (data.image && data.imageMeta) {
      try {
        const restoredFile = await base64ToFile(
          data.image,
          data.imageMeta.name,
          data.imageMeta.type
        );
        setTourFile(restoredFile);
        setTourPreviewUrl(URL.createObjectURL(restoredFile));
      } catch (err) {
        console.error("Failed to restore image:", err);
      }
    }
  };

  const { clearDraft, hasDraft, restoreDraft, discardDraft, draftInfo } =
    useAutoDraft({
      module: "add-tour",
      formData: draftPayload,
      setFormData: restoreDraftData,
      imagePreview: tourPreviewUrl,
      autoRestore: false,
    });

  const [showRestoreModal, setShowRestoreModal] = useState(false);

  useEffect(() => {
    if (hasDraft) {
      setShowRestoreModal(true);
    }
  }, [hasDraft]);

  const handleRestoreDraft = () => {
    restoreDraft();
    setShowRestoreModal(false);
    toast.success("Your draft has been restored successfully!", "Welcome Back");
  };

  const handleDiscardDraft = async () => {
    await discardDraft();
    setShowRestoreModal(false);
    toast.info("Draft has been discarded.", "Discarded");
  };

  // =========================================================
  // ✅ PRICING LOGIC
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

  // =========================================================
  // ✅ IMAGE HANDLERS
  // =========================================================

  const handleTourFile = (e) => {
    const sel = e.target.files[0];
    if (sel) {
      setTourFile(sel);
      setTourPreviewUrl(URL.createObjectURL(sel));
      setIsTourPasteActive(false);
      toast.success(`Image "${sel.name}" uploaded successfully!`, "Image Ready");
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
            toast.success("Image pasted from clipboard!", "Success");
            break;
          }
        }
      }
    };
    document.addEventListener("paste", handleGlobalTourPaste);
    return () => document.removeEventListener("paste", handleGlobalTourPaste);
  }, [isTourPasteActive, toast]);

  // =========================================================
  // ✅ INCLUSIONS & ACTIONS
  // =========================================================

  const handleTourInclusionPaste = (index, e) => {
    const pastedText = e.clipboardData.getData("text");
    const lines = pastedText.split(/\r?\n/).filter((line) => line.trim());

    if (lines.length > 1) {
      e.preventDefault();
      const cleanedLines = lines.map((line) => {
        return line.replace(/^[✓✔️☑️•\s]+/, "").trim();
      });

      const newTourIncs = [...tourIncs];
      newTourIncs[index] = cleanedLines[0];

      cleanedLines.slice(1).forEach((line) => {
        newTourIncs.splice(index + 1, 0, line);
        index++;
      });

      setTourIncs(newTourIncs);
      toast.info(`${lines.length} inclusions pasted and formatted.`, "Inclusions Updated");
    }
  };

  const handleCancel = () => {
    askConfirmation(
      "Confirm Cancel",
      "Are you sure you want to leave? Your progress will be lost.",
      async () => {
        await clearDraft();
        navigate("/dashboard");
      },
      "danger"
    );
  };

  const handleSaveConfirmation = (e) => {
    e.preventDefault();

    if (!tourFile) {
      toast.warning("Please upload an image for the tour.", "Missing Image");
      return;
    }

    if (!tourTitle.trim() || !tourDest.trim() || !tourDuration.trim()) {
      toast.warning("Please fill in all required fields (Title, Destination, Duration).", "Incomplete Form");
      return;
    }

    if (!tourSupplier || !tourMarkup) {
      toast.warning("Please enter supplier rate and markup.", "Missing Pricing");
      return;
    }

    if (tourType === 'joiners' && (!minPax || parseInt(minPax) < 1)) {
      toast.error("Please enter minimum pax for joiner tours.", "Missing Min Pax");
      return;
    }

    askConfirmation(
      "Publish Tour",
      `Are you sure you want to publish "${tourTitle}" to the catalog?`,
      () => performSubmit()
    );
  };

  const performSubmit = async () => {
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
    formData.append("tourType", tourType); 

    if (tourType === 'joiners') {
      formData.append("minPax", parseInt(minPax));
    }

    const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
    const activeUser = adminData.email || adminData.username || adminData.user || 'Unknown User';
    const activeId = adminData.id || adminData._id || "";

    formData.append("userEmail", activeUser);
    formData.append("adminId", activeId);

    toast.info("Uploading tour package to server...", "Please Wait");

    try {
      const res = await fetch("https://wanderwaveph.onrender.com/api/tours/add", {
        method: "POST",
        body: formData,
      });
      
      const data = await res.json();
      
      if (res.ok && data.status === 'ok') {
        toast.success(`"${tourTitle}" has been added successfully!`, "Published");
        await clearDraft();

        setTourTitle("");
        setTourDest("");
        setTourSupplier("");
        setTourMarkup("");
        setTourPrice("");
        setTourDuration("");
        setTourCat("Local");
        setTourType("private");
        setMinPax("");
        setTourFile(null);
        setTourPreviewUrl(null);
        setTourIncs([""]);
        setTourMarkupType("peso");
      } else {
        const errorMessage = data.error || data.message || "Failed to add tour.";
        toast.error(errorMessage, "Upload Failed");
      }
    } catch (err) {
      toast.error(`Connection error: ${err.message}`, "Error");
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

      <CustomConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() =>
          setConfirmConfig((prev) => ({ ...prev, isOpen: false }))
        }
      />

      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
      <main className={`atour-main ${isSidebarCollapsed ? "atour-collapsed" : ""}`}>
        <div className="atour-container">
          <header className="atour-header">
            <div className="atour-header-content">
              <h1 className="atour-title">NEW TOUR</h1>
              <p className="atour-subtitle">Add a new travel offer to your catalog</p>
            </div>
          </header>
          <form onSubmit={handleSaveConfirmation}>
            <div className="atour-grid">
              <div className="atour-left">
                <TourImageUpload
                  previewUrl={tourPreviewUrl}
                  handleFileChange={handleTourFile}
                  clearImage={() => {
                    setTourFile(null);
                    setTourPreviewUrl(null);
                    toast.info("Image removed.", "Cleared");
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
                  tourType={tourType}         
                  setTourType={setTourType}    
                  minPax={minPax}             
                  setMinPax={setMinPax}       
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
                  tourType={tourType}
                  minPax={minPax}  
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