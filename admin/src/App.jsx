import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Main Components (Lowercase folders based on screenshot)
import Login from './components/login/login.jsx'; 
import Dashboard from './components/dashboard/dashboard.jsx'; 
import Booking from './components/booking/booking.jsx';
// Assuming settings is in components/settings based on structure
import Settings from './components/settings/settings.jsx'; 

// Packages
import AddPackage from './components/addpackage/addpackage.jsx';
import ViewPackages from './components/viewpackages/viewpackages.jsx';
import EditPackage from './components/editpackage/editpackage.jsx';

// Tours
import AddTour from './components/addtours/addtours.jsx';
import ViewTours from './components/viewtours/viewtours.jsx';

// Promos & Posters
import AddPromo from './components/addpromo/addpromo.jsx';
import ViewPromos from './components/viewpromos/viewpromos.jsx';
import AddPoster from './components/addposter/addposter.jsx';       
import ViewPoster from './components/viewposter/viewposter.jsx'; 

// Blogs
import AddBlog from './components/addblog/addblog.jsx';
import ViewBlog from './components/viewblog/viewblog.jsx';

// Gallery & Media
import AddImage from './components/addimage/addimage.jsx';
import ViewImage from './components/viewimage/viewimage.jsx';
import ViewTestimonials from './components/viewtestimonials/viewtestimonials.jsx';
import AddTestimonial from './components/addtestimonial/addtestimonial.jsx';

// Deals
import AddDeal from './components/adddeals/adddeals.jsx';
import ViewDeal from './components/viewdeals/viewdeals.jsx';

// Hotels (General Management)
import AddHotel from './components/addhotel/addhotel.jsx';
import ViewHotels from './components/viewhotel/viewhotel.jsx';

// --- SERVICE MANAGEMENT IMPORTS (PascalCase folders based on screenshot) ---
import VisaProcessing from './components/services/VisaProcessing/VisaProcessing.jsx';
import PSASerbilis from './components/services/PSASerbilis/PSASerbilis.jsx';
import CenomarRequest from './components/services/CenomarRequest/CenomarRequest.jsx';
import PassportAppt from './components/services/PassportAppt/PassportAppt.jsx';
import AirlineBooking from './components/services/AirlineBooking/AirlineBooking.jsx';
import HotelBooking from './components/services/HotelBooking/HotelBooking.jsx';
import TourArrangements from './components/services/TourArrangements/TourArrangements.jsx';
import FerryBooking from './components/services/FerryBooking/FerryBooking.jsx';
import TravelInsurance from './components/services/TravelInsurance/TravelInsurance.jsx';
import BillsPayment from './components/services/BillsPayment/BillsPayment.jsx';
import MarriageCertificate from './components/services/MarriageCertificate/MarriageCertificate.jsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/settings" element={<Settings />} />

        {/* Packages */}
        <Route path="/add-package" element={<AddPackage />} />
        <Route path="/view-packages" element={<ViewPackages />} />
        <Route path="/edit-package" element={<EditPackage />} />
        
        {/* Tours */}
        <Route path="/add-tour" element={<AddTour />} />
        <Route path="/view-tours" element={<ViewTours />} />

        {/* Promos & Posters */}
        <Route path="/add-promo" element={<AddPromo />} />
        <Route path="/view-promos" element={<ViewPromos />} />
        <Route path="/add-poster" element={<AddPoster />} />       
        <Route path="/view-posters" element={<ViewPoster />} /> 

        {/* Blogs */}
        <Route path="/add-blog" element={<AddBlog />} />
        <Route path="/view-blogs" element={<ViewBlog />} />

        {/* Image Gallery */}
        <Route path="/add-image" element={<AddImage />} />
        <Route path="/view-images" element={<ViewImage />} />

        {/* Deals */}
        <Route path="/add-deals" element={<AddDeal />} />
        <Route path="/view-deals" element={<ViewDeal />} />
        
        {/* Testimonials */}
        <Route path="/view-testimonials" element={<ViewTestimonials />} />
        <Route path="/add-testimonial" element={<AddTestimonial />} />
        
        {/* Hotel Inventory Management */}
        <Route path="/add-hotel" element={<AddHotel />} />
        <Route path="/view-hotels" element={<ViewHotels />} />

        {/* --- SERVICE MANAGEMENT ROUTES --- */}
        <Route path="/services/visa" element={<VisaProcessing />} />
        <Route path="/services/psa" element={<PSASerbilis />} />
        <Route path="/services/cenomar" element={<CenomarRequest />} />
        <Route path="/services/passport" element={<PassportAppt />} />
        <Route path="/services/airlinebooking" element={<AirlineBooking />} />
        <Route path="/services/hotelbooking" element={<HotelBooking />} />
        <Route path="/services/tourarrangements" element={<TourArrangements />} />
        <Route path="/services/ferrybooking" element={<FerryBooking />} />
        <Route path="/services/marriagecert" element={<MarriageCertificate />} />
        <Route path="/services/travelinsurance" element={<TravelInsurance />} />
        <Route path="/services/billspayment" element={<BillsPayment />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;