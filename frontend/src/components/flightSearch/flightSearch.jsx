import { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./FlightSearch.css";
import FlightSearchForm from "./FlightSearchForm";
import FlightSearchResults from "./FlightSearchResults";

function FlightSearch({ onFlightSelect, prefilledDepartureDate, prefilledDestination, prefilledPassengers }) {
  const [searchParams, setSearchParams] = useState({
    journeyType: "one-way",
    adults: prefilledPassengers?.adults?.toString() || "1",
    children: prefilledPassengers?.children?.toString() || "0",
    infants: prefilledPassengers?.infants?.toString() || "0",
    cabinType: "Economy",
    preferredAirline: "",
  });

  const [oneWayData, setOneWayData] = useState({
    origin: "",
    destination: "",
    departureDate: prefilledDepartureDate || getTomorrowDate(),
  });

  const [roundTripData, setRoundTripData] = useState({
    origin: "",
    destination: "",
    departureDate: prefilledDepartureDate || getTomorrowDate(),
    returnDate: getNextWeekDate(),
  });

  const [multiCityLegs, setMultiCityLegs] = useState([
    { origin: "", destination: "", departureDate: prefilledDepartureDate || getTomorrowDate() },
    { origin: "", destination: "", departureDate: getNextWeekDate() },
  ]);

  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchInfo, setSearchInfo] = useState(null);
  
  // Suggestions State
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [multiCitySuggestions, setMultiCitySuggestions] = useState([]);
  
  // Search Terms (Visual Input)
  const [originSearchTerm, setOriginSearchTerm] = useState("");
  const [destinationSearchTerm, setDestinationSearchTerm] = useState("");
  const [multiCitySearchTerms, setMultiCitySearchTerms] = useState([
    { origin: "", destination: "" },
    { origin: "", destination: "" },
  ]);
  
  const [airportSearchLoading, setAirportSearchLoading] = useState(false);
  
  // Track which multi-city field is active { legIndex, field: 'origin'|'destination' }
  const [activeMultiCityField, setActiveMultiCityField] = useState(null);
  
  // REFS
  const originRef = useRef(null);
  const destinationRef = useRef(null);
  const suggestionsRef = useRef(null);
  const searchTimerRef = useRef(null);
  const multiCityContainerRef = useRef(null); 

  // --- HELPERS ---
  function getTomorrowDate() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  }

  function getNextWeekDate() {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek.toISOString().split("T")[0];
  }

  // Update departure dates when prefilledDepartureDate changes
  useEffect(() => {
    if (prefilledDepartureDate) {
      setOneWayData(prev => ({ ...prev, departureDate: prefilledDepartureDate }));
      setRoundTripData(prev => ({ ...prev, departureDate: prefilledDepartureDate }));
      setMultiCityLegs(prev => {
        const updated = [...prev];
        updated[0] = { ...updated[0], departureDate: prefilledDepartureDate };
        return updated;
      });
    }
  }, [prefilledDepartureDate]);

  // Search and set destination when prefilledDestination is provided
  useEffect(() => {
    if (prefilledDestination) {
      // Auto-search for destination airport
      const searchDestination = async () => {
        try {
          const response = await axios.get(
            "http://localhost:5000/api/flights/airports",
            { params: { search: prefilledDestination } }
          );

          if (response.data.success && response.data.data && response.data.data.length > 0) {
            const airport = response.data.data[0];
            const iataCode = airport.iata_code;
            const displayName = `${airport.city_name} (${iataCode})`;

            // Set destination for all journey types
            setOneWayData(prev => ({ ...prev, destination: iataCode }));
            setRoundTripData(prev => ({ ...prev, destination: iataCode }));
            setMultiCityLegs(prev => {
              const updated = [...prev];
              updated[0] = { ...updated[0], destination: iataCode };
              return updated;
            });

            // Set display text
            setDestinationSearchTerm(displayName);
          }
        } catch (error) {
          console.error("Auto-search destination error:", error);
        }
      };

      searchDestination();
    }
  }, [prefilledDestination]);

  // --- API SEARCH ---
  const searchAirportsFromAPI = async (searchTerm, field) => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      if (field === "origin") setOriginSuggestions([]);
      else if (field === "destination") setDestinationSuggestions([]);
      else if (field === "multi-city") setMultiCitySuggestions([]);
      setAirportSearchLoading(false);
      return; 
    }

    setAirportSearchLoading(true);

    try {
      const response = await axios.get(
        "http://localhost:5000/api/flights/airports",
        { params: { search: searchTerm } }
      );

      if (response.data.success && response.data.data) {
        const airports = response.data.data
          .filter((airport) => airport.iata_code)
          .map((airport) => ({
            iataCode: airport.iata_code,
            name: airport.airport_name,
            city: airport.city_name,
            country: airport.country_name,
            countryCode: airport.country_iso2,
          }))
          .slice(0, 50);

        if (field === "origin") setOriginSuggestions(airports);
        else if (field === "destination") setDestinationSuggestions(airports);
        else if (field === "multi-city") setMultiCitySuggestions(airports);
      }
    } catch (error) {
      console.error("Airport search error:", error);
      if (field === "origin") setOriginSuggestions([]);
      else if (field === "destination") setDestinationSuggestions([]);
      else if (field === "multi-city") setMultiCitySuggestions([]);
    } finally {
      setAirportSearchLoading(false);
    }
  };

  const debouncedSearch = (searchTerm, field) => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (searchTerm && searchTerm.trim().length >= 2) {
        searchTimerRef.current = setTimeout(() => {
          searchAirportsFromAPI(searchTerm, field);
        }, 500);
    } else {
        if (field === "origin") setOriginSuggestions([]);
        if (field === "destination") setDestinationSuggestions([]);
        if (field === "multi-city") setMultiCitySuggestions([]);
    }
  };

  // --- ONE WAY / ROUND TRIP HANDLERS ---
  const handleAirportInputChange = (field, value) => {
    if (field === "origin") {
      setOriginSearchTerm(value);
    } else {
      setDestinationSearchTerm(value);
    }
    debouncedSearch(value, field);
  };

  const selectAirport = (airport, field) => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    const iataCode = airport.iataCode;
    const displayName = `${airport.city} (${iataCode})`;

    if (searchParams.journeyType === "one-way") {
      setOneWayData(prev => ({ ...prev, [field]: iataCode }));
    } else if (searchParams.journeyType === "round-trip") {
      setRoundTripData(prev => ({ ...prev, [field]: iataCode }));
    }

    if (field === "origin") {
      setOriginSearchTerm(displayName);
      setOriginSuggestions([]);
    } else {
      setDestinationSearchTerm(displayName);
      setDestinationSuggestions([]);
    }
  };

  // --- MULTI CITY HANDLERS ---
  const handleMultiCityAirportFocus = async (legIndex, field) => {
    setActiveMultiCityField({ legIndex, field });
    const currentValue = multiCitySearchTerms[legIndex]?.[field] || "";
    if (currentValue.length >= 2) {
      await searchAirportsFromAPI(currentValue, "multi-city");
    } else {
      setMultiCitySuggestions([]);
    }
  };

  const handleMultiCityAirportInputChange = (legIndex, field, value) => {
    const newSearchTerms = [...multiCitySearchTerms];
    if (!newSearchTerms[legIndex]) newSearchTerms[legIndex] = { origin: "", destination: "" };
    newSearchTerms[legIndex][field] = value;
    setMultiCitySearchTerms(newSearchTerms);

    const newLegs = [...multiCityLegs];
    newLegs[legIndex][field] = value;
    setMultiCityLegs(newLegs);

    setActiveMultiCityField({ legIndex, field });
    debouncedSearch(value, "multi-city");
  };

  const selectMultiCityAirport = (airport, legIndex, field) => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    const iataCode = airport.iataCode;
    const displayName = `${airport.city} (${iataCode})`;

    const newSearchTerms = [...multiCitySearchTerms];
    if (!newSearchTerms[legIndex]) newSearchTerms[legIndex] = { origin: "", destination: "" };
    newSearchTerms[legIndex][field] = displayName;
    setMultiCitySearchTerms(newSearchTerms);

    const newLegs = [...multiCityLegs];
    newLegs[legIndex][field] = iataCode;
    setMultiCityLegs(newLegs);

    setActiveMultiCityField(null);
    setMultiCitySuggestions([]);
  };

  const handleMultiCityChange = (index, field, value) => {
    const newLegs = [...multiCityLegs];
    newLegs[index][field] = field === "origin" || field === "destination" ? value.toUpperCase() : value;
    setMultiCityLegs(newLegs);
  };
  
  const addMultiCityLeg = () => {
      setMultiCityLegs([...multiCityLegs, { origin: "", destination: "", departureDate: getTomorrowDate() }]);
      setMultiCitySearchTerms([...multiCitySearchTerms, { origin: "", destination: "" }]);
  };

  const removeMultiCityLeg = (index) => {
      if (multiCityLegs.length > 2) {
          setMultiCityLegs(multiCityLegs.filter((_, i) => i !== index));
          setMultiCitySearchTerms(multiCitySearchTerms.filter((_, i) => i !== index));
      }
  };

  // --- GENERAL HANDLERS ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (multiCityContainerRef.current && !multiCityContainerRef.current.contains(event.target)) {
        setActiveMultiCityField(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const swapCities = () => {
    if (searchParams.journeyType === "one-way") {
        const tempOrigin = oneWayData.origin; 
        setOneWayData(p => ({ ...p, origin: p.destination, destination: tempOrigin }));
        const tempTerm = originSearchTerm;
        setOriginSearchTerm(destinationSearchTerm);
        setDestinationSearchTerm(tempTerm);
    } else if (searchParams.journeyType === "round-trip") {
        const tempOrigin = roundTripData.origin;
        setRoundTripData(p => ({ ...p, origin: p.destination, destination: tempOrigin }));
        const tempTerm = originSearchTerm;
        setOriginSearchTerm(destinationSearchTerm);
        setDestinationSearchTerm(tempTerm);
    }
  };

  const getTotalPassengers = () => parseInt(searchParams.adults) + parseInt(searchParams.children) + parseInt(searchParams.infants);

  // --- SUBMIT SEARCH ---
  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSearchInfo(null);
    setFlights([]);
    
    let searchData = {};
    
    if (searchParams.journeyType === "one-way") {
        if (!oneWayData.origin || !oneWayData.destination) {
            setError("Please enter origin and destination"); 
            setLoading(false); 
            return;
        }
        searchData = { 
          origin: oneWayData.origin, 
          destination: oneWayData.destination, 
          departureDate: oneWayData.departureDate 
        };
    } else if (searchParams.journeyType === "round-trip") {
        if (!roundTripData.origin || !roundTripData.destination) {
            setError("Please enter origin and destination"); 
            setLoading(false); 
            return;
        }
        if (!roundTripData.returnDate) {
            setError("Please select return date"); 
            setLoading(false); 
            return;
        }
        searchData = { 
          origin: roundTripData.origin, 
          destination: roundTripData.destination, 
          departureDate: roundTripData.departureDate, 
          returnDate: roundTripData.returnDate 
        };
    } else if (searchParams.journeyType === "multi-city") {
        // Validate Multi-City
        for (let i = 0; i < multiCityLegs.length; i++) {
            if (!multiCityLegs[i].origin || !multiCityLegs[i].destination) {
                setError(`Please fill in origin and destination for flight ${i + 1}`); 
                setLoading(false); 
                return;
            }
        }
        
        // Multi-city will search each leg as one-way
        // For now, we'll just search the first leg (you can enhance this later)
        searchData = {
          origin: multiCityLegs[0].origin,
          destination: multiCityLegs[0].destination,
          departureDate: multiCityLegs[0].departureDate
        };
    }

    try {
      const response = await axios.get("http://localhost:5000/api/flights/search-domestic", {
          params: { 
            ...searchData, 
            adults: searchParams.adults, 
            children: searchParams.children, 
            infants: searchParams.infants, 
            cabinType: searchParams.cabinType 
          }
      });

      if (response.data.success && response.data.data.length > 0) {
        const allFlights = response.data.data.map((flight, index) => ({
          ...flight,
          id: flight.id || `google-${index}`,
          departure: { ...flight.departure, displayTime: flight.departure.time },
          arrival: { ...flight.arrival, displayTime: flight.arrival.time },
          airline: { ...flight.airline, logo: flight.airline.logo || "https://images.kiwi.com/airlines/64/5J.png" },
          source: "Google Flights",
        }));
        
        setFlights(allFlights);
        setSearchInfo({
          source: "Google Flights",
          count: allFlights.length,
          disclaimer: `✅ ${allFlights.length} flights found`,
          routeInfo: searchParams.journeyType === "multi-city" 
            ? { origin: "Multi", destination: "City" }
            : { origin: searchData.origin, destination: searchData.destination },
          pricingInfo: { 
            pricePerAdult: allFlights[0].price.perPerson, 
            totalPrice: allFlights[0].price.amount, 
            passengers: getTotalPassengers() 
          },
        });
      } else {
        setError("No flights found for this date/route.");
      }
    } catch (err) {
      console.error(err);
      setError("Search Failed. Please try again or check your server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flight-search-container">
      <FlightSearchForm
        searchParams={searchParams}
        setSearchParams={setSearchParams}
        oneWayData={oneWayData}
        setOneWayData={setOneWayData}
        roundTripData={roundTripData}
        setRoundTripData={setRoundTripData}
        multiCityLegs={multiCityLegs}
        originSearchTerm={originSearchTerm}
        destinationSearchTerm={destinationSearchTerm}
        handleAirportInputChange={handleAirportInputChange}
        handleSearch={handleSearch}
        swapCities={swapCities}
        getTotalPassengers={getTotalPassengers}
        showOriginSuggestions={originSuggestions.length > 0}
        showDestinationSuggestions={destinationSuggestions.length > 0}
        originSuggestions={originSuggestions}
        destinationSuggestions={destinationSuggestions}
        airportSearchLoading={airportSearchLoading}
        selectAirport={selectAirport}
        loading={loading}
        disableDateEdit={!!prefilledDepartureDate}
        disableDestinationEdit={!!prefilledDestination}
        disablePassengerEdit={!!prefilledPassengers}
        
        // Multi City Props
        multiCitySearchTerms={multiCitySearchTerms}
        handleMultiCityAirportInputChange={handleMultiCityAirportInputChange}
        handleMultiCityAirportFocus={handleMultiCityAirportFocus}
        activeMultiCityField={activeMultiCityField}
        multiCitySuggestions={multiCitySuggestions}
        selectMultiCityAirport={selectMultiCityAirport}
        handleMultiCityChange={handleMultiCityChange}
        removeMultiCityLeg={removeMultiCityLeg}
        addMultiCityLeg={addMultiCityLeg}
        multiCityContainerRef={multiCityContainerRef}
      />
      
      <div className="orange-divider"></div>
      
      <FlightSearchResults 
        searchInfo={searchInfo} 
        flights={flights} 
        error={error} 
        loading={loading} 
        searchParams={searchParams}
        onFlightSelect={onFlightSelect}
      />
    </div>
  );
}

export default FlightSearch;