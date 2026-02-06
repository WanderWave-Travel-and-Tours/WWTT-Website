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
  onCustomizationChange 
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
  
  // Use ref to track if we've already fetched for this destination
  const hasFetchedRef = useRef(false);
  const currentDestinationRef = useRef('');

  /**
   * 🔧 ENHANCED SYNONYM MAPPING
   */
  const SYNONYM_MAP = {
    // Flight-related - EXPANDED for Roundtrip matching
    'flight': ['airfare', 'air', 'plane', 'aviation', 'ticket', 'roundtrip', 'round trip', 'rt'],
    'airfare': ['flight', 'air', 'plane', 'ticket', 'roundtrip', 'round trip'],
    'roundtrip': ['round trip', 'return', 'twoway', 'two way', 'rt', 'flight', 'airfare', 'air'],
    'round': ['roundtrip', 'return'], // Special handling for "round trip"
    'trip': ['journey', 'travel'], // Special handling for "round trip"
    'oneway': ['one way', 'single', 'ow'],
    
    // Accommodation-related
    'accommodation': ['hotel', 'lodging', 'stay', 'room', 'inn'],
    'hotel': ['accommodation', 'lodging', 'inn', 'resort'],
    'resort': ['hotel', 'accommodation', 'inn'],
    'room': ['accommodation', 'hotel', 'lodging'],
    
    // Transport-related
    'transport': ['transfer', 'transportation', 'shuttle', 'vehicle', 'ride'],
    'transfer': ['transport', 'shuttle', 'pickup', 'dropoff'],
    'van': ['vehicle', 'shuttle', 'transport'],
    'tricycle': ['trike', 'vehicle'],
    'boat': ['ferry', 'vessel', 'ship'],
    
    // Meal-related
    'meal': ['food', 'dining', 'breakfast', 'lunch', 'dinner'],
    'breakfast': ['meal', 'food', 'morning'],
    'lunch': ['meal', 'food', 'midday', 'luncheon'],
    'dinner': ['meal', 'food', 'evening', 'supper'],
    
    // Tour-related
    'tour': ['trip', 'excursion', 'visit', 'sightseeing', 'experience'],
    'island': ['isle', 'islet'],
    'hopping': ['hop', 'jumping', 'tour'],
    'snorkel': ['snorkeling', 'diving', 'underwater', 'swim'],
    'dive': ['diving', 'snorkel', 'underwater'],
    'trek': ['trekking', 'hike', 'hiking', 'walking'],
    'climb': ['climbing', 'ascent', 'hike'],
    'beach': ['shore', 'coast', 'seaside'],
    'coastal': ['coast', 'beach', 'shore', 'seaside'],
    
    // Other
    'guide': ['escort', 'leader', 'companion'],
    'entrance': ['admission', 'entry', 'fee', 'ticket'],
    'museum': ['gallery', 'exhibit'],
  };

  /**
   * 🔥 SPECIAL CROSS-DESTINATION ACTIVITIES
   * These activities should match regardless of destination
   */
  const CROSS_DESTINATION_KEYWORDS = [
    'roundtrip', 'round trip', 'rt', 'flight', 'airfare', 'air ticket',
    'return flight', 'return ticket', 'plane ticket'
  ];

  /**
   * Get all synonyms for a word including the word itself
   */
  const getSynonyms = (word) => {
    const lower = word.toLowerCase();
    const syns = SYNONYM_MAP[lower] || [];
    return [lower, ...syns];
  };

  /**
   * Check if an activity is cross-destination (like roundtrip flights)
   */
  const isCrossDestinationActivity = (activityText) => {
    const normalized = activityText.toLowerCase();
    return CROSS_DESTINATION_KEYWORDS.some(keyword => 
      normalized.includes(keyword)
    );
  };

  /**
   * Extract location keywords from destination
   */
  const extractLocationKeywords = (destination) => {
    if (!destination) return [];
    
    const normalized = destination
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Remove common package-related words but KEEP location names
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

  /**
   * 🔧 ENHANCED: Destination matching with special handling for cross-destination activities
   */
  const destinationsMatch = (rateDestination, packageDestination, activityName = '') => {
    if (!rateDestination || !packageDestination) return false;
    
    // 🔥 SPECIAL CASE: If this is a cross-destination activity (like roundtrip flight),
    // check if the package destination is mentioned in the rate destination
    if (activityName && isCrossDestinationActivity(activityName)) {
      console.log(`   🛫 Cross-destination activity detected: "${activityName}"`);
      
      const pkgLoc = extractLocationKeywords(packageDestination);
      const rateLoc = extractLocationKeywords(rateDestination);
      
      console.log(`      Package location: ${pkgLoc.mainLocation}`);
      console.log(`      Rate destination: ${rateDestination}`);
      
      // If package location is mentioned in rate destination, it's a match
      if (pkgLoc.mainLocation) {
        const rateDestLower = rateDestination.toLowerCase();
        const pkgLocLower = pkgLoc.mainLocation.toLowerCase();
        
        if (rateDestLower.includes(pkgLocLower)) {
          console.log(`      ✅ Package location "${pkgLoc.mainLocation}" found in rate destination`);
          return true;
        }
      }
      
      // Also check if any package keyword is in rate destination
      const hasKeywordMatch = pkgLoc.keywords.some(kw => 
        rateDestination.toLowerCase().includes(kw)
      );
      
      if (hasKeywordMatch) {
        console.log(`      ✅ Package keyword found in rate destination`);
        return true;
      }
    }
    
    const loc1 = extractLocationKeywords(rateDestination);
    const loc2 = extractLocationKeywords(packageDestination);
    
    console.log(`\n🗺️  Comparing destinations:`);
    console.log(`   Rate Dest: "${rateDestination}" → keywords: [${loc1.keywords.join(', ')}]`);
    console.log(`   Pkg Dest:  "${packageDestination}" → keywords: [${loc2.keywords.join(', ')}]`);
    
    // Strategy 1: Main location exact match
    if (loc1.mainLocation && loc2.mainLocation) {
      if (loc1.mainLocation === loc2.mainLocation) {
        console.log(`   ✅ Main location match: "${loc1.mainLocation}"`);
        return true;
      }
    }
    
    // Strategy 2: Any keyword from one appears in the other
    const hasCommonKeyword = loc1.keywords.some(k1 => 
      loc2.keywords.some(k2 => k1 === k2 || k1.includes(k2) || k2.includes(k1))
    );
    
    if (hasCommonKeyword) {
      console.log(`   ✅ Common keyword found`);
      return true;
    }
    
    // Strategy 3: Check if one destination string contains the other's main location
    if (loc1.mainLocation && packageDestination.toLowerCase().includes(loc1.mainLocation)) {
      console.log(`   ✅ Package contains rate's main location: "${loc1.mainLocation}"`);
      return true;
    }
    
    if (loc2.mainLocation && rateDestination.toLowerCase().includes(loc2.mainLocation)) {
      console.log(`   ✅ Rate contains package's main location: "${loc2.mainLocation}"`);
      return true;
    }
    
    // Strategy 4: Partial string matching
    const norm1 = loc1.fullNormalized;
    const norm2 = loc2.fullNormalized;
    
    if (norm1.length >= 5 && norm2.length >= 5) {
      if (norm1.includes(norm2) || norm2.includes(norm1)) {
        console.log(`   ✅ Partial string match`);
        return true;
      }
    }
    
    console.log(`   ❌ No destination match`);
    return false;
  };

  /**
   * Normalize activity/inclusion name for matching
   */
  const normalizeActivity = (activity) => {
    if (!activity) return '';
    
    let normalized = activity
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Handle compound words
    normalized = normalized
      .replace(/roundtrip/g, 'round trip')
      .replace(/twoway/g, 'two way')
      .replace(/oneway/g, 'one way');
    
    return normalized;
  };

  /**
   * Extract meaningful keywords from text
   */
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

  /**
   * 🔥 ENHANCED: Calculate semantic similarity with special handling for roundtrip/flight
   */
  const calculateSimilarity = (text1, text2) => {
    const keywords1 = extractKeywords(text1);
    const keywords2 = extractKeywords(text2);
    
    if (keywords1.length === 0 || keywords2.length === 0) {
      return 0;
    }
    
    let matchScore = 0;
    let totalPossibleScore = 0;
    
    // 🔥 SPECIAL BOOST: If both texts contain flight/roundtrip related terms
    const text1Lower = text1.toLowerCase();
    const text2Lower = text2.toLowerCase();
    
    const flightKeywords = ['roundtrip', 'round trip', 'flight', 'airfare', 'air ticket', 'rt'];
    const hasFlightTerm1 = flightKeywords.some(k => text1Lower.includes(k));
    const hasFlightTerm2 = flightKeywords.some(k => text2Lower.includes(k));
    
    if (hasFlightTerm1 && hasFlightTerm2) {
      console.log(`      🛫 Both contain flight/roundtrip terms - BOOSTING SIMILARITY`);
      matchScore += 10; // Significant boost for flight matches
      totalPossibleScore += 10;
    }
    
    // Strategy 1: Exact keyword matches (highest weight)
    keywords1.forEach(kw1 => {
      const weight = Math.min(kw1.length / 4, 3);
      totalPossibleScore += weight * 3;
      
      keywords2.forEach(kw2 => {
        if (kw1.word === kw2.word) {
          matchScore += weight * 3;
        }
      });
    });
    
    // Strategy 2: Synonym matches (medium weight)
    keywords1.forEach(kw1 => {
      const weight = Math.min(kw1.length / 4, 3);
      
      keywords2.forEach(kw2 => {
        const areSynonyms = kw1.synonyms.some(syn => kw2.synonyms.includes(syn));
        if (areSynonyms && kw1.word !== kw2.word) {
          matchScore += weight * 2;
        }
      });
    });
    
    // Strategy 3: Partial word matches (low weight)
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

  /**
   * 🔥 ENHANCED: Activity matching with special roundtrip handling
   */
  const activitiesMatch = (inclusion, activity) => {
    const norm1 = normalizeActivity(inclusion);
    const norm2 = normalizeActivity(activity);
    
    console.log(`\n   🔍 Comparing activities:`);
    console.log(`      Inclusion: "${inclusion}" → "${norm1}"`);
    console.log(`      Activity:  "${activity}" → "${norm2}"`);
    
    // Level 1: Exact match
    if (norm1 === norm2) {
      console.log(`      ✅ EXACT MATCH`);
      return true;
    }
    
    // 🔥 SPECIAL LEVEL: Cross-destination activity matching (for flights/roundtrip)
    const isCrossDest1 = isCrossDestinationActivity(inclusion);
    const isCrossDest2 = isCrossDestinationActivity(activity);
    
    if (isCrossDest1 || isCrossDest2) {
      console.log(`      🛫 Cross-destination activity detected`);
      
      // If both mention flight/roundtrip terms, they should match
      const flightKeywords = ['roundtrip', 'round trip', 'flight', 'airfare', 'air', 'ticket', 'rt'];
      const hasFlightTerm1 = flightKeywords.some(k => norm1.includes(k));
      const hasFlightTerm2 = flightKeywords.some(k => norm2.includes(k));
      
      if (hasFlightTerm1 && hasFlightTerm2) {
        console.log(`      ✅ FLIGHT/ROUNDTRIP MATCH (both contain flight terms)`);
        return true;
      }
    }
    
    // Level 2: Semantic similarity
    const similarity = calculateSimilarity(norm1, norm2);
    console.log(`      📊 Similarity: ${(similarity * 100).toFixed(1)}%`);
    
    // Lower threshold for flight-related activities
    const threshold = (isCrossDest1 || isCrossDest2) ? 0.50 : 0.60;
    
    if (similarity >= threshold) {
      console.log(`      ✅ SEMANTIC MATCH (${(similarity * 100).toFixed(1)}%)`);
      return true;
    }
    
    // Level 3: Category safety check
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
        console.log(`      ❌ DIFFERENT CATEGORIES (${[...cats1].join(',')} vs ${[...cats2].join(',')})`);
        return false;
      }
    }
    
    console.log(`      ❌ NO MATCH (similarity: ${(similarity * 100).toFixed(1)}%)`);
    return false;
  };

  /**
   * 🔥 ENHANCED: Match inclusions with special handling for cross-destination activities
   */
  const matchInclusionsWithPrices = useCallback((inclusions, sellerRates, destination) => {
    console.log('\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔍 MATCHING INCLUSIONS WITH SELLER RATES');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`📍 Package destination: "${destination}"`);
    console.log(`📦 Total inclusions: ${inclusions.length}`);
    console.log(`💰 Total seller rates available: ${sellerRates.length}`);
    
    let matchCount = 0;
    
    const matchedInclusions = inclusions.map((inclusion, idx) => {
      console.log(`\n🔎 INCLUSION #${idx + 1}: "${inclusion}"`);
      
      // 🔥 SPECIAL HANDLING: Check if this is a cross-destination activity
      const isCrossDest = isCrossDestinationActivity(inclusion);
      
      let destinationMatchedRates;
      
      if (isCrossDest) {
        console.log(`   🛫 Cross-destination activity - searching ALL destinations`);
        
        // For cross-destination activities, search all rates but prioritize
        // those that mention the package destination
        destinationMatchedRates = sellerRates.filter(rate => {
          // Check if activity matches (flight/roundtrip)
          const activityMatches = isCrossDestinationActivity(rate.activity);
          
          if (activityMatches) {
            // If it's a flight activity, check if package destination is mentioned
            return destinationsMatch(rate.destination, destination, rate.activity);
          }
          
          return false;
        });
        
        console.log(`   🎯 Found ${destinationMatchedRates.length} cross-destination rates`);
        
      } else {
        // For regular activities, filter by destination first
        destinationMatchedRates = sellerRates.filter(rate => 
          destinationsMatch(rate.destination, destination)
        );
        
        console.log(`   🎯 Found ${destinationMatchedRates.length} destination-matched rates`);
      }
      
      // Show matched rates
      if (destinationMatchedRates.length > 0) {
        console.log(`\n   📋 Available rates for matching:`);
        destinationMatchedRates.forEach((rate, i) => {
          console.log(`      ${i + 1}. "${rate.activity}" - ₱${rate.sellingPrice.toLocaleString()} (${rate.destination})`);
        });
      }
      
      // Find matching activity
      const matchedRate = destinationMatchedRates.find(rate => {
        console.log(`\n   Checking: "${rate.activity}" (₱${rate.sellingPrice})`);
        const actMatch = activitiesMatch(inclusion, rate.activity);
        return actMatch;
      });
      
      if (matchedRate) {
        matchCount++;
        console.log(`\n   ✅ ✅ ✅ MATCHED!`);
        console.log(`   Activity: "${matchedRate.activity}"`);
        console.log(`   Destination: "${matchedRate.destination}"`);
        console.log(`   Price: ₱${matchedRate.sellingPrice.toLocaleString()}`);
        console.log(`   Supplier: ${matchedRate.supplierName}`);
        
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
          isChecked: true
        };
      } else {
        console.log(`\n   ❌ NO MATCH FOUND`);
        return {
          id: `original-${idx}`,
          name: inclusion,
          matchedActivity: null,
          matchedDestination: null,
          price: 0,
          isOriginal: true,
          isChecked: true
        };
      }
    });
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log(`✅ MATCHING COMPLETE: ${matchCount}/${inclusions.length} inclusions matched`);
    console.log('═══════════════════════════════════════════════════════════\n');
    
    setMatchedInclusionCount(matchCount);
    return matchedInclusions;
  }, []);

  /**
   * Fetch seller rates
   */
  const fetchSellerRates = useCallback(async (destination) => {
    const destinationKey = (destination || '').toLowerCase().trim();
    
    if (hasFetchedRef.current && currentDestinationRef.current === destinationKey) {
      console.log('⏭️  Skipping fetch - already loaded for this destination');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      console.log(`\n🌐 Fetching seller rates for destination: "${destination}"`);
      
      const response = await fetch('/api/seller-rates');
      
      if (!response.ok) {
        throw new Error('Failed to fetch seller rates');
      }
      
      const allRates = await response.json();
      console.log(`📥 Received ${allRates.length} total seller rates from API`);
      
      // For display purposes, show destination-matched rates
      const matchingRates = allRates.filter(rate => 
        destinationsMatch(rate.destination, destination)
      );
      
      console.log(`🎯 Found ${matchingRates.length} rates for "${destination}"`);
      
      const uniqueDestinations = [...new Set(matchingRates.map(r => r.destination))];
      console.log(`📍 Matched destinations: ${uniqueDestinations.join(', ')}`);
      
      setAvailableActivities(matchingRates);
      setFilteredActivities(matchingRates);
      
      // Match with ALL rates (not just destination-matched) for cross-destination activities
      const matched = matchInclusionsWithPrices(
        pkg.inclusions || [],
        allRates, // Use ALL rates here
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
        isChecked: true
      }));
      setCustomizedInclusions(basicInclusions);
    } finally {
      setIsLoading(false);
    }
  }, [pkg.inclusions, matchInclusionsWithPrices]);

  /**
   * Initialize
   */
  useEffect(() => {
    const packageDestination = pkg.destination || pkg.location || '';
    
    if (packageDestination) {
      console.log(`🎯 Package Customizer initialized for: "${packageDestination}"`);
      fetchSellerRates(packageDestination);
    }
  }, [pkg.destination, pkg.location, fetchSellerRates]);

  /**
   * Filter activities based on search query
   */
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

  /**
   * Calculate total price
   */
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
    
    const totalChange = totalAdditions - totalDeductions;
    setTotalCustomPrice(totalChange);
    
    if (onCustomizationChange) {
      onCustomizationChange({
        inclusions: customizedInclusions,
        additionalPrice: totalChange,
        deductions: totalDeductions,
        additions: totalAdditions
      });
    }
  }, [customizedInclusions, onCustomizationChange]);

  /**
   * Toggle inclusion checkbox
   * ✅ VALIDATION: Prevent unchecking all inclusions
   */
  const toggleInclusion = (id) => {
    setCustomizedInclusions(prev => {
      // Find the inclusion being toggled
      const inclusionToToggle = prev.find(inc => inc.id === id);
      
      // If trying to uncheck
      if (inclusionToToggle && inclusionToToggle.isChecked) {
        // Count currently checked inclusions
        const checkedCount = prev.filter(inc => inc.isChecked).length;
        
        // ⚠️ PREVENT: Don't allow unchecking if it's the last remaining inclusion
        if (checkedCount === 1) {
          setError('⚠️ At least one inclusion must remain selected. You cannot remove all inclusions from your package.');
          
          // Auto-clear error after 4 seconds
          setTimeout(() => setError(''), 4000);
          
          return prev; // Return unchanged state
        }
      }
      
      // Clear any previous error
      setError('');
      
      // Proceed with toggle
      return prev.map(inc => 
        inc.id === id ? { ...inc, isChecked: !inc.isChecked } : inc
      );
    });
  };

  /**
   * Add new inclusion
   */
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
      isChecked: true
    };
    
    setCustomizedInclusions(prev => [...prev, newInclusion]);
    console.log(`✅ Added inclusion: "${rate.activity}" (₱${rate.sellingPrice})`);
  };

  /**
   * Remove added inclusion
   */
  const removeInclusion = (id) => {
    setCustomizedInclusions(prev => prev.filter(inc => inc.id !== id));
  };

  /**
   * Reset customization
   */
  const resetCustomization = () => {
    const packageDestination = pkg.destination || pkg.location || '';
    fetchSellerRates(packageDestination);
    setSearchQuery('');
    setShowSearch(false);
  };

  /**
   * Format price
   */
  const formatPrice = (phpPrice) => {
    const price = currency === 'PHP' ? phpPrice : (phpPrice / exchangeRate) * 1.30;
    const symbol = currency === 'PHP' ? '₱' : '$';
    
    return `${symbol}${price.toLocaleString(undefined, {
      minimumFractionDigits: currency === 'USD' ? 2 : 0,
      maximumFractionDigits: currency === 'USD' ? 2 : 0
    })}`;
  };

  // Calculate prices
  const packageDestination = pkg.destination || pkg.location || 'Unknown';
  const originalPackagePrice = pkg.price || 0;
  const deductionsTotal = customizedInclusions
    .filter(inc => !inc.isChecked && inc.isOriginal && inc.price > 0)
    .reduce((sum, inc) => sum + inc.price, 0);
  const additionsTotal = customizedInclusions
    .filter(inc => inc.isChecked && !inc.isOriginal)
    .reduce((sum, inc) => sum + inc.price, 0);
  const newTotalPrice = originalPackagePrice - deductionsTotal + additionsTotal;

  return (
    <div className="pc-container">
      {/* Header */}
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
            // ✅ Check if this is the last remaining checked inclusion
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
                      
                      {inclusion.isOriginal && !isLastRemaining && (
                        <span 
                          className="pc-badge" 
                          style={{ 
                            background: inclusion.price > 0 ? '#dcfce7' : '#fee2e2',
                            color: inclusion.price > 0 ? '#166534' : '#991b1b'
                          }}
                        >
                          {inclusion.price > 0 ? 'Priced' : 'No Rate'}
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
                      <div className="pc-activity-meta">
                        <span className="pc-meta-tag">
                          📍 {rate.destination}
                        </span>
                        {rate.supplierName && (
                          <span className="pc-meta-tag">
                            🏢 {rate.supplierName}
                          </span>
                        )}
                        {rate.pax && (
                          <span className="pc-meta-tag">
                            👥 {rate.pax}
                          </span>
                        )}
                      </div>
                      {rate.inclusions && (
                        <div className="pc-activity-inclusions">
                          <small>Includes: {rate.inclusions}</small>
                        </div>
                      )}
                    </div>

                    <div className="pc-activity-actions">
                      <div className="pc-activity-price">
                        {formatPrice(rate.sellingPrice)}
                      </div>
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

      {/* Price Summary */}
      <div className="pc-price-summary">
        <div className="pc-price-row">
          <span>Original Package Price:</span>
          <span>{formatPrice(originalPackagePrice)}</span>
        </div>
        
        {customizedInclusions.filter(inc => !inc.isChecked && inc.isOriginal && inc.price > 0).length > 0 && (
          <div className="pc-price-row" style={{ color: '#dc2626' }}>
            <span>Less: Removed Inclusions</span>
            <span>
              - {formatPrice(
                customizedInclusions
                  .filter(inc => !inc.isChecked && inc.isOriginal && inc.price > 0)
                  .reduce((sum, inc) => sum + inc.price, 0)
              )}
            </span>
          </div>
        )}
        
        {customizedInclusions.filter(inc => inc.isChecked && !inc.isOriginal).length > 0 && (
          <div className="pc-price-row highlight">
            <span>Additional Inclusions:</span>
            <span className="pc-price-added">
              + {formatPrice(
                customizedInclusions
                  .filter(inc => inc.isChecked && !inc.isOriginal)
                  .reduce((sum, inc) => sum + inc.price, 0)
              )}
            </span>
          </div>
        )}
        
        <div className="pc-price-row total">
          <span>New Total Price:</span>
          <span className="pc-price-total">
            {formatPrice(newTotalPrice)}
          </span>
        </div>
        
        {totalCustomPrice !== 0 && (
          <div style={{ 
            marginTop: '12px', 
            padding: '8px', 
            background: totalCustomPrice < 0 ? '#dcfce7' : '#fff7ed',
            borderRadius: '6px',
            textAlign: 'center',
            fontSize: '0.85rem',
            fontWeight: 600,
            color: totalCustomPrice < 0 ? '#059669' : '#ea580c'
          }}>
            {totalCustomPrice < 0 ? '💰 You save: ' : '💳 Additional cost: '}
            {formatPrice(Math.abs(totalCustomPrice))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PackageCustomizer;