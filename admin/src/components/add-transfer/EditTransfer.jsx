import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../sidebar/sidebar";
import "./addtransfer.css"; // ✅ Reuse exact same styles as AddTransfer

// ✅ Reuse all existing sub-components — no changes needed in those files
import TransferBasicInfo from "./TransferBasicInfo";
import TransferPricing from "./TransferPricing";
import TransferPreview from "./TransferPreview";

import { useToast } from "../toast/ToastManager";
import CustomConfirmModal from "../../components/confirmationModal/CustomConfirmModal";

const API_BASE =
    import.meta.env.VITE_API_URL?.replace(/\/$/, "") ||
    "https://wanderwaveph.onrender.com/api";

// ─────────────────────────────────────────────────────────────────────────────
// EditTransfer
// Route: /transfers/edit/:id   (add this to your router)
// Fetches existing transfer via GET /api/transfers/:id, then PATCHes on save.
// ─────────────────────────────────────────────────────────────────────────────
const EditTransfer = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();

    // --- SIDEBAR ---
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const toggleSidebar = () => setIsSidebarCollapsed((p) => !p);

    // --- PAGE-LEVEL LOADING (fetching existing data) ---
    const [fetching, setFetching] = useState(true);
    const [fetchError, setFetchError] = useState(null);

    // --- BASIC INFO ---
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("Local Transfer");
    const [packageDestination, setPackageDestination] = useState("");
    const [pax, setPax] = useState("");

    // --- IMAGE ---
    // existingImageUrl  = URL currently saved in the DB (Cloudinary)
    // file              = new File object selected by the user (null = keep existing)
    // previewUrl        = what is shown in the UI (blob URL for new file, or Cloudinary URL for existing)
    const [existingImageUrl, setExistingImageUrl] = useState(null);
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isPasteActive, setIsPasteActive] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);
    const pasteAreaRef = useRef(null);

    // --- ONE WAY PRICING ---
    const [oneWaySupplierRate, setOneWaySupplierRate] = useState("");
    const [oneWayMarkupValue, setOneWayMarkupValue] = useState("");
    const [oneWayMarkupType, setOneWayMarkupType] = useState("peso");
    const [oneWayPrice, setOneWayPrice] = useState("");

    // --- ROUNDTRIP PRICING ---
    const [roundtripSupplierRate, setRoundtripSupplierRate] = useState("");
    const [roundtripMarkupValue, setRoundtripMarkupValue] = useState("");
    const [roundtripMarkupType, setRoundtripMarkupType] = useState("peso");
    const [roundtripPrice, setRoundtripPrice] = useState("");

    // --- SUBMIT ---
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
    // ✅ FETCH EXISTING TRANSFER DATA ON MOUNT
    // =========================================================
    useEffect(() => {
        if (!id) {
            setFetchError("No transfer ID provided.");
            setFetching(false);
            return;
        }

        const load = async () => {
            try {
                setFetching(true);
                const res = await fetch(`${API_BASE}/transfers/${id}`);
                if (!res.ok) {
                    const json = await res.json().catch(() => ({}));
                    throw new Error(json.message || `Server returned ${res.status}`);
                }
                const json = await res.json();
                const t = json.data || json.transfer || json;

                // ── Pre-fill all state from the fetched document ──────────
                setTitle(t.title || "");
                setCategory(t.category || "Local Transfer");
                setPackageDestination(t.packageDestination || "");
                setPax(t.pax != null ? String(t.pax) : "");

                // Image — show Cloudinary URL as the initial preview
                if (t.imageUrl) {
                    setExistingImageUrl(t.imageUrl);
                    setPreviewUrl(t.imageUrl);
                }

                // Markup types: DB stores 'peso' | 'percent'; component uses 'peso' | 'percentage'
                const toUiType = (raw) =>
                    raw === "percent" ? "percentage" : raw || "peso";

                setOneWaySupplierRate(
                    t.oneWaySupplierRate != null ? String(t.oneWaySupplierRate) : ""
                );
                setOneWayMarkupValue(
                    t.oneWayMarkupValue != null ? String(t.oneWayMarkupValue) : ""
                );
                setOneWayMarkupType(toUiType(t.oneWayMarkupType));
                setOneWayPrice(
                    t.oneWayPrice != null ? String(t.oneWayPrice) : ""
                );

                setRoundtripSupplierRate(
                    t.roundtripSupplierRate != null ? String(t.roundtripSupplierRate) : ""
                );
                setRoundtripMarkupValue(
                    t.roundtripMarkupValue != null ? String(t.roundtripMarkupValue) : ""
                );
                setRoundtripMarkupType(toUiType(t.roundtripMarkupType));
                setRoundtripPrice(
                    t.roundtripPrice != null ? String(t.roundtripPrice) : ""
                );
            } catch (err) {
                console.error("❌ Failed to load transfer:", err);
                setFetchError(err.message || "Failed to load transfer data.");
                toast.error(err.message || "Failed to load transfer.", "Load Error", 5000);
            } finally {
                setFetching(false);
            }
        };

        load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    // =========================================================
    // ✅ PRICING HANDLERS (identical logic to AddTransfer)
    // =========================================================
    const computePrice = useCallback((supplierRate, markupValue, markupType) => {
        const supplier = parseFloat(supplierRate) || 0;
        const markup = parseFloat(markupValue) || 0;
        const markupInPeso =
            markupType === "percentage" ? (supplier * markup) / 100 : markup;
        const total = supplier + markupInPeso;
        return total > 0 ? total.toFixed(2) : "";
    }, []);

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
    // ✅ COVER IMAGE HANDLERS
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

    const handleFileChange = (e) => applyFile(e.target.files[0]);

    // In edit mode, "clearing" the image just restores the existing saved image.
    // A new upload will replace it; removing falls back to the saved Cloudinary URL.
    const clearImage = () => {
        setFile(null);
        // Restore existing image if one was saved; otherwise blank the preview
        setPreviewUrl(existingImageUrl || null);
        setIsPasteActive(false);
        setIsDragging(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const activatePasteArea = () => {
        setIsPasteActive(true);
        setTimeout(() => pasteAreaRef.current?.focus(), 0);
    };

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
    // ✅ FORM SUBMIT — PATCH /api/transfers/:id
    // =========================================================
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!title.trim()) {
            toast.error("Please enter a transfer title.", "Missing Field");
            return;
        }
        if (!oneWayPrice && !roundtripPrice) {
            toast.error(
                "Please set at least one pricing rate (One Way or Roundtrip).",
                "Missing Pricing"
            );
            return;
        }

        // Map UI markup type back to DB enum ('peso' | 'percent')
        const toDbType = (uiType) =>
            uiType === "percentage" ? "percent" : "peso";

        setSubmitting(true);
        try {
            const formData = new FormData();

            // Only attach image if the user chose a NEW file
            if (file) formData.append("image", file);

            formData.append("title", title.trim());
            formData.append("packageDestination", packageDestination);
            formData.append("category", category);
            formData.append("pax", pax || "");

            formData.append("oneWaySupplierRate", oneWaySupplierRate || "");
            formData.append("oneWayMarkupValue", oneWayMarkupValue || "");
            formData.append("oneWayMarkupType", toDbType(oneWayMarkupType));
            formData.append("oneWayPrice", oneWayPrice || "");

            formData.append("roundtripSupplierRate", roundtripSupplierRate || "");
            formData.append("roundtripMarkupValue", roundtripMarkupValue || "");
            formData.append("roundtripMarkupType", toDbType(roundtripMarkupType));
            formData.append("roundtripPrice", roundtripPrice || "");

            const res = await fetch(`${API_BASE}/transfers/${id}`, {
                method: "PATCH",
                body: formData,
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(
                    "Transfer has been updated successfully!",
                    "Transfer Updated 🚗",
                    4000
                );
                // Give toast a moment then navigate back
                setTimeout(() => navigate(-1), 1200);
            } else {
                const errorMessage =
                    data.error || data.message || "Failed to update transfer";
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
            "Discard Changes",
            "Are you sure you want to discard all unsaved changes?",
            () => {
                toast.info("Changes discarded.", "Cancelled");
                navigate(-1);
            },
            "danger"
        );
    };

    // =========================================================
    // ✅ COVER IMAGE SECTION JSX  (identical UI to AddTransfer)
    // =========================================================
    const CoverImageSection = () => (
        <section className="atrn-section atrn-cover-section">
            <h2 className="atrn-section-title">COVER IMAGE</h2>

            {previewUrl ? (
                /* ── Preview / existing image state ── */
                <div className="atrn-cover-preview">
                    <img src={previewUrl} alt="Cover preview" className="atrn-cover-img" />

                    {/* Badge showing whether this is the saved or a newly selected image */}
                    {!file && existingImageUrl && (
                        <div className="atrn-cover-existing-badge">
                            ✅ Current saved image
                        </div>
                    )}
                    {file && (
                        <div className="atrn-cover-existing-badge atrn-cover-existing-badge--new">
                            🆕 New image selected
                        </div>
                    )}

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
                        {/* Only show Remove if user selected a NEW file (revert to saved) */}
                        {file && (
                            <button
                                type="button"
                                className="atrn-cover-btn atrn-cover-btn--remove"
                                onClick={clearImage}
                                title="Revert to saved image"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4h6v2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                Revert
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                /* ── Upload state (no image exists at all) ── */
                <div className="atrn-cover-upload-area">
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
                            JPG, PNG or WebP · Drag &amp; drop supported
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
                            {isPasteActive
                                ? "Click anywhere else to cancel"
                                : "Press Ctrl+V (Windows) or Cmd+V (Mac)"}
                        </span>
                    </div>
                </div>
            )}
        </section>
    );

    // =========================================================
    // ✅ LOADING / ERROR SCREENS
    // =========================================================
    if (fetching) {
        return (
            <div className="atrn-page">
                <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
                <main className={`atrn-main ${isSidebarCollapsed ? "collapsed-main" : ""}`}>
                    <div className="atrn-container">
                        <div style={{
                            display: "flex", flexDirection: "column",
                            alignItems: "center", justifyContent: "center",
                            minHeight: "60vh", gap: 16,
                        }}>
                            <div style={{
                                width: 48, height: 48, border: "4px solid #e2e8f0",
                                borderTopColor: "#FF8C42", borderRadius: "50%",
                                animation: "spin 0.8s linear infinite",
                            }} />
                            <p style={{ color: "#64748b", fontSize: 15, fontWeight: 600 }}>
                                Loading transfer data…
                            </p>
                            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    if (fetchError) {
        return (
            <div className="atrn-page">
                <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
                <main className={`atrn-main ${isSidebarCollapsed ? "collapsed-main" : ""}`}>
                    <div className="atrn-container">
                        <div style={{
                            display: "flex", flexDirection: "column",
                            alignItems: "center", justifyContent: "center",
                            minHeight: "60vh", gap: 12,
                        }}>
                            <span style={{ fontSize: 40 }}>⚠️</span>
                            <p style={{ color: "#dc2626", fontSize: 15, fontWeight: 700 }}>
                                {fetchError}
                            </p>
                            <button
                                onClick={() => navigate(-1)}
                                style={{
                                    padding: "10px 24px", borderRadius: 8,
                                    background: "#001F3F", color: "#fff",
                                    border: "none", cursor: "pointer",
                                    fontWeight: 700, fontSize: 14,
                                }}
                            >
                                ← Go Back
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    // =========================================================
    // ✅ MAIN RENDER
    // =========================================================
    return (
        <div className="atrn-page">
            {/* ── Confirmation Modal ── */}
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
                            {/* Back button */}
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                style={{
                                    display: "inline-flex", alignItems: "center", gap: 6,
                                    padding: "8px 16px", marginBottom: 12,
                                    background: "#f1f5f9", border: "1px solid #e2e8f0",
                                    borderRadius: 8, cursor: "pointer",
                                    fontSize: 13, fontWeight: 700, color: "#475569",
                                    transition: "all 0.2s",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = "#e2e8f0";
                                    e.currentTarget.style.color = "#1e293b";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = "#f1f5f9";
                                    e.currentTarget.style.color = "#475569";
                                }}
                            >
                                ← Back
                            </button>

                            <h1 className="atrn-title">EDIT TRANSFER</h1>
                            <p className="atrn-subtitle">
                                Update the details below to modify this transfer service
                            </p>
                        </div>
                    </header>

                    {/* ── FORM ── */}
                    <form onSubmit={handleSubmit} className="atrn-form">
                        <div className="atrn-grid">

                            {/* ── LEFT COLUMN ── */}
                            <div className="atrn-left">
                                {/* Cover Image */}
                                <CoverImageSection />

                                {/* Basic Info — reuses TransferBasicInfo unchanged */}
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

                                {/* Pricing — reuses TransferPricing unchanged */}
                                <TransferPricing
                                    oneWaySupplierRate={oneWaySupplierRate}
                                    handleOneWaySupplierRateChange={handleOneWaySupplierRateChange}
                                    oneWayMarkupValue={oneWayMarkupValue}
                                    handleOneWayMarkupChange={handleOneWayMarkupChange}
                                    oneWayMarkupType={oneWayMarkupType}
                                    toggleOneWayMarkupType={toggleOneWayMarkupType}
                                    oneWayPrice={oneWayPrice}
                                    roundtripSupplierRate={roundtripSupplierRate}
                                    handleRoundtripSupplierRateChange={handleRoundtripSupplierRateChange}
                                    roundtripMarkupValue={roundtripMarkupValue}
                                    handleRoundtripMarkupChange={handleRoundtripMarkupChange}
                                    roundtripMarkupType={roundtripMarkupType}
                                    toggleRoundtripMarkupType={toggleRoundtripMarkupType}
                                    roundtripPrice={roundtripPrice}
                                />
                            </div>

                            {/* ── RIGHT COLUMN (Preview + Actions) ── */}
                            <aside className="atrn-right">
                                {/* Live Preview — reuses TransferPreview unchanged */}
                                <TransferPreview
                                    previewUrl={previewUrl}
                                    title={title}
                                    category={category}
                                    packageDestination={packageDestination}
                                    pax={pax}
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
                                        disabled={submitting}
                                    >
                                        Discard
                                    </button>
                                    <button
                                        type="submit"
                                        className="atrn-btn atrn-btn--submit"
                                        disabled={submitting}
                                    >
                                        {submitting ? "Saving…" : "Save Changes"}
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

export default EditTransfer;
