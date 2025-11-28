const Amadeus = require('amadeus');

let amadeus;
try {
  const config = {
    clientId: process.env.AMADEUS_API_KEY,
    clientSecret: process.env.AMADEUS_API_SECRET
  };

  if (process.env.AMADEUS_HOSTNAME === 'test') {
    config.hostname = 'test';
  }

  amadeus = new Amadeus(config);
} catch (error) {
  console.error('❌ Failed to initialize Amadeus SDK:', error.message);
}

exports.verifyCredentials = async (req, res) => {
  try {
    console.log('🔍 Testing Amadeus credentials...');
    const response = await amadeus.referenceData.locations.get({
      keyword: 'MNL',
      subType: 'AIRPORT'
    });

    console.log('✅ Amadeus credentials are VALID!');
    console.log('✅ Test result:', response.data.length, 'locations found');
    
    return res.json({
      success: true,
      message: 'Amadeus API credentials are working correctly!',
      environment: process.env.AMADEUS_HOSTNAME || 'production',
      testResult: `Found ${response.data.length} airports for MNL`,
      apiVersion: response.meta?.version || 'unknown'
    });

  } catch (error) {
    console.error('❌ Credential verification failed');
    console.error('Error details:', JSON.stringify(error.response?.body || error.message, null, 2));
    
    const errorBody = error.response?.body;
    let troubleshooting = [
      '1. Verify your API Key and Secret at: https://developers.amadeus.com/my-apps',
      '2. Make sure you copied the ENTIRE secret (usually 16 characters)',
      '3. Check there are no extra spaces in your .env file',
      '4. Try regenerating your API keys if still not working'
    ];

    if (errorBody?.errors?.[0]?.code === 38187) {
      troubleshooting.unshift('⚠️ POSSIBLE ISSUE: You might be using TEST keys with PRODUCTION environment (or vice versa)');
      troubleshooting.push('5. Try adding AMADEUS_HOSTNAME=test to your .env if using test keys');
    }
    
    return res.status(401).json({
      success: false,
      message: 'Amadeus API credentials are INVALID',
      error: errorBody || error.message,
      troubleshooting: troubleshooting
    });
  }
};

exports.searchFlightOffers = async (req, res) => {
  try {
    const { 
      origin, 
      destination, 
      departureDate, 
      returnDate,
      adults = 1,
      children = 0,
      infants = 0,
      cabinType = 'ECONOMY'
    } = req.query;

    console.log('🔍 Amadeus Flight Search:', { 
      origin, 
      destination, 
      departureDate, 
      returnDate,
      adults,
      cabinType
    });

    if (!origin || !destination || !departureDate) {
      return res.status(400).json({
        success: false,
        message: 'Origin, destination, and departure date are required'
      });
    }

    const searchParams = {
      originLocationCode: origin.toUpperCase(),
      destinationLocationCode: destination.toUpperCase(),
      departureDate: departureDate,
      adults: parseInt(adults),
      currencyCode: 'PHP',
      max: 50,
      nonStop: false 
    };

    if (children && parseInt(children) > 0) {
      searchParams.children = parseInt(children);
    }

    if (infants && parseInt(infants) > 0) {
      searchParams.infants = parseInt(infants);
    }

    if (returnDate) {
      searchParams.returnDate = returnDate;
    }

    const travelClassMap = {
      'Economy': 'ECONOMY',
      'Premium Economy': 'PREMIUM_ECONOMY',
      'Business': 'BUSINESS',
      'First': 'FIRST'
    };
    searchParams.travelClass = travelClassMap[cabinType] || 'ECONOMY';
    const response = await amadeus.shopping.flightOffersSearch.get(searchParams);

    if (!response.data || response.data.length === 0) {
      return res.json({
        success: true,
        count: 0,
        data: [],
        message: `No flights found for ${origin} → ${destination} on ${departureDate}`,
        suggestions: [
          'Try different dates (booking 2-3 months in advance often has better prices)',
          'Check if airport codes are correct (use IATA codes: MNL, CEB, SIN, etc.)',
          'Try nearby airports or different routes',
          'Consider flexible dates - prices vary significantly by day'
        ],
        searchParams: searchParams
      });
    }

    const flights = response.data.map((offer, index) => {
      const itinerary = offer.itineraries[0]; 
      const firstSegment = itinerary.segments[0];
      const lastSegment = itinerary.segments[itinerary.segments.length - 1];
      const duration = itinerary.duration; 
      const formattedDuration = formatDuration(duration);
      const price = offer.price;
      const totalPrice = parseFloat(price.total);
      const currency = price.currency;
      const numberOfStops = itinerary.segments.length - 1;
      const carrierCode = firstSegment.carrierCode;
      const flightNumber = firstSegment.number;

      return {
        id: offer.id || `amadeus-${index}`,
        offerId: offer.id, 
        price: {
          amount: totalPrice,
          currency: currency,
          formatted: `₱${Math.round(totalPrice).toLocaleString()}`,
          isEstimated: false,
          pricePerAdult: Math.round(totalPrice / parseInt(adults)),
          base: parseFloat(price.base),
          fees: price.fees ? parseFloat(price.fees[0]?.amount || 0) : 0,
          grandTotal: totalPrice,
          lastUpdated: new Date().toISOString()
        },
        airline: {
          name: getAirlineName(carrierCode),
          code: carrierCode,
          flightNumber: `${carrierCode}${flightNumber}`,
          logo: `https://images.kiwi.com/airlines/64/${carrierCode}.png`
        },
        departure: {
          airport: firstSegment.departure.iataCode,
          iataCode: firstSegment.departure.iataCode,
          terminal: firstSegment.departure.terminal || null,
          scheduledTime: firstSegment.departure.at,
          displayTime: formatTime(firstSegment.departure.at),
          displayDate: formatDate(firstSegment.departure.at)
        },
        arrival: {
          airport: lastSegment.arrival.iataCode,
          iataCode: lastSegment.arrival.iataCode,
          terminal: lastSegment.arrival.terminal || null,
          scheduledTime: lastSegment.arrival.at,
          displayTime: formatTime(lastSegment.arrival.at),
          displayDate: formatDate(lastSegment.arrival.at)
        },
        duration: formattedDuration,
        stops: numberOfStops,
        segments: itinerary.segments.length,
        cabinClass: offer.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin || cabinType,
        bookingClass: firstSegment.co?.bookingClass || 'N/A',
        numberOfBookableSeats: offer.numberOfBookableSeats,
        instantTicketingRequired: offer.instantTicketingRequired || false,
        validatingAirline: offer.validatingAirlineCodes?.[0] || carrierCode,
        source: 'amadeus',
        bookable: true,
        bookingUrl: `https://www.google.com/flights?q=${origin}+to+${destination}+${departureDate}`,
        segments_detail: itinerary.segments.map(seg => ({
          departure: seg.departure.iataCode,
          arrival: seg.arrival.iataCode,
          departureTime: formatTime(seg.departure.at),
          arrivalTime: formatTime(seg.arrival.at),
          carrier: seg.carrierCode,
          flightNumber: seg.number,
          aircraft: seg.aircraft?.code || 'N/A',
          duration: formatDuration(seg.duration)
        }))
      };
    });

    flights.sort((a, b) => a.price.amount - b.price.amount);

    return res.json({
      success: true,
      count: flights.length,
      data: flights,
      source: 'amadeus',
      searchDate: departureDate,
      priceDisclaimer: '✅ Real-time prices from Amadeus GDS. These are actual bookable fares from airlines.',
      routeInfo: {
        origin: origin.toUpperCase(),
        destination: destination.toUpperCase(),
        departureDate: departureDate,
        returnDate: returnDate || null,
        type: returnDate ? 'Round Trip' : 'One Way'
      },
      pricingInfo: {
        currency: 'PHP',
        adults: parseInt(adults),
        children: parseInt(children) || 0,
        infants: parseInt(infants) || 0,
        lowestPrice: flights.length > 0 ? flights[0].price.amount : 0,
        highestPrice: flights.length > 0 ? flights[flights.length - 1].price.amount : 0,
        averagePrice: flights.length > 0 
          ? Math.round(flights.reduce((sum, f) => sum + f.price.amount, 0) / flights.length)
          : 0
      }
    });

  } catch (error) {
    console.error('❌ Amadeus API Error:', JSON.stringify(error.response?.body || error.message, null, 2));

    let errorMessage = 'Unable to search flights';
    let suggestions = [];
    let statusCode = 500;

    const errorBody = error.response?.body;
    const errorStatus = error.response?.statusCode || error.response?.status;

    if (errorStatus === 401 || errorBody?.errors?.[0]?.code === 701) {
      errorMessage = 'Authentication failed - Invalid API credentials';
      statusCode = 401;
      suggestions = [
        '❌ Your Amadeus API Key or Secret is incorrect',
        '1. Go to: https://developers.amadeus.com/my-apps',
        '2. Click the eye icon to reveal your API Secret',
        '3. Copy the ENTIRE secret (all characters)',
        '4. Update your .env file with the correct secret',
        '5. Make sure there are NO quotes or extra spaces',
        '6. Restart your backend server',
        '',
        'Current config:',
        `- API Key: ${process.env.AMADEUS_API_KEY?.substring(0, 10)}...`,
        `- Secret Length: ${process.env.AMADEUS_API_SECRET?.length} chars`,
        `- Environment: ${process.env.AMADEUS_HOSTNAME || 'production'}`,
        '',
        '💡 TIP: Try the TEST keys first! They have unlimited API calls.'
      ];
    } else if (errorStatus === 400) {
      const apiError = errorBody?.errors?.[0];
      errorMessage = apiError?.detail || 'Invalid search parameters';
      statusCode = 400;
      suggestions = [
        'Check if airport codes are valid IATA codes (3 letters)',
        'Make sure date is in YYYY-MM-DD format',
        'Ensure departure date is in the future',
        'Verify the route has available flights'
      ];
    } else if (errorStatus === 429) {
      errorMessage = 'Too many requests. Rate limit exceeded.';
      statusCode = 429;
      suggestions = [
        'Wait 60 seconds before trying again',
        'You may have exceeded your monthly quota (2,000 calls for free tier)'
      ];
    } else if (errorStatus === 500) {
      errorMessage = 'Amadeus API server error';
      suggestions = ['Try again in a few moments', 'The route may not be available'];
    }

    return res.status(statusCode).json({
      success: false,
      count: 0,
      data: [],
      message: errorMessage,
      error: {
        code: errorBody?.errors?.[0]?.code || error.code,
        detail: errorBody?.errors?.[0]?.detail || error.message,
        status: errorStatus
      },
      suggestions: suggestions
    });
  }
};

function formatDuration(isoDuration) {
  if (!isoDuration) return 'N/A';
  
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return isoDuration;
  
  const hours = match[1] || '0';
  const minutes = match[2] || '0';
  
  return `${hours}h ${minutes}m`;
}

function formatTime(isoDateTime) {
  const date = new Date(isoDateTime);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

function formatDate(isoDateTime) {
  const date = new Date(isoDateTime);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function getAirlineName(code) {
  const airlines = {
    'PR': 'Philippine Airlines',
    '5J': 'Cebu Pacific',
    'Z2': 'AirAsia Philippines',
    'DG': 'Cebgo',
    'SQ': 'Singapore Airlines',
    'TR': 'Scoot',
    'CX': 'Cathay Pacific',
    'TG': 'Thai Airways',
    'MH': 'Malaysia Airlines',
    'KE': 'Korean Air',
    'OZ': 'Asiana Airlines',
    'NH': 'ANA',
    'JL': 'Japan Airlines',
    'QR': 'Qatar Airways',
    'EK': 'Emirates',
    'TK': 'Turkish Airlines',
    'BA': 'British Airways',
    'AF': 'Air France',
    'LH': 'Lufthansa',
    'KL': 'KLM',
    'QF': 'Qantas',
    'UA': 'United Airlines',
    'DL': 'Delta Air Lines',
    'AA': 'American Airlines',
    'CA': 'Air China',
    'CI': 'China Airlines',
    'BR': 'EVA Air'
  };
  
  return airlines[code] || code;
}

exports.getFlightPriceCalendar = async (req, res) => {
  try {
    const { origin, destination, departureDate } = req.query;

    if (!origin || !destination || !departureDate) {
      return res.status(400).json({
        success: false,
        message: 'Origin, destination, and departureDate required'
      });
    }

    const response = await amadeus.shopping.flightDates.get({
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      departureDate: departureDate
    });

    return res.json({
      success: true,
      data: response.data,
      message: 'Flight price calendar retrieved successfully'
    });

  } catch (error) {
    console.error('Price calendar error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving price calendar',
      note: 'This feature may not be available for all routes'
    });
  }
};

exports.getFlightPricePrediction = async (req, res) => {
  try {
    const { origin, destination, departureDate } = req.query;

    const response = await amadeus.analytics.itineraryPriceMetrics.get({
      originIataCode: origin.toUpperCase(),
      destinationIataCode: destination.toUpperCase(),
      departureDate: departureDate,
      currencyCode: 'PHP'
    });

    return res.json({
      success: true,
      data: response.data,
      message: 'Price prediction retrieved'
    });

  } catch (error) {
    return res.json({
      success: false,
      message: 'Price prediction not available for this route',
      note: 'This feature is only available for select routes'
    });
  }
};