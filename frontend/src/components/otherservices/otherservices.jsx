import React from 'react';
import { 
  Plane, 
  Hotel, 
  Map, 
  Ship, 
  Book, 
  FileText, 
  HeartHandshake, 
  FileCheck, 
  Globe, 
  ShieldCheck, 
  Receipt, 
  PlusCircle 
} from 'lucide-react';
import './OtherServices.css'; 

const OtherServices = () => {
  const services = [
    { 
      icon: <Plane size={32} />, 
      title: "Airline Booking", 
      desc: "Domestic and international flight reservations." 
    },
    { 
      icon: <Hotel size={32} />, 
      title: "Hotel Booking", 
      desc: "Affordable and luxury accommodation deals." 
    },
    { 
      icon: <Map size={32} />, 
      title: "Tour Arrangements", 
      desc: "Complete tour packages for groups and solo travelers." 
    },
    { 
      icon: <Ship size={32} />, 
      title: "Ferry Booking", 
      desc: "Convenient sea travel ticket reservations." 
    },
    { 
      icon: <Book size={32} />, 
      title: "Passport Assistance", 
      desc: "New application and renewal processing support." 
    },
    { 
      icon: <FileText size={32} />, 
      title: "PSA Birth Certificate", 
      desc: "Hassle-free request for authentic PSA documents." 
    },
    { 
      icon: <HeartHandshake size={32} />, 
      title: "Marriage Cert Processing", 
      desc: "Assistance for marriage certificate documents." 
    },
    { 
      icon: <FileCheck size={32} />, 
      title: "Cenomar Request", 
      desc: "Certificate of No Marriage application service." 
    },
    { 
      icon: <Globe size={32} />, 
      title: "Visa Assistance", 
      desc: "Expert guidance for your visa applications." 
    },
    { 
      icon: <ShieldCheck size={32} />, 
      title: "Travel Insurance", 
      desc: "Comprehensive coverage for worry-free travel." 
    },
    { 
      icon: <Receipt size={32} />, 
      title: "Bills Payments", 
      desc: "One-stop shop for paying your utility bills." 
    },
    { 
      icon: <PlusCircle size={32} />, 
      title: "And Many More!", 
      desc: "Inquire with us for other special travel needs." 
    },
  ];

  return (
    <div className="services-page-container">
      <div className="services-header">
        <h1 className="services-title">Services We Offer</h1>
        <p className="services-subtitle">
          Your one-stop shop for all travel and documentation needs. 
          We make processing easy so you can focus on the journey.
        </p>
      </div>
      
      <div className="services-grid">
        {services.map((service, index) => (
          <div key={index} className="service-card">
            <div className="icon-wrapper">
              {service.icon}
            </div>
            <div className="card-content">
              <h3 className="service-name">{service.title}</h3>
              <p className="service-desc">{service.desc}</p>
              <button className="inquire-btn">Inquire Now</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OtherServices;