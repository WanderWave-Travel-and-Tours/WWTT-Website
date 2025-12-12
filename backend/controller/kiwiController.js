const axios = require('axios');

let cachedRate = 56.5; 
let lastFetchTime = 0;
const CACHE_DURATION = 3600000;

async function getUsdToPhpRate() {
  try {
    const now = Date.now();
    if (now - lastFetchTime < CACHE_DURATION) {
      console.log(`💱 Using cached exchange rate: 1 USD = ₱${cachedRate}`);
      return cachedRate;
    }

    console.log('💱 Fetching real-time exchange rate...');
    try {
      const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD', {
        timeout: 3000
      });
      
      if (response.data?.rates?.PHP) {
        cachedRate = response.data.rates.PHP;
        lastFetchTime = now;
        console.log(`✅ Real-time rate: 1 USD = ₱${cachedRate}`);
        return cachedRate;
      }
    } catch (error) {
      console.log('⚠️ ExchangeRate-API failed, trying alternative...');
    }

    try {
      const response = await axios.get('https://open.er-api.com/v6/latest/USD', {
        timeout: 3000
      });
      
      if (response.data?.rates?.PHP) {
        cachedRate = response.data.rates.PHP;
        lastFetchTime = now;
        console.log(`✅ Real-time rate (backup): 1 USD = ₱${cachedRate}`);
        return cachedRate;
      }
    } catch (error) {
      console.log('⚠️ Backup API also failed');
    }

    console.log(`⚠️ Using fallback cached rate: 1 USD = ₱${cachedRate}`);
    return cachedRate;

  } catch (error) {
    console.error('❌ Error fetching exchange rate:', error.message);
    return cachedRate;
  }
}

exports.searchFlightPrices = async (req, res) => {
  try {
    const { origin, destination, departureDate, returnDate } = req.query;
    
    const apiHost = process.env.RAPIDAPI_HOST;
    const apiKey = process.env.RAPIDAPI_KEY;

    console.log(`🔵 Booking.com Flight Search:`, { origin, destination, departureDate });

    const USD_TO_PHP = await getUsdToPhpRate();

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

    const flights = flightData.map((offer, index) => {
      const segment = offer.segments?.[0];
      const leg = segment?.legs?.[0];
      const carrier = leg?.carriersData?.[0];

      let priceAmount = 0;
      
      if (offer.priceBreakdown?.total) {
        const total = offer.priceBreakdown.total;
        
        if (typeof total.units === 'number') {
          const units = total.units || 0;
          const nanos = total.nanos || 0;
          priceAmount = units + (nanos / 1000000000);
        }
        else if (typeof total.amount === 'string') {
          priceAmount = parseFloat(total.amount) || 0;
        }
        else if (typeof total.amount === 'number') {
          priceAmount = total.amount;
        }
        else if (typeof total.value === 'number') {
          priceAmount = total.value;
        }
        else if (typeof total.price === 'number') {
          priceAmount = total.price;
        }
      }
      
      if (priceAmount === 0 && offer.price) {
        if (typeof offer.price === 'number') {
          priceAmount = offer.price;
        } else if (typeof offer.price.amount === 'string') {
          priceAmount = parseFloat(offer.price.amount) || 0;
        } else if (typeof offer.price.amount === 'number') {
          priceAmount = offer.price.amount;
        }
      }
      
      if (priceAmount === 0 && offer.totalPrice) {
        priceAmount = parseFloat(offer.totalPrice) || 0;
      }

      let finalPrice = priceAmount;
      
      if (priceAmount > 0 && priceAmount < 500) {
        finalPrice = Math.round(priceAmount * USD_TO_PHP); 
        
        if (index < 3) { 
          console.log(`💱 [${index+1}] $${priceAmount.toFixed(2)} USD × ₱${USD_TO_PHP.toFixed(2)} = ₱${finalPrice}`);
          console.log(`   ${carrier?.name || 'Unknown'}`);
        }
      } else if (priceAmount >= 500) {
        finalPrice = Math.round(priceAmount);
        if (index < 3) {
          console.log(`💰 [${index+1}] Already PHP: ₱${finalPrice} (${carrier?.name || 'Unknown'})`);
        }
      }

      return {
        id: offer.token || `booking-${index}`,
        airline: {
          name: typeof carrier?.name === 'string' ? carrier.name : 'Unknown',
          code: typeof carrier?.code === 'string' ? carrier.code : 'XX',
          logo: typeof carrier?.logo === 'string' ? carrier.logo : ''
        },
        price: {
          amount: finalPrice,
          formatted: `₱${finalPrice.toLocaleString('en-PH')}`, 
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

    console.log(`\n✅ Processed ${flights.length} flights`);
    if (flights.length > 0) {
      console.log(`💰 Cheapest: ₱${flights[0].price.amount.toLocaleString()} (${flights[0].airline.name})`);
      console.log(`💰 Most expensive: ₱${flights[flights.length-1].price.amount.toLocaleString()} (${flights[flights.length-1].airline.name})`);
    }

    res.json({
      success: true,
      count: flights.length,
      data: flights,
      cheapest: flights[0] || null,
      exchangeRate: USD_TO_PHP
    });

  } catch (error) {
    console.error('❌ Error:', error.message);

    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }

    res.status(500).json({
      success: false,
      message: 'Flight search failed',
      error: error.message,
      details: error.response?.data
    });
  }
};

exports.getCurrentExchangeRate = async (req, res) => {
  try {
    const rate = await getUsdToPhpRate();
    res.json({
      success: true,
      rate: rate,
      lastUpdated: new Date(lastFetchTime).toISOString(),
      cacheAge: Math.floor((Date.now() - lastFetchTime) / 1000 / 60) + ' minutes ago'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};