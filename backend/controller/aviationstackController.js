const axios = require('axios');

// Comprehensive airport list as fallback (major airports worldwide)
const FALLBACK_AIRPORTS = [
  // PHILIPPINES
  { iata_code: 'MNL', airport_name: 'Ninoy Aquino International Airport', city_name: 'Manila', country_name: 'Philippines', country_iso2: 'PH' },
  { iata_code: 'CEB', airport_name: 'Mactan-Cebu International Airport', city_name: 'Cebu', country_name: 'Philippines', country_iso2: 'PH' },
  { iata_code: 'DVO', airport_name: 'Francisco Bangoy International Airport', city_name: 'Davao', country_name: 'Philippines', country_iso2: 'PH' },
  { iata_code: 'CRK', airport_name: 'Clark International Airport', city_name: 'Angeles', country_name: 'Philippines', country_iso2: 'PH' },
  { iata_code: 'ILO', airport_name: 'Iloilo International Airport', city_name: 'Iloilo', country_name: 'Philippines', country_iso2: 'PH' },
  { iata_code: 'BCD', airport_name: 'Bacolod-Silay Airport', city_name: 'Bacolod', country_name: 'Philippines', country_iso2: 'PH' },
  { iata_code: 'KLO', airport_name: 'Kalibo International Airport', city_name: 'Kalibo', country_name: 'Philippines', country_iso2: 'PH' },
  { iata_code: 'TAG', airport_name: 'Tagbilaran Airport', city_name: 'Tagbilaran', country_name: 'Philippines', country_iso2: 'PH' },
  { iata_code: 'PPS', airport_name: 'Puerto Princesa Airport', city_name: 'Puerto Princesa', country_name: 'Philippines', country_iso2: 'PH' },
  { iata_code: 'MPH', airport_name: 'Godofredo P. Ramos Airport', city_name: 'Caticlan', country_name: 'Philippines', country_iso2: 'PH' },
  
  // ASIA
  { iata_code: 'SIN', airport_name: 'Singapore Changi Airport', city_name: 'Singapore', country_name: 'Singapore', country_iso2: 'SG' },
  { iata_code: 'HKG', airport_name: 'Hong Kong International Airport', city_name: 'Hong Kong', country_name: 'Hong Kong', country_iso2: 'HK' },
  { iata_code: 'TPE', airport_name: 'Taiwan Taoyuan International Airport', city_name: 'Taipei', country_name: 'Taiwan', country_iso2: 'TW' },
  { iata_code: 'ICN', airport_name: 'Incheon International Airport', city_name: 'Seoul', country_name: 'South Korea', country_iso2: 'KR' },
  { iata_code: 'NRT', airport_name: 'Narita International Airport', city_name: 'Tokyo', country_name: 'Japan', country_iso2: 'JP' },
  { iata_code: 'HND', airport_name: 'Tokyo Haneda Airport', city_name: 'Tokyo', country_name: 'Japan', country_iso2: 'JP' },
  { iata_code: 'BKK', airport_name: 'Suvarnabhumi Airport', city_name: 'Bangkok', country_name: 'Thailand', country_iso2: 'TH' },
  { iata_code: 'KUL', airport_name: 'Kuala Lumpur International Airport', city_name: 'Kuala Lumpur', country_name: 'Malaysia', country_iso2: 'MY' },
  { iata_code: 'CGK', airport_name: 'Soekarno-Hatta International Airport', city_name: 'Jakarta', country_name: 'Indonesia', country_iso2: 'ID' },
  { iata_code: 'DPS', airport_name: 'Ngurah Rai International Airport', city_name: 'Bali', country_name: 'Indonesia', country_iso2: 'ID' },
  { iata_code: 'SGN', airport_name: 'Tan Son Nhat International Airport', city_name: 'Ho Chi Minh City', country_name: 'Vietnam', country_iso2: 'VN' },
  { iata_code: 'HAN', airport_name: 'Noi Bai International Airport', city_name: 'Hanoi', country_name: 'Vietnam', country_iso2: 'VN' },
  { iata_code: 'PVG', airport_name: 'Shanghai Pudong International Airport', city_name: 'Shanghai', country_name: 'China', country_iso2: 'CN' },
  { iata_code: 'PEK', airport_name: 'Beijing Capital International Airport', city_name: 'Beijing', country_name: 'China', country_iso2: 'CN' },
  { iata_code: 'CAN', airport_name: 'Guangzhou Baiyun International Airport', city_name: 'Guangzhou', country_name: 'China', country_iso2: 'CN' },
  
  // USA
  { iata_code: 'JFK', airport_name: 'John F. Kennedy International Airport', city_name: 'New York', country_name: 'United States', country_iso2: 'US' },
  { iata_code: 'LAX', airport_name: 'Los Angeles International Airport', city_name: 'Los Angeles', country_name: 'United States', country_iso2: 'US' },
  { iata_code: 'ORD', airport_name: "O'Hare International Airport", city_name: 'Chicago', country_name: 'United States', country_iso2: 'US' },
  { iata_code: 'MIA', airport_name: 'Miami International Airport', city_name: 'Miami', country_name: 'United States', country_iso2: 'US' },
  { iata_code: 'SFO', airport_name: 'San Francisco International Airport', city_name: 'San Francisco', country_name: 'United States', country_iso2: 'US' },
  { iata_code: 'LAS', airport_name: 'Harry Reid International Airport', city_name: 'Las Vegas', country_name: 'United States', country_iso2: 'US' },
  { iata_code: 'SEA', airport_name: 'Seattle-Tacoma International Airport', city_name: 'Seattle', country_name: 'United States', country_iso2: 'US' },
  { iata_code: 'LGA', airport_name: 'LaGuardia Airport', city_name: 'New York', country_name: 'United States', country_iso2: 'US' },
  { iata_code: 'EWR', airport_name: 'Newark Liberty International Airport', city_name: 'Newark', country_name: 'United States', country_iso2: 'US' },
  { iata_code: 'DFW', airport_name: 'Dallas/Fort Worth International Airport', city_name: 'Dallas', country_name: 'United States', country_iso2: 'US' },
  { iata_code: 'ATL', airport_name: 'Hartsfield-Jackson Atlanta International Airport', city_name: 'Atlanta', country_name: 'United States', country_iso2: 'US' },
  
  // EUROPE
  { iata_code: 'LHR', airport_name: 'London Heathrow Airport', city_name: 'London', country_name: 'United Kingdom', country_iso2: 'GB' },
  { iata_code: 'LGW', airport_name: 'London Gatwick Airport', city_name: 'London', country_name: 'United Kingdom', country_iso2: 'GB' },
  { iata_code: 'CDG', airport_name: 'Charles de Gaulle Airport', city_name: 'Paris', country_name: 'France', country_iso2: 'FR' },
  { iata_code: 'AMS', airport_name: 'Amsterdam Airport Schiphol', city_name: 'Amsterdam', country_name: 'Netherlands', country_iso2: 'NL' },
  { iata_code: 'FRA', airport_name: 'Frankfurt Airport', city_name: 'Frankfurt', country_name: 'Germany', country_iso2: 'DE' },
  { iata_code: 'MUC', airport_name: 'Munich Airport', city_name: 'Munich', country_name: 'Germany', country_iso2: 'DE' },
  { iata_code: 'FCO', airport_name: 'Leonardo da Vinci-Fiumicino Airport', city_name: 'Rome', country_name: 'Italy', country_iso2: 'IT' },
  { iata_code: 'MAD', airport_name: 'Adolfo Suárez Madrid-Barajas Airport', city_name: 'Madrid', country_name: 'Spain', country_iso2: 'ES' },
  { iata_code: 'BCN', airport_name: 'Barcelona-El Prat Airport', city_name: 'Barcelona', country_name: 'Spain', country_iso2: 'ES' },
  { iata_code: 'IST', airport_name: 'Istanbul Airport', city_name: 'Istanbul', country_name: 'Turkey', country_iso2: 'TR' },
  { iata_code: 'VIE', airport_name: 'Vienna International Airport', city_name: 'Vienna', country_name: 'Austria', country_iso2: 'AT' },
  { iata_code: 'ZRH', airport_name: 'Zurich Airport', city_name: 'Zurich', country_name: 'Switzerland', country_iso2: 'CH' },
  
  // MIDDLE EAST
  { iata_code: 'DXB', airport_name: 'Dubai International Airport', city_name: 'Dubai', country_name: 'United Arab Emirates', country_iso2: 'AE' },
  { iata_code: 'DOH', airport_name: 'Hamad International Airport', city_name: 'Doha', country_name: 'Qatar', country_iso2: 'QA' },
  { iata_code: 'AUH', airport_name: 'Abu Dhabi International Airport', city_name: 'Abu Dhabi', country_name: 'United Arab Emirates', country_iso2: 'AE' },
  
  // OCEANIA
  { iata_code: 'SYD', airport_name: 'Sydney Kingsford Smith Airport', city_name: 'Sydney', country_name: 'Australia', country_iso2: 'AU' },
  { iata_code: 'MEL', airport_name: 'Melbourne Airport', city_name: 'Melbourne', country_name: 'Australia', country_iso2: 'AU' },
  { iata_code: 'BNE', airport_name: 'Brisbane Airport', city_name: 'Brisbane', country_name: 'Australia', country_iso2: 'AU' },
  { iata_code: 'AKL', airport_name: 'Auckland Airport', city_name: 'Auckland', country_name: 'New Zealand', country_iso2: 'NZ' },
  
  // CANADA
  { iata_code: 'YYZ', airport_name: 'Toronto Pearson International Airport', city_name: 'Toronto', country_name: 'Canada', country_iso2: 'CA' },
  { iata_code: 'YVR', airport_name: 'Vancouver International Airport', city_name: 'Vancouver', country_name: 'Canada', country_iso2: 'CA' },
  
  // SOUTH AMERICA
  { iata_code: 'GRU', airport_name: 'São Paulo/Guarulhos International Airport', city_name: 'São Paulo', country_name: 'Brazil', country_iso2: 'BR' },
  { iata_code: 'EZE', airport_name: 'Ministro Pistarini International Airport', city_name: 'Buenos Aires', country_name: 'Argentina', country_iso2: 'AR' },
  { iata_code: 'BOG', airport_name: 'El Dorado International Airport', city_name: 'Bogotá', country_name: 'Colombia', country_iso2: 'CO' },
  { iata_code: 'LIM', airport_name: 'Jorge Chávez International Airport', city_name: 'Lima', country_name: 'Peru', country_iso2: 'PE' },
];

// Cache for API results
let apiAirportsCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

exports.searchFlights = async (req, res) => {
  try {
    const { origin, destination, departureDate } = req.query;
    console.log('Aviationstack search params:', { origin, destination, departureDate });

    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: origin and destination'
      });
    }

    const apiUrl = 'http://api.aviationstack.com/v1/flights';
    
    const params = {
      access_key: process.env.AVIATIONSTACK_API_KEY,
      dep_iata: origin.toUpperCase(),
      arr_iata: destination.toUpperCase(),
      limit: 50
    };

    const response = await axios.get(apiUrl, { params });

    if (!response.data.data || response.data.data.length === 0) {
      return res.json({
        success: true,
        count: 0,
        data: [],
        message: 'No flights found for this route'
      });
    }

    const flights = response.data.data.map(flight => ({
      id: flight.flight.iata,
      airline: {
        name: flight.airline.name,
        code: flight.airline.iata || flight.airline.icao,
        flightNumber: flight.flight.number
      },
      departure: {
        airport: flight.departure.airport,
        iataCode: flight.departure.iata,
        terminal: flight.departure.terminal,
        gate: flight.departure.gate,
        scheduledTime: flight.departure.scheduled,
        estimatedTime: flight.departure.estimated,
        actualTime: flight.departure.actual,
        delay: flight.departure.delay
      },
      arrival: {
        airport: flight.arrival.airport,
        iataCode: flight.arrival.iata,
        terminal: flight.arrival.terminal,
        gate: flight.arrival.gate,
        scheduledTime: flight.arrival.scheduled,
        estimatedTime: flight.arrival.estimated,
        actualTime: flight.arrival.actual,
        delay: flight.arrival.delay
      },
      status: flight.flight_status,
      aircraft: flight.aircraft?.registration || 'N/A',
      duration: calculateDuration(flight.departure.scheduled, flight.arrival.scheduled)
    }));

    res.json({
      success: true,
      count: flights.length,
      data: flights
    });

  } catch (error) {
    console.error('Aviationstack error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API key. Check your Aviationstack API key in .env file'
      });
    }

    if (error.response?.status === 429) {
      return res.status(429).json({
        success: false,
        message: 'API rate limit exceeded. You have reached your monthly limit (100 requests)'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error searching flights',
      error: error.message
    });
  }
};

function calculateDuration(departureTime, arrivalTime) {
  try {
    const dept = new Date(departureTime);
    const arr = new Date(arrivalTime);
    const diffMs = arr - dept;
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffMins = Math.floor((diffMs % 3600000) / 60000);
    return `${diffHrs}h ${diffMins}m`;
  } catch (error) {
    return 'N/A';
  }
}

exports.getAirlines = async (req, res) => {
  try {
    const apiUrl = 'http://api.aviationstack.com/v1/airlines';
    
    const params = {
      access_key: process.env.AVIATIONSTACK_API_KEY,
      limit: 100
    };

    const response = await axios.get(apiUrl, { params });

    res.json({
      success: true,
      data: response.data.data
    });

  } catch (error) {
    console.error('Airlines error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching airlines'
    });
  }
};

// IMPROVED: Airport search with fallback system
exports.getAirports = async (req, res) => {
  try {
    const { search } = req.query;
    const searchTerm = (search || '').toLowerCase().trim();

    console.log(`🔍 Airport search: "${searchTerm}"`);

    // Combine fallback airports with cached API data
    let allAirports = [...FALLBACK_AIRPORTS];

    // Try to fetch from API and cache (only once every 24 hours)
    const now = Date.now();
    const cacheIsValid = apiAirportsCache && cacheTimestamp && (now - cacheTimestamp < CACHE_DURATION);

    if (!cacheIsValid && process.env.AVIATIONSTACK_API_KEY) {
      try {
        console.log('🌐 Fetching additional airports from API...');
        const apiUrl = 'http://api.aviationstack.com/v1/airports';
        const params = {
          access_key: process.env.AVIATIONSTACK_API_KEY,
          limit: 100
        };

        const response = await axios.get(apiUrl, { params });

        if (response.data && response.data.data) {
          apiAirportsCache = response.data.data.filter(airport => airport.iata_code);
          cacheTimestamp = now;
          console.log(`✅ Fetched ${apiAirportsCache.length} airports from API`);
          
          // Merge with fallback (avoid duplicates)
          apiAirportsCache.forEach(airport => {
            if (!allAirports.find(a => a.iata_code === airport.iata_code)) {
              allAirports.push(airport);
            }
          });
        }
      } catch (apiError) {
        console.log('⚠️ API fetch failed, using fallback airports only:', apiError.message);
      }
    } else if (apiAirportsCache) {
      console.log('✅ Using cached API airports');
      // Merge cached data
      apiAirportsCache.forEach(airport => {
        if (!allAirports.find(a => a.iata_code === airport.iata_code)) {
          allAirports.push(airport);
        }
      });
    }

    // Filter based on search term
    let filteredAirports = allAirports;

    if (searchTerm) {
      filteredAirports = allAirports.filter(airport => {
        const iataMatch = airport.iata_code?.toLowerCase().includes(searchTerm);
        const nameMatch = airport.airport_name?.toLowerCase().includes(searchTerm);
        const cityMatch = airport.city_name?.toLowerCase().includes(searchTerm);
        const countryMatch = airport.country_name?.toLowerCase().includes(searchTerm);
        
        return iataMatch || nameMatch || cityMatch || countryMatch;
      });
    }

    // Sort by relevance
    filteredAirports.sort((a, b) => {
      const aIata = a.iata_code?.toLowerCase() || '';
      const bIata = b.iata_code?.toLowerCase() || '';
      
      // Exact match first
      if (aIata === searchTerm) return -1;
      if (bIata === searchTerm) return 1;
      
      // Starts with search term
      if (aIata.startsWith(searchTerm) && !bIata.startsWith(searchTerm)) return -1;
      if (bIata.startsWith(searchTerm) && !aIata.startsWith(searchTerm)) return 1;
      
      // Alphabetical
      return aIata.localeCompare(bIata);
    });

    console.log(`✅ Returning ${filteredAirports.length} airports (total: ${allAirports.length})`);

    res.json({
      success: true,
      data: filteredAirports.slice(0, 50), // Limit to 50 results
      source: apiAirportsCache ? 'api+fallback' : 'fallback',
      totalAvailable: allAirports.length
    });

  } catch (error) {
    console.error('Airports error:', error);
    
    // If everything fails, return fallback airports
    console.log('⚠️ Returning fallback airports only due to error');
    const searchTerm = (req.query.search || '').toLowerCase().trim();
    
    let filteredFallback = FALLBACK_AIRPORTS;
    if (searchTerm) {
      filteredFallback = FALLBACK_AIRPORTS.filter(airport => {
        const iataMatch = airport.iata_code?.toLowerCase().includes(searchTerm);
        const nameMatch = airport.airport_name?.toLowerCase().includes(searchTerm);
        const cityMatch = airport.city_name?.toLowerCase().includes(searchTerm);
        const countryMatch = airport.country_name?.toLowerCase().includes(searchTerm);
        return iataMatch || nameMatch || cityMatch || countryMatch;
      });
    }

    res.json({
      success: true,
      data: filteredFallback.slice(0, 50),
      source: 'fallback-only',
      warning: 'Using fallback airports due to error'
    });
  }
};

// NEW: Endpoint to manually refresh cache
exports.refreshAirportsCache = async (req, res) => {
  try {
    console.log('🔄 Manually refreshing airports cache...');
    
    const apiUrl = 'http://api.aviationstack.com/v1/airports';
    const params = {
      access_key: process.env.AVIATIONSTACK_API_KEY,
      limit: 100
    };

    const response = await axios.get(apiUrl, { params });

    if (response.data && response.data.data) {
      apiAirportsCache = response.data.data.filter(airport => airport.iata_code);
      cacheTimestamp = Date.now();
      
      res.json({
        success: true,
        message: 'Cache refreshed successfully',
        totalAirports: apiAirportsCache.length
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'No data received from API'
      });
    }

  } catch (error) {
    console.error('Cache refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Error refreshing cache',
      error: error.message
    });
  }
};

// NEW: Get cache status
exports.getCacheStatus = (req, res) => {
  const now = Date.now();
  const cacheAge = cacheTimestamp ? now - cacheTimestamp : null;
  const cacheValid = cacheAge && cacheAge < CACHE_DURATION;

  res.json({
    success: true,
    cached: !!apiAirportsCache,
    totalAirports: apiAirportsCache?.length || 0,
    fallbackAirports: FALLBACK_AIRPORTS.length,
    cacheAge: cacheAge ? Math.floor(cacheAge / 1000 / 60) + ' minutes' : 'N/A',
    cacheValid,
    expiresIn: cacheValid ? Math.floor((CACHE_DURATION - cacheAge) / 1000 / 60) + ' minutes' : 'Expired'
  });
};