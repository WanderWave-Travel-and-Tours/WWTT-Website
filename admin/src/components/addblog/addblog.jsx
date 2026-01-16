import React, { useState, useEffect, useRef } from "react";
import {
  Upload,
  FileText,
  User,
  Loader2,
  X,
  AlertTriangle,
  Calendar,
  Wand2,
  Sparkles,
  Image as ImageIcon,
  Paperclip,
  Search,
  Check,
  Globe,
  TrendingUp,
  Zap
} from "lucide-react";
import Sidebar from "../sidebar/sidebar";
import { useNavigate } from "react-router-dom";
import useAutoDraft from "../../hooks/useAutoDraft";
import RestoreDraftModal from "../../components/RestoreDraftModal/RestoreDraftModal";
import { useToast } from "../toast/ToastManager"; 
import "./addblog.css";

// =============================================================================
// CUSTOM CONFIRM MODAL
// =============================================================================
const CustomConfirmModal = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  type = "primary",
}) => {
  if (!isOpen) return null;
  return (
    <div
      className="arc-confirm-overlay"
      style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 11000,
      }}
    >
      <div
        className="arc-confirm-modal"
        style={{
          backgroundColor: "white", padding: "2rem", borderRadius: "12px",
          maxWidth: "400px", width: "90%", textAlign: "center",
          boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
        }}
      >
        <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "center" }}>
          <div style={{
              padding: "1rem", borderRadius: "50%",
              backgroundColor: type === "danger" ? "#fee2e2" : "#e0f2fe",
              color: type === "danger" ? "#ef4444" : "#0ea5e9",
            }}
          >
            <AlertTriangle size={32} />
          </div>
        </div>
        <h3 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "0.5rem", color: "#1e293b" }}>
          {title}
        </h3>
        <p style={{ color: "#64748b", marginBottom: "2rem", lineHeight: "1.5" }}>
          {message}
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
          <button onClick={onCancel} style={{ padding: "0.75rem 1.5rem", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "white", color: "#64748b", fontWeight: "500", cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={onConfirm} style={{ padding: "0.75rem 1.5rem", borderRadius: "8px", border: "none", backgroundColor: type === "danger" ? "#ef4444" : "#0ea5e9", color: "white", fontWeight: "500", cursor: "pointer" }}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// UNSPLASH SEARCH MODAL - COMPLETE (Replaced Pexels)
// =============================================================================
const UnsplashSearchModal = ({ isOpen, onClose, onSelectImage }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hoveredImage, setHoveredImage] = useState(null);
    const [showCurated, setShowCurated] = useState(true);
    
    const scrollContainerRef = useRef(null);
    const API_BASE_URL = "https://wanderwaveph-backend.onrender.com";

    // Load curated images on mount
    useEffect(() => {
        if (isOpen && showCurated) {
            loadCuratedImages();
        }
    }, [isOpen]);

    const loadCuratedImages = async (page = 1, append = false) => {
        if (page === 1) {
            setIsSearching(true);
            setSearchResults([]);
        } else {
            setIsLoadingMore(true);
        }

        try {
            // Updated Endpoint
            const response = await fetch(
                `${API_BASE_URL}/api/blogs/curated-unsplash?perPage=30&page=${page}`
            );
            const data = await response.json();

            if (data.success && data.photos) {
                if (append) {
                    setSearchResults(prev => [...prev, ...data.photos]);
                } else {
                    setSearchResults(data.photos);
                }
                setHasMore(data.photos.length === 30);
                setCurrentPage(page);
            }
        } catch (error) {
            console.error("❌ Curated Images Error:", error);
        } finally {
            setIsSearching(false);
            setIsLoadingMore(false);
        }
    };

    const handleSearch = async (page = 1, append = false) => {
        if (!searchQuery.trim()) return;
        
        setShowCurated(false);
        
        if (page === 1) {
            setIsSearching(true);
            setSearchResults([]);
            setSelectedImage(null);
            setCurrentPage(1);
        } else {
            setIsLoadingMore(true);
        }

        try {
            // Updated Endpoint
            const response = await fetch(
                `${API_BASE_URL}/api/blogs/search-unsplash?query=${encodeURIComponent(searchQuery)}&perPage=30&page=${page}`
            );
            const data = await response.json();

            if (data.success && data.photos) {
                if (append) {
                    setSearchResults(prev => [...prev, ...data.photos]);
                } else {
                    setSearchResults(data.photos);
                }
                setHasMore(data.photos.length === 30);
                setCurrentPage(page);
            } else {
                setSearchResults([]);
                setHasMore(false);
            }
        } catch (error) {
            console.error("❌ Unsplash Search Error:", error);
            setSearchResults([]);
            setHasMore(false);
        } finally {
            setIsSearching(false);
            setIsLoadingMore(false);
        }
    };

    const handleLoadMore = () => {
        if (!isLoadingMore && hasMore) {
            if (showCurated) {
                loadCuratedImages(currentPage + 1, true);
            } else {
                handleSearch(currentPage + 1, true);
            }
        }
    };

    // Infinite Scroll Detection
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = container;
            if (scrollTop + clientHeight >= scrollHeight - 300) {
                handleLoadMore();
            }
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, [isLoadingMore, hasMore, currentPage, showCurated]);

    const handleSelectImage = async () => {
        if (!selectedImage) return;
        setIsDownloading(true);

        try {
            // Updated Endpoint
            const response = await fetch(`${API_BASE_URL}/api/blogs/download-unsplash`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    imageUrl: selectedImage.src.large2x || selectedImage.src.regular,
                    photographer: selectedImage.photographer,
                    alt: selectedImage.alt,
                    photoId: selectedImage.id,
                    downloadLocation: selectedImage.downloadLocation // Necessary for Unsplash Tracking
                })
            });

            const data = await response.json();

            if (data.success) {
                onSelectImage({
                    url: data.url,
                    publicId: data.publicId,
                    photographer: data.photographer,
                    alt: data.alt
                });
                onClose();
            }
        } catch (error) {
            console.error("❌ Download Error:", error);
        } finally {
            setIsDownloading(false);
        }
    };

    const handleQuickSearch = (tag) => {
        setSearchQuery(tag);
        setTimeout(() => handleSearch(1), 100);
    };

    if (!isOpen) return null;

    const getRandomHeight = () => {
        const heights = [200, 250, 300, 350, 280, 320];
        return heights[Math.floor(Math.random() * heights.length)];
    };

    return (
        <div style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(0,0,0,0.85)", zIndex: 12000,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "20px", backdropFilter: "blur(8px)"
        }}>
            <div style={{
                backgroundColor: "#ffffff",
                borderRadius: "24px",
                width: "100%",
                maxWidth: "1600px",
                height: "92vh",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.6)",
                overflow: "hidden"
            }}>
                {/* Header */}
                <div style={{
                    padding: "28px 36px",
                    borderBottom: "1px solid rgba(226, 232, 240, 0.8)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "linear-gradient(135deg, #000000 0%, #333333 100%)" // Unsplash style (black/white)
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
                        <div style={{
                            background: "white",
                            padding: "14px",
                            borderRadius: "16px",
                            display: "flex",
                            boxShadow: "0 8px 16px rgba(0,0,0,0.15)"
                        }}>
                            <Globe size={32} color="#000000" strokeWidth={2.5} />
                        </div>
                        <div>
                            <h3 style={{ 
                                margin: 0, 
                                fontSize: "28px", 
                                fontWeight: "900",
                                color: "white",
                                letterSpacing: "-0.5px",
                                textShadow: "0 2px 8px rgba(0,0,0,0.15)"
                            }}>
                                Browse Unsplash
                            </h3>
                            <p style={{ 
                                margin: "4px 0 0 0", 
                                fontSize: "15px", 
                                color: "rgba(255,255,255,0.95)",
                                fontWeight: "600",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px"
                            }}>
                                <Sparkles size={16} />
                                {searchResults.length > 0 
                                    ? `${searchResults.length}+ stunning photos available`
                                    : "Powered by Unsplash API"}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        style={{
                            background: "rgba(255,255,255,0.25)",
                            border: "none",
                            cursor: "pointer",
                            padding: "12px",
                            borderRadius: "12px",
                            display: "flex",
                            transition: "all 0.3s",
                            backdropFilter: "blur(12px)"
                        }}
                    >
                        <X size={26} color="white" strokeWidth={2.5} />
                    </button>
                </div>

                {/* Search Bar */}
                <div style={{ 
                    padding: "28px 36px", 
                    borderBottom: "1px solid #e2e8f0",
                    background: "linear-gradient(to bottom, #ffffff, #f8fafc)"
                }}>
                    <div style={{ display: "flex", gap: "14px" }}>
                        <div style={{ 
                            flex: 1, 
                            position: "relative",
                            display: "flex",
                            alignItems: "center"
                        }}>
                            <Search 
                                size={22} 
                                style={{ 
                                    position: "absolute", 
                                    left: "18px",
                                    color: "#94a3b8",
                                    pointerEvents: "none"
                                }} 
                            />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch(1)}
                                placeholder="Search: tropical beach, mountain sunset, city skyline..."
                                style={{
                                    width: "100%",
                                    padding: "16px 20px 16px 54px",
                                    border: "2px solid #e2e8f0",
                                    borderRadius: "14px",
                                    fontSize: "16px",
                                    outline: "none",
                                    transition: "all 0.3s",
                                    fontWeight: "500",
                                    backgroundColor: "white"
                                }}
                            />
                        </div>
                        <button
                            onClick={() => handleSearch(1)}
                            disabled={isSearching || !searchQuery.trim()}
                            style={{
                                background: "#000000",
                                border: "none",
                                color: "white",
                                padding: "16px 36px",
                                borderRadius: "14px",
                                fontWeight: "800",
                                fontSize: "16px",
                                letterSpacing: "0.3px",
                                cursor: (isSearching || !searchQuery.trim()) ? "not-allowed" : "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                opacity: (isSearching || !searchQuery.trim()) ? 0.6 : 1,
                                transition: "all 0.3s",
                                boxShadow: "0 6px 16px rgba(0,0,0,0.2)"
                            }}
                        >
                            {isSearching ? (
                                <>
                                    <Loader2 size={22} style={{ animation: "spin 1s linear infinite" }} />
                                    Searching...
                                </>
                            ) : (
                                <>
                                    <Search size={22} strokeWidth={2.5} />
                                    Search
                                </>
                            )}
                        </button>
                    </div>
                    
                    {/* Popular Searches */}
                    <div style={{ 
                        marginTop: "20px", 
                        display: "flex", 
                        gap: "10px", 
                        flexWrap: "wrap",
                        alignItems: "center"
                    }}>
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            fontSize: "14px",
                            color: "#64748b",
                            fontWeight: "700"
                        }}>
                            <TrendingUp size={18} />
                            Popular:
                        </div>
                        {[
                            "Tropical Beach", 
                            "Mountain Sunset", 
                            "City Skyline", 
                            "Forest Nature", 
                            "Ocean Waves",
                            "Desert Landscape",
                            "Waterfall",
                            "Aurora Borealis"
                        ].map(tag => (
                            <button
                                key={tag}
                                onClick={() => handleQuickSearch(tag)}
                                style={{
                                    padding: "8px 18px",
                                    border: "2px solid #e2e8f0",
                                    borderRadius: "24px",
                                    background: "white",
                                    fontSize: "13px",
                                    fontWeight: "700",
                                    color: "#64748b",
                                    cursor: "pointer",
                                    transition: "all 0.3s",
                                    boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
                                }}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Results Grid - Pinterest Masonry Style */}
                <div 
                    ref={scrollContainerRef}
                    style={{
                        flex: 1,
                        overflowY: "auto",
                        overflowX: "hidden",
                        padding: "24px 36px",
                        background: "#f8fafc"
                    }}
                >
                    {isSearching ? (
                        <div style={{
                            columnCount: 4,
                            columnGap: "16px",
                            breakInside: "avoid"
                        }}>
                            {[...Array(20)].map((_, i) => (
                                <div
                                    key={i}
                                    style={{
                                        height: `${getRandomHeight()}px`,
                                        marginBottom: "16px",
                                        background: "linear-gradient(135deg, #e2e8f0, #cbd5e1)",
                                        borderRadius: "16px",
                                        animation: "pulse 1.5s infinite",
                                        breakInside: "avoid",
                                        display: "inline-block",
                                        width: "100%"
                                    }}
                                />
                            ))}
                        </div>
                    ) : searchResults.length === 0 ? (
                        <div style={{
                            textAlign: "center",
                            padding: "100px 20px",
                            color: "#94a3b8"
                        }}>
                            <p style={{ 
                                fontSize: "24px", 
                                fontWeight: "800",
                                color: "#334155",
                                marginBottom: "12px",
                            }}>
                                {searchQuery ? "No images found" : "Start exploring"}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div style={{
                                columnCount: 4,
                                columnGap: "16px"
                            }}>
                                {searchResults.map((photo) => {
                                    const isSelected = selectedImage?.id === photo.id;
                                    const isHovered = hoveredImage === photo.id;
                                    
                                    return (
                                        <div
                                            key={photo.id}
                                            onClick={() => setSelectedImage(photo)}
                                            onMouseEnter={() => setHoveredImage(photo.id)}
                                            onMouseLeave={() => setHoveredImage(null)}
                                            style={{
                                                position: "relative",
                                                cursor: "pointer",
                                                borderRadius: "18px",
                                                overflow: "hidden",
                                                marginBottom: "16px",
                                                breakInside: "avoid",
                                                display: "inline-block",
                                                width: "100%",
                                                border: isSelected ? "4px solid #000000" : "none",
                                                transform: isHovered ? "scale(0.98)" : "scale(1)",
                                                transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                                                boxShadow: isSelected 
                                                    ? "0 24px 48px rgba(0,0,0,0.35)" 
                                                    : isHovered
                                                    ? "0 16px 32px rgba(0,0,0,0.2)"
                                                    : "0 4px 8px rgba(0,0,0,0.1)"
                                            }}
                                        >
                                            <img
                                                src={photo.src.medium}
                                                alt={photo.alt}
                                                loading="lazy"
                                                style={{
                                                    width: "100%",
                                                    height: "auto",
                                                    display: "block",
                                                    transition: "filter 0.4s",
                                                    filter: isHovered ? "brightness(0.88)" : "brightness(1)"
                                                }}
                                            />
                                            
                                            {isSelected && (
                                                <div style={{
                                                    position: "absolute",
                                                    top: "14px",
                                                    right: "14px",
                                                    background: "#000000",
                                                    borderRadius: "50%",
                                                    padding: "10px",
                                                    display: "flex",
                                                    boxShadow: "0 6px 16px rgba(0,0,0,0.5)",
                                                    animation: "scaleIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
                                                }}>
                                                    <Check size={22} color="white" strokeWidth={3.5} />
                                                </div>
                                            )}

                                            {isHovered && (
                                                <div style={{
                                                    position: "absolute",
                                                    bottom: 0,
                                                    left: 0,
                                                    right: 0,
                                                    background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 70%, transparent 100%)",
                                                    padding: "32px 18px 18px",
                                                    color: "white",
                                                    animation: "slideUp 0.4s ease-out"
                                                }}>
                                                    <div style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "10px",
                                                        fontSize: "13px",
                                                        fontWeight: "700"
                                                    }}>
                                                        <div style={{
                                                            background: "rgba(255,255,255,0.2)",
                                                            padding: "6px",
                                                            borderRadius: "8px",
                                                            backdropFilter: "blur(8px)"
                                                        }}>
                                                            <User size={16} strokeWidth={2.5} />
                                                        </div>
                                                        {photo.photographer}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {isLoadingMore && (
                                <div style={{
                                    display: "flex",
                                    justifyContent: "center",
                                    padding: "40px",
                                    gap: "14px",
                                    alignItems: "center"
                                }}>
                                    <Loader2 size={28} style={{ animation: "spin 1s linear infinite" }} />
                                    <span>Loading more images...</span>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer Actions */}
                {selectedImage && (
                    <div style={{
                        padding: "24px 36px",
                        borderTop: "2px solid #e2e8f0",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        background: "linear-gradient(to top, #f8fafc, white)",
                        boxShadow: "0 -8px 16px rgba(0,0,0,0.06)"
                    }}>
                        <div style={{ 
                            display: "flex", 
                            alignItems: "center", 
                            gap: "18px" 
                        }}>
                            <img 
                                src={selectedImage.src.small}
                                alt="Selected Preview"
                                style={{
                                    width: "72px",
                                    height: "72px",
                                    borderRadius: "14px",
                                    objectFit: "cover",
                                    border: "3px solid #000000",
                                }}
                            />
                            <div>
                                <p style={{ 
                                    margin: 0, 
                                    fontSize: "17px", 
                                    fontWeight: "800",
                                    color: "#1e293b"
                                }}>
                                    Selected Image
                                </p>
                                <p style={{ 
                                    margin: "4px 0 0 0", 
                                    fontSize: "14px", 
                                    color: "#64748b",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    fontWeight: "600"
                                }}>
                                    <User size={14} strokeWidth={2.5} />
                                    Photo by <strong>{selectedImage.photographer}</strong>
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleSelectImage}
                            disabled={isDownloading}
                            style={{
                                background: "#000000",
                                border: "none",
                                color: "white",
                                padding: "16px 36px",
                                borderRadius: "14px",
                                fontWeight: "800",
                                fontSize: "16px",
                                letterSpacing: "0.3px",
                                cursor: isDownloading ? "not-allowed" : "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                opacity: isDownloading ? 0.6 : 1,
                                transition: "all 0.3s"
                            }}
                        >
                            {isDownloading ? "Downloading..." : "Use This Image"}
                        </button>
                    </div>
                )}
            </div>
            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                @keyframes scaleIn {
                    from { transform: scale(0) rotate(-180deg); }
                    to { transform: scale(1) rotate(0deg); }
                }
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

// =============================================================================
// GEMINI INPUT MODAL
// =============================================================================
const GeminiInputModal = ({ isOpen, onClose, onGenerate, mode }) => {
    const [prompt, setPrompt] = useState("");
    const [attachedImage, setAttachedImage] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setPrompt("");
            setAttachedImage(null);
            setPreviewImage(null);
        }
    }, [isOpen]);
    
    if (!isOpen) return null;
  
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith("image/")) {
                alert("Please select a valid image file.");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setAttachedImage(reader.result);
                setPreviewImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeAttachment = () => {
        setAttachedImage(null);
        setPreviewImage(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSubmit = () => {
      if (!prompt.trim() && !attachedImage) return;
      onGenerate(prompt, attachedImage);
      onClose();
    };
  
    const placeholderText = {
        Title: "e.g., Best beaches in Siargao",
        Content: "e.g., Top attractions in Palawan",
        Image: "e.g., Tropical beach sunset with palm trees"
    };

    const helperText = {
        Title: "Enter a topic (or attach an image) to generate a catchy title.",
        Content: "Enter a topic (or attach an image) for Gemini to write a full article.",
        Image: "Describe the image you want, OR attach a reference photo for Gemini to copy the style/composition."
    };

    return (
      <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.6)", zIndex: 12000,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "20px"
      }}>
          <div style={{ 
              backgroundColor: "white", 
              padding: "24px", 
              borderRadius: "16px", 
              width: "100%",
              maxWidth: "500px",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)"
          }}>
              <h3 style={{ 
                  margin: "0 0 8px 0", 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "10px",
                  fontSize: "20px",
                  fontWeight: "700",
                  color: "#1e293b"
              }}>
                  {mode === "Image" ? (
                      <div style={{
                          background: "linear-gradient(135deg, #a855f7, #6366f1)",
                          padding: "8px",
                          borderRadius: "10px",
                          display: "flex"
                      }}>
                          <ImageIcon size={20} color="white" />
                      </div>
                  ) : (
                      <div style={{
                          background: "linear-gradient(135deg, #0ea5e9, #2563eb)",
                          padding: "8px",
                          borderRadius: "10px",
                          display: "flex"
                      }}>
                          <Sparkles size={20} color="white" />
                      </div>
                  )}
                  Generate {mode} with AI
              </h3>
              <p style={{
                  fontSize: "14px", 
                  color: "#64748b", 
                  marginBottom: "20px",
                  lineHeight: "1.6"
              }}>
                  {helperText[mode]}
              </p>

              {previewImage && (
                  <div style={{
                      position: "relative",
                      marginBottom: "16px",
                      width: "100%",
                      height: "150px",
                      borderRadius: "8px",
                      overflow: "hidden",
                      border: "1px solid #e2e8f0"
                  }}>
                      <img 
                        src={previewImage} 
                        alt="Attached Reference" 
                        style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                      />
                      <button 
                        onClick={removeAttachment}
                        style={{
                            position: "absolute",
                            top: "8px",
                            right: "8px",
                            background: "rgba(0,0,0,0.6)",
                            border: "none",
                            borderRadius: "50%",
                            padding: "6px",
                            cursor: "pointer",
                            color: "white",
                            display: "flex"
                        }}
                      >
                          <X size={14} />
                      </button>
                      <div style={{
                          position: "absolute",
                          bottom: "8px",
                          left: "8px",
                          background: "rgba(0,0,0,0.6)",
                          color: "white",
                          fontSize: "10px",
                          padding: "4px 8px",
                          borderRadius: "4px"
                      }}>
                          Reference Image
                      </div>
                  </div>
              )}

              <div style={{ position: "relative" }}>
                <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={placeholderText[mode]}
                    rows={mode === "Content" ? 5 : 3}
                    style={{ 
                        width: "100%", 
                        padding: "12px 16px", 
                        paddingBottom: "40px",
                        borderRadius: "10px", 
                        border: "2px solid #e2e8f0",
                        marginBottom: "20px",
                        fontSize: "14px",
                        fontFamily: "inherit",
                        resize: "vertical",
                        outline: "none",
                        transition: "border 0.2s"
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#0ea5e9"}
                    onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
                />
                
                <div style={{ 
                    position: "absolute", 
                    bottom: "30px", 
                    left: "12px",
                    display: "flex" 
                }}>
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        style={{ display: "none" }}
                        accept="image/*"
                        onChange={handleFileSelect}
                    />
                    <button 
                        type="button"
                        onClick={() => fileInputRef.current.click()}
                        title="Attach Reference Image"
                        style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                            color: attachedImage ? "#0ea5e9" : "#94a3b8",
                            fontSize: "12px",
                            fontWeight: "600"
                        }}
                    >
                        <Paperclip size={18} />
                        {attachedImage ? "Change Image" : "Attach Image"}
                    </button>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                  <button 
                      onClick={onClose} 
                      style={{ 
                          padding: "10px 20px", 
                          border: "2px solid #e2e8f0", 
                          borderRadius: "8px", 
                          background: "white", 
                          cursor: "pointer",
                          fontWeight: "600",
                          color: "#64748b",
                          transition: "all 0.2s"
                      }}
                      onMouseEnter={(e) => e.target.style.borderColor = "#cbd5e1"}
                      onMouseLeave={(e) => e.target.style.borderColor = "#e2e8f0"}
                  >
                      Cancel
                  </button>
                  <button 
                      onClick={handleSubmit} 
                      disabled={!prompt.trim() && !attachedImage}
                      style={{ 
                          padding: "10px 24px", 
                          border: "none", 
                          borderRadius: "8px", 
                          background: mode === "Image" 
                              ? "linear-gradient(135deg, #a855f7, #6366f1)"
                              : "linear-gradient(135deg, #0ea5e9, #2563eb)", 
                          color: "white", 
                          cursor: (prompt.trim() || attachedImage) ? "pointer" : "not-allowed",
                          fontWeight: "600",
                          opacity: (prompt.trim() || attachedImage) ? 1 : 0.6,
                          display: "flex",
                          alignItems: "center",
                          gap: "8px"
                      }}
                  >
                      <Sparkles size={16} />
                      Generate
                  </button>
              </div>
          </div>
      </div>
    );
};

// =============================================================================
// MAIN COMPONENT - ADD BLOG
// =============================================================================
const AddBlog = () => {
  const navigate = useNavigate();
  const toast = useToast(); 
  const API_BASE_URL = "https://wanderwaveph-backend.onrender.com"; 

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const [blogDetails, setBlogDetails] = useState({
    title: "",
    author: "",
    category: "",
    content: "",
    status: "Published",
    scheduledAt: "", 
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isAiLoading, setIsAiLoading] = useState(false);
  const [geminiModalOpen, setGeminiModalOpen] = useState(false);
  const [unsplashModalOpen, setUnsplashModalOpen] = useState(false);
  const [geminiMode, setGeminiMode] = useState("Content");
  const [aiProgress, setAiProgress] = useState("");

  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "primary",
    onConfirm: () => {},
  });

  const openGeminiModal = (mode) => {
    setGeminiMode(mode);
    setGeminiModalOpen(true);
  };

  const openUnsplashModal = () => {
    setUnsplashModalOpen(true);
  };

  const handleUnsplashSelect = async (imageData) => {
    try {
        // Convert URL to File object
        const response = await fetch(imageData.url);
        const blob = await response.blob();
        const file = new File([blob], `unsplash-${imageData.alt}.jpg`, { type: "image/jpeg" });
        
        setImageFile(file);
        setImagePreview(imageData.url);
        
        toast.success(
            `Image by ${imageData.photographer} added successfully!`,
            "✅ Image Selected",
            4000
        );
    } catch (error) {
        console.error("Error handling Unsplash image:", error);
        toast.error("Failed to load image", "❌ Error");
    }
  };

  const handleAiSubmit = async (prompt, attachedImageBase64) => {
    setIsAiLoading(true);
    const progressText = attachedImageBase64 
        ? "Analyzing image & connecting to AI..." 
        : "Connecting to AI server...";
    setAiProgress(progressText);

    try {
        const response = await fetch(`${API_BASE_URL}/api/blogs/generate-ai`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                prompt: prompt, 
                type: geminiMode,
                image: attachedImageBase64
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || data.error || "AI generation failed");
        }

        if (geminiMode === "Image") {
            if (data.generatedImage) {
                setAiProgress("Converting AI image...");
                const res = await fetch(data.generatedImage);
                const blob = await res.blob();
                const file = new File([blob], "ai-generated-cover.png", { type: "image/png" });
                setImageFile(file);
                setImagePreview(data.generatedImage);
                toast.success("AI cover image created successfully!", "🎨 Image Generated", 4000);
            } else {
                throw new Error("No image data received");
            }
        } 
        else if (geminiMode === "Title") {
            if (data.generatedText) {
                const cleanTitle = data.generatedText
                    .replace(/['"]/g, "")
                    .replace(/^Title:\s*/i, "")
                    .trim();
                setBlogDetails(prev => ({ ...prev, title: cleanTitle }));
                toast.success("Blog title generated!", "✨ Title Created", 3000);
            }
        } 
        else if (geminiMode === "Content") {
            if (data.generatedText) {
                setBlogDetails(prev => ({ ...prev, content: data.generatedText }));
                toast.success("Blog content generated successfully!", "✨ Content Ready", 4000);
            }
        }

    } catch (error) {
        console.error("❌ AI Generation Error:", error);
        toast.error(
            `Failed to generate ${geminiMode.toLowerCase()}: ${error.message}`, 
            "❌ AI Error", 
            5000
        );
    } finally {
        setIsAiLoading(false);
        setAiProgress("");
    }
  };

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
        !blogDetails.title &&
        !blogDetails.author &&
        !blogDetails.category &&
        !blogDetails.content &&
        blogDetails.status === "Published" &&
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
        ...blogDetails,
        image: imageBase64,
        imageMeta: imageMeta,
      });
    };

    const timeoutId = setTimeout(() => {
      updateDraft();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [blogDetails, imageFile]);

  const restoreDraftData = async (data) => {
    if (!data) return;
    setBlogDetails({
      title: data.title || "",
      author: data.author || "",
      category: data.category || "",
      content: data.content || "",
      status: data.status || "Published",
      scheduledAt: data.scheduledAt || "", 
    });
    if (data.image && data.imageMeta) {
      try {
        const restoredFile = await base64ToFile(
          data.image,
          data.imageMeta.name,
          data.imageMeta.type
        );
        setImageFile(restoredFile);
        setImagePreview(URL.createObjectURL(restoredFile));
      } catch (err) {
        console.error("Failed to restore image:", err);
      }
    }
  };

  const { clearDraft, hasDraft, restoreDraft, discardDraft, draftInfo } =
    useAutoDraft({
      module: "add-blog",
      formData: draftPayload,
      setFormData: restoreDraftData,
      imagePreview: imagePreview,
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
    toast.success(
      "Your blog draft has been restored successfully!",
      "✅ Draft Restored",
      3000
    );
  };

  const handleDiscardDraft = async () => {
    await discardDraft();
    setShowRestoreModal(false);
    toast.info("Draft has been discarded.", "🗑️ Discarded");
  };

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBlogDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error(
          "Please upload a valid image file (JPG, PNG, WebP).",
          "❌ Invalid File"
        );
        return;
      }
      setImageFile(file);
      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);
      toast.success(
        `Cover image "${file.name}" uploaded successfully!`,
        "✅ Image Added"
      );
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    toast.info("Cover image removed.", "🗑️ Image Removed");
  };

  const executeSubmit = async () => {
    setIsSubmitting(true);
    const actionText = blogDetails.status === "Scheduled" ? "Scheduling" : "Publishing";
    toast.info(`${actionText} blog post...`, "📤 Please Wait", 2000);

    try {
      const formData = new FormData();
      formData.append("title", blogDetails.title);
      formData.append("author", blogDetails.author);
      formData.append("category", blogDetails.category);
      formData.append("content", blogDetails.content);
      formData.append("status", blogDetails.status);
      
      if (blogDetails.status === "Scheduled" && blogDetails.scheduledAt) {
        formData.append("scheduledAt", blogDetails.scheduledAt);
      }

      formData.append("image", imageFile);

      try {
        const adminData = JSON.parse(localStorage.getItem("adminData") || "{}");
        const activeUser = adminData.email || adminData.username || adminData.user || "Unknown User";
        const activeId = adminData.id || adminData._id || "";
        formData.append("userEmail", activeUser);
        formData.append("adminId", activeId);
      } catch (err) {
        console.error("Error parsing admin data:", err);
      }

      const response = await fetch(`${API_BASE_URL}/api/blogs/add`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        const successMsg = blogDetails.status === "Scheduled" 
            ? "Blog post has been scheduled successfully!" 
            : `Blog post "${blogDetails.title}" has been published successfully!`;
        toast.success(successMsg, "✅ Success", 5000);
        await clearDraft();
        setBlogDetails({
          title: "",
          author: "",
          category: "",
          content: "",
          status: "Published",
          scheduledAt: "", 
        });
        setImageFile(null);
        setImagePreview(null);
      } else {
        const errorMessage = result.message || "Unknown error occurred";
        toast.error(`Failed to process: ${errorMessage}`, "❌ Failed", 5000);
      }
    } catch (error) {
      console.error("❌ Network Error:", error);
      toast.error(`Unable to connect to server: ${error.message}.`, "❌ Connection Error", 6000);
    } finally {
      setIsSubmitting(false);
      setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!blogDetails.title || !blogDetails.content || !imageFile) {
      toast.warning("Please provide a title, content, and cover image.", "⚠️ Incomplete Form");
      return;
    }

    if (blogDetails.status === "Scheduled") {
        if (!blogDetails.scheduledAt) {
            toast.warning("Please select a date and time for the scheduled post.", "⚠️ Missing Date");
            return;
        }
        const scheduleDate = new Date(blogDetails.scheduledAt);
        const now = new Date();
        if (scheduleDate <= now) {
            toast.warning("Scheduled time must be in the future.", "⚠️ Invalid Date");
            return;
        }
    }

    const confirmTitle = blogDetails.status === "Scheduled" ? "Schedule Blog?" : "Publish Blog?";
    const confirmMsg = blogDetails.status === "Scheduled"
        ? `Are you sure you want to schedule this blog for ${new Date(blogDetails.scheduledAt).toLocaleString()}?`
        : "Are you sure you want to publish this blog post now?";

    setConfirmConfig({
      isOpen: true,
      title: confirmTitle,
      message: confirmMsg,
      type: "primary",
      onConfirm: executeSubmit,
    });
  };

  const handleCancel = () => {
    setConfirmConfig({
      isOpen: true,
      title: "Discard Changes?",
      message: "Are you sure you want to cancel? All unsaved changes will be lost.",
      type: "danger",
      onConfirm: async () => {
        await clearDraft();
        setBlogDetails({
          title: "",
          author: "",
          category: "",
          content: "",
          status: "Published",
          scheduledAt: "",
        });
        setImageFile(null);
        setImagePreview(null);
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        toast.info("Action cancelled and form cleared.", "❌ Cancelled");
      },
    });
  };

  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="blog-page">
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
        onCancel={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
      />

      <GeminiInputModal 
        isOpen={geminiModalOpen}
        onClose={() => setGeminiModalOpen(false)}
        onGenerate={handleAiSubmit}
        mode={geminiMode}
      />

      <UnsplashSearchModal 
        isOpen={unsplashModalOpen}
        onClose={() => setUnsplashModalOpen(false)}
        onSelectImage={handleUnsplashSelect}
      />

      {isAiLoading && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.7)",
          zIndex: 13000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "20px"
        }}>
          <div style={{
            background: "white",
            padding: "30px 40px",
            borderRadius: "16px",
            textAlign: "center",
            maxWidth: "400px"
          }}>
            <Loader2 
              size={48} 
              style={{ 
                animation: "spin 1s linear infinite",
                color: "#0ea5e9",
                marginBottom: "16px"
              }} 
            />
            <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "700" }}>
              Generating {geminiMode}...
            </h3>
            <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>
              {aiProgress || "AI is processing your request"}
            </p>
          </div>
        </div>
      )}

      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />

      <main className={`blog-main ${isSidebarCollapsed ? "blog-main--collapsed" : ""}`}>
        <div className="blog-container">
          <header className="blog-header">
            <div className="blog-header-content">
              <h1 className="blog-title">NEW BLOG</h1>
              <p className="blog-subtitle">Share travel tips, news, and stories with your audience</p>
            </div>
          </header>

          <form onSubmit={handleSubmit}>
            <div className="blog-grid">
              <div className="blog-left">
                <section className="blog-section">
                  <h2 className="blog-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      BLOG COVER IMAGE
                      <div style={{ display: 'flex', gap: '10px' }}>
                          <button 
                            type="button"
                            onClick={openUnsplashModal}
                            disabled={isAiLoading}
                            style={{
                                background: "#000000",
                                border: "none",
                                color: "white",
                                padding: "8px 14px",
                                borderRadius: "8px",
                                fontSize: "13px",
                                fontWeight: "600",
                                cursor: isAiLoading ? "not-allowed" : "pointer",
                                display: "flex", 
                                alignItems: "center", 
                                gap: "6px",
                                opacity: isAiLoading ? 0.6 : 1,
                                transition: "all 0.2s"
                            }}
                          >
                              <Globe size={16} />
                              Browse Unsplash
                          </button>
                          <button 
                            type="button"
                            onClick={() => openGeminiModal("Image")}
                            disabled={isAiLoading}
                            style={{
                                background: "linear-gradient(135deg, #a855f7, #6366f1)",
                                border: "none",
                                color: "white",
                                padding: "8px 14px",
                                borderRadius: "8px",
                                fontSize: "13px",
                                fontWeight: "600",
                                cursor: isAiLoading ? "not-allowed" : "pointer",
                                display: "flex", 
                                alignItems: "center", 
                                gap: "6px",
                                opacity: isAiLoading ? 0.6 : 1,
                                transition: "all 0.2s"
                            }}
                          >
                              <ImageIcon size={16} />
                              Generate AI
                          </button>
                      </div>
                  </h2>
                  {!imagePreview ? (
                    <div className="b-upload-zone-wrapper">
                      <label className="b-upload-label-poster" style={{ cursor: "pointer" }}>
                        <input
                          type="file"
                          id="blog-upload"
                          accept="image/*"
                          onChange={handleImageChange}
                          hidden
                        />
                        <div className="b-upload-icon-box">
                          <Upload size={32} />
                        </div>
                        <p style={{ fontWeight: "700", color: "#1e293b", margin: "0" }}>
                          Click to upload cover image
                        </p>
                        <span style={{ fontSize: "12px", color: "#64748b" }}>
                          JPG, PNG or WebP (Max 5MB)
                        </span>
                      </label>
                    </div>
                  ) : (
                    <div className="b-upload-preview-box">
                      <img src={imagePreview} alt="Preview" />
                      <div className="b-upload-actions">
                        <label className="b-upload-change-btn">
                          <input
                            type="file"
                            onChange={handleImageChange}
                            accept="image/*"
                            hidden
                          />
                          Change
                        </label>
                        <button type="button" className="b-upload-remove-btn" onClick={removeImage}>
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
                </section>

                <section className="blog-section">
                  <h2 className="blog-section-title">BLOG DETAILS</h2>
                  <div className="blog-fields">
                    <div className="blog-field blog-field--full">
                      <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          Blog Title
                          <button 
                             type="button"
                             onClick={() => openGeminiModal("Title")}
                             disabled={isAiLoading}
                             style={{
                                 border: "none", 
                                 background: "transparent", 
                                 color: "#a855f7",
                                 fontSize: "13px", 
                                 fontWeight: "600", 
                                 cursor: isAiLoading ? "not-allowed" : "pointer",
                                 display: "flex", 
                                 alignItems: "center", 
                                 gap: "6px",
                                 opacity: isAiLoading ? 0.5 : 1
                             }}
                          >
                              <Wand2 size={16} />
                              Auto-Generate
                          </button>
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={blogDetails.title}
                        onChange={handleChange}
                        placeholder="e.g., Top 10 Hidden Gems in Palawan"
                        required
                      />
                    </div>

                    <div className="blog-field">
                      <label>Author</label>
                      <input
                        type="text"
                        name="author"
                        value={blogDetails.author}
                        onChange={handleChange}
                        placeholder="e.g., Admin Team"
                      />
                    </div>

                    <div className="blog-field">
                      <label>Category</label>
                      <select
                        name="category"
                        value={blogDetails.category}
                        onChange={handleChange}
                      >
                        <option value="" disabled>Select Category</option>
                        <option value="Trending Stories">Trending Stories</option>
                        <option value="Travel Guide">Travel Guide</option>
                        <option value="News & Updates">News & Updates</option>
                        <option value="Promos">Latest Promos</option>
                        <option value="Tips">Travel Tips</option>
                      </select>
                    </div>

                    <div className="blog-field blog-field--full">
                      <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          Content Body
                          <button 
                             type="button"
                             onClick={() => openGeminiModal("Content")}
                             disabled={isAiLoading}
                             style={{
                                 background: "linear-gradient(135deg, #0ea5e9, #2563eb)",
                                 border: "none", 
                                 color: "white", 
                                 padding: "6px 12px",
                                 borderRadius: "8px", 
                                 fontSize: "12px", 
                                 fontWeight: "600",
                                 cursor: isAiLoading ? "not-allowed" : "pointer",
                                 display: "flex", 
                                 alignItems: "center", 
                                 gap: "6px",
                                 opacity: isAiLoading ? 0.6 : 1
                             }}
                          >
                              <Sparkles size={14} />
                              Write with Gemini
                          </button>
                      </label>
                      <textarea
                        name="content"
                        value={blogDetails.content}
                        onChange={handleChange}
                        placeholder="Write your story here..."
                        rows="10"
                        required
                      ></textarea>
                    </div>

                    <div className="blog-field">
                      <label>Status</label>
                      <select
                        name="status"
                        value={blogDetails.status}
                        onChange={handleChange}
                      >
                        <option value="Published">Published</option>
                        <option value="Draft">Draft</option>
                        <option value="Scheduled">Scheduled</option> 
                      </select>
                    </div>

                    {blogDetails.status === 'Scheduled' && (
                        <div className="blog-field">
                            <label>Schedule Date & Time</label>
                            <input
                                type="datetime-local"
                                name="scheduledAt"
                                value={blogDetails.scheduledAt}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    )}
                  </div>
                </section>
              </div>

              <aside className="blog-right">
                <div className="blog-preview-card">
                  <span className="blog-preview-label">BLOG PREVIEW</span>

                  <div className="bp-card">
                    <div className="bp-image-wrapper">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Blog Cover" />
                      ) : (
                        <div className="bp-placeholder">
                          <FileText size={40} />
                        </div>
                      )}
                      {blogDetails.category && (
                        <span className="bp-category-tag">{blogDetails.category}</span>
                      )}
                    </div>

                    <div className="bp-content">
                      <h3 className="bp-title">
                        {blogDetails.title || "Your Blog Title Here"}
                      </h3>

                      <div className="bp-meta">
                        <div className="bp-meta-item">
                          <User size={12} />
                          <span>{blogDetails.author || "Author"}</span>
                        </div>
                        <div className="bp-meta-item">
                          {blogDetails.status === 'Scheduled' && blogDetails.scheduledAt ? (
                             <>
                             <Calendar size={12} />
                             <span>{new Date(blogDetails.scheduledAt).toLocaleDateString()}</span>
                             </>
                          ) : (
                             <span>• {currentDate}</span>
                          )}
                        </div>
                      </div>

                      <p className="bp-excerpt">
                        {blogDetails.content
                          ? blogDetails.content.replace(/<[^>]*>/g, '').substring(0, 100) + "..."
                          : "Preview of your blog content will appear here..."}
                      </p>

                      <div className="bp-readmore">Read Article →</div>
                    </div>
                  </div>
                </div>

                <div className="blog-actions">
                  <button
                    type="button"
                    className="blog-btn blog-btn--cancel"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="blog-btn blog-btn--submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="vb-spinner" size={18} />{" "}
                        Processing...
                      </>
                    ) : (
                      blogDetails.status === 'Scheduled' ? 'Schedule Post' : 'Publish'
                    )}
                  </button>
                </div>
              </aside>
            </div>
          </form>
        </div>
      </main>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .vb-spinner {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default AddBlog;