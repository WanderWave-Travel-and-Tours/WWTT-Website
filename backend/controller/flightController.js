const axios = require('axios');

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

    console.log('Calling Aviationstack API with params:', params);
    
    const response = await axios.get(apiUrl, { params });

    console.log('Aviationstack raw response:', JSON.stringify(response.data, null, 2));

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

    console.log('Formatted flights:', flights.length, 'flights');

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
      error: error.message,
      details: error.response?.data
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