import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../sidebar/sidebar";
import "./addtours.css";
import { useToast } from "../toast/ToastManager"; // Import useToast hook

// Import the renamed sub-components
import TourBasicInfo from "./TourBasicInfo";
import TourImageUpload from "./TourImageUpload";
import TourPricing from "./TourPricing";
import TourInclusions from "./TourInclusions";
import TourPreview from "./TourPreview";

const AddTour = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  // Toast hook
  const toast = useToast();

  // State Management
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

  const tourPasteRef = useRef(null);
  const navigate = useNavigate();

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

  const handleSubmitTour = async (e) => {
    e.preventDefault();
    
    // Validation with Toast notifications
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
    
    // Calculate markup in peso
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

    // =========================================================
    // 1. KUNIN ANG USER DATA PARA SA ACTIVITY LOGS
    // =========================================================
    const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
    const activeUser = adminData.email || adminData.username || adminData.user || 'Unknown User';
    
    // I-handle ang ID para hindi maging string na "null"
    const activeId = adminData.id || adminData._id || "";

    formData.append("userEmail", activeUser);
    formData.append("adminId", activeId);
    // =========================================================

    // Show loading toast
    toast.info("Uploading tour package...", "Please Wait", 2000);

    try {
      const res = await fetch("http://localhost:5000/api/tours/add", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      
      if (res.ok && data.status === 'ok') {
        // Success toast
        toast.success(
          `${tourTitle} has been added to ${tourCat} tours!`,
          "Tour Published Successfully",
          6000
        );

        // Reset form
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

        // Optional: Navigate after delay
        setTimeout(() => {
          // navigate("/tours"); // Uncomment if you want to redirect
        }, 2000);
      } else {
        console.error("Server error:", data);
        toast.error(
          data.error || "Failed to add tour. Please try again.",
          "Upload Failed",
          6000
        );
        if (data.details) {
          console.error("Details:", data.details);
        }
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
                    onClick={() => navigate(-1)}
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