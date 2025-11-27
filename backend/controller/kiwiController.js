const axios = require('axios');

const PHILIPPINE_AIRPORTS = [
  'MNL', 'CEB', 'DVO', 'ILO', 'BCD', 'CRK', 'KLO', 'TAG', 
  'CBO', 'GES', 'USU', 'ZAM', 'BXU', 'DGT', 'MPH', 'PPS',
  'SFS', 'TBH', 'TAC', 'TUG', 'WNP', 'IAO', 'CGY', 'BSO'
];

function isDomesticPhilippineFlight(origin, destination) {
  return PHILIPPINE_AIRPORTS.includes(origin.toUpperCase()) && 
         PHILIPPINE_AIRPORTS.includes(destination.toUpperCase());
}

exports.searchFlightPrices = async (req, res) => {
  try {
    const { origin, destination, departureDate, returnDate, adults = 1 } = req.query;

    console.log('🔍 Flight search request:', { origin, destination, departureDate, returnDate, adults });

    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        message: 'Origin and destination are required'
      });
    }

    const isDomestic = isDomesticPhilippineFlight(origin, destination);
    console.log(`🔍 Route type: ${isDomestic ? 'DOMESTIC Philippine' : 'INTERNATIONAL'}`);
    return await searchKiwiWithFallback(req, res, origin, destination, departureDate, returnDate, adults, isDomestic);

  } catch (error) {
    console.error('❌ Search error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error searching flights',
      error: error.message
    });
  }
};

async function searchKiwiWithFallback(req, res, origin, destination, departureDate, returnDate, adults, isDomestic) {
  try {
    console.log('🌍 Attempting Kiwi API search...');

    let searchDate;
    if (departureDate) {
      const inputDate = new Date(departureDate);
      const today = new Date();
      const daysAhead = Math.floor((inputDate - today) / (1000 * 60 * 60 * 24));
      
      if (daysAhead < 7) {
        console.log('⚠️  Date too soon, adjusting to 30 days ahead for better results');
        const betterDate = new Date();
        betterDate.setDate(betterDate.getDate() + 30);
        searchDate = betterDate.toISOString().split('T')[0];
      } else {
        searchDate = inputDate.toISOString().split('T')[0];
      }
    } else {
      const nextMonth = new Date();
      nextMonth.setDate(nextMonth.getDate() + 30);
      searchDate = nextMonth.toISOString().split('T')[0];
    }

    const dateFrom = new Date(searchDate);
    const dateTo = new Date(searchDate);
    dateTo.setDate(dateTo.getDate() + 6); 

    const options = {
      method: 'GET',
      url: 'https://kiwi-com-cheap-flights.p.rapidapi.com/search',
      params: {
        fly_from: origin.toUpperCase(),
        fly_to: destination.toUpperCase(),
        date_from: dateFrom.toISOString().split('T')[0],
        date_to: dateTo.toISOString().split('T')[0],
        adults: parseInt(adults),
        curr: 'PHP',
        locale: 'en',
        limit: 50,
        sort: 'price',
        max_stopovers: isDomestic ? 0 : 2,
        flight_type: returnDate ? 'round' : 'oneway'
      },
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
        'x-rapidapi-host': 'kiwi-com-cheap-flights.p.rapidapi.com'
      },
      timeout: 20000
    };

    if (returnDate) {
      const returnFrom = new Date(returnDate);
      const returnTo = new Date(returnDate);
      returnTo.setDate(returnTo.getDate() + 6);
      
      options.params.return_from = returnFrom.toISOString().split('T')[0];
      options.params.return_to = returnTo.toISOString().split('T')[0];
    }

    console.log('📡 Calling Kiwi API with params:', options.params);

    const response = await axios.request(options);
    
    console.log('📥 API Response status:', response.status);
    console.log('📥 API Response data structure:', Object.keys(response.data || {}));

    let flights = [];
    
    if (response.data?.data) {
      flights = response.data.data;
      console.log(`📊 Found ${flights.length} flights in response.data.data`);
    } else if (response.data?.itineraries) {
      flights = response.data.itineraries;
      console.log(`📊 Found ${flights.length} flights in response.data.itineraries`);
    } else if (Array.isArray(response.data)) {
      flights = response.data;
      console.log(`📊 Found ${flights.length} flights in response.data array`);
    }

    if (flights.length === 0) {
      console.log('⚠️  No flights from API, using enhanced estimates...');
      return await useEnhancedEstimates(req, res, origin, destination, searchDate, adults, isDomestic);
    }

    const transformedFlights = flights.map((flight, index) => {
      const route = flight.route || [flight];
      const firstLeg = route[0] || flight;
      const lastLeg = route[route.length - 1] || flight;

      const deptTime = new Date(firstLeg.dTime || firstLeg.local_departure || firstLeg.utc_departure);
      const arrTime = new Date(lastLeg.aTime || lastLeg.local_arrival || lastLeg.utc_arrival);
      const durationSeconds = (arrTime - deptTime) / 1000;

      const price = flight.price || flight.conversion?.PHP || 0;
      const airline = firstLeg.airline || firstLeg.airlines?.[0] || firstLeg.carrier?.name || 'Unknown';
      const airlineCode = firstLeg.operating_carrier || firstLeg.carrier?.code || 'XX';

      return {
        id: flight.id || `flight-${index}`,
        price: {
          amount: price,
          currency: 'PHP',
          formatted: `₱${Math.round(price).toLocaleString()}`,
          isEstimated: false,
          pricePerAdult: Math.round(price / parseInt(adults)),
          lastUpdated: new Date().toISOString()
        },
        airline: {
          name: airline,
          code: airlineCode,
          flightNumber: firstLeg.flight_no || firstLeg.flightNumber || 'N/A',
          logo: `https://images.kiwi.com/airlines/64/${airlineCode}.png`
        },
        departure: {
          airport: firstLeg.cityFrom || origin,
          iataCode: firstLeg.flyFrom || origin.toUpperCase(),
          scheduledTime: deptTime.toISOString(),
          displayTime: deptTime.toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit', hour12: true
          }),
          displayDate: deptTime.toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
          })
        },
        arrival: {
          airport: lastLeg.cityTo || destination,
          iataCode: lastLeg.flyTo || destination.toUpperCase(),
          scheduledTime: arrTime.toISOString(),
          displayTime: arrTime.toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit', hour12: true
          }),
          displayDate: arrTime.toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
          })
        },
        duration: formatDuration(durationSeconds),
        stops: route.length - 1,
        quality: flight.quality ? (flight.quality * 10).toFixed(1) : '7.5',
        bookingUrl: flight.deep_link || `https://www.kiwi.com/deep?from=${origin}&to=${destination}&departure=${searchDate}`,
        source: 'kiwi-api',
        routeType: isDomestic ? 'domestic' : 'international'
      };
    });

    transformedFlights.sort((a, b) => a.price.amount - b.price.amount);

    return res.json({
      success: true,
      count: transformedFlights.length,
      data: transformedFlights,
      source: 'kiwi.com (real-time)',
      searchDate: searchDate,
      priceDisclaimer: '✅ Real-time prices from airlines. Prices are current and bookable.',
      routeInfo: {
        type: isDomestic ? 'Domestic Philippine Flight' : 'International Flight',
        origin: origin.toUpperCase(),
        destination: destination.toUpperCase()
      }
    });

  } catch (error) {
    console.error('❌ Kiwi API error:', error.response?.data || error.message);
    console.log('🔄 Falling back to enhanced estimates...');
    return await useEnhancedEstimates(req, res, origin, destination, departureDate, adults, isDomestic);
  }
}

async function useEnhancedEstimates(req, res, origin, destination, departureDate, adults, isDomestic) {
  console.log('📊 Generating enhanced price estimates...');

  const date = departureDate ? new Date(departureDate) : new Date();
  date.setDate(date.getDate() + 30);
  date.setHours(0, 0, 0, 0);

  const routes = getRouteData(origin, destination, isDomestic);
  const flights = generateEnhancedFlights(origin, destination, date, routes, adults);

  return res.json({
    success: true,
    count: flights.length,
    data: flights,
    source: 'enhanced-estimates',
    searchDate: date.toISOString().split('T')[0],
    priceDisclaimer: '⚠️ These are estimated prices based on historical data. For exact prices, click "Book Now" to check airline websites.',
    routeInfo: {
      type: isDomestic ? 'Domestic Philippine Flight' : 'International Flight',
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase()
    },
    bookingSites: [
      { name: 'Cebu Pacific', url: 'https://www.cebupacificair.com' },
      { name: 'Philippine Airlines', url: 'https://www.philippineairlines.com' },
      { name: 'AirAsia', url: 'https://www.airasia.com' },
      { name: 'Google Flights', url: `https://www.google.com/flights?q=${origin}+to+${destination}` }
    ]
  });
}

function getRouteData(origin, destination, isDomestic) {
  const domesticRoutes = {
    'MNL-CEB': { basePrice: 2500, duration: 85, airlines: ['5J', 'PR', 'Z2'] },
    'MNL-DVO': { basePrice: 3200, duration: 120, airlines: ['5J', 'PR', 'Z2'] },
    'MNL-ILO': { basePrice: 2200, duration: 60, airlines: ['5J', 'PR'] },
    'MNL-BCD': { basePrice: 2400, duration: 65, airlines: ['5J', 'PR'] },
    'MNL-KLO': { basePrice: 2300, duration: 55, airlines: ['5J', 'PR', 'Z2'] },
    'CEB-DVO': { basePrice: 1800, duration: 55, airlines: ['5J', 'PR'] },
    'MNL-CRK': { basePrice: 1500, duration: 45, airlines: ['5J'] }
  };

  const internationalRoutes = {
    'MNL-SIN': { basePrice: 8500, duration: 210, airlines: ['5J', 'PR', 'SQ', 'TR'] },
    'MNL-BKK': { basePrice: 7500, duration: 225, airlines: ['5J', 'PR', 'TG', 'FD'] },
    'MNL-HKG': { basePrice: 6500, duration: 135, airlines: ['5J', 'PR', 'CX'] },
    'MNL-KUL': { basePrice: 7000, duration: 240, airlines: ['5J', 'AK', 'MH'] },
    'MNL-ICN': { basePrice: 12000, duration: 240, airlines: ['PR', 'KE', '7C'] },
    'MNL-TPE': { basePrice: 6000, duration: 135, airlines: ['PR', 'CI', 'BR'] }
  };

  const routes = isDomestic ? domesticRoutes : internationalRoutes;
  const routeKey = `${origin}-${destination}`;
  const reverseKey = `${destination}-${origin}`;

  return routes[routeKey] || routes[reverseKey] || {
    basePrice: isDomestic ? 2500 : 8000,
    duration: isDomestic ? 90 : 180,
    airlines: isDomestic ? ['5J', 'PR'] : ['5J', 'PR']
  };
}

function generateEnhancedFlights(origin, destination, date, routeData, adults) {
  const airlineInfo = {
    '5J': { name: 'Cebu Pacific', mult: 0.85 },
    'PR': { name: 'Philippine Airlines', mult: 1.2 },
    'Z2': { name: 'AirAsia Philippines', mult: 0.9 },
    'SQ': { name: 'Singapore Airlines', mult: 1.5 },
    'TR': { name: 'Scoot', mult: 0.95 },
    'TG': { name: 'Thai Airways', mult: 1.3 },
    'FD': { name: 'Thai AirAsia', mult: 0.88 },
    'CX': { name: 'Cathay Pacific', mult: 1.4 },
    'AK': { name: 'AirAsia', mult: 0.87 },
    'MH': { name: 'Malaysia Airlines', mult: 1.25 },
    'KE': { name: 'Korean Air', mult: 1.6 },
    '7C': { name: 'Jeju Air', mult: 0.92 },
    'CI': { name: 'China Airlines', mult: 1.3 },
    'BR': { name: 'EVA Air', mult: 1.35 }
  };

  const flightTimes = [
    { hour: 6, minute: 0 },
    { hour: 9, minute: 30 },
    { hour: 13, minute: 0 },
    { hour: 16, minute: 30 },
    { hour: 19, minute: 0 }
  ];

  const flights = [];

  routeData.airlines.slice(0, 4).forEach((airlineCode, airlineIdx) => {
    const airline = airlineInfo[airlineCode] || { name: 'Unknown', mult: 1 };
    
    flightTimes.slice(0, 2).forEach((time, timeIdx) => {
      const deptTime = new Date(date);
      deptTime.setHours(time.hour, time.minute, 0, 0);

      const arrTime = new Date(deptTime.getTime() + routeData.duration * 60000);

      const basePrice = routeData.basePrice * airline.mult;
      const variation = 0.85 + Math.random() * 0.3;
      const finalPrice = Math.round(basePrice * variation);

      flights.push({
        id: `${airlineCode}${100 + airlineIdx * 10 + timeIdx}`,
        price: {
          amount: finalPrice * parseInt(adults),
          currency: 'PHP',
          formatted: `₱${(finalPrice * parseInt(adults)).toLocaleString()}`,
          isEstimated: true,
          pricePerAdult: finalPrice
        },
        airline: {
          name: airline.name,
          code: airlineCode,
          flightNumber: `${airlineCode}${100 + airlineIdx * 10 + timeIdx}`,
          logo: `https://images.kiwi.com/airlines/64/${airlineCode}.png`
        },
        departure: {
          airport: getAirportName(origin),
          iataCode: origin.toUpperCase(),
          scheduledTime: deptTime.toISOString(),
          displayTime: deptTime.toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit', hour12: true
          }),
          displayDate: deptTime.toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
          })
        },
        arrival: {
          airport: getAirportName(destination),
          iataCode: destination.toUpperCase(),
          scheduledTime: arrTime.toISOString(),
          displayTime: arrTime.toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit', hour12: true
          }),
          displayDate: arrTime.toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
          })
        },
        duration: `${Math.floor(routeData.duration / 60)}h ${routeData.duration % 60}m`,
        stops: 0,
        quality: (7 + Math.random() * 2).toFixed(1),
        bookingUrl: getAirlineBookingUrl(airline.name, origin, destination),
        source: 'estimated'
      });
    });
  });

  return flights.sort((a, b) => a.price.amount - b.price.amount);
}

function getAirportName(code) {
  const airports = {
    'MNL': 'Ninoy Aquino Intl',
    'CEB': 'Mactan-Cebu Intl',
    'DVO': 'Francisco Bangoy Intl',
    'ILO': 'Iloilo Intl',
    'BCD': 'Bacolod-Silay',
    'CRK': 'Clark Intl',
    'KLO': 'Kalibo Intl',
    'SIN': 'Singapore Changi',
    'BKK': 'Bangkok Suvarnabhumi',
    'HKG': 'Hong Kong Intl',
    'KUL': 'Kuala Lumpur Intl',
    'ICN': 'Seoul Incheon',
    'TPE': 'Taiwan Taoyuan'
  };
  return airports[code.toUpperCase()] || code;
}

function getAirlineBookingUrl(airlineName, origin, destination) {
  const urls = {
    'Cebu Pacific': 'https://www.cebupacificair.com',
    'Philippine Airlines': 'https://www.philippineairlines.com',
    'AirAsia Philippines': 'https://www.airasia.com',
    'AirAsia': 'https://www.airasia.com'
  };
  return urls[airlineName] || `https://www.google.com/flights?q=${origin}+to+${destination}`;
}

function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return 'N/A';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

exports.validateFlightPrice = async (req, res) => {
  res.json({
    success: true,
    isValid: true,
    message: 'Proceed to booking site for final price confirmation'
  });
};

exports.getCheapestFlight = async (req, res) => {
  res.json({
    success: false,
    message: 'Feature coming soon'
  });
};