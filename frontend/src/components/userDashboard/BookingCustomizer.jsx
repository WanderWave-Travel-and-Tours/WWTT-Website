import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Search, Plus, CheckCircle, XCircle, 
  Package, RotateCcw, AlertCircle, DollarSign
} from 'lucide-react';
import './BookingCustomizer.css';

const BookingCustomizer = ({ 
  booking,      // ✅ booking object from parent
  onUpdate      // ✅ callback to update parent when changes saved
}) => {
  const [customizedInclusions, setCustomizedInclusions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableActivities, setAvailableActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [error, setError] = useState('');
  const [matchedInclusionCount, setMatchedInclusionCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [fetchedPackageData, setFetchedPackageData] = useState(null); // ✅ NEW: Store fetched package
  
  const hasFetchedRef = useRef(false);
  const currentDestinationRef = useRef('');
  const currentPackageNameRef = useRef('');
  const hasFetchedPackageRef = useRef(false); // ✅ NEW: Track package fetch
  
  // ✅ API Configuration
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://wanderwaveph.onrender.com';

  /**
   * 🔧 ENHANCED SYNONYM MAPPING
   */
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

  // ✅ Extract main destination name only (remove package details)
  const extractMainDestination = (destination) => {
    if (!destination) return '';
    
    let clean = destination.split('(')[0].trim();
    
    clean = clean
      .replace(/\d+D\d+N/gi, '')
      .replace(/\d+\s*(day|days|night|nights)/gi, '')
      .replace(/package/gi, '')
      .replace(/tour/gi, '')
      .trim();
    
    return clean;
  };

  // ✅ NEW: Extract package duration (e.g., "5D4N", "3D2N")
  const extractPackageDuration = (packageName) => {
    if (!packageName) return null;
    
    // Match patterns like 5D4N, 3D2N, etc.
    const durationMatch = packageName.match(/(\d+)D(\d+)N/i);
    
    if (durationMatch) {
      return {
        days: parseInt(durationMatch[1]),
        nights: parseInt(durationMatch[2]),
        format: durationMatch[0].toUpperCase() // e.g., "5D4N"
      };
    }
    
    // Alternative: Match "5 days 4 nights" format
    const altMatch = packageName.match(/(\d+)\s*(?:day|days)\s*(\d+)\s*(?:night|nights)/i);
    if (altMatch) {
      return {
        days: parseInt(altMatch[1]),
        nights: parseInt(altMatch[2]),
        format: `${altMatch[1]}D${altMatch[2]}N`
      };
    }
    
    return null;
  };

  // ✅ FIXED: Check if activity matches package duration (checks both activity text AND destination field)
  const activityMatchesPackageDuration = (activityText, destinationText, packageDuration) => {
    if (!packageDuration) return true; // No duration filtering if not found
    
    // Helper function to check duration in text
    const checkDurationInText = (text) => {
      if (!text) return false;
      
      // Check if text contains the exact duration format (e.g., "5D4N")
      const durationMatch = text.match(/(\d+)D(\d+)N/i);
      
      if (durationMatch) {
        const days = parseInt(durationMatch[1]);
        const nights = parseInt(durationMatch[2]);
        
        // Exact match
        if (days === packageDuration.days && nights === packageDuration.nights) {
          return true;
        }
      }
      
      // Also check alternative formats (e.g., "5 days 4 nights")
      const altMatch = text.match(/(\d+)\s*(?:day|days)\s*(\d+)\s*(?:night|nights)/i);
      if (altMatch) {
        const days = parseInt(altMatch[1]);
        const nights = parseInt(altMatch[2]);
        
        if (days === packageDuration.days && nights === packageDuration.nights) {
          return true;
        }
      }
      
      return false;
    };
    
    // Check activity text first
    if (checkDurationInText(activityText)) {
      return true;
    }
    
    // ✅ CRITICAL: Check destination field (this is where duration is stored in your data)
    // e.g., "Puerto Princesa 5D4N (Solo)", "Puerto Princesa 3D2N (min. of 2 pax)"
    if (checkDurationInText(destinationText)) {
      return true;
    }
    
    return false;
  };

  // ✅ NEW: Extract package keywords for matching
  const extractPackageKeywords = (packageName) => {
    if (!packageName) return [];
    
    const normalized = packageName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    const noiseWords = ['the', 'and', 'or', 'with', 'for', 'in', 'on', 'at', 'to', 'from', 'a', 'an', 'package', 'tour', 'day', 'days', 'night', 'nights'];
    
    const words = normalized.split(' ')
      .filter(w => w.length >= 3 && !noiseWords.includes(w));
    
    console.log(`📦 Package keywords extracted from "${packageName}":`, words);
    return words;
  };

  // ✅ NEW: Check if activity matches package-specific keywords
  const activityMatchesPackage = (activityText, packageKeywords) => {
    if (!packageKeywords || packageKeywords.length === 0) {
      return true;
    }

    const activityNormalized = activityText
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ');

    const matchCount = packageKeywords.filter(keyword => 
      activityNormalized.includes(keyword)
    ).length;

    return matchCount > 0;
  };

  // ✅ STRICT destination matching
  const destinationsMatchStrict = (rateDestination, packageDestination) => {
    if (!rateDestination || !packageDestination) return false;
    
    const rateMain = extractMainDestination(rateDestination).toLowerCase();
    const packageMain = extractMainDestination(packageDestination).toLowerCase();
    
    if (rateMain === packageMain) {
      return true;
    }
    
    if (rateMain.includes(packageMain) && packageMain.length >= 5) {
      return true;
    }
    
    if (packageMain.includes(rateMain) && rateMain.length >= 5) {
      return true;
    }
    
    const rateWords = rateMain.split(/\s+/).filter(w => w.length >= 4);
    const packageWords = packageMain.split(/\s+/).filter(w => w.length >= 4);
    
    if (rateWords.length > 0 && packageWords.length > 0) {
      const rateFirst = rateWords[0];
      const packageFirst = packageWords[0];
      
      if (rateFirst === packageFirst) {
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
            return destinationsMatchStrict(rate.destination, destination);
          }
          return false;
        });
      } else {
        destinationMatchedRates = sellerRates.filter(rate => 
          destinationsMatchStrict(rate.destination, destination)
        );
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

  // ✅ NEW: Fetch package data by title when packageId is null
  const fetchPackageByTitle = async (packageTitle) => {
    if (!packageTitle || hasFetchedPackageRef.current) {
      return null;
    }

    try {
      console.log(`🔍 Fetching package by title: "${packageTitle}"`);
      
      const response = await fetch(`${API_BASE_URL}/api/packages/all`);
      const data = await response.json();

      if (data.status === 'ok' && data.data) {
        // Find package with matching title
        const matchedPackage = data.data.find(pkg => 
          pkg.title.toLowerCase() === packageTitle.toLowerCase()
        );

        if (matchedPackage) {
          console.log('✅ Found matching package:', matchedPackage.title);
          console.log('   - Inclusions:', matchedPackage.inclusions);
          hasFetchedPackageRef.current = true;
          setFetchedPackageData(matchedPackage);
          return matchedPackage;
        } else {
          console.log('⚠️ No matching package found for:', packageTitle);
        }
      }

      return null;
    } catch (error) {
      console.error('❌ Error fetching package:', error);
      return null;
    }
  };

  // ✅ ENHANCED: Fetch seller rates with package-specific filtering
  const fetchSellerRates = async (destination, packageName) => {
    if (!destination || destination === 'Unknown' || destination === 'Unknown Destination') {
      console.log('⚠️ Invalid destination, skipping fetch');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const mainDestination = extractMainDestination(destination);
      console.log(`🔍 Fetching seller rates for: "${destination}"`);
      console.log(`📍 Extracted main destination: "${mainDestination}"`);
      console.log(`📦 Package name: "${packageName}"`);
      
      const response = await fetch(`${API_BASE_URL}/api/seller-rates`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`✅ Fetched ${data.length} total seller rates`);
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format');
      }
      
      const destinationFiltered = data.filter(rate => {
        const matches = destinationsMatchStrict(rate.destination, destination);
        return matches;
      });
      
      console.log(`📊 After destination filter: ${destinationFiltered.length} activities`);
      
      const packageKeywords = extractPackageKeywords(packageName);
      const packageDuration = extractPackageDuration(packageName); // ✅ NEW: Extract duration
      
      console.log(`⏱️ Package duration:`, packageDuration);
      
      let finalFiltered = destinationFiltered;
      
      // ✅ FIXED: Filter by duration first if available (checks both activity and destination field)
      if (packageDuration) {
        finalFiltered = destinationFiltered.filter(rate => {
          // Always include cross-destination activities (flights, etc)
          if (isCrossDestinationActivity(rate.activity)) {
            return true;
          }
          
          // ✅ CRITICAL: Pass both activity and destination to check duration
          // Duration is stored in the destination field (e.g., "Puerto Princesa 5D4N (Solo)")
          return activityMatchesPackageDuration(rate.activity, rate.destination, packageDuration);
        });
        
        console.log(`📊 After duration filter (${packageDuration.format}): ${finalFiltered.length} activities`);
      }
      
      // Then apply package keyword filtering
      if (packageKeywords.length > 0) {
        finalFiltered = finalFiltered.filter(rate => {
          if (isCrossDestinationActivity(rate.activity)) {
            return true;
          }
          
          const matches = activityMatchesPackage(rate.activity, packageKeywords);
          return matches;
        });

        console.log(`📊 After package keyword filter: ${finalFiltered.length} activities`);
      }
      
      const uniqueDestinations = [...new Set(finalFiltered.map(r => r.destination))];
      console.log(`📍 Unique destinations matched:`, uniqueDestinations);
      
      setAvailableActivities(finalFiltered);
      setFilteredActivities(finalFiltered);
      
    } catch (error) {
      console.error('❌ Error fetching seller rates:', error);
      setError(`Failed to load activities: ${error.message}`);
      setAvailableActivities([]);
      setFilteredActivities([]);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ CRITICAL FIX: Initialize inclusions with package fetch fallback
  useEffect(() => {
    if (!booking) {
      console.log('⚠️ No booking provided to BookingCustomizer');
      return;
    }

    const initializeInclusions = async () => {
      console.log('📦 Initializing BookingCustomizer for booking:', booking._id);
      console.log('   - customizedInclusions:', booking.customizedInclusions?.length || 0);
      console.log('   - originalInclusions:', booking.originalInclusions?.length || 0);
      console.log('   - packageId:', booking.packageId || 'null');
      console.log('   - packageName:', booking.packageName || 'null');
      
      // PRIORITY 1: Existing customized inclusions
      if (booking.customizedInclusions && 
          Array.isArray(booking.customizedInclusions) && 
          booking.customizedInclusions.length > 0) {
        
        console.log('✅ Found customizedInclusions:', booking.customizedInclusions.length, 'items');
        
        const clonedInclusions = booking.customizedInclusions.map((inc, index) => ({
          id: inc.id || `inc-${index}-${Date.now()}`,
          name: inc.name || '',
          price: typeof inc.price === 'number' ? inc.price : (parseFloat(inc.price) || 0),
          supplierRate: typeof inc.supplierRate === 'number' ? inc.supplierRate : (parseFloat(inc.supplierRate) || 0),
          markup: typeof inc.markup === 'number' ? inc.markup : (parseFloat(inc.markup) || 0),
          markupType: inc.markupType || 'fixed',
          supplier: inc.supplier || 'N/A',
          destination: inc.destination || '',
          pax: inc.pax || '',
          notes: inc.notes || '',
          isOriginal: inc.isOriginal === true || inc.isOriginal === 'true',
          isChecked: inc.isChecked === false || inc.isChecked === 'false' ? false : true,
          source: inc.source || 'package',
          sellerRateId: inc.sellerRateId || null,
          matchedActivity: inc.matchedActivity || null,
          matchedDestination: inc.matchedDestination || null
        }));
        
        setCustomizedInclusions(clonedInclusions);
        const originalCount = clonedInclusions.filter(inc => inc.isOriginal).length;
        setMatchedInclusionCount(originalCount);
        console.log(`✅ Loaded ${clonedInclusions.length} customized inclusions`);
        return;
      } 
      
      // PRIORITY 2: packageId.inclusions
      if (booking.packageId && 
          booking.packageId.inclusions && 
          Array.isArray(booking.packageId.inclusions) && 
          booking.packageId.inclusions.length > 0) {
        
        console.log('📋 Found packageId.inclusions:', booking.packageId.inclusions.length, 'items');
        
        // ✅ Try to fetch seller rates and match prices
        try {
          // ✅ FIXED: Use destination from packageId, not packageName
          const packageDestination = booking.packageId?.destination || 
                                    booking.destination ||
                                    booking.packageName ||
                                    'Unknown';
          
          console.log('🎯 Using destination for matching:', packageDestination);
          
          const response = await fetch(`${API_BASE_URL}/api/seller-rates`);
          const ratesData = await response.json();
          
          // ✅ FIXED: API returns direct array, not object with status/data
          if (Array.isArray(ratesData)) {
            const activeRates = ratesData.filter(rate => 
              rate.status === 'active' && rate.isArchive === 'No'
            );
            
            console.log(`🔍 Matching packageId.inclusions with ${activeRates.length} seller rates...`);
            const matchedInclusions = matchInclusionsWithPrices(
              booking.packageId.inclusions,
              activeRates,
              packageDestination
            );
            
            setCustomizedInclusions(matchedInclusions);
            console.log(`✅ Initialized ${matchedInclusions.length} inclusions from packageId with prices`);
            return;
          }
        } catch (error) {
          console.error('⚠️ Error fetching seller rates for packageId.inclusions:', error);
        }
        
        // Fallback: Initialize without prices if fetch fails
        const packageInclusions = booking.packageId.inclusions.map((inc, idx) => ({
          id: `original-${idx}`,
          name: inc,
          price: 0,
          isOriginal: true,
          isChecked: true,
          source: 'package'
        }));
        
        setCustomizedInclusions(packageInclusions);
        setMatchedInclusionCount(0);
        console.log(`✅ Initialized ${packageInclusions.length} inclusions from packageId (no prices)`);
        return;
      }
      
      // PRIORITY 3: originalInclusions
      if (booking.originalInclusions && 
          Array.isArray(booking.originalInclusions) && 
          booking.originalInclusions.length > 0) {
        
        console.log('📋 Found originalInclusions:', booking.originalInclusions.length, 'items');
        
        // ✅ Try to fetch seller rates and match prices
        try {
          // ✅ FIXED: Use destination from packageId, not packageName
          const packageDestination = booking.packageId?.destination || 
                                    booking.destination ||
                                    booking.packageName ||
                                    'Unknown';
          
          console.log('🎯 Using destination for matching:', packageDestination);
          
          const response = await fetch(`${API_BASE_URL}/api/seller-rates`);
          const ratesData = await response.json();
          
          // ✅ FIXED: API returns direct array, not object with status/data
          if (Array.isArray(ratesData)) {
            const activeRates = ratesData.filter(rate => 
              rate.status === 'active' && rate.isArchive === 'No'
            );
            
            console.log(`🔍 Matching originalInclusions with ${activeRates.length} seller rates...`);
            const matchedInclusions = matchInclusionsWithPrices(
              booking.originalInclusions,
              activeRates,
              packageDestination
            );
            
            setCustomizedInclusions(matchedInclusions);
            console.log(`✅ Initialized ${matchedInclusions.length} inclusions from originalInclusions with prices`);
            return;
          }
        } catch (error) {
          console.error('⚠️ Error fetching seller rates for originalInclusions:', error);
        }
        
        // Fallback: Initialize without prices if fetch fails
        const fallbackInclusions = booking.originalInclusions.map((inc, idx) => ({
          id: `original-${idx}`,
          name: inc,
          price: 0,
          isOriginal: true,
          isChecked: true,
          source: 'package'
        }));
        
        setCustomizedInclusions(fallbackInclusions);
        setMatchedInclusionCount(0);
        console.log(`✅ Initialized ${fallbackInclusions.length} inclusions from originalInclusions (no prices)`);
        return;
      }
      
      // ✅ PRIORITY 4: FETCH PACKAGE BY TITLE (NEW FALLBACK!)
      if (booking.packageName) {
        console.log('🔍 Attempting to fetch package by title:', booking.packageName);
        const fetchedPackage = await fetchPackageByTitle(booking.packageName);
        
        if (fetchedPackage && fetchedPackage.inclusions && fetchedPackage.inclusions.length > 0) {
          console.log('✅ Using inclusions from fetched package');
          
          // ✅ Try to match with seller rates for accurate pricing
          try {
            // ✅ FIXED: Use destination from fetched package first
            const packageDestination = fetchedPackage.destination ||
                                      booking.packageId?.destination || 
                                      booking.destination ||
                                      'Unknown';
            
            console.log('🎯 Using destination for matching:', packageDestination);
            
            const response = await fetch(`${API_BASE_URL}/api/seller-rates`);
            const ratesData = await response.json();
            
            // ✅ FIXED: API returns direct array, not object with status/data
            if (Array.isArray(ratesData)) {
              const activeRates = ratesData.filter(rate => 
                rate.status === 'active' && rate.isArchive === 'No'
              );
              
              console.log(`🔍 Matching fetched package inclusions with ${activeRates.length} seller rates...`);
              const matchedInclusions = matchInclusionsWithPrices(
                fetchedPackage.inclusions,
                activeRates,
                packageDestination
              );
              
              setCustomizedInclusions(matchedInclusions);
              console.log(`✅ Initialized ${matchedInclusions.length} inclusions from fetched package with prices`);
              return;
            }
          } catch (error) {
            console.error('⚠️ Error fetching seller rates for fetched package:', error);
          }
          
          // Fallback: Initialize without prices if fetch fails
          const packageInclusions = fetchedPackage.inclusions.map((inc, idx) => ({
            id: `original-${idx}`,
            name: inc,
            price: 0,
            isOriginal: true,
            isChecked: true,
            source: 'package'
          }));
          
          setCustomizedInclusions(packageInclusions);
          setMatchedInclusionCount(0);
          console.log(`✅ Initialized ${packageInclusions.length} inclusions from fetched package (no prices)`);
          return;
        }
      }
      
      // PRIORITY 5: EMPTY STATE
      console.error('❌ No inclusions found in any source!');
      setCustomizedInclusions([]);
      setMatchedInclusionCount(0);
    };

    initializeInclusions();
  }, [booking?._id]);

  // ✅ Fetch seller rates when booking changes
  useEffect(() => {
    if (!booking) return;
    
    const packageDestination = booking.packageName ||
                              booking.packageId?.destination || 
                              booking.destination ||
                              'Unknown Destination';
    
    const packageName = booking.packageName || '';
                              
    console.log('🎯 Booking destination:', packageDestination);
    console.log('🎯 Package name:', packageName);
    
    if (currentDestinationRef.current === packageDestination && 
        currentPackageNameRef.current === packageName) {
      console.log('⏭️ Same destination and package, skipping fetch');
      return;
    }
    
    if (hasFetchedRef.current && 
        currentDestinationRef.current === packageDestination &&
        currentPackageNameRef.current === packageName) {
      console.log('⏭️ Already fetched for this destination and package');
      return;
    }
    
    currentDestinationRef.current = packageDestination;
    currentPackageNameRef.current = packageName;
    hasFetchedRef.current = true;
    
    fetchSellerRates(packageDestination, packageName);
  }, [booking]);

  // ✅ Filter activities based on search query
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

  // ✅ Save customization to backend
  const handleSaveCustomization = async () => {
    if (!booking || !booking._id) {
      console.error('❌ No booking ID available');
      setError('Cannot save: No booking ID found');
      return;
    }
    
    setIsSaving(true);
    setError('');
    
    try {
      const checkedInclusions = customizedInclusions.filter(inc => inc.isChecked);
      const addedInclusions = checkedInclusions.filter(inc => !inc.isOriginal);
      const removedOriginal = customizedInclusions.filter(inc => inc.isOriginal && !inc.isChecked);
      
      const additionalPrice = addedInclusions.reduce((sum, inc) => sum + (inc.price || 0), 0);
      const deductions = removedOriginal.reduce((sum, inc) => sum + (inc.price || 0), 0);
      const netAdditionalPrice = additionalPrice - deductions;
      
      console.log('💰 Customization pricing:', {
        additionalPrice,
        deductions,
        netAdditionalPrice,
        checkedCount: checkedInclusions.length
      });
      
      const response = await fetch(`${API_BASE_URL}/api/bookings/${booking._id}/customization`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customizedInclusions: customizedInclusions,
          customizationAdditionalPrice: netAdditionalPrice
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save customization');
      }
      
      const updatedBooking = await response.json();
      console.log('✅ Customization saved:', updatedBooking);
      
      if (onUpdate) {
        onUpdate(updatedBooking.booking);
      }
      
    } catch (error) {
      console.error('❌ Error saving customization:', error);
      setError(`Failed to save: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

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

  const resetCustomization = async () => {
    console.log('🔄 Resetting customization to original');
    
    if (!booking) return;
    
    const originalInclusions = booking.originalInclusions || 
                             booking.packageId?.inclusions ||
                             fetchedPackageData?.inclusions ||
                             [];
    
    if (originalInclusions.length === 0) {
      console.warn('⚠️ No original inclusions found');
      return;
    }
    
    const resetInclusions = originalInclusions.map((inc, idx) => ({
      id: `original-${idx}`,
      name: inc,
      price: 0,
      isOriginal: true,
      isChecked: true,
      source: 'package'
    }));
    
    setCustomizedInclusions(resetInclusions);
    setMatchedInclusionCount(0);
    
    await handleSaveCustomization();
  };

  const formatPrice = (price) => {
    if (!price || isNaN(price)) return '₱0';
    return `₱${Number(price).toLocaleString('en-PH', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`;
  };

  const packageDestination = booking?.packageName ||
                            booking?.packageId?.destination || 
                            booking?.destination ||
                            'Unknown Destination';

  return (
    <div className="pc-container">
      {/* Header */}
      <div className="pc-header">
        <div className="pc-title-row">
          <Package size={24} color="#f97316" />
          <h2 className="pc-title">Customize Your Booking</h2>
        </div>
        <p className="pc-subtitle">
          Personalize your tour by selecting or deselecting inclusions
        </p>
        <div className="pc-destination-badge">
          📍 {booking?.packageName ? `${booking.packageName} in ${extractMainDestination(packageDestination)}` : extractMainDestination(packageDestination)}
        </div>
        
        {customizedInclusions.length > 0 && matchedInclusionCount > 0 && (
          <div style={{
            marginTop: '12px',
            padding: '8px 12px',
            background: '#dbeafe',
            border: '1px solid #93c5fd',
            borderRadius: '8px',
            fontSize: '0.85rem',
            color: '#1e40af'
          }}>
            ✅ {matchedInclusionCount} of {customizedInclusions.length} inclusions have pricing data
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
              {error.includes('⚠️') ? 'Validation Warning' : 'Error'}
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
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="pc-save-btn" 
              onClick={handleSaveCustomization}
              disabled={isSaving}
              style={{
                padding: '8px 16px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                fontSize: '0.9rem',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                opacity: isSaving ? 0.6 : 1,
                transition: 'all 0.2s'
              }}
            >
              {isSaving ? (
                <>
                  <div style={{ 
                    width: '14px', 
                    height: '14px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite'
                  }}></div>
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle size={14} />
                  Save Changes
                </>
              )}
            </button>
            
            <button 
              className="pc-reset-btn" 
              onClick={resetCustomization}
              title="Reset to original package"
            >
              <RotateCcw size={14} /> Reset
            </button>
          </div>
        </div>

        {/* INCLUSIONS LIST */}
        {customizedInclusions.length > 0 ? (
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
                        {formatPrice(inclusion.price)}
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
        ) : (
          <div style={{
            padding: '40px 20px',
            textAlign: 'center',
            color: '#64748b',
            background: '#f8fafc',
            borderRadius: '12px',
            border: '2px dashed #cbd5e1'
          }}>
            <Package size={48} style={{ margin: '0 auto 16px', color: '#cbd5e1' }} />
            <p style={{ margin: 0, fontSize: '1rem', fontWeight: '500' }}>
              No inclusions found for this booking
            </p>
            <p style={{ margin: '8px 0 0', fontSize: '0.875rem' }}>
              Loading package details...
            </p>
          </div>
        )}
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
                Showing activities for <strong>{booking?.packageName || extractMainDestination(packageDestination)}</strong>
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
                  <div key={rate._id} className="pc-activity-item-simple">
                    <div className="pc-activity-content">
                      <div className="pc-activity-title">
                        {rate.activity}
                      </div>
                      <div className="pc-activity-destination">
                        📍 {rate.destination}
                      </div>
                    </div>
                    
                    <div className="pc-activity-actions-simple">
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
                <p>No activities available for {booking?.packageName || extractMainDestination(packageDestination)}.</p>
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

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default BookingCustomizer;