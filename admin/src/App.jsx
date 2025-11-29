import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './components/login/login'; 
import Dashboard from './components/dashboard/dashboard'; 
import AddPackage from './components/addpackage/addpackage';
import ViewPackages from './components/viewpackages/viewpackages';
import EditPackage from './components/editpackage/editpackage.jsx';
import AddPromo from './components/addpromo/addpromo.jsx';
import ViewPromos from './components/viewpromos/viewpromos.jsx';
import ViewTestimonials from './components/viewtestimonials/viewtestimonials.jsx';
import AddTestimonial from './components/addtestimonial/addtestimonial.jsx';
import ServiceManagement from './components/servicemanagement/servicemanagement.jsx';
import Settings from './components/settings/settings.jsx';
import AddHotel from './components/addhotel/addhotel.jsx';
import ViewHotels from './components/viewhotel/viewhotel.jsx';
import Booking from './components/booking/booking.jsx';

import AddPoster from './components/addposter/addposter.jsx';
import ViewPoster from './components/viewposter/viewposter.jsx';

import AddBlog from './components/addblog/addblog.jsx';
import ViewBlog from './components/viewblog/viewblog.jsx';

import AddImage from './components/addimage/addimage.jsx';
import ViewImage from './components/viewimage/viewimage.jsx';

import AddDeal from './components/adddeals/adddeals.jsx';
import ViewDeal from './components/viewdeals/viewdeals.jsx';

import AddTour from './components/addtours/addtours.jsx';
import ViewTours from './components/viewtours/viewtours.jsx';


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
        
        {/* Tours (NEW) */}
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
        
        {/* Services */}
        <Route path="/services/visa" element={<ServiceManagement />} />
        <Route path="/services/psa" element={<ServiceManagement />} />
        <Route path="/services/cenomar" element={<ServiceManagement />} />
        <Route path="/services/passport" element={<ServiceManagement />} />
        
        {/* Hotels */}
        <Route path="/add-hotel" element={<AddHotel />} />
        <Route path="/view-hotels" element={<ViewHotels />} />
        <Route path="/services/airlinebooking" element={<ServiceManagement />} />
        <Route path="/services/hotelbooking" element={<ServiceManagement />} />
        <Route path="/services/tourarrangements" element={<ServiceManagement />} />
        <Route path="/services/ferrybooking" element={<ServiceManagement />} />
        <Route path="/services/marriagecert" element={<ServiceManagement />} />
        <Route path="/services/travelinsurance" element={<ServiceManagement />} />
        <Route path="/services/billspayment" element={<ServiceManagement />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;