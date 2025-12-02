import React, { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import "./VisaTable.css";

const VisaTable = ({ onSelectVisa }) => {
  const [expandedRequirements, setExpandedRequirements] = useState({});

  const visaData = [
    {
      id: "icw6p",
      country: "Japan",
      flag: "🇯🇵",
      flagCode: "JP",
      title: "JAPAN",
      subtitle: "JAPAN VISA ASSISTANCE (PREMIUM) (MULTIPLE-ENTRY)",
      price: "₱3,749.00",
      requirements: [
        {
          category: "PRIMARY REQUIREMENTS",
          items: [
            "Philippine Passport - (At least 6 months valid beyond intended stay. Passports must be signed and must have at least two (2) blank visa pages.)",
            "Accomplished Application Form - (can be downloaded below) (Application form should be filled out all items correctly, If item is not applicable, please fill in [N/A]. Embassy may not accept application with blank item, no signature or no date in the form; may deny the application that is filled out incorrectly or wrong information.)",
            "Photo - (TWO COPIES OF 4.5cm x 3.5cm or 2in x 1.4 in PHOTO With white background, taken within 6 months Photo must be pasted on the application form.)",
            "Original PSA Birth Certificate",
            "Original PSA Marriage Certificate - Must be issued within one year from PSA Main Office/Serbilis Outlet Center. If the birth certificate from Philippine Statistics Office (PSA) is unreadable, or has incomplete information, please submit the birth certificate issued by PSA together with a birth certificate issued by the Local Civil Registrar.",
            "Daily Schedule in Japan (can be downloaded below)",
          ],
        },
        {
          category: "FINANCIAL REQUIREMENTS",
          items: [
            "Original Bank Certificate (Ideal amount for the current balance is P100,000) Including type of account, opening date, average daily balance and current balance",
            "ITR (Income Tax Return) Form 2316 for individual / Form 1701 or Form 1702 to for companies NOTE: If No ITR – kindly provide a notarized affidavit explaining why there's no ITR",
            "If ITR is not available and there is no ADB (Average Daily Balance) on Bank Certificate, submit a Bank Statement to prove transaction for the last 3 months. (Ideal amount for the Average Daily Balance is P50,000)",
          ],
        },
        {
          category: "ADDITIONAL REQUIREMENTS IF EMPLOYED",
          items: [
            "Original Signed Certificate of Employment (indicate applicant's position, date hired, compensation, office address, HR landline number & HR email address)",
            "Copy of Company ID",
            "Printed Scanned Copy PRC or IBP Card – for Professionals",
          ],
        },
        {
          category: "ADDITIONAL REQUIREMENTS IF BUSINESS OWNER",
          items: [
            "Copy of DTI or SEC Permit (Includes Names & signatories of the corporation)",
            "Copy of Business Permit",
            "Copy of BIR company registration",
          ],
        },
        {
          category: "ADDITIONAL REQUIREMENTS IF STUDENT",
          items: ["Original Copy of School Certificate", "Copy of School ID"],
        },
        {
          category: "ADDITIONAL REQUIREMENTS IF SENIOR CITIZEN",
          items: ["Copy of Senior Citizen ID"],
        },
        {
          category: "ADDITIONAL REQUIREMENTS IF SPONSORED",
          items: [
            "Guarantee Letter (can be downloaded below)",
            "Proof of Relationship - APPLICANT and GUARANTOR",
          ],
        },
      ],
    },
    {
      id: "9462a",
      country: "Japan",
      flag: "🇯🇵",
      flagCode: "JP",
      title: "JAPAN",
      subtitle: "JAPAN VISA ASSISTANCE (PREMIUM) (SINGLE-ENTRY)",
      price: "₱3,249.00",
      requirements: [
        {
          category: "PRIMARY REQUIREMENTS",
          items: [
            "Valid Passport (6 months validity beyond travel date).",
            "Duly Accomplished Visa Application Form.",
            "2x2 Passport-size Photo (white background).",
            "Proof of Financial Capacity (Bank Certificate/Statement).",
            "Income Tax Return (ITR) or Certificate of Employment.",
            "Flight and Hotel Reservations.",
          ],
        },
      ],
    },
    {
      id: "HfOu",
      country: "Australia",
      flag: "🇦🇺",
      flagCode: "AU",
      title: "AUSTRALIA",
      subtitle: "AUSTRALIA VISA ASSISTANCE",
      price: "₱11,999.00",
      requirements: [
        {
          category: "REQUIREMENTS",
          items: [
            "Valid Passport (6 months validity).",
            "Completed Visa Application Form.",
            "Passport-size Photos.",
            "Bank Statements (last 6 months).",
            "Employment Certificate or Business Documents.",
            "Travel Itinerary and Hotel Bookings.",
          ],
        },
      ],
    },
    {
      id: "q16Or",
      country: "India",
      flag: "🇮🇳",
      flagCode: "IN",
      title: "INDIA",
      subtitle: "INDIA VISA ASSISTANCE",
      price: "₱2,599.00",
      requirements: [
        {
          category: "REQUIREMENTS",
          items: [
            "Valid Passport (6 months validity).",
            "Visa Application Form.",
            "2x2 Photo (white background).",
            "Flight Tickets.",
            "Hotel Bookings or Invitation Letter.",
          ],
        },
      ],
    },
    {
      id: "bB9h",
      country: "Canada",
      flag: "🇨🇦",
      flagCode: "CA",
      title: "CANADA",
      subtitle: "CANADA VISA ASSISTANCE",
      price: "₱11,999.00",
      requirements: [
        {
          category: "REQUIREMENTS",
          items: [
            "Valid Passport.",
            "Completed Application Forms.",
            "Passport Photos.",
            "Proof of Financial Support.",
            "Employment Letter or Business Registration.",
            "Travel Itinerary.",
          ],
        },
      ],
    },
    {
      id: "Jwn2",
      country: "Canada",
      flag: "🇨🇦",
      flagCode: "CA",
      title: "CANADA (ETA)",
      subtitle: "CANADA (ETA) VISA ASSISTANCE",
      price: "₱999.00",
      requirements: [
        {
          category: "REQUIREMENTS",
          items: [
            "Valid Passport.",
            "Email Address.",
            "Credit/Debit Card for payment.",
          ],
        },
      ],
    },
    {
      id: "cV3iV",
      country: "France",
      flag: "🇫🇷",
      flagCode: "FR",
      title: "SCHENGEN (EUROPE)",
      subtitle: "SCHENGEN (EUROPE) VISA ASSISTANCE",
      price: "₱13,999.00",
      requirements: [
        {
          category: "REQUIREMENTS",
          items: [
            "Valid Passport (3 months validity after return).",
            "Visa Application Form.",
            "Passport Photos.",
            "Travel Insurance (minimum €30,000 coverage).",
            "Flight Reservations.",
            "Hotel Bookings.",
            "Bank Statements.",
          ],
        },
      ],
    },
    {
      id: "s56H",
      country: "United Kingdom",
      flag: "🇬🇧",
      flagCode: "GB",
      title: "UNITED KINGDOM",
      subtitle: "UNITED KINGDOM VISA ASSISTANCE",
      price: "₱13,999.00",
      requirements: [
        {
          category: "REQUIREMENTS",
          items: [
            "Valid Passport.",
            "Completed Online Application.",
            "Passport Photos.",
            "Financial Documents (Bank Statements).",
            "Employment Certificate.",
            "Travel Itinerary.",
          ],
        },
      ],
    },
    {
      id: "RKJiz",
      country: "United Arab Emirates",
      flag: "🇦🇪",
      flagCode: "AE",
      title: "UAE (DUBAI/ABU DHABI)",
      subtitle: "UNITED ARAB EMIRATES (DUBAI/ABU DHABI) VISA ASSISTANCE",
      price: "₱7,499.00",
      requirements: [
        {
          category: "REQUIREMENTS",
          items: [
            "Valid Passport (6 months validity).",
            "Passport Photos.",
            "Bank Statements.",
            "Hotel Bookings.",
            "Return Flight Tickets.",
          ],
        },
      ],
    },
    {
      id: "RZ7n",
      country: "China",
      flag: "🇨🇳",
      flagCode: "CN",
      title: "CHINA",
      subtitle: "CHINA VISA ASSISTANCE",
      price: "₱6,749.00",
      requirements: [
        {
          category: "REQUIREMENTS",
          items: [
            "Valid Passport.",
            "Visa Application Form.",
            "Passport Photo.",
            "Hotel Bookings.",
            "Flight Tickets.",
            "Invitation Letter (if applicable).",
          ],
        },
      ],
    },
    {
      id: "US01",
      country: "United States",
      flag: "🇺🇸",
      flagCode: "US",
      title: "USA",
      subtitle: "USA VISA ASSISTANCE",
      price: "₱15,999.00",
      requirements: [
        {
          category: "REQUIREMENTS",
          items: [
            "Valid Passport.",
            "DS-160 Confirmation Page.",
            "Visa Fee Receipt.",
            "Passport Photo.",
            "Financial Documents.",
            "Employment Certificate.",
          ],
        },
      ],
    },
    {
      id: "US02",
      country: "United States",
      flag: "🇺🇸",
      flagCode: "US",
      title: "USA (DROPBOX)",
      subtitle: "USA (DROPBOX) VISA ASSISTANCE",
      price: "₱12,999.00",
      requirements: [
        {
          category: "REQUIREMENTS",
          items: [
            "Valid Passport.",
            "DS-160 Confirmation Page.",
            "Visa Fee Receipt.",
            "Previous US Visa (must be expired within 4 years).",
            "Passport Photo.",
          ],
        },
      ],
    },
    {
      id: "SG01",
      country: "Singapore",
      flag: "🇸🇬",
      flagCode: "SG",
      title: "SINGAPORE",
      subtitle: "SINGAPORE VISA ASSISTANCE",
      price: "₱2,999.00",
      requirements: [
        {
          category: "REQUIREMENTS",
          items: [
            "Valid Passport (6 months validity).",
            "Completed Form 14A.",
            "Passport Photo.",
            "Bank Statements.",
            "Flight and Hotel Reservations.",
          ],
        },
      ],
    },
    {
      id: "KR01",
      country: "South Korea",
      flag: "🇰🇷",
      flagCode: "KR",
      title: "SOUTH KOREA",
      subtitle: "SOUTH KOREA VISA ASSISTANCE",
      price: "₱4,999.00",
      requirements: [
        {
          category: "REQUIREMENTS",
          items: [
            "Valid Passport.",
            "Visa Application Form.",
            "Passport Photo.",
            "Bank Certificate.",
            "Income Tax Return (ITR).",
            "Travel Itinerary.",
          ],
        },
      ],
    },
    {
      id: "NZ01",
      country: "New Zealand",
      flag: "🇳🇿",
      flagCode: "NZ",
      title: "NEW ZEALAND",
      subtitle: "NEW ZEALAND VISA ASSISTANCE",
      price: "₱11,999.00",
      requirements: [
        {
          category: "REQUIREMENTS",
          items: [
            "Valid Passport.",
            "Completed Online Application.",
            "Passport Photos.",
            "Bank Statements.",
            "Employment Certificate or Business Documents.",
            "Travel Itinerary.",
          ],
        },
      ],
    },
    {
      id: "TH01",
      country: "Thailand",
      flag: "🇹🇭",
      flagCode: "TH",
      title: "THAILAND",
      subtitle: "THAILAND VISA ASSISTANCE",
      price: "₱1,999.00",
      requirements: [
        {
          category: "REQUIREMENTS",
          items: [
            "Valid Passport (6 months validity).",
            "Visa Application Form.",
            "Passport Photo.",
            "Flight Tickets.",
            "Hotel Confirmation.",
          ],
        },
      ],
    },
  ];

  const toggleRequirements = (id) => {
    setExpandedRequirements((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSendInquiry = (visa) => {
    if (onSelectVisa) {
      onSelectVisa(visa);
    }
  };

  return (
    <div className="visa-list-container">
      <div className="visa-list-header">
        <h2 className="visa-list-title">Visa Forms</h2>
        <p className="visa-list-subtitle">
          This table shows all Visa Forms you can apply for.
        </p>
      </div>

      <div className="visa-list-wrapper">
        {visaData.map((visa) => (
          <div key={visa.id} className="visa-list-item">
            <div className="visa-item-content">
              <div className="visa-item-header">
                <div className="visa-header-left">
                  {visa.flagCode ? (
                    <img 
                      src={`https://flagcdn.com/w80/${visa.flagCode.toLowerCase()}.png`}
                      alt={`${visa.country} flag`}
                      className="visa-flag-img"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                  ) : null}
                  <span className="visa-flag" style={{ display: visa.flagCode ? 'none' : 'block' }}>
                    {visa.flag}
                  </span>
                  <div className="visa-info">
                    <h3 className="visa-title">{visa.title}</h3>
                    {visa.subtitle && (
                      <span className="visa-subtitle">{visa.subtitle}</span>
                    )}
                    <span className="visa-price">
                      Starts at: {visa.price}/person
                    </span>
                  </div>
                </div>

                {!expandedRequirements[visa.id] && (
                  <div className="visa-header-right">
                    <button
                      className="view-requirements-btn-visa"
                      onClick={() => toggleRequirements(visa.id)}
                    >
                      <ChevronRight size={18} />
                      <span>View Requirements</span>
                    </button>
                  </div>
                )}
              </div>

              {expandedRequirements[visa.id] && (
                <div className="visa-requirements-expanded">
                  <h4 className="requirements-heading">
                    List of Requirements
                  </h4>
                  {visa.requirements.map((reqSection, sectionIndex) => (
                    <div key={sectionIndex} className="requirements-section">
                      <h5 className="requirements-category">
                        {reqSection.category}
                      </h5>
                      <ul className="requirements-list-simple">
                        {reqSection.items.map((req, index) => (
                          <li key={index} className="requirement-simple-item">
                            <span className="req-checkbox">☑️</span>
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  
                  <div className="visa-actions-bottom">
                    <button
                      className="hide-requirements-btn"
                      onClick={() => toggleRequirements(visa.id)}
                    >
                      <ChevronDown size={18} />
                      <span>Hide Requirements</span>
                    </button>
                    <button
                      className="send-inquiry-btn"
                      onClick={() => handleSendInquiry(visa)}
                    >
                      <span>Send Inquiry Request</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VisaTable;