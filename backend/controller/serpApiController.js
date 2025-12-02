const { getJson } = require("serpapi");

exports.searchDomesticFlights = (req, res) => {
  try {
    const { 
      origin, 
      destination, 
      departureDate, 
      returnDate,
      multiCityLegs,
      adults = '1',
      children = '0', 
      infants = '0',
      cabinType = 'Economy'
    } = req.query;

    if ((!origin || !destination || !departureDate) && !multiCityLegs) {
      return res.status(400).json({
        success: false,
        message: 'Required: origin, destination, departureDate OR multiCityLegs'
      });
    }

    const totalAdults = parseInt(adults) || 1;
    const totalChildren = parseInt(children) || 0;
    const totalInfants = parseInt(infants) || 0;
    const totalPassengers = totalAdults + totalChildren + totalInfants;

    const cabinClassMap = {
      'Economy': '1',
      'Premium Economy': '2', 
      'Business': '3',
      'First': '4'
    };

    let params = {
      engine: "google_flights",
      api_key: process.env.SERPAPI_KEY,
      currency: "PHP",
      hl: "en", 
      gl: "ph",
      adults: totalAdults.toString(),
      children: totalChildren.toString(),
      infants_in_seat: totalInfants.toString(),
      travel_class: cabinClassMap[cabinType] || '1',
      type: "2"
    };

    if (multiCityLegs) {
      try {
        const legs = JSON.parse(multiCityLegs);
        params.type = "3"; 
        params.multi_city_json = JSON.stringify(legs.map(leg => ({
          departure_id: leg.origin,
          arrival_id: leg.destination,
          date: leg.departureDate
        })));

        console.log('🌍 Searching Multi-City:', params.multi_city_json);
      } catch (e) {
        console.error('Error parsing multiCityLegs:', e);
        return res.status(400).json({ success: false, message: 'Invalid Multi-City Data' });
      }

    } else {
      params.departure_id = origin.toUpperCase();
      params.arrival_id = destination.toUpperCase();
      params.outbound_date = departureDate;

      if (returnDate) {
        params.return_date = returnDate;
        params.type = "1"; 
      }
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
          message: 'No flights found for this schedule.'
        });
      }

      const allFlights = [
        ...(json.best_flights || []),
        ...(json.other_flights || [])
      ];

      const formattedFlights = allFlights.map((flight, index) => {
        const flightSegments = flight.flights || [];
        const firstSegment = flightSegments[0];
        const lastSegment = flightSegments[flightSegments.length - 1];
        const totalMinutes = flight.total_duration || 0;
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        const formattedDuration = `${hours}h ${mins}m`;
        const numberOfStops = flightSegments.length - 1; 
        const departureTimeRaw = firstSegment.departure_airport.time || '';
        const arrivalTimeRaw = lastSegment.arrival_airport.time || '';
        const cleanDepartureTime = departureTimeRaw.split(' ').pop(); 
        const cleanArrivalTime = arrivalTimeRaw.split(' ').pop();
        const totalPrice = flight.price;
        const pricePerPerson = Math.round(totalPrice / totalPassengers);

        return {
          id: `google-${index}`,
          airline: {
            name: firstSegment.airline, 
            code: firstSegment.airline_logo, 
            logo: firstSegment.airline_logo
          },
          price: {
            amount: totalPrice,
            currency: 'PHP',
            formatted: `₱${totalPrice.toLocaleString()}`,
            perPerson: pricePerPerson,
            totalPassengers: totalPassengers
          },
          departure: {
            airport: firstSegment.departure_airport.name,
            iataCode: firstSegment.departure_airport.id,
            time: cleanDepartureTime 
          },
          arrival: {
            airport: lastSegment.arrival_airport.name,
            iataCode: lastSegment.arrival_airport.id,
            time: cleanArrivalTime
          },
          duration: formattedDuration,
          stops: numberOfStops,
          cabinClass: cabinType,
          type: multiCityLegs ? 'Multi-City' : (flight.type || 'Direct'),
          itinerary: flightSegments.map(seg => ({
            dep: seg.departure_airport.id,
            arr: seg.arrival_airport.id,
            time: seg.departure_airport.time.split(' ').pop(),
            airline: seg.airline
          })),
          link: json.search_metadata?.google_flights_url 
        };
      });

      console.log(`✅ Found ${formattedFlights.length} flights`);

      res.json({
        success: true,
        count: formattedFlights.length,
        source: 'google_flights (serpapi)',
        passengers: { total: totalPassengers },
        cabinClass: cabinType,
        data: formattedFlights
      });
    });

  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};