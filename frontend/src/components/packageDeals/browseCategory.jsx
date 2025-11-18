import { useState, useRef, useEffect } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react'; 
import './BrowseCategory.css';

// Tinanggal na ang 'title' sa props, dahil gagamitin natin ang bago
function BrowseCategory({ title, categories, selectedFilter, onFilterChange, onCategoryClick }) {
  const scrollerRef = useRef(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [atEnd, setAtEnd] = useState(false);

  // --- BAGONG STATE PARA SA CATEGORY FILTERS ---
  const [categoryScope, setCategoryScope] = useState('all'); // 'all', 'local', 'international'

  const handleScrollPrev = () => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const handleScrollNext = () => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  const handleScroll = () => {
    if (scrollerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollerRef.current;
      setScrollPosition(scrollLeft);
      setAtEnd(scrollLeft + clientWidth >= scrollWidth - 5);
    }
  };

  // I-filter ang categories bago i-render
  // Tandaan: Tinanggal natin ang 'all' sa filtering para di siya mawala
  const filteredCategories = categories.filter(category => {
    if (category.id === 'all') return false; // Huwag ipakita ang 'All Packages' card
    if (categoryScope === 'all') return true;
    return category.scope === categoryScope;
  });

  // I-reset ang scroll position pag nagbago ang filter
  useEffect(() => {
    handleScroll();
    if (scrollerRef.current) {
      scrollerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  }, [categoryScope, categories]);


  return (
    <section className="browse-category-section">
      <h2 className="category-section-title">{title}</h2>
      
      {/* --- BAGONG CATEGORY FILTER BUTTONS --- */}
      <div className="scope-filter-container">
        <button 
          className={`scope-filter-btn ${categoryScope === 'all' ? 'active' : ''}`}
          onClick={() => setCategoryScope('all')}
        >
          All
        </button>
        <button 
          className={`scope-filter-btn ${categoryScope === 'local' ? 'active' : ''}`}
          onClick={() => setCategoryScope('local')}
        >
          Local
        </button>
        <button 
          className={`scope-filter-btn ${categoryScope === 'international' ? 'active' : ''}`}
          onClick={() => setCategoryScope('international')}
        >
          International
        </button>
      </div>
      {/* --- END OF BUTTONS --- */}

      <div className="category-slider-container">
        
        <div 
          className="category-scroller" 
          ref={scrollerRef} 
          onScroll={handleScroll}
        >
          {/* Idagdag ang 'All Packages' button nang manu-mano sa unahan */}
          <button
              key="all"
              className={`category-card ${selectedFilter === 'all' ? 'active' : ''}`}
              onClick={() => {
                onFilterChange('all');
                if (onCategoryClick) {
                  onCategoryClick();
                }
              }}
            >
              <div className="category-image-wrapper">
                <img 
                  src="https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/6911b2d6d1ba95589cf4b863.jpg"
                  alt="All Packages"
                  className="category-image"
                />
              </div>
              <div className="category-info">
                <span className="category-label">All Packages</span>
                <span className="category-subtitle">All Destinations</span>
              </div>
            </button>
          
          {/* I-render ang na-filter na categories */}
          {filteredCategories.map(category => (
            <button
              key={category.id}
              className={`category-card ${selectedFilter === category.id ? 'active' : ''}`}
              onClick={() => {
                onFilterChange(category.id);
                if (onCategoryClick) {
                  onCategoryClick();
                }
              }}
            >
              <div className="category-image-wrapper">
                <img 
                  src={category.image} 
                  alt={category.name}
                  className="category-image"
                />
              </div>
              
              <div className="category-info">
                <span className="category-label">{category.name}</span>
                <span className="category-subtitle">{category.subtitle}</span>
              </div>
            </button>
          ))}
        </div>

        {scrollPosition > 0 && (
          <button 
            className="scroll-arrow-btn scroll-arrow-left" 
            onClick={handleScrollPrev}
            aria-label="Scroll previous"
          >
            <ChevronLeft size={20} />
          </button>
        )}

        {!atEnd && (
          <button 
            className="scroll-arrow-btn scroll-arrow-right" 
            onClick={handleScrollNext}
            aria-label="Scroll next"
          >
            <ChevronRight size={20} />
          </button>
        )}
      </div>
    </section>
  );
}

export default BrowseCategory;