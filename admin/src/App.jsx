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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/add-package" element={<AddPackage />} />
        <Route path="/view-packages" element={<ViewPackages />} />
        <Route path="/edit-package" element={<EditPackage />} />
        <Route path="/add-promo" element={<AddPromo />} />
        <Route path="/view-promos" element={<ViewPromos />} />
        <Route path="/view-testimonials" element={<ViewTestimonials />} />
        <Route path="/add-testimonial" element={<AddTestimonial />} />
        <Route path="/services/visa" element={<ServiceManagement />} />
        <Route path="/services/psa" element={<ServiceManagement />} />
        <Route path="/services/cenomar" element={<ServiceManagement />} />
        <Route path="/services/passport" element={<ServiceManagement />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/add-hotel" element={<AddHotel />} />
        <Route path="/view-hotels" element={<ViewHotels />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;