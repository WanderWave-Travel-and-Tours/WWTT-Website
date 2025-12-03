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

      // Check if raw data exists
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

      // 🔍 DEBUG: Log first flight to see price structure
      if (allFlights.length > 0) {
        console.log('🔍 Sample Flight Data:', JSON.stringify(allFlights[0], null, 2));
      }

      const formattedFlights = allFlights.map((flight, index) => {
        const flightSegments = flight.flights || [];
        if (flightSegments.length === 0) return null;

        const firstSegment = flightSegments[0];
        const lastSegment = flightSegments[flightSegments.length - 1];
        
        const totalMinutes = flight.total_duration || 0;
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        const formattedDuration = `${hours}h ${mins}m`;
        
        const numberOfStops = flightSegments.length - 1; 
        
        const departureTimeRaw = firstSegment.departure_airport?.time || '';
        const arrivalTimeRaw = lastSegment.arrival_airport?.time || '';
        const cleanDepartureTime = departureTimeRaw.split(' ').pop(); 
        const cleanArrivalTime = arrivalTimeRaw.split(' ').pop();

        // 🛡️ IMPROVED PRICE EXTRACTION
        let totalPrice = 0;
        let isPriceAvailable = false;
        
        // Try multiple locations where price might be
        const priceValue = flight.price || flight.rate || flight.total_price;
        
        if (priceValue !== undefined && priceValue !== null) {
            if (typeof priceValue === 'number') {
                totalPrice = priceValue;
                isPriceAvailable = true;
            } else if (typeof priceValue === 'string') {
                // Remove currency symbols and non-numeric chars
                const cleanString = priceValue.replace(/[₱,\s]/g, '');
                totalPrice = parseFloat(cleanString) || 0;
                isPriceAvailable = totalPrice > 0;
            } else if (typeof priceValue === 'object' && priceValue.amount) {
                // Sometimes price is an object with amount property
                totalPrice = parseFloat(priceValue.amount) || 0;
                isPriceAvailable = totalPrice > 0;
            }
        }

        // 🔍 DEBUG: Log price extraction for each flight
        console.log(`Flight ${index} - Airline: ${firstSegment.airline}, Raw Price:`, flight.price, 'Extracted:', totalPrice);

        const safePassengers = totalPassengers > 0 ? totalPassengers : 1;
        const pricePerPerson = Math.round(totalPrice / safePassengers);

        // If no price, show "Check Price"
        const formattedPrice = isPriceAvailable 
          ? `₱${totalPrice.toLocaleString()}` 
          : 'Check Price';

        return {
          id: `google-${index}`,
          airline: {
            name: firstSegment.airline || 'Unknown Airline', 
            code: firstSegment.airline_logo || '', 
            logo: firstSegment.airline_logo || ''
          },
          price: {
            amount: totalPrice,
            currency: 'PHP',
            formatted: formattedPrice,
            perPerson: pricePerPerson,
            totalPassengers: totalPassengers,
            unavailable: !isPriceAvailable
          },
          departure: {
            airport: firstSegment.departure_airport?.name || 'Unknown Airport',
            iataCode: firstSegment.departure_airport?.id || '',
            time: cleanDepartureTime 
          },
          arrival: {
            airport: lastSegment.arrival_airport?.name || 'Unknown Airport',
            iataCode: lastSegment.arrival_airport?.id || '',
            time: cleanArrivalTime
          },
          duration: formattedDuration,
          stops: numberOfStops,
          cabinClass: cabinType,
          type: multiCityLegs ? 'Multi-City' : (flight.type || 'Direct'),
          itinerary: flightSegments.map(seg => ({
            dep: seg.departure_airport?.id,
            arr: seg.arrival_airport?.id,
            time: seg.departure_airport?.time?.split(' ').pop(),
            airline: seg.airline
          })),
          link: json.search_metadata?.google_flights_url 
        };
      }).filter(flight => flight !== null); 

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