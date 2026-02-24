import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Search, Plus, CheckCircle, XCircle, 
  Package, RotateCcw, AlertCircle, DollarSign
} from 'lucide-react';
import './PackageCustomizer.css';

const PackageCustomizer = ({ 
  pkg, 
  currency = 'PHP', 
  exchangeRate = 58,
  onCustomizationChange,
  timerExpired = false,
  activeBasePrice = null
}) => {
  const [customizedInclusions, setCustomizedInclusions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableActivities, setAvailableActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCustomPrice, setTotalCustomPrice] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
  const [error, setError] = useState('');
  const [matchedInclusionCount, setMatchedInclusionCount] = useState(0);
  const hasFetchedRef = useRef(false);
  const currentDestinationRef = useRef('');

  const SYNONYM_MAP = {
    'flight': ['airfare', 'air', 'plane', 'aviation', 'ticket', 'roundtrip', 'round trip', 'rt'],
    'airfare': ['flight', 'air', 'plane', 'ticket', 'roundtrip', 'round trip'],
    'roundtrip': ['round trip', 'return', 'twoway', 'two way', 'rt', 'flight', 'airfare', 'air'],
    'round': ['roundtrip', 'return'], 
    'trip': ['journey', 'travel'],
    'oneway': ['one way', 'single', 'ow'],
    
    'accommodation': ['hotel', 'lodging', 'stay', 'room', 'inn'],
    'hotel': ['accommodation', 'lodging', 'inn', 'resort'],
    'resort': ['hotel', 'accommodation', 'inn'],
    'room': ['accommodation', 'hotel', 'lodging'],
    
    'transport': ['transfer', 'transportation', 'shuttle', 'vehicle', 'ride'],
    'transfer': ['transport', 'shuttle', 'pickup', 'dropoff'],
    'van': ['vehicle', 'shuttle', 'transport'],
    'tricycle': ['trike', 'vehicle'],
    'boat': ['ferry', 'vessel', 'ship'],
    
    'meal': ['food', 'dining', 'breakfast', 'lunch', 'dinner'],
    'breakfast': ['meal', 'food', 'morning'],
    'lunch': ['meal', 'food', 'midday', 'luncheon'],
    'dinner': ['meal', 'food', 'evening', 'supper'],
    
    'tour': ['trip', 'excursion', 'visit', 'sightseeing', 'experience'],
    'island': ['isle', 'islet'],
    'hopping': ['hop', 'jumping', 'tour'],
    'snorkel': ['snorkeling', 'diving', 'underwater', 'swim'],
    'dive': ['diving', 'snorkel', 'underwater'],
    'trek': ['trekking', 'hike', 'hiking', 'walking'],
    'climb': ['climbing', 'ascent', 'hike'],
    'beach': ['shore', 'coast', 'seaside'],
    'coastal': ['coast', 'beach', 'shore', 'seaside'],
    
    'guide': ['escort', 'leader', 'companion'],
    'entrance': ['admission', 'entry', 'fee', 'ticket'],
    'museum': ['gallery', 'exhibit'],
  };

  const CROSS_DESTINATION_KEYWORDS = [
    'roundtrip', 'round trip', 'rt', 'flight', 'airfare', 'air ticket',
    'return flight', 'return ticket', 'plane ticket'
  ];

  const getSynonyms = (word) => {
    const lower = word.toLowerCase();
    const syns = SYNONYM_MAP[lower] || [];
    return [lower, ...syns];
  };

  const isCrossDestinationActivity = (activityText) => {
    const normalized = activityText.toLowerCase();
    return CROSS_DESTINATION_KEYWORDS.some(keyword => 
      normalized.includes(keyword)
    );
  };

  const extractLocationKeywords = (destination) => {
    if (!destination) return [];
    
    const normalized = destination
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    const wordsToRemove = [
      'tour', 'package', 'trip', 'travel', 'holiday', 'vacation',
      'day', 'days', 'night', 'nights', 'd', 'n',
      'island', 'city', 'province', 'municipality', 'region'
    ];
    
    const words = normalized.split(' ');
    
    const locationKeywords = words.filter(word => {
      if (word.length < 3) return false;
      if (wordsToRemove.includes(word)) return false;
      if (/^\d+$/.test(word)) return false;
      return true;
    });
    
    const mainLocation = locationKeywords.length > 0 ? locationKeywords[0] : '';
    
    return {
      keywords: locationKeywords,
      mainLocation: mainLocation,
      fullNormalized: normalized
    };
  };

  const destinationsMatch = (rateDestination, packageDestination, activityName = '') => {
    if (!rateDestination || !packageDestination) return false;
    
    if (activityName && isCrossDestinationActivity(activityName)) {
      
      const pkgLoc = extractLocationKeywords(packageDestination);
      const rateLoc = extractLocationKeywords(rateDestination);
      
      if (pkgLoc.mainLocation) {
        const rateDestLower = rateDestination.toLowerCase();
        const pkgLocLower = pkgLoc.mainLocation.toLowerCase();
        
        if (rateDestLower.includes(pkgLocLower)) {
          return true;
        }
      }
      
      const hasKeywordMatch = pkgLoc.keywords.some(kw => 
        rateDestination.toLowerCase().includes(kw)
      );
      
      if (hasKeywordMatch) {
        return true;
      }
    }
    
    const loc1 = extractLocationKeywords(rateDestination);
    const loc2 = extractLocationKeywords(packageDestination);
    
    if (loc1.mainLocation && loc2.mainLocation) {
      if (loc1.mainLocation === loc2.mainLocation) {
        return true;
      }
    }
    
    const hasCommonKeyword = loc1.keywords.some(k1 => 
      loc2.keywords.some(k2 => k1 === k2 || k1.includes(k2) || k2.includes(k1))
    );
    
    if (hasCommonKeyword) {
      return true;
    }
    
    if (loc1.mainLocation && packageDestination.toLowerCase().includes(loc1.mainLocation)) {
      return true;
    }
    
    if (loc2.mainLocation && rateDestination.toLowerCase().includes(loc2.mainLocation)) {
      return true;
    }
    
    const norm1 = loc1.fullNormalized;
    const norm2 = loc2.fullNormalized;
    
    if (norm1.length >= 5 && norm2.length >= 5) {
      if (norm1.includes(norm2) || norm2.includes(norm1)) {
        return true;
      }
    }
    
    return false;
  };

  const normalizeActivity = (activity) => {
    if (!activity) return '';
    
    let normalized = activity
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    normalized = normalized
      .replace(/roundtrip/g, 'round trip')
      .replace(/twoway/g, 'two way')
      .replace(/oneway/g, 'one way');
    
    return normalized;
  };

  const extractKeywords = (text) => {
    const normalized = normalizeActivity(text);
    const words = normalized.split(' ');
    
    const noiseWords = ['the', 'and', 'or', 'with', 'for', 'in', 'on', 'at', 'to', 'from', 'a', 'an'];
    
    const keywords = words
      .filter(w => w.length >= 3 && !noiseWords.includes(w))
      .map(word => ({
        word,
        length: word.length,
        synonyms: getSynonyms(word)
      }));
    
    return keywords;
  };

  const calculateSimilarity = (text1, text2) => {
    const keywords1 = extractKeywords(text1);
    const keywords2 = extractKeywords(text2);
    
    if (keywords1.length === 0 || keywords2.length === 0) {
      return 0;
    }
    
    let matchScore = 0;
    let totalPossibleScore = 0;
    
    const text1Lower = text1.toLowerCase();
    const text2Lower = text2.toLowerCase();
    const flightKeywords = ['roundtrip', 'round trip', 'flight', 'airfare', 'air ticket', 'rt'];
    const hasFlightTerm1 = flightKeywords.some(k => text1Lower.includes(k));
    const hasFlightTerm2 = flightKeywords.some(k => text2Lower.includes(k));
    
    if (hasFlightTerm1 && hasFlightTerm2) {
      matchScore += 10; 
      totalPossibleScore += 10;
    }
    
    keywords1.forEach(kw1 => {
      const weight = Math.min(kw1.length / 4, 3);
      totalPossibleScore += weight * 3;
      
      keywords2.forEach(kw2 => {
        if (kw1.word === kw2.word) {
          matchScore += weight * 3;
        }
      });
    });
    
    keywords1.forEach(kw1 => {
      const weight = Math.min(kw1.length / 4, 3);
      
      keywords2.forEach(kw2 => {
        const areSynonyms = kw1.synonyms.some(syn => kw2.synonyms.includes(syn));
        if (areSynonyms && kw1.word !== kw2.word) {
          matchScore += weight * 2;
        }
      });
    });
    
    keywords1.forEach(kw1 => {
      const weight = Math.min(kw1.length / 4, 3);
      
      keywords2.forEach(kw2 => {
        if (kw1.length >= 5 && kw2.length >= 5) {
          if (kw1.word.includes(kw2.word) || kw2.word.includes(kw1.word)) {
            const shorter = kw1.word.length < kw2.word.length ? kw1.word : kw2.word;
            const longer = kw1.word.length >= kw2.word.length ? kw1.word : kw2.word;
            
            if (shorter.length / longer.length >= 0.7) {
              matchScore += weight * 1;
            }
          }
        }
      });
    });
    
    const similarity = totalPossibleScore > 0 ? (matchScore / totalPossibleScore) : 0;
    return similarity;
  };

  const activitiesMatch = (inclusion, activity) => {
    const norm1 = normalizeActivity(inclusion);
    const norm2 = normalizeActivity(activity);
    
    if (norm1 === norm2) {
      return true;
    }
    
    const isCrossDest1 = isCrossDestinationActivity(inclusion);
    const isCrossDest2 = isCrossDestinationActivity(activity);
    
    if (isCrossDest1 || isCrossDest2) {
      
      const flightKeywords = ['roundtrip', 'round trip', 'flight', 'airfare', 'air', 'ticket', 'rt'];
      const hasFlightTerm1 = flightKeywords.some(k => norm1.includes(k));
      const hasFlightTerm2 = flightKeywords.some(k => norm2.includes(k));
      
      if (hasFlightTerm1 && hasFlightTerm2) {
        return true;
      }
    }
    
    const similarity = calculateSimilarity(norm1, norm2);
    const threshold = (isCrossDest1 || isCrossDest2) ? 0.50 : 0.60;
    
    if (similarity >= threshold) {
      return true;
    }
    
    const keywords1 = extractKeywords(norm1);
    const keywords2 = extractKeywords(norm2);
    
    const categories = {
      flight: ['flight', 'airfare', 'air', 'plane', 'ticket', 'roundtrip', 'round', 'trip', 'return'],
      accommodation: ['accommodation', 'hotel', 'lodging', 'room', 'resort', 'inn'],
      transport: ['transport', 'transfer', 'van', 'vehicle', 'shuttle', 'tricycle', 'boat'],
      meal: ['meal', 'breakfast', 'lunch', 'dinner', 'food'],
      tour: ['tour', 'hopping', 'island', 'snorkel', 'trek', 'visit', 'coastal', 'beach']
    };
    
    const getCategories = (keywords) => {
      const cats = new Set();
      keywords.forEach(kw => {
        Object.entries(categories).forEach(([catName, catWords]) => {
          if (catWords.some(cw => kw.synonyms.includes(cw) || kw.word === cw)) {
            cats.add(catName);
          }
        });
      });
      return cats;
    };
    
    const cats1 = getCategories(keywords1);
    const cats2 = getCategories(keywords2);
    
    if (cats1.size > 0 && cats2.size > 0) {
      const hasCommonCategory = [...cats1].some(cat => cats2.has(cat));
      if (!hasCommonCategory) {
        return false;
      }
    }
    
    return false;
  };

  const matchInclusionsWithPrices = useCallback((inclusions, sellerRates, destination) => {
    
    let matchCount = 0;
    
    const matchedInclusions = inclusions.map((inclusion, idx) => {
      const isCrossDest = isCrossDestinationActivity(inclusion);
      
      let destinationMatchedRates;
      
      if (isCrossDest) {
        destinationMatchedRates = sellerRates.filter(rate => {
          const activityMatches = isCrossDestinationActivity(rate.activity);
          
          if (activityMatches) {
            return destinationsMatch(rate.destination, destination, rate.activity);
          }
          
          return false;
        });
        
        
      } else {
        destinationMatchedRates = sellerRates.filter(rate => 
          destinationsMatch(rate.destination, destination)
        );
        
      }
      
      if (destinationMatchedRates.length > 0) {
        destinationMatchedRates.forEach((rate, i) => {
        });
      }
      
      const matchedRate = destinationMatchedRates.find(rate => {
        const actMatch = activitiesMatch(inclusion, rate.activity);
        return actMatch;
      });
      
      if (matchedRate) {
        matchCount++;
        
        return {
          id: `original-${idx}`,
          name: inclusion,
          matchedActivity: matchedRate.activity,
          matchedDestination: matchedRate.destination,
          price: matchedRate.sellingPrice || 0,
          supplierRate: matchedRate.supplierRate,
          markup: matchedRate.markup,
          markupType: matchedRate.markupType,
          supplier: matchedRate.supplierName,
          destination: matchedRate.destination,
          pax: matchedRate.pax,
          notes: matchedRate.notes,
          isOriginal: true,
          isChecked: true,
          source: 'seller-rate', 
          sellerRateId: matchedRate._id 
        };
      } else {
        return {
          id: `original-${idx}`,
          name: inclusion,
          matchedActivity: null,
          matchedDestination: null,
          price: 0,
          isOriginal: true,
          isChecked: true,
          source: 'package' 
        };
      }
    });
    
    
    setMatchedInclusionCount(matchCount);
    return matchedInclusions;
  }, []);

  const fetchSellerRates = useCallback(async (destination) => {
    const destinationKey = (destination || '').toLowerCase().trim();
    
    if (hasFetchedRef.current && currentDestinationRef.current === destinationKey) {
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      
    const response = await fetch('https://wanderwaveph.onrender.com/api/seller-rates');      
      if (!response.ok) {
        throw new Error('Failed to fetch seller rates');
      }
      
      const allRates = await response.json();
      
      const matchingRates = allRates.filter(rate => 
        destinationsMatch(rate.destination, destination)
      );
      
      
      const uniqueDestinations = [...new Set(matchingRates.map(r => r.destination))];
      
      setAvailableActivities(matchingRates);
      setFilteredActivities(matchingRates);
      
      const matched = matchInclusionsWithPrices(
        pkg.inclusions || [],
        allRates, 
        destination
      );
      
      setCustomizedInclusions(matched);
      
      hasFetchedRef.current = true;
      currentDestinationRef.current = destinationKey;
      
    } catch (err) {
      console.error('❌ Error fetching seller rates:', err);
      setError(err.message);
      setAvailableActivities([]);
      setFilteredActivities([]);
      
      const basicInclusions = (pkg.inclusions || []).map((inc, idx) => ({
        id: `original-${idx}`,
        name: inc,
        matchedActivity: null,
        matchedDestination: null,
        price: 0,
        isOriginal: true,
        isChecked: true,
        source: 'package' 
      }));
      setCustomizedInclusions(basicInclusions);
    } finally {
      setIsLoading(false);
    }
  }, [pkg.inclusions, matchInclusionsWithPrices]);

  useEffect(() => {
    const packageDestination = pkg.destination || pkg.location || '';
    
    if (packageDestination) {
      fetchSellerRates(packageDestination);
    }
  }, [pkg.destination, pkg.location, fetchSellerRates]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredActivities(availableActivities);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = availableActivities.filter(activity => 
      activity.activity.toLowerCase().includes(query) ||
      activity.supplierName?.toLowerCase().includes(query) ||
      activity.destination?.toLowerCase().includes(query)
    );
    
    setFilteredActivities(filtered);
  }, [searchQuery, availableActivities]);

  useEffect(() => {
    let totalDeductions = 0;
    let totalAdditions = 0;
    
    customizedInclusions.forEach(inc => {
      if (inc.price > 0) {
        if (inc.isOriginal && !inc.isChecked) {
          totalDeductions += inc.price;
        } else if (!inc.isOriginal && inc.isChecked) {
          totalAdditions += inc.price;
        }
      }
    });
    
    const originalPkgPrice = activeBasePrice !== null ? activeBasePrice : (pkg.price || 0);
    const pricedOriginalInclusions = customizedInclusions.filter(
      inc => inc.isOriginal && inc.price > 0
    );
    const allPricedOriginalUnchecked = pricedOriginalInclusions.length > 0 && 
      pricedOriginalInclusions.every(inc => !inc.isChecked);
    
    let adjustedDeductions = totalDeductions;
    if (allPricedOriginalUnchecked) {
      adjustedDeductions = originalPkgPrice;
    }
    
    const totalChange = totalAdditions - adjustedDeductions;
    setTotalCustomPrice(totalChange);
    
    if (onCustomizationChange) {
      const finalTotalPrice = Math.max(0, originalPkgPrice + totalChange);
      
      onCustomizationChange({
        inclusions: customizedInclusions,
        additionalPrice: totalChange,
        deductions: adjustedDeductions,
        additions: totalAdditions,
        totalPrice: finalTotalPrice
      });
    }
  }, [customizedInclusions, onCustomizationChange, activeBasePrice, pkg.price]);

  const toggleInclusion = (id) => {
    setCustomizedInclusions(prev => {
      const inclusionToToggle = prev.find(inc => inc.id === id);
      
      if (inclusionToToggle && inclusionToToggle.isChecked) {
        const checkedCount = prev.filter(inc => inc.isChecked).length;
        
        if (checkedCount === 1) {
          setError('⚠️ At least one inclusion must remain selected. You cannot remove all inclusions from your package.');
          
          setTimeout(() => setError(''), 4000);
          
          return prev; 
        }
      }
      
      setError('');
      
      return prev.map(inc => 
        inc.id === id ? { ...inc, isChecked: !inc.isChecked } : inc
      );
    });
  };

  const addInclusion = (rate) => {
    const newInclusion = {
      id: `added-${Date.now()}`,
      name: rate.activity,
      matchedActivity: rate.activity,
      matchedDestination: rate.destination,
      price: rate.sellingPrice,
      supplierRate: rate.supplierRate,
      markup: rate.markup,
      markupType: rate.markupType,
      supplier: rate.supplierName,
      destination: rate.destination,
      pax: rate.pax,
      inclusions: rate.inclusions,
      notes: rate.notes,
      isOriginal: false,
      isChecked: true,
      source: 'seller-rate', 
      sellerRateId: rate._id
    };
    
    setCustomizedInclusions(prev => [...prev, newInclusion]);
  };

  const removeInclusion = (id) => {
    setCustomizedInclusions(prev => prev.filter(inc => inc.id !== id));
  };

  const resetCustomization = () => {
    hasFetchedRef.current = false;
    currentDestinationRef.current = '';
    
    const packageDestination = pkg.destination || pkg.location || '';
    fetchSellerRates(packageDestination);
    setSearchQuery('');
    setShowSearch(false);
  };

  const formatPrice = (phpPrice) => {
    const price = currency === 'PHP' ? phpPrice : (phpPrice / exchangeRate) * 1.30;
    const symbol = currency === 'PHP' ? '₱' : '$';
    
    return `${symbol}${price.toLocaleString(undefined, {
      minimumFractionDigits: currency === 'USD' ? 2 : 0,
      maximumFractionDigits: currency === 'USD' ? 2 : 0
    })}`;
  };

  const packageDestination = pkg.destination || pkg.location || 'Unknown';
  const originalPackagePrice = activeBasePrice !== null ? activeBasePrice : (pkg.price || 0);
  
  const deductionsTotal = customizedInclusions
    .filter(inc => !inc.isChecked && inc.isOriginal && inc.price > 0)
    .reduce((sum, inc) => sum + inc.price, 0);
  
  const additionsTotal = customizedInclusions
    .filter(inc => inc.isChecked && !inc.isOriginal)
    .reduce((sum, inc) => sum + inc.price, 0);
  
  const pricedOriginalInclusions = customizedInclusions.filter(
    inc => inc.isOriginal && inc.price > 0
  );
  const allPricedOriginalUnchecked = pricedOriginalInclusions.length > 0 && 
    pricedOriginalInclusions.every(inc => !inc.isChecked);
  
  const newTotalPrice = allPricedOriginalUnchecked && additionsTotal === 0 
    ? 0 
    : Math.max(0, originalPackagePrice - (allPricedOriginalUnchecked ? originalPackagePrice : deductionsTotal) + additionsTotal);

  return (
    <div className="pc-container">
      <div className="pc-header">
        <div className="pc-title-row">
          <Package size={24} color="#f97316" />
          <h2 className="pc-title">Customize Your Package</h2>
        </div>
        <p className="pc-subtitle">
          Personalize your tour by selecting or deselecting inclusions
        </p>
        <div className="pc-destination-badge">
          📍 {packageDestination}
        </div>
        
        {matchedInclusionCount > 0 && (
          <div style={{
            marginTop: '12px',
            padding: '8px 12px',
            background: '#dbeafe',
            border: '1px solid #93c5fd',
            borderRadius: '8px',
            fontSize: '0.85rem',
            color: '#1e40af'
          }}>
            ✅ {matchedInclusionCount} of {pkg.inclusions?.length || 0} inclusions have pricing data
          </div>
        )}
      </div>

      {/* Error/Warning Alert */}
      {error && (
        <div className="pc-error-alert" style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          padding: '16px',
          marginBottom: '20px',
          background: error.includes('⚠️') ? '#fef3c7' : '#fee2e2',
          border: `2px solid ${error.includes('⚠️') ? '#f59e0b' : '#ef4444'}`,
          borderRadius: '12px',
          color: error.includes('⚠️') ? '#92400e' : '#991b1b'
        }}>
          <AlertCircle size={20} style={{ 
            marginTop: '2px',
            flexShrink: 0,
            color: error.includes('⚠️') ? '#f59e0b' : '#ef4444'
          }} />
          <div style={{ flex: 1 }}>
            <strong style={{ 
              display: 'block',
              marginBottom: '4px',
              fontSize: '0.95rem'
            }}>
              {error.includes('⚠️') ? 'Validation Warning' : 'Error Loading Activities'}
            </strong>
            <p style={{ 
              margin: 0,
              fontSize: '0.9rem',
              lineHeight: '1.5'
            }}>
              {error}
            </p>
          </div>
        </div>
      )}

      {/* Current Inclusions */}
      <div className="pc-section">
        <div className="pc-section-header">
          <h3 className="pc-section-title">Package Inclusions</h3>
          <button 
            className="pc-reset-btn" 
            onClick={resetCustomization}
            title="Reset to original package"
          >
            <RotateCcw size={14} /> Reset
          </button>
        </div>

        <div className="pc-inclusions-list">
          {customizedInclusions.map((inclusion) => {
            const checkedCount = customizedInclusions.filter(inc => inc.isChecked).length;
            const isLastRemaining = inclusion.isChecked && checkedCount === 1;
            
            return (
              <div 
                key={inclusion.id}
                className={`pc-inclusion-item ${inclusion.isChecked ? 'checked' : 'unchecked'} ${isLastRemaining ? 'last-remaining' : ''}`}
              >
                <div className="pc-inclusion-main">
                  <input
                    type="checkbox"
                    className="pc-checkbox"
                    checked={inclusion.isChecked}
                    onChange={() => toggleInclusion(inclusion.id)}
                    disabled={isLastRemaining}
                    title={isLastRemaining ? "This is the last remaining inclusion and cannot be removed" : ""}
                  />
                  
                  <div className="pc-inclusion-info">
                    <div className="pc-inclusion-name">
                      {inclusion.name}
                      
                      {isLastRemaining && (
                        <span 
                          className="pc-badge" 
                          style={{ 
                            background: '#fef3c7',
                            color: '#92400e',
                            fontSize: '0.75rem',
                            padding: '2px 6px'
                          }}
                          title="At least one inclusion must remain in your package"
                        >
                          Required
                        </span>
                      )}
                      {!inclusion.isOriginal && (
                        <span className="pc-badge" style={{ background: '#fef3c7', color: '#92400e' }}>
                          Added
                        </span>
                      )}
                    </div>
                </div>
              </div>

              <div className="pc-inclusion-actions">
                {inclusion.price > 0 && (
                  <span 
                    className="pc-inclusion-price"
                    style={{ 
                      color: inclusion.isOriginal 
                        ? (!inclusion.isChecked ? '#dc2626' : '#64748b')
                        : '#059669'
                    }}
                    title={
                      inclusion.isOriginal 
                        ? (!inclusion.isChecked ? 'Will be deducted from package price' : 'Included in package')
                        : 'Will be added to package price'
                    }
                  > 
                  </span>
                )}
                
                {!inclusion.isOriginal && (
                  <button
                    className="pc-remove-btn"
                    onClick={() => removeInclusion(inclusion.id)}
                    title="Remove inclusion"
                  >
                    <XCircle size={18} />
                  </button>
                )}
              </div>
            </div>
          );
          })}
        </div>
      </div>

      {/* Add More Section */}
      <div className="pc-section">
        <button 
          className="pc-search-toggle"
          onClick={() => setShowSearch(!showSearch)}
          disabled={isLoading}
        >
          <Plus size={18} />
          {isLoading ? 'Loading Activities...' : 'Add More Inclusions'}
        </button>

        {showSearch && (
          <div className="pc-search-panel">
            <div className="pc-info-box">
              <p>
                Showing activities available for <strong>{packageDestination}</strong>
              </p>
              {availableActivities.length > 0 && (
                <p className="pc-count">
                  {filteredActivities.length} of {availableActivities.length} activities
                </p>
              )}
            </div>

            {availableActivities.length > 0 && (
              <div className="pc-search-box">
                <input
                  type="text"
                  placeholder="Search activities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pc-search-input"
                />
              </div>
            )}

            {filteredActivities.length > 0 && (
              <div className="pc-activities-list">
                {filteredActivities.map((rate) => (
                  <div key={rate._id} className="pc-activity-item">
                    <div className="pc-activity-info">
                      <div className="pc-activity-name">{rate.activity}</div>
                    </div>

                    <div className="pc-activity-actions">
                      <button
                        className="pc-add-btn"
                        onClick={() => addInclusion(rate)}
                      >
                        <Plus size={16} /> Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isLoading && filteredActivities.length === 0 && availableActivities.length > 0 && (
              <div className="pc-no-results">
                <p>No activities match your search.</p>
                <button 
                  onClick={() => setSearchQuery('')}
                  className="pc-clear-btn"
                >
                  Clear Search
                </button>
              </div>
            )}

            {!isLoading && availableActivities.length === 0 && !error && (
              <div className="pc-no-activities">
                <p>No activities available for {packageDestination}.</p>
                <p className="pc-hint">
                  Contact admin to add activities for this destination.
                </p>
              </div>
            )}

            {isLoading && (
              <div className="pc-loading">
                <div className="pc-spinner"></div>
                <p>Loading activities...</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PackageCustomizer;