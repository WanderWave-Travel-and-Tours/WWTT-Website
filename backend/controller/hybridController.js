const axios = require('axios');

// Helper function to calculate distance between airports (approximate)
function calculateDistance(origin, destination) {
  // Approximate distances in kilometers for common Philippine routes
  const distances = {
    'MNL-CEB': 570, 'CEB-MNL': 570,
    'MNL-DVO': 990, 'DVO-MNL': 990,
    'MNL-ILO': 330, 'ILO-MNL': 330,
    'MNL-BCD': 470, 'BCD-MNL': 470,
    'MNL-CRK': 80, 'CRK-MNL': 80,
    'MNL-KLO': 320, 'KLO-MNL': 320,
    'MNL-TAG': 1050, 'TAG-MNL': 1050,
    'CEB-DVO': 300, 'DVO-CEB': 300,
  };
  
  const route = `${origin}-${destination}`;
  return distances[route] || 500; // Default 500km if unknown
}

// Helper function to estimate price based on distance and other factors
function estimatePrice(distance, airline, departureTime) {
  // Base price per kilometer
  const basePricePerKm = 0.15; // ~₱0.15 per km
  
  // Airline multipliers (budget vs full-service)
  const airlineMultipliers = {
    'Cebu Pacific': 0.8,
    'AirAsia': 0.85,
    'Philippine Airlines': 1.2,
    'PAL Express': 1.1,
    'default': 1.0
  };
  
  // Time-of-day multipliers
  const hour = new Date(departureTime).getHours();
  let timeMultiplier = 1.0;
  if (hour >= 6 && hour <= 9) timeMultiplier = 1.2; // Peak morning
  else if (hour >= 17 && hour <= 20) timeMultiplier = 1.15; // Peak evening
  else if (hour >= 22 || hour <= 5) timeMultiplier = 0.9; // Red-eye discount
  
  // Calculate base price
  const airlineMultiplier = airlineMultipliers[airline] || airlineMultipliers['default'];
  const basePrice = distance * basePricePerKm * airlineMultiplier * timeMultiplier;
  
  // Add taxes and fees (approximately 30% of base price)
  const totalPrice = basePrice * 1.3;
  
  // Add some randomness (±10%) to make it more realistic
  const variation = 0.9 + (Math.random() * 0.2);
  
  return Math.round(totalPrice * variation);
}

exports.searchFlightPrices = async (req, res) => {
  try {
    const { origin, destination, departureDate } = req.query;

    console.log('Hybrid search params:', { origin, destination, departureDate });

    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: origin and destination'
      });
    }

    // Calculate distance for price estimation
    const distance = calculateDistance(origin.toUpperCase(), destination.toUpperCase());
    console.log(`Route distance: ${distance}km`);

    // First, try Kiwi.com for real pricing
    let kiwiFlights = [];
    try {
      const date = new Date(departureDate || Date.now());
      const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      const kiwiOptions = {
        method: 'GET',
        url: 'https://kiwi-com-cheap-flights.p.rapidapi.com/one-way',
        params: {
          flyFrom: origin.toUpperCase(),
          flyTo: destination.toUpperCase(),
          dateFrom: formattedDate,
          dateTo: formattedDate,
          adults: '1',
          curr: 'PHP',
          limit: 10
        },
        headers: {
          'x-rapidapi-key': process.env.RAPIDAPI_KEY,
          'x-rapidapi-host': 'kiwi-com-cheap-flights.p.rapidapi.com'
        },
        timeout: 5000
      };

      const kiwiResponse = await axios.request(kiwiOptions);
      if (kiwiResponse.data?.itineraries?.length > 0) {
        console.log(`✅ Kiwi.com found ${kiwiResponse.data.itineraries.length} flights`);
        kiwiFlights = kiwiResponse.data.itineraries;
      }
    } catch (kiwiError) {
      console.log('⚠️ Kiwi.com not available, using Aviationstack with price estimation');
    }

    // If Kiwi.com has results, use those
    if (kiwiFlights.length > 0) {
      const flights = kiwiFlights.map(itinerary => {
        const sector = itinerary.sectors[0];
        const segment = sector.segments[0];
        
        return {
          id: itinerary.id,
          price: {
            amount: itinerary.price?.amount || 0,
            currency: 'PHP',
            formatted: `₱${Math.round(itinerary.price?.amount || 0).toLocaleString()}`,
            isEstimated: false
          },
          airline: {
            name: segment.carrier?.name || 'Unknown',
            code: segment.carrier?.code || 'N/A',
            flightNumber: segment.flightNumber || 'N/A',
            logo: segment.carrier?.code 
              ? `https://images.kiwi.com/airlines/64/${segment.carrier.code}.png`
              : null
          },
          departure: {
            airport: sector.source?.name || 'N/A',
            iataCode: sector.source?.code || origin,
            scheduledTime: sector.departure,
            displayTime: new Date(sector.departure).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            }),
            displayDate: new Date(sector.departure).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })
          },
          arrival: {
            airport: sector.destination?.name || 'N/A',
            iataCode: sector.destination?.code || destination,
            scheduledTime: sector.arrival,
            displayTime: new Date(sector.arrival).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            }),
            displayDate: new Date(sector.arrival).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })
          },
          duration: formatDuration(sector.duration),
          stops: sector.stopoverCount || 0,
          bookingUrl: itinerary.shareableUrl || '#'
        };
      });

      return res.json({
        success: true,
        count: flights.length,
        data: flights,
        source: 'kiwi'
      });
    }

    // Fallback to Aviationstack with estimated pricing
    const apiUrl = 'http://api.aviationstack.com/v1/flights';
    
    const params = {
      access_key: process.env.AVIATIONSTACK_API_KEY,
      dep_iata: origin.toUpperCase(),
      arr_iata: destination.toUpperCase(),
      limit: 20
    };

    console.log('Calling Aviationstack API...');
    const response = await axios.get(apiUrl, { params });

    if (!response.data.data || response.data.data.length === 0) {
      return res.json({
        success: true,
        count: 0,
        data: [],
        message: 'No flights found for this route'
      });
    }

    // Format with estimated pricing
    const flights = response.data.data.map(flight => {
      const estimatedPrice = estimatePrice(
        distance,
        flight.airline.name,
        flight.departure.scheduled
      );

      return {
        id: flight.flight.iata,
        price: {
          amount: estimatedPrice,
          currency: 'PHP',
          formatted: `₱${estimatedPrice.toLocaleString()}`,
          isEstimated: true
        },
        airline: {
          name: flight.airline.name,
          code: flight.airline.iata || flight.airline.icao,
          flightNumber: flight.flight.number,
          logo: null
        },
        departure: {
          airport: flight.departure.airport,
          iataCode: flight.departure.iata,
          terminal: flight.departure.terminal,
          scheduledTime: flight.departure.scheduled,
          displayTime: new Date(flight.departure.scheduled).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }),
          displayDate: new Date(flight.departure.scheduled).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })
        },
        arrival: {
          airport: flight.arrival.airport,
          iataCode: flight.arrival.iata,
          terminal: flight.arrival.terminal,
          scheduledTime: flight.arrival.scheduled,
          displayTime: new Date(flight.arrival.scheduled).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }),
          displayDate: new Date(flight.arrival.scheduled).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })
        },
        duration: calculateDuration(flight.departure.scheduled, flight.arrival.scheduled),
        status: flight.flight_status,
        stops: 0,
        bookingUrl: `https://www.google.com/flights?q=${origin}+to+${destination}`
      };
    });

    console.log(`✅ Found ${flights.length} flights with estimated pricing`);

    res.json({
      success: true,
      count: flights.length,
      data: flights,
      source: 'aviationstack',
      priceDisclaimer: 'Prices are estimated based on distance, airline, and time of day. For exact prices, click "Book Now".'
    });

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    
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

function formatDuration(seconds) {
  if (!seconds) return 'N/A';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}