import React, { useState } from 'react';
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
  PlusCircle,
  ArrowRight
} from 'lucide-react';
import './OtherServices.css'; 

const OtherServices = () => {
  const [activeFilter, setActiveFilter] = useState('all');

  const services = [
    { 
      icon: <Plane size={32} />, 
      title: "Airline Booking", 
      desc: "Domestic and international flight reservations with competitive rates.",
      category: "travel"
    },
    { 
      icon: <Hotel size={32} />, 
      title: "Hotel Booking", 
      desc: "Affordable and luxury accommodation deals worldwide.",
      category: "travel"
    },
    { 
      icon: <Map size={32} />, 
      title: "Tour Arrangements", 
      desc: "Complete tour packages for groups and solo travelers.",
      category: "travel"
    },
    { 
      icon: <Ship size={32} />, 
      title: "Ferry Booking", 
      desc: "Convenient sea travel ticket reservations.",
      category: "travel"
    },
    { 
      icon: <Book size={32} />, 
      title: "Passport Assistance", 
      desc: "New application and renewal processing support.",
      category: "documents"
    },
    { 
      icon: <FileText size={32} />, 
      title: "PSA Birth Certificate", 
      desc: "Hassle-free request for authentic PSA documents.",
      category: "documents"
    },
    { 
      icon: <HeartHandshake size={32} />, 
      title: "Marriage Certificate", 
      desc: "Assistance for marriage certificate documents.",
      category: "documents"
    },
    { 
      icon: <FileCheck size={32} />, 
      title: "CENOMAR Request", 
      desc: "Certificate of No Marriage application service.",
      category: "documents"
    },
    { 
      icon: <Globe size={32} />, 
      title: "Visa Assistance", 
      desc: "Expert guidance for your visa applications worldwide.",
      category: "travel"
    },
    { 
      icon: <ShieldCheck size={32} />, 
      title: "Travel Insurance", 
      desc: "Comprehensive coverage for worry-free travel.",
      category: "travel"
    },
    { 
      icon: <Receipt size={32} />, 
      title: "Bills Payments", 
      desc: "One-stop shop for paying your utility bills.",
      category: "other"
    },
    { 
      icon: <PlusCircle size={32} />, 
      title: "And Many More!", 
      desc: "Inquire with us for other special travel needs.",
      category: "other"
    },
  ];

  const categories = [
    { value: 'all', label: 'All Services' },
    { value: 'travel', label: 'Travel Services' },
    { value: 'documents', label: 'Documentation' },
    { value: 'other', label: 'Other Services' }
  ];

  const filteredServices = activeFilter === 'all' 
    ? services 
    : services.filter(service => service.category === activeFilter);

  return (
    <div className="services-page-container">
      <div className="services-header">
        <div className="services-badge">What We Offer</div>
        <h1 className="services-title">Our Premium Services</h1>
        <p className="services-subtitle">
          Your one-stop shop for all travel and documentation needs. 
          We make processing easy so you can focus on the journey ahead.
        </p>
      </div>

      {/* Filter Categories */}
      <div className="services-filter">
        {categories.map((category) => (
          <button
            key={category.value}
            className={`filter-btn ${activeFilter === category.value ? 'active' : ''}`}
            onClick={() => setActiveFilter(category.value)}
          >
            {category.label}
          </button>
        ))}
      </div>
      
      {/* Services Grid */}
      <div className="services-grid">
        {filteredServices.map((service, index) => (
          <div key={index} className="service-card">
            <div className="service-card-inner">
              <div className="icon-wrapper">
                {service.icon}
              </div>
              <div className="card-content">
                <h3 className="service-name">{service.title}</h3>
                <p className="service-desc">{service.desc}</p>
              </div>
              <button className="inquire-btn">
                <span>Inquire Now</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* CTA Section */}
      <div className="services-cta">
        <div className="cta-content">
          <h2 className="cta-title">Need Something Specific?</h2>
          <p className="cta-desc">
            Can't find what you're looking for? Contact us directly and we'll help you with your specific needs.
          </p>
          <button className="cta-btn">
            Contact Us Today
          </button>
        </div>
      </div>
    </div>
  );
};

export default OtherServices;