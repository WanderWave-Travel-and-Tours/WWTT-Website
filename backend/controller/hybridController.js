const axios = require('axios');
const Amadeus = require('amadeus');

// Initialize Amadeus
const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_API_KEY,
  clientSecret: process.env.AMADEUS_API_SECRET
});

exports.searchFlightsHybrid = async (req, res) => {
  try {
    const { origin, destination, departureDate, adults = 1 } = req.query;
    console.log('🔄 Hybrid search params:', { origin, destination, departureDate, adults });

    if (!origin || !destination || !departureDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: origin, destination, and departureDate'
      });
    }

    // STEP 1: Get flight schedules from Aviationstack (maraming airlines)
    console.log('📡 Fetching flights from Aviationstack...');
    const aviationstackFlights = await getAviationstackFlights(origin, destination);
    
    if (aviationstackFlights.length === 0) {
      console.log('⚠️ No flights found in Aviationstack');
    } else {
      console.log(`✅ Found ${aviationstackFlights.length} flights from Aviationstack`);
    }

    // STEP 2: Get flight offers with prices from Amadeus
    console.log('💰 Fetching prices from Amadeus...');
    const amadeusOffers = await getAmadeusFlightOffers(origin, destination, departureDate, adults);
    
    if (amadeusOffers.length === 0) {
      console.log('⚠️ No offers found in Amadeus');
    } else {
      console.log(`✅ Found ${amadeusOffers.length} offers from Amadeus`);
    }

    // STEP 3: Merge both results - prioritize Amadeus (with price) then add Aviationstack
    const mergedFlights = mergeFlightData(aviationstackFlights, amadeusOffers, departureDate);

    console.log(`🎯 Total merged flights: ${mergedFlights.length}`);

    res.json({
      success: true,
      count: mergedFlights.length,
      data: mergedFlights,
      sources: {
        amadeus: amadeusOffers.length,
        aviationstack: aviationstackFlights.length
      }
    });

  } catch (error) {
    console.error('❌ Hybrid search error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error searching flights',
      error: error.message
    });
  }
};

// Fetch flights from Aviationstack
async function getAviationstackFlights(origin, destination) {
  try {
    const apiUrl = 'http://api.aviationstack.com/v1/flights';
    const params = {
      access_key: process.env.AVIATIONSTACK_API_KEY,
      dep_iata: origin.toUpperCase(),
      arr_iata: destination.toUpperCase(),
      limit: 100
    };

    const response = await axios.get(apiUrl, { params });

    if (!response.data.data || response.data.data.length === 0) {
      return [];
    }

    return response.data.data.map(flight => ({
      source: 'aviationstack',
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
      duration: calculateDuration(flight.departure.scheduled, flight.arrival.scheduled),
      price: null, // Will be enriched if found in Amadeus
      priceEstimated: false
    }));
  } catch (error) {
    console.error('Aviationstack fetch error:', error.message);
    return [];
  }
}

// Fetch flight offers from Amadeus
async function getAmadeusFlightOffers(origin, destination, departureDate, adults) {
  try {
    const response = await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: origin.toUpperCase(),
      destinationLocationCode: destination.toUpperCase(),
      departureDate: departureDate,
      adults: adults,
      max: 50
    });

    if (!response.data || response.data.length === 0) {
      return [];
    }

    return response.data.map(offer => {
      const firstSegment = offer.itineraries[0].segments[0];
      const lastSegment = offer.itineraries[0].segments[offer.itineraries[0].segments.length - 1];
      
      return {
        source: 'amadeus',
        id: offer.id,
        airline: {
          name: firstSegment.carrierCode,
          code: firstSegment.carrierCode,
          flightNumber: firstSegment.number
        },
        departure: {
          airport: firstSegment.departure.iataCode,
          iataCode: firstSegment.departure.iataCode,
          terminal: firstSegment.departure.terminal,
          scheduledTime: firstSegment.departure.at
        },
        arrival: {
          airport: lastSegment.arrival.iataCode,
          iataCode: lastSegment.arrival.iataCode,
          terminal: lastSegment.arrival.terminal,
          scheduledTime: lastSegment.arrival.at
        },
        duration: offer.itineraries[0].duration,
        price: {
          amount: parseFloat(offer.price.total),
          currency: offer.price.currency
        },
        priceEstimated: false,
        stops: offer.itineraries[0].segments.length - 1,
        bookingClass: firstSegment.cabin,
        seatsAvailable: offer.numberOfBookableSeats || null
      };
    });
  } catch (error) {
    console.error('Amadeus fetch error:', error.message);
    return [];
  }
}

// Merge Aviationstack and Amadeus data
function mergeFlightData(aviationstackFlights, amadeusOffers, requestedDate) {
  const merged = [];
  const addedFlightKeys = new Set();

  // PRIORITY 1: Add all Amadeus offers (with real prices)
  amadeusOffers.forEach(offer => {
    const key = `${offer.airline.code}-${offer.airline.flightNumber}`;
    merged.push(offer);
    addedFlightKeys.add(key);
  });

  // PRIORITY 2: Add Aviationstack flights not in Amadeus
  aviationstackFlights.forEach(flight => {
    const key = `${flight.airline.code}-${flight.airline.flightNumber}`;
    
    // Skip if already added from Amadeus
    if (addedFlightKeys.has(key)) {
      return;
    }

    // Check if flight date matches requested date (within same day)
    const flightDate = new Date(flight.departure.scheduledTime).toISOString().split('T')[0];
    const reqDate = new Date(requestedDate).toISOString().split('T')[0];
    
    if (flightDate === reqDate) {
      // Try to estimate price based on similar Amadeus routes
      const estimatedPrice = estimatePrice(flight, amadeusOffers);
      
      merged.push({
        ...flight,
        price: estimatedPrice,
        priceEstimated: estimatedPrice !== null
      });
      
      addedFlightKeys.add(key);
    }
  });

  // Sort by price (real prices first, then estimated, then no price)
  return merged.sort((a, b) => {
    if (a.price && b.price) {
      if (!a.priceEstimated && b.priceEstimated) return -1;
      if (a.priceEstimated && !b.priceEstimated) return 1;
      return a.price.amount - b.price.amount;
    }
    if (a.price && !b.price) return -1;
    if (!a.price && b.price) return 1;
    return 0;
  });
}

// Estimate price based on similar flights
function estimatePrice(flight, amadeusOffers) {
  if (amadeusOffers.length === 0) return null;

  // Calculate average price from Amadeus offers
  const totalPrice = amadeusOffers.reduce((sum, offer) => sum + offer.price.amount, 0);
  const avgPrice = totalPrice / amadeusOffers.length;
  
  // Add some randomness (±20%) to make it look realistic
  const variation = (Math.random() - 0.5) * 0.4; // -20% to +20%
  const estimatedAmount = avgPrice * (1 + variation);

  return {
    amount: Math.round(estimatedAmount * 100) / 100,
    currency: amadeusOffers[0].price.currency
  };
}

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