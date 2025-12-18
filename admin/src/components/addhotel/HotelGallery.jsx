import "./HotelGallery.css";

const HotelGallery = ({ galleryFiles, setGalleryFiles }) => {
  const handleGalleryChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const newGalleryItems = files.map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }));
      setGalleryFiles(prev => [...prev, ...newGalleryItems]);
    }
  };

  const removeGalleryImage = (indexToRemove) => {
    setGalleryFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  return (
    <section className="hotel-section">
      <h2 className="hotel-section-title">HOTEL GALLERY</h2>
      <div className="hotel-gallery-grid">
        <label className="hotel-upload-box">
          <input
            type="file"
            onChange={handleGalleryChange}
            accept="image/*"
            multiple
            hidden
          />
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <span>Add Photos</span>
        </label>

        {galleryFiles.map((item, index) => (
          <div key={index} className="hotel-gallery-item">
            <img src={item.preview} alt={`Gallery ${index}`} />
            <button
              type="button"
              className="hotel-remove-image-btn"
              onClick={() => removeGalleryImage(index)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <p className="hotel-gallery-helper">
        {galleryFiles.length} photo{galleryFiles.length !== 1 ? 's' : ''} selected
      </p>
    </section>
  );
};

export default HotelGallery;