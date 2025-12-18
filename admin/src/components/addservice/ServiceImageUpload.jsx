import { useState, useRef, useEffect } from "react";
import "./ServiceImageUpload.css";

const ServiceImageUpload = ({ file, setFile, previewUrl, setPreviewUrl }) => {
  const [isPasteActive, setIsPasteActive] = useState(false);
  const pasteAreaRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const items = e.clipboardData?.items;

    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            setFile(blob);
            setPreviewUrl(URL.createObjectURL(blob));
            setIsPasteActive(false);
          }
          break;
        }
      }
    }
  };

  useEffect(() => {
    const handleGlobalPaste = (e) => {
      if (isPasteActive && pasteAreaRef.current) {
        handlePaste(e);
      }
    };

    document.addEventListener("paste", handleGlobalPaste);
    return () => document.removeEventListener("paste", handleGlobalPaste);
  }, [isPasteActive]);

  const activatePasteArea = () => {
    setIsPasteActive(true);
    if (pasteAreaRef.current) {
      pasteAreaRef.current.focus();
    }
  };

  const handleRemoveImage = () => {
    setFile(null);
    setPreviewUrl(null);
  };

  return (
    <section className="svc-section">
      <h2 className="svc-section-title">SERVICE IMAGE</h2>

      {previewUrl ? (
        <div className="svc-upload-preview-container">
          <div className="svc-upload-preview">
            <img src={previewUrl} alt="Service Image" />
            <div className="svc-upload-actions">
              <label className="svc-upload-change-btn">
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*"
                  hidden
                />
                Change
              </label>
              <button
                type="button"
                className="svc-upload-remove-btn"
                onClick={handleRemoveImage}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="svc-upload-options">
          <label className="svc-upload svc-upload-click">
            <input
              type="file"
              onChange={handleFileChange}
              accept="image/*"
              hidden
              required
            />
            <div className="svc-upload-empty">
              <div className="svc-upload-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <p className="svc-upload-text">Click to upload</p>
              <p className="svc-upload-hint">JPG, PNG or WebP</p>
            </div>
          </label>
        </div>
      )}
    </section>
  );
};

export default ServiceImageUpload;