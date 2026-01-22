import React, { useState, useEffect, useRef } from "react";
import { 
  Search, 
  X, 
  Loader2, 
  Globe, 
  Sparkles, 
  User, 
  Check, 
  TrendingUp 
} from "lucide-react";

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
      const response = await fetch(`${API_BASE_URL}/api/blogs/download-unsplash`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: selectedImage.src.large2x || selectedImage.src.regular,
          photographer: selectedImage.photographer,
          alt: selectedImage.alt,
          photoId: selectedImage.id,
          downloadLocation: selectedImage.downloadLocation
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
      position: "fixed", 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.85)", 
      zIndex: 12000,
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
      padding: "20px", 
      backdropFilter: "blur(8px)"
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
          background: "linear-gradient(135deg, #000000 0%, #333333 100%)"
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
                placeholder="Search for stunning travel photos..."
                style={{
                  width: "100%",
                  padding: "16px 18px 16px 54px",
                  fontSize: "16px",
                  fontWeight: "600",
                  border: "3px solid #e2e8f0",
                  borderRadius: "14px",
                  outline: "none",
                  transition: "all 0.3s",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.05)"
                }}
              />
            </div>
            <button 
              onClick={() => handleSearch(1)}
              disabled={!searchQuery.trim()}
              style={{
                padding: "0 32px",
                background: "linear-gradient(135deg, #000000 0%, #333333 100%)",
                color: "white",
                border: "none",
                borderRadius: "14px",
                fontWeight: "800",
                fontSize: "15px",
                cursor: searchQuery.trim() ? "pointer" : "not-allowed",
                opacity: searchQuery.trim() ? 1 : 0.5,
                transition: "all 0.3s",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
              }}
            >
              <Search size={20} strokeWidth={2.5} />
              Search
            </button>
          </div>

          {/* Quick Search Tags */}
          <div style={{ 
            display: "flex", 
            gap: "10px", 
            marginTop: "18px", 
            flexWrap: "wrap",
            alignItems: "center" 
          }}>
            <TrendingUp size={18} color="#64748b" strokeWidth={2.5} />
            {[
              "Travel", 
              "Beach", 
              "Mountains", 
              "Sunset", 
              "City", 
              "Nature",
              "Ocean",
              "Adventure",
              "Landscape",
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

export default UnsplashSearchModal;