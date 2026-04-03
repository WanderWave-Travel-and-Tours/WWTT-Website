import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./flightSearch.css";
import MascotGif from "../MascotGif/MascotGif";
import FlightSearchForm from "./FlightSearchForm";
import FlightSearchResults from "./FlightSearchResults";
import FlightBookingModal from "./flightBookingModal";
import { ChevronLeft } from 'lucide-react';
import { BookingStateManager } from '../../utils/bookingStateManager';
import usePageTracker from '../../hooks/usePageTracker';

function FlightSearch({ onFlightSelect, prefilledDepartureDate, prefilledDestination, prefilledPassengers }) {
  const location = useLocation();
  const navigate = useNavigate();

  const context = BookingStateManager.getFlightSearchContext();
  const isFromBooking = location.state?.fromBooking || false;
  const packageData = location.state?.packageData || null;
  
  useEffect(() => {
    if (!isFromBooking && !packageData) {
      BookingStateManager.clearFlightSearchContext();
    }
  }, [isFromBooking, packageData]);

  // ── Page View Tracker ────────────────────────────────────────────
  usePageTracker('flights', '/flights', 'Flight Search Page');

  const shouldShowBackButton = context && context.returnTo && (isFromBooking || packageData);

  const [searchParams, setSearchParams] = useState({
    journeyType: "round-trip",
    adults: prefilledPassengers?.adults?.toString() || packageData?.passengers?.adults?.toString() || "1",
    children: prefilledPassengers?.children?.toString() || packageData?.passengers?.children?.toString() || "0",
    infants: prefilledPassengers?.infants?.toString() || packageData?.passengers?.infants?.toString() || "0",
    cabinType: "Economy",
    preferredAirline: "",
  });

  const [oneWayData, setOneWayData] = useState({
    origin: "",
    destination: "",
    departureDate: prefilledDepartureDate || packageData?.departureDate || getTomorrowDate(),
  });

  const [roundTripData, setRoundTripData] = useState({
    origin: "",
    destination: "",
    departureDate: prefilledDepartureDate || packageData?.departureDate || getTomorrowDate(),
    returnDate: packageData?.returnDate || getNextWeekDate(),
  });

  const [multiCityLegs, setMultiCityLegs] = useState([
    { origin: "", destination: "", departureDate: prefilledDepartureDate || packageData?.departureDate || getTomorrowDate() },
    { origin: "", destination: "", departureDate: getNextWeekDate() },
  ]);

  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchInfo, setSearchInfo] = useState(null);
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [multiCitySuggestions, setMultiCitySuggestions] = useState([]);
  const [originSearchTerm, setOriginSearchTerm] = useState("");
  const [destinationSearchTerm, setDestinationSearchTerm] = useState("");
  const [multiCitySearchTerms, setMultiCitySearchTerms] = useState([
    { origin: "", destination: "" },
    { origin: "", destination: "" },
  ]);
  
  const [airportSearchLoading, setAirportSearchLoading] = useState(false);
  const [activeMultiCityField, setActiveMultiCityField] = useState(null);

  // ── ROUND-TRIP 2-STEP STATES ──
  const [roundTripStep, setRoundTripStep] = useState(1);
  const [selectedOutbound, setSelectedOutbound] = useState(null);

  // ── BOOKING MODAL: set when ready to open (round-trip: after return selected; one-way: direct) ──
  const [bookingModalFlight, setBookingModalFlight] = useState(null);

  const searchTimerRef = useRef(null);
  const multiCityContainerRef = useRef(null); 

  const handleBackToBooking = () => {
    if (context && context.returnTo) {
      navigate(context.returnTo, { 
        state: { packageData: context.packageData },
        replace: true 
      });
    }
  };

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

  useEffect(() => {
    const depDate = prefilledDepartureDate || packageData?.departureDate;
    const retDate = packageData?.returnDate; 

    if (depDate) {
      setOneWayData(prev => ({ ...prev, departureDate: depDate }));
      setRoundTripData(prev => ({ 
        ...prev, 
        departureDate: depDate,
        returnDate: retDate || prev.returnDate 
      }));
      setMultiCityLegs(prev => {
        const updated = [...prev];
        updated[0] = { ...updated[0], departureDate: depDate };
        return updated;
      });
    }
  }, [prefilledDepartureDate, packageData?.departureDate, packageData?.returnDate]);

  useEffect(() => {
    const destination = prefilledDestination || packageData?.destination;
    if (destination) {
      const searchDestination = async () => {
        try {
          const response = await axios.get(
            "https://wanderwaveph.onrender.com/api/flights/airports",
            { params: { search: destination } }
          );
          if (response.data.success && response.data.data && response.data.data.length > 0) {
            const airport = response.data.data[0];
            const iataCode = airport.iata_code;
            const displayName = `${airport.city_name} (${iataCode})`;
            setOneWayData(prev => ({ ...prev, destination: iataCode }));
            setRoundTripData(prev => ({ ...prev, destination: iataCode }));
            setMultiCityLegs(prev => {
              const updated = [...prev];
              updated[0] = { ...updated[0], destination: iataCode };
              return updated;
            });
            setDestinationSearchTerm(displayName);
          }
        } catch (error) {
          console.error("Auto-search destination error:", error);
        }
      };
      searchDestination();
    }
  }, [prefilledDestination, packageData?.destination]);

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
        "https://wanderwaveph.onrender.com/api/flights/airports",
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

  const handleAirportInputChange = (field, value) => {
    if (field === "origin") setOriginSearchTerm(value);
    else setDestinationSearchTerm(value);
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

  const handleMultiCityAirportInputChange = (legIndex, field, value) => {
    setMultiCitySearchTerms(prev => {
      const updated = [...prev];
      updated[legIndex] = { ...updated[legIndex], [field]: value };
      return updated;
    });
    debouncedSearch(value, "multi-city");
  };

  const handleMultiCityAirportFocus = (legIndex, field) => {
    setActiveMultiCityField({ legIndex, field });
  };

  const selectMultiCityAirport = (airport) => {
    if (!activeMultiCityField) return;
    const { legIndex, field } = activeMultiCityField;
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    const iataCode = airport.iataCode;
    const displayName = `${airport.city} (${iataCode})`;
    setMultiCityLegs(prev => {
      const updated = [...prev];
      updated[legIndex] = { ...updated[legIndex], [field]: iataCode };
      return updated;
    });
    setMultiCitySearchTerms(prev => {
      const updated = [...prev];
      updated[legIndex] = { ...updated[legIndex], [field]: displayName };
      return updated;
    });
    setMultiCitySuggestions([]);
    setActiveMultiCityField(null);
  };

  const handleMultiCityChange = (index, field, value) => {
    const newLegs = [...multiCityLegs];
    newLegs[index][field] = value;
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

  const getTotalPassengers = () =>
    parseInt(searchParams.adults) + parseInt(searchParams.children) + parseInt(searchParams.infants);

  const handleFlightSelectFromBooking = (flight) => {
    const bookingData = JSON.parse(sessionStorage.getItem('pendingBookingData') || '{}');
    bookingData.selectedFlight = flight;
    sessionStorage.setItem('pendingBookingData', JSON.stringify(bookingData));
    const returnPath = bookingData.returnPath;
    navigate(returnPath, {
      state: { 
        selectedFlight: flight,
        packageData: bookingData.packageData, 
        fromFlightSearch: true 
      },
      replace: false
    });
  };

  // ── ROUND-TRIP: Step 1 → outbound selected, trigger return search ──
  const handleOutboundSelect = (flight) => {
    setSelectedOutbound(flight);
    setRoundTripStep(2);
    triggerReturnSearch();
  };

  const triggerReturnSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get("https://wanderwaveph.onrender.com/api/flights/search-domestic", {
        params: {
          origin: roundTripData.destination,
          destination: roundTripData.origin,
          departureDate: roundTripData.returnDate,
          adults: searchParams.adults,
          children: searchParams.children,
          infants: searchParams.infants,
          cabinType: searchParams.cabinType,
        },
      });
      if (res.data.success && res.data.data.length > 0) {
        const returnFlights = res.data.data.map((flight, index) => ({
          ...flight,
          id: flight.id || `return-flight-${index}`,
          departure: { ...flight.departure, displayTime: flight.departure.time },
          arrival: { ...flight.arrival, displayTime: flight.arrival.time },
          airline: { ...flight.airline, logo: flight.airline.logo || "https://images.kiwi.com/airlines/64/5J.png" },
          price: {
            ...flight.price,
            amount: parseFloat(flight.price.amount) || 0,
            formatted: flight.price.formatted || `₱${(parseFloat(flight.price.amount) || 0).toLocaleString()}`,
          },
          source: "Google Flights",
        }));
        setFlights(returnFlights);
        setSearchInfo(prev => ({
          ...prev,
          count: returnFlights.length,
          routeInfo: { origin: roundTripData.destination, destination: roundTripData.origin },
          disclaimer: `✅ ${returnFlights.length} return flights found — select your return flight`,
          pricingInfo: {
            pricePerAdult: returnFlights[0].price.perPerson,
            totalPrice: returnFlights[0].price.amount,
            passengers: getTotalPassengers(),
          },
        }));
      } else {
        setError("No return flights found for the selected date.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load return flights. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── ROUND-TRIP: Step 2 → return selected, build combined flight, open booking modal ──
  const handleReturnSelect = (returnFlight) => {
    const outboundAmount = selectedOutbound?.price?.amount || 0;
    const returnAmount   = returnFlight?.price?.amount    || 0;
    const total          = outboundAmount + returnAmount;

    const combinedFlight = {
      type: 'Round-Trip',
      airline: {
        name:         selectedOutbound?.airline?.name         || '',
        flightNumber: selectedOutbound?.airline?.flightNumber || 'N/A',
        logo:         selectedOutbound?.airline?.logo         || '',
      },
      departure: {
        iataCode: selectedOutbound?.departure?.iataCode || '',
        time:     selectedOutbound?.departure?.time || selectedOutbound?.departure?.displayTime || '',
      },
      arrival: {
        iataCode: selectedOutbound?.arrival?.iataCode || '',
        time:     selectedOutbound?.arrival?.time || selectedOutbound?.arrival?.displayTime || '',
      },
      duration:   selectedOutbound?.duration  || '',
      stops:      selectedOutbound?.stops     ?? 0,
      cabinClass: selectedOutbound?.cabinClass || '',
      price: {
        amount:          total,
        formatted:       `₱${total.toLocaleString()}`,
        perPerson:       selectedOutbound?.price?.perPerson       || 0,
        totalPassengers: selectedOutbound?.price?.totalPassengers || 1,
      },
      roundTripOutbound: {
        airline:   { name: selectedOutbound?.airline?.name || '', flightNumber: selectedOutbound?.airline?.flightNumber || 'N/A', logo: selectedOutbound?.airline?.logo || '' },
        departure: { iataCode: selectedOutbound?.departure?.iataCode || '', time: selectedOutbound?.departure?.time || selectedOutbound?.departure?.displayTime || '' },
        arrival:   { iataCode: selectedOutbound?.arrival?.iataCode  || '', time: selectedOutbound?.arrival?.time   || selectedOutbound?.arrival?.displayTime   || '' },
        duration:  selectedOutbound?.duration || '',
        stops:     selectedOutbound?.stops    ?? 0,
        price:     { amount: outboundAmount },
      },
      roundTripReturn: {
        airline:   { name: returnFlight?.airline?.name || '', flightNumber: returnFlight?.airline?.flightNumber || 'N/A', logo: returnFlight?.airline?.logo || '' },
        departure: { iataCode: returnFlight?.departure?.iataCode || '', time: returnFlight?.departure?.time || returnFlight?.departure?.displayTime || '' },
        arrival:   { iataCode: returnFlight?.arrival?.iataCode  || '', time: returnFlight?.arrival?.time   || returnFlight?.arrival?.displayTime   || '' },
        duration:  returnFlight?.duration || '',
        stops:     returnFlight?.stops    ?? 0,
        price:     { amount: returnAmount },
      },
    };

    setBookingModalFlight(combinedFlight);
  };

  // ── MAIN SEARCH ──
  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSearchInfo(null);
    setFlights([]);
    setSelectedOutbound(null);
    setRoundTripStep(1);
    setBookingModalFlight(null);
    
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
      };
    } else if (searchParams.journeyType === "multi-city") {
      for (let i = 0; i < multiCityLegs.length; i++) {
        if (!multiCityLegs[i].origin || !multiCityLegs[i].destination) {
          setError(`Please fill in origin and destination for flight ${i + 1}`); 
          setLoading(false); 
          return;
        }
      }
      searchData = {
        origin: multiCityLegs[0].origin,
        destination: multiCityLegs[0].destination,
        departureDate: multiCityLegs[0].departureDate
      };
    }

    try {
      const response = await axios.get("https://wanderwaveph.onrender.com/api/flights/search-domestic", {
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
          id: flight.id || `flight-${index}`,
          departure: { ...flight.departure, displayTime: flight.departure.time },
          arrival: { ...flight.arrival, displayTime: flight.arrival.time },
          airline: { ...flight.airline, logo: flight.airline.logo || "https://images.kiwi.com/airlines/64/5J.png" },
          price: {
            ...flight.price,
            amount: parseFloat(flight.price.amount) || 0,
            formatted: flight.price.formatted || `₱${(parseFloat(flight.price.amount) || 0).toLocaleString()}`
          },
          source: "Google Flights",
        }));
        
        setFlights(allFlights);
        setSearchInfo({
          source: "Google Flights",
          count: allFlights.length,
          disclaimer: searchParams.journeyType === "round-trip"
            ? `✅ ${allFlights.length} outbound flights found — select your outbound flight`
            : `✅ ${allFlights.length} flights found`,
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

  const today = new Date().toISOString().split("T")[0]; 

  return (
    <div className="flight-search-container">
      {shouldShowBackButton && (
        <div className="back-button-wrapper">
          <button className="back-button" onClick={handleBackToBooking}>
            <ChevronLeft size={20} strokeWidth={2.5} />
            <span>Back to Package Booking</span>
          </button>
        </div>
      )}

      <FlightSearchForm
        searchParams={searchParams}
        minDate={today}
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
        disableDateEdit={!!prefilledDepartureDate || !!packageData?.departureDate}
        disableDestinationEdit={!!prefilledDestination || !!packageData?.destination}
        disablePassengerEdit={!!prefilledPassengers || !!packageData?.passengers}
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
        onFlightSelect={isFromBooking ? handleFlightSelectFromBooking : onFlightSelect}
        roundTripStep={roundTripStep}
        selectedOutbound={selectedOutbound}
        onOutboundSelect={handleOutboundSelect}
        onReturnSelect={handleReturnSelect}
        onOneWayBook={(flight) => setBookingModalFlight(flight)}
      />

      {/* Single booking modal entry point for all journey types.
          For round-trip: starts at breakdown step (step 0) inside the modal.
          For one-way / multi-city: starts directly at passenger form (step 1). */}
      {bookingModalFlight && (
        <FlightBookingModal
          flight={bookingModalFlight}
          searchParams={searchParams}
          onClose={() => setBookingModalFlight(null)}
        />
      )}

      <MascotGif />
    </div>
  );
}

export default FlightSearch;