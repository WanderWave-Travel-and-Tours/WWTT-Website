import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './components/login/login'; 
import Dashboard from './components/dashboard/dashboard'; 
import AddPackage from './components/addpackage/addpackage';
import ViewPackages from './components/viewpackages/viewpackages';
import EditPackage from './components/editpackage/editpackage.jsx';
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/add-package" element={<AddPackage />} />
        <Route path="/view-packages" element={<ViewPackages />} />
        <Route path="/edit-package" element={<EditPackage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;