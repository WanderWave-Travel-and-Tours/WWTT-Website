import { useState, useRef, useEffect } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react'; 
import './browseCategory.css';

function BrowseCategory({ title, categories, selectedFilter, onFilterChange, onCategoryClick }) {
  const scrollerRef = useRef(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [atEnd, setAtEnd] = useState(false);
  const [categoryScope, setCategoryScope] = useState('all'); 
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

  const filteredCategories = categories.filter(category => {
    if (category.id === 'all') return false; 
    if (categoryScope === 'all') return true;
    return category.scope === categoryScope;
  });

  useEffect(() => {
    handleScroll();
    if (scrollerRef.current) {
      scrollerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  }, [categoryScope, categories]);


  return (
    <section className="browse-category-section">
      <h2 className="category-section-title">{title}</h2>
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

      <div className="category-slider-container">
        
        <div 
          className="category-scroller" 
          ref={scrollerRef} 
          onScroll={handleScroll}
        >
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