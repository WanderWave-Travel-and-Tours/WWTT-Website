import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../sidebar/sidebar";
import "./addtransfer.css";

// Import sub-components
import TransferBasicInfo from "./TransferBasicInfo";
import TransferPricing from "./TransferPricing";
import TransferPreview from "./TransferPreview";

// ✅ Toast & Confirmation Modal
import { useToast } from "../toast/ToastManager";
import CustomConfirmModal from "../../components/confirmationModal/CustomConfirmModal";

// ✅ FIX: Strip trailing slash so VITE_API_URL (which already includes /api)
//         doesn't produce a double /api/api prefix when appending paths.
//         e.g. VITE_API_URL = "https://wanderwaveph.onrender.com/api"
//         → API_BASE = "https://wanderwaveph.onrender.com/api"
//         → fetch(`${API_BASE}/transfers`) = ".../api/transfers"  ✅
const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'https://wanderwaveph.onrender.com/api';

const AddTransfer = () => {
    // --- SIDEBAR TOGGLE ---
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

    const navigate = useNavigate();
    const toast = useToast();

    // --- BASIC INFO STATE ---
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("Local Transfer");
    const [packageDestination, setPackageDestination] = useState("");
    const [pax, setPax] = useState("");

    // --- IMAGE STATE ---
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isPasteActive, setIsPasteActive] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);
    const pasteAreaRef = useRef(null);

    // --- ONE WAY PRICING STATE ---
    const [oneWaySupplierRate, setOneWaySupplierRate] = useState("");
    const [oneWayMarkupValue, setOneWayMarkupValue] = useState("");
    const [oneWayMarkupType, setOneWayMarkupType] = useState("peso");
    const [oneWayPrice, setOneWayPrice] = useState("");

    // --- ROUNDTRIP PRICING STATE ---
    const [roundtripSupplierRate, setRoundtripSupplierRate] = useState("");
    const [roundtripMarkupValue, setRoundtripMarkupValue] = useState("");
    const [roundtripMarkupType, setRoundtripMarkupType] = useState("peso");
    const [roundtripPrice, setRoundtripPrice] = useState("");

    // --- SUBMIT STATE ---
    const [submitting, setSubmitting] = useState(false);

    // --- CONFIRMATION MODAL ---
    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => {},
        type: "primary",
    });

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
    // ✅ PRICING HANDLERS
    // =========================================================

    const computePrice = useCallback((supplierRate, markupValue, markupType) => {
        const supplier = parseFloat(supplierRate) || 0;
        const markup = parseFloat(markupValue) || 0;
        const markupInPeso =
            markupType === "percentage" ? (supplier * markup) / 100 : markup;
        const total = supplier + markupInPeso;
        return total > 0 ? total.toFixed(2) : "";
    }, []);

    // One Way handlers
    const handleOneWaySupplierRateChange = (e) => {
        const val = e.target.value;
        setOneWaySupplierRate(val);
        setOneWayPrice(computePrice(val, oneWayMarkupValue, oneWayMarkupType));
    };

    const handleOneWayMarkupChange = (e) => {
        const val = e.target.value;
        setOneWayMarkupValue(val);
        setOneWayPrice(computePrice(oneWaySupplierRate, val, oneWayMarkupType));
    };

    const toggleOneWayMarkupType = () => {
        const newType = oneWayMarkupType === "percentage" ? "peso" : "percentage";
        setOneWayMarkupType(newType);
        setOneWayMarkupValue("");
        setOneWayPrice(computePrice(oneWaySupplierRate, "", newType));
    };

    // Roundtrip handlers
    const handleRoundtripSupplierRateChange = (e) => {
        const val = e.target.value;
        setRoundtripSupplierRate(val);
        setRoundtripPrice(computePrice(val, roundtripMarkupValue, roundtripMarkupType));
    };

    const handleRoundtripMarkupChange = (e) => {
        const val = e.target.value;
        setRoundtripMarkupValue(val);
        setRoundtripPrice(computePrice(roundtripSupplierRate, val, roundtripMarkupType));
    };

    const toggleRoundtripMarkupType = () => {
        const newType = roundtripMarkupType === "percentage" ? "peso" : "percentage";
        setRoundtripMarkupType(newType);
        setRoundtripMarkupValue("");
        setRoundtripPrice(computePrice(roundtripSupplierRate, "", newType));
    };

    // =========================================================
    // ✅ COVER IMAGE HANDLERS (custom — no external component)
    // =========================================================

    const applyFile = (selectedFile) => {
        if (!selectedFile) return;
        if (!selectedFile.type.startsWith("image/")) {
            toast.error("Only image files are allowed.", "Invalid File");
            return;
        }
        setFile(selectedFile);
        setPreviewUrl(URL.createObjectURL(selectedFile));
        setIsPasteActive(false);
        setIsDragging(false);
    };

    const handleFileChange = (e) => {
        applyFile(e.target.files[0]);
    };

    const clearImage = () => {
        setFile(null);
        setPreviewUrl(null);
        setIsPasteActive(false);
        setIsDragging(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const activatePasteArea = () => {
        setIsPasteActive(true);
        setTimeout(() => pasteAreaRef.current?.focus(), 0);
    };

    // Drag-and-drop handlers
    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };
    const handleDragLeave = () => setIsDragging(false);
    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        applyFile(e.dataTransfer.files[0]);
    };

    useEffect(() => {
        const handlePaste = (e) => {
            if (!isPasteActive) return;
            const items = e.clipboardData?.items;
            if (!items) return;
            for (const item of items) {
                if (item.type.startsWith("image/")) {
                    const blob = item.getAsFile();
                    if (blob) {
                        applyFile(
                            new File(
                                [blob],
                                `pasted-image-${Date.now()}.${blob.type.split("/")[1] || "png"}`,
                                { type: blob.type }
                            )
                        );
                    }
                    break;
                }
            }
        };

        const handleClickOutside = (e) => {
            if (
                isPasteActive &&
                pasteAreaRef.current &&
                !pasteAreaRef.current.contains(e.target)
            ) {
                setIsPasteActive(false);
            }
        };

        document.addEventListener("paste", handlePaste);
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("paste", handlePaste);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isPasteActive]);

    // =========================================================
    // ✅ FORM SUBMIT
    // =========================================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!title) {
            toast.error("Please enter a transfer title.", "Missing Field");
            return;
        }
        if (!file) {
            toast.error("Please upload a cover image.", "Missing Field");
            return;
        }
        if (!oneWayPrice && !roundtripPrice) {
            toast.error(
                "Please set at least one pricing rate (One Way or Roundtrip).",
                "Missing Pricing"
            );
            return;
        }

        setSubmitting(true);

        try {
            const formData = new FormData();
            formData.append("image", file);
            formData.append("title", title);
            formData.append("packageDestination", packageDestination);
            formData.append("category", category);
            formData.append("pax", pax || "");

            // One Way
            formData.append("oneWaySupplierRate", oneWaySupplierRate || "");
            formData.append("oneWayMarkupValue", oneWayMarkupValue || "");
            formData.append("oneWayMarkupType", oneWayMarkupType);
            formData.append("oneWayPrice", oneWayPrice || "");

            // Roundtrip
            formData.append("roundtripSupplierRate", roundtripSupplierRate || "");
            formData.append("roundtripMarkupValue", roundtripMarkupValue || "");
            formData.append("roundtripMarkupType", roundtripMarkupType);
            formData.append("roundtripPrice", roundtripPrice || "");

            // ✅ FIX: API_BASE already includes /api — no need to repeat it
            const res = await fetch(`${API_BASE}/transfers`, {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(
                    "Transfer has been published successfully!",
                    "Transfer Published 🚗",
                    4000
                );

                // Reset all state
                setTitle("");
                setPackageDestination("");
                setCategory("Local Transfer");
                setPax("");
                setFile(null);
                setPreviewUrl(null);
                setOneWaySupplierRate("");
                setOneWayMarkupValue("");
                setOneWayMarkupType("peso");
                setOneWayPrice("");
                setRoundtripSupplierRate("");
                setRoundtripMarkupValue("");
                setRoundtripMarkupType("peso");
                setRoundtripPrice("");
                if (fileInputRef.current) fileInputRef.current.value = "";
            } else {
                const errorMessage =
                    data.error || data.message || "Failed to publish transfer";
                toast.error(errorMessage, "Server Error", 5000);
            }
        } catch (error) {
            toast.error(
                `Cannot connect to server: ${error.message}.`,
                "Connection Error",
                6000
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = () => {
        askConfirmation(
            "Cancel Entry",
            "Are you sure you want to cancel? All unsaved changes will be lost.",
            () => {
                toast.info("Process cancelled.", "Cancelled");
                navigate(-1);
            },
            "danger"
        );
    };

    // =========================================================
    // ✅ COVER IMAGE SECTION JSX
    // =========================================================

    const CoverImageSection = () => (
        <section className="atrn-section atrn-cover-section">
            <h2 className="atrn-section-title">COVER IMAGE</h2>

            {previewUrl ? (
                /* ── Preview state ── */
                <div className="atrn-cover-preview">
                    <img src={previewUrl} alt="Cover preview" className="atrn-cover-img" />
                    <div className="atrn-cover-preview-actions">
                        <label className="atrn-cover-btn atrn-cover-btn--change">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Change Image
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                style={{ display: "none" }}
                            />
                        </label>
                        <button
                            type="button"
                            className="atrn-cover-btn atrn-cover-btn--remove"
                            onClick={clearImage}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4h6v2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Remove
                        </button>
                    </div>
                </div>
            ) : (
                /* ── Upload state ── */
                <div className="atrn-cover-upload-area">
                    {/* Upload zone */}
                    <label
                        className={`atrn-cover-dropzone ${isDragging ? "atrn-cover-dropzone--dragging" : ""}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <div className="atrn-cover-dropzone-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <polyline points="21 15 16 10 5 21" />
                            </svg>
                        </div>
                        <span className="atrn-cover-dropzone-title">
                            {isDragging ? "Drop image here" : "Click to upload"}
                        </span>
                        <span className="atrn-cover-dropzone-sub">
                            JPG, PNG or WebP · Drag & drop supported
                        </span>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            style={{ display: "none" }}
                        />
                    </label>

                    <div className="atrn-cover-divider">
                        <span>OR</span>
                    </div>

                    {/* Paste zone */}
                    <div
                        ref={pasteAreaRef}
                        tabIndex={0}
                        className={`atrn-cover-paste-zone ${isPasteActive ? "atrn-cover-paste-zone--active" : ""}`}
                        onClick={activatePasteArea}
                        onKeyDown={(e) => e.key === "Enter" && activatePasteArea()}
                    >
                        <div className="atrn-cover-dropzone-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" strokeLinecap="round" strokeLinejoin="round" />
                                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                            </svg>
                        </div>
                        <span className="atrn-cover-dropzone-title">
                            {isPasteActive ? "⌨️ Ready — press Ctrl+V / Cmd+V" : "Paste screenshot"}
                        </span>
                        <span className="atrn-cover-dropzone-sub">
                            {isPasteActive ? "Click anywhere else to cancel" : "Press Ctrl+V (Windows) or Cmd+V (Mac)"}
                        </span>
                    </div>
                </div>
            )}
        </section>
    );

    // =========================================================
    // ✅ RENDER
    // =========================================================

    return (
        <div className="atrn-page">
            {/* ✅ CUSTOM CONFIRMATION MODAL */}
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

            <Sidebar
                isCollapsed={isSidebarCollapsed}
                toggleSidebar={toggleSidebar}
            />

            <main
                className={`atrn-main ${isSidebarCollapsed ? "collapsed-main" : ""}`}
            >
                <div className="atrn-container">
                    {/* ── HEADER ── */}
                    <header className="atrn-header">
                        <div className="atrn-header-content">
                            <h1 className="atrn-title">NEW TRANSFER</h1>
                            <p className="atrn-subtitle">
                                Fill in the details below to create a new transfer service
                            </p>
                        </div>
                    </header>

                    {/* ── FORM ── */}
                    <form onSubmit={handleSubmit} className="atrn-form">
                        <div className="atrn-grid">
                            {/* ── LEFT COLUMN ── */}
                            <div className="atrn-left">
                                {/* Cover Image — custom inline section */}
                                <CoverImageSection />

                                {/* Basic Info */}
                                <TransferBasicInfo
                                    title={title}
                                    setTitle={setTitle}
                                    category={category}
                                    setCategory={setCategory}
                                    packageDestination={packageDestination}
                                    setPackageDestination={setPackageDestination}
                                    pax={pax}
                                    setPax={setPax}
                                />

                                {/* Transfer Pricing */}
                                <TransferPricing
                                    // One Way
                                    oneWaySupplierRate={oneWaySupplierRate}
                                    handleOneWaySupplierRateChange={
                                        handleOneWaySupplierRateChange
                                    }
                                    oneWayMarkupValue={oneWayMarkupValue}
                                    handleOneWayMarkupChange={handleOneWayMarkupChange}
                                    oneWayMarkupType={oneWayMarkupType}
                                    toggleOneWayMarkupType={toggleOneWayMarkupType}
                                    oneWayPrice={oneWayPrice}
                                    // Roundtrip
                                    roundtripSupplierRate={roundtripSupplierRate}
                                    handleRoundtripSupplierRateChange={
                                        handleRoundtripSupplierRateChange
                                    }
                                    roundtripMarkupValue={roundtripMarkupValue}
                                    handleRoundtripMarkupChange={
                                        handleRoundtripMarkupChange
                                    }
                                    roundtripMarkupType={roundtripMarkupType}
                                    toggleRoundtripMarkupType={toggleRoundtripMarkupType}
                                    roundtripPrice={roundtripPrice}
                                />
                            </div>

                            {/* ── RIGHT COLUMN (Preview + Buttons) ── */}
                            <aside className="atrn-right">
                                <TransferPreview
                                    previewUrl={previewUrl}
                                    title={title}
                                    category={category}
                                    packageDestination={packageDestination}
                                    oneWaySupplierRate={oneWaySupplierRate}
                                    oneWayMarkupValue={oneWayMarkupValue}
                                    oneWayMarkupType={oneWayMarkupType}
                                    oneWayPrice={oneWayPrice}
                                    roundtripSupplierRate={roundtripSupplierRate}
                                    roundtripMarkupValue={roundtripMarkupValue}
                                    roundtripMarkupType={roundtripMarkupType}
                                    roundtripPrice={roundtripPrice}
                                />

                                <div className="atrn-actions">
                                    <button
                                        type="button"
                                        className="atrn-btn atrn-btn--cancel"
                                        onClick={handleCancel}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="atrn-btn atrn-btn--submit"
                                        disabled={submitting}
                                    >
                                        {submitting ? "Publishing..." : "Publish"}
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

export default AddTransfer;