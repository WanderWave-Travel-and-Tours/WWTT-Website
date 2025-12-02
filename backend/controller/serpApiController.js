const { getJson } = require("serpapi");

exports.searchDomesticFlights = (req, res) => {
  try {
    const { 
      origin, 
      destination, 
      departureDate, 
      returnDate,
      adults = '1',
      children = '0', 
      infants = '0',
      cabinType = 'Economy'
    } = req.query;

    if (!origin || !destination || !departureDate) {
      return res.status(400).json({
        success: false,
        message: 'Required: origin, destination, departureDate (YYYY-MM-DD)'
      });
    }

    const totalAdults = parseInt(adults) || 1;
    const totalChildren = parseInt(children) || 0;
    const totalInfants = parseInt(infants) || 0;
    const totalPassengers = totalAdults + totalChildren + totalInfants;

    console.log(`🔎 Searching Google Flights (SerpApi): ${origin} -> ${destination} on ${departureDate}`);
    console.log(`👥 Passengers: ${totalAdults} adults, ${totalChildren} children, ${totalInfants} infants (Total: ${totalPassengers})`);
    console.log(`🎫 Cabin: ${cabinType}`);

    // Map cabin types to Google Flights travel_class codes
    const cabinClassMap = {
      'Economy': '1',
      'Premium Economy': '2', 
      'Business': '3',
      'First': '4'
    };

    const params = {
      engine: "google_flights",
      api_key: process.env.SERPAPI_KEY,
      departure_id: origin.toUpperCase(),
      arrival_id: destination.toUpperCase(),
      outbound_date: departureDate,
      currency: "PHP",
      hl: "en", 
      gl: "ph",
      adults: totalAdults.toString(),
      children: totalChildren.toString(),
      infants_in_seat: totalInfants.toString(),
      travel_class: cabinClassMap[cabinType] || '1', // Default to Economy
      type: "2" // One-way by default
    };

    if (returnDate) {
      params.return_date = returnDate;
      params.type = "1"; // Round trip
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

        // Google Flights already returns total price for all passengers
        const totalPrice = flight.price;
        const pricePerPerson = Math.round(totalPrice / totalPassengers);

        return {
          id: `google-${index}`,
          airline: {
            name: flightSegment.airline,
            code: flightSegment.airline_logo, 
            logo: flightSegment.airline_logo
          },
          price: {
            amount: totalPrice, // Already total for all passengers from Google
            currency: 'PHP',
            formatted: `₱${totalPrice.toLocaleString()}`,
            perPerson: pricePerPerson,
            totalPassengers: totalPassengers
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
          cabinClass: cabinType,
          type: flight.type || 'Direct', 
          link: json.search_metadata?.google_flights_url 
        };
      });

      console.log(`✅ Found ${formattedFlights.length} flights in ${cabinType} class for ${totalPassengers} passenger(s)`);

      res.json({
        success: true,
        count: formattedFlights.length,
        source: 'google_flights (serpapi)',
        passengers: {
          adults: totalAdults,
          children: totalChildren,
          infants: totalInfants,
          total: totalPassengers
        },
        cabinClass: cabinType,
        data: formattedFlights
      });
    });

  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};