const { getJson } = require("serpapi");
const airports = require("airport-codes");

const CUSTOM_PH_AIRPORTS = [
  { iata: 'MNL', country: 'Philippines', iso: 'PH' },
  { iata: 'CEB', country: 'Philippines', iso: 'PH' },
  { iata: 'CRK', country: 'Philippines', iso: 'PH' },
  { iata: 'DVO', country: 'Philippines', iso: 'PH' },
  { iata: 'IAO', country: 'Philippines', iso: 'PH' }, // Siargao
  { iata: 'MPH', country: 'Philippines', iso: 'PH' }, // Caticlan
  { iata: 'KLO', country: 'Philippines', iso: 'PH' }, // Kalibo
  { iata: 'USU', country: 'Philippines', iso: 'PH' }, // Busuanga
  { iata: 'ENI', country: 'Philippines', iso: 'PH' }, // El Nido
  { iata: 'PPS', country: 'Philippines', iso: 'PH' }, // Puerto Princesa
  { iata: 'TAG', country: 'Philippines', iso: 'PH' }, // Bohol
  { iata: 'DGT', country: 'Philippines', iso: 'PH' }, // Dumaguete
  { iata: 'LGP', country: 'Philippines', iso: 'PH' }, // Legazpi
  { iata: 'ILO', country: 'Philippines', iso: 'PH' },
  { iata: 'BCD', country: 'Philippines', iso: 'PH' },
  { iata: 'TAC', country: 'Philippines', iso: 'PH' },
  { iata: 'ZAM', country: 'Philippines', iso: 'PH' },
  { iata: 'GES', country: 'Philippines', iso: 'PH' },
  { iata: 'LAO', country: 'Philippines', iso: 'PH' },
  { iata: 'BSO', country: 'Philippines', iso: 'PH' },
  { iata: 'SUG', country: 'Philippines', iso: 'PH' },
  { iata: 'OZC', country: 'Philippines', iso: 'PH' },
  { iata: 'CGY', country: 'Philippines', iso: 'PH' },
  { iata: 'BUT', country: 'Philippines', iso: 'PH' },
  { iata: 'CBO', country: 'Philippines', iso: 'PH' },
  { iata: 'DPL', country: 'Philippines', iso: 'PH' },
  { iata: 'PAG', country: 'Philippines', iso: 'PH' },
  { iata: 'RXS', country: 'Philippines', iso: 'PH' },
  { iata: 'TUG', country: 'Philippines', iso: 'PH' },
  { iata: 'VRC', country: 'Philippines', iso: 'PH' },
  { iata: 'SJI', country: 'Philippines', iso: 'PH' }
];

function getAirportInfo(iataCode) {
    if (!iataCode) return null;
    const code = iataCode.toUpperCase();

    const localMatch = CUSTOM_PH_AIRPORTS.find(a => a.iata === code);
    if (localMatch) {
        return { country: localMatch.country, iso: localMatch.iso };
    }

    const libMatch = airports.findWhere({ iata: code });
    if (libMatch) {
        return { country: libMatch.get('country'), iso: libMatch.get('iso') };
    }

    return null;
}

function getMarkupAmount(originIata, destinationIata) {
  try {
    const originInfo = getAirportInfo(originIata);
    const destInfo = getAirportInfo(destinationIata);

    if (!originInfo || !destInfo) {
      console.log(`⚠️ Unknown Airport (${originIata} or ${destinationIata}). Defaulting to International Markup.`);
      return 2500;
    }

    console.log(`✈️ Route: ${originIata} (${originInfo.country}) ➝ ${destinationIata} (${destInfo.country})`);

    if (originInfo.country === 'Philippines' && destInfo.country === 'Philippines') {
      console.log(`💰 Mark Up: DOMESTIC (₱1,000)`);
      return 1000;
    }

    const isAsia = isAsianCountry(destInfo.country);
    if (isAsia) {
      console.log(`💰 Mark Up: INTERNATIONAL ASIA (₱2,000)`);
      return 2000;
    }

    console.log(`💰 Mark Up: INTERNATIONAL OUTSIDE ASIA (₱2,500)`);
    return 2500;

  } catch (error) {
    console.error('Markup Calculation Error:', error);
    return 2500; 
  }
}

function isAsianCountry(countryName) {
  if (!countryName) return false;
  const asianCountries = [
    'Philippines', 'Japan', 'South Korea', 'China', 'Hong Kong', 'Taiwan', 'Thailand',
    'Vietnam', 'Singapore', 'Malaysia', 'Indonesia', 'Cambodia', 'Laos', 'Myanmar',
    'India', 'Nepal', 'Sri Lanka', 'Maldives', 'Bangladesh', 'Pakistan', 'United Arab Emirates',
    'Qatar', 'Saudi Arabia', 'Kuwait', 'Bahrain', 'Oman', 'Israel', 'Jordan', 'Lebanon', 'Turkey'
  ];
  return asianCountries.some(asian => countryName.toLowerCase().includes(asian.toLowerCase()));
}

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

    // --- CALCULATE MARKUP ---
    let markupAmount = 0;
    if (multiCityLegs) {
      markupAmount = 2500; 
    } else {
      markupAmount = getMarkupAmount(origin, destination);
    }

    const totalAdults = parseInt(adults) || 1;
    const totalChildren = parseInt(children) || 0;
    const totalInfants = parseInt(infants) || 0;
    const totalPassengers = totalAdults + totalChildren + totalInfants;

    const cabinClassMap = {
      'Economy': '1', 'Premium Economy': '2', 'Business': '3', 'First': '4'
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
      if (json.error) return res.status(500).json({ success: false, message: json.error });

      if (!json.best_flights && !json.other_flights) {
        return res.json({ success: true, count: 0, data: [], message: 'No flights found.' });
      }

      const allFlights = [...(json.best_flights || []), ...(json.other_flights || [])];

      const formattedFlights = allFlights.map((flight, index) => {
        const firstSegment = flight.flights[0];
        const lastSegment = flight.flights[flight.flights.length - 1];
        
        let originalPrice = 0;
        let isPriceAvailable = false;
        const priceValue = flight.price || flight.rate || flight.total_price;
        
        if (priceValue) {
           if (typeof priceValue === 'number') { originalPrice = priceValue; isPriceAvailable = true; }
           else if (typeof priceValue === 'string') { originalPrice = parseFloat(priceValue.replace(/[₱,\s]/g, '')) || 0; isPriceAvailable = originalPrice > 0; }
           else if (priceValue.amount) { originalPrice = parseFloat(priceValue.amount) || 0; isPriceAvailable = originalPrice > 0; }
        }

        let finalPrice = originalPrice;
        if (isPriceAvailable) {
            finalPrice = originalPrice + markupAmount;
        }

        return {
          id: `google-${index}`,
          airline: {
            name: firstSegment.airline || 'Unknown Airline', 
            logo: firstSegment.airline_logo || ''
          },
          price: {
            amount: finalPrice, 
            originalAmount: originalPrice,
            markupApplied: markupAmount,
            formatted: isPriceAvailable ? `₱${finalPrice.toLocaleString()}` : 'Check Price',
            perPerson: Math.round(finalPrice / (totalPassengers || 1)),
            totalPassengers: totalPassengers
          },
          departure: {
            airport: firstSegment.departure_airport?.name,
            iataCode: firstSegment.departure_airport?.id,
            time: firstSegment.departure_airport?.time?.split(' ').pop() 
          },
          arrival: {
            airport: lastSegment.arrival_airport?.name,
            iataCode: lastSegment.arrival_airport?.id,
            time: lastSegment.arrival_airport?.time?.split(' ').pop()
          },
          duration: `${Math.floor((flight.total_duration || 0) / 60)}h ${(flight.total_duration || 0) % 60}m`,
          stops: flight.flights.length - 1,
          cabinClass: cabinType,
          type: multiCityLegs ? 'Multi-City' : 'Direct'
        };
      });

      res.json({
        success: true,
        count: formattedFlights.length,
        markupConfig: {
            type: markupAmount === 1000 ? 'Domestic' : (markupAmount === 2000 ? 'International (Asia)' : 'International (World)'),
            amount: markupAmount
        },
        data: formattedFlights
      });
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};