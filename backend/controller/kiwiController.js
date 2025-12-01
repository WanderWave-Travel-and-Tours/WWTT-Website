// controller/kiwiController.js - FIXED
const axios = require('axios');

exports.searchFlightPrices = async (req, res) => {
  try {
    const { origin, destination, departureDate, returnDate } = req.query;
    
    const apiHost = 'booking-com15.p.rapidapi.com';
    const apiKey = process.env.RAPIDAPI_KEY;

    console.log(`🔵 Booking.com Flight Search:`, { origin, destination, departureDate });

    const searchParams = {
      fromId: `${origin}.AIRPORT`,
      toId: `${destination}.AIRPORT`,
      departDate: departureDate,
      adults: '1',
      cabinClass: 'ECONOMY',
      currency: 'PHP'
    };

    if (returnDate) {
      searchParams.returnDate = returnDate;
    }

    console.log(`🛫 Search params:`, searchParams);

    const options = {
      method: 'GET',
      url: `https://${apiHost}/api/v1/flights/searchFlights`,
      params: searchParams,
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': apiHost
      }
    };

    const response = await axios.request(options);

    console.log('✅ API Response received');
    console.log('📦 Status:', response.status);

    const flightData = response.data?.data?.flightOffers || [];

    if (flightData.length === 0) {
      return res.json({
        success: true,
        count: 0,
        data: [],
        message: 'No flights found'
      });
    }

    console.log(`✅ Found ${flightData.length} flights`);

    // ✅ FIX: Extract strings only, no objects
    const flights = flightData.map((offer, index) => {
      const segment = offer.segments?.[0];
      const leg = segment?.legs?.[0];
      const carrier = leg?.carriersData?.[0];

      // ✅ IMPORTANT: Extract only STRING values, not objects
      return {
        id: offer.token || `booking-${index}`,
        airline: {
          name: typeof carrier?.name === 'string' ? carrier.name : 'Unknown',
          code: typeof carrier?.code === 'string' ? carrier.code : 'XX',
          logo: typeof carrier?.logo === 'string' ? carrier.logo : ''
        },
        price: {
          amount: Number(offer.priceBreakdown?.total?.units) || 0,
          formatted: `₱${(offer.priceBreakdown?.total?.units || 0).toLocaleString()}`,
          currency: 'PHP'
        },
        departure: {
          iataCode: String(leg?.departureAirport || origin),
          displayTime: leg?.departureTime 
            ? new Date(leg.departureTime).toLocaleTimeString('en-PH', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              })
            : 'N/A',
          airport: String(leg?.departureAirport || '')
        },
        arrival: {
          iataCode: String(leg?.arrivalAirport || destination),
          displayTime: leg?.arrivalTime
            ? new Date(leg.arrivalTime).toLocaleTimeString('en-PH', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              })
            : 'N/A',
          airport: String(leg?.arrivalAirport || '')
        },
        duration: String(segment?.totalTime || 'N/A'),
        stops: Number((segment?.legs?.length - 1) || 0),
        source: 'booking.com'
      };
    });

    flights.sort((a, b) => a.price.amount - b.price.amount);

    console.log(`✅ Processed ${flights.length} flights`);
    if (flights.length > 0) {
      console.log(`💰 Cheapest: ₱${flights[0].price.amount.toLocaleString()} (${flights[0].airline.name})`);
    }

    res.json({
      success: true,
      count: flights.length,
      data: flights,
      cheapest: flights[0] || null
    });

  } catch (error) {
    console.error('❌ Error:', error.message);

    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data));
    }

    res.status(500).json({
      success: false,
      message: 'Flight search failed',
      error: error.message,
      details: error.response?.data
    });
  }
};