const { getJson } = require("serpapi");

exports.searchDomesticFlights = (req, res) => {
  try {
    const { origin, destination, departureDate, returnDate } = req.query;

    if (!origin || !destination || !departureDate) {
      return res.status(400).json({
        success: false,
        message: 'Required: origin, destination, departureDate (YYYY-MM-DD)'
      });
    }

    console.log(`🔎 Searching Google Flights (SerpApi): ${origin} -> ${destination} on ${departureDate}`);

    const params = {
      engine: "google_flights",
      api_key: process.env.SERPAPI_KEY,
      departure_id: origin.toUpperCase(),
      arrival_id: destination.toUpperCase(),
      outbound_date: departureDate,
      currency: "PHP",
      hl: "en", 
      gl: "ph", 
      stops: "0", 
      type: "2" 
    };

    if (returnDate) {
      params.return_date = returnDate;
      params.type = "1";
    }

    getJson(params, (json) => {
      if (json.error) {
        console.error('❌ SerpApi Error:', json.error);
        return res.status(500).json({ success: false, message: json.error });
      }

      if (!json.best_flights && !json.other_flights) {
        return res.json({
          success: true,
          count: 0,
          data: [],
          message: 'No domestic flights found for this schedule.'
        });
      }

      const allFlights = [
        ...(json.best_flights || []),
        ...(json.other_flights || [])
      ];

      const formattedFlights = allFlights.map((flight, index) => {
        const flightSegment = flight.flights[0]; 
        const totalMinutes = flight.total_duration || 0;
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        const formattedDuration = `${hours}h ${mins}m`;
        const numberOfStops = (flight.flights || []).length - 1;
        const departureTimeRaw = flightSegment.departure_airport.time || '';
        const arrivalTimeRaw = flightSegment.arrival_airport.time || '';
        const cleanDepartureTime = departureTimeRaw.split(' ').pop(); 
        const cleanArrivalTime = arrivalTimeRaw.split(' ').pop();   

        return {
          id: `google-${index}`,
          airline: {
            name: flightSegment.airline,
            code: flightSegment.airline_logo, 
            logo: flightSegment.airline_logo
          },
          price: {
            amount: flight.price,
            currency: 'PHP',
            formatted: `₱${flight.price.toLocaleString()}`
          },
          departure: {
            airport: flightSegment.departure_airport.name,
            iataCode: flightSegment.departure_airport.id,
            time: cleanDepartureTime 
          },
          arrival: {
            airport: flightSegment.arrival_airport.name,
            iataCode: flightSegment.arrival_airport.id,
            time: cleanArrivalTime
          },
          duration: formattedDuration,
          stops: numberOfStops,
          type: flight.type || 'Direct', 
          link: json.search_metadata?.google_flights_url 
        };
      });

      console.log(`✅ Found ${formattedFlights.length} domestic flights via Google.`);

      res.json({
        success: true,
        count: formattedFlights.length,
        source: 'google_flights (serpapi)',
        data: formattedFlights
      });
    });

  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};