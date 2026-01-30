// controller/ipController.js

const checkIPAccess = async (req, res) => {
  try {
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0].trim() 
                    || req.headers['x-real-ip'] 
                    || req.connection.remoteAddress 
                    || req.socket.remoteAddress
                    || req.connection.socket?.remoteAddress;

    console.log('=======================================');
    console.log('IP ACCESS CHECK');
    console.log('Client IP:', clientIP);
    console.log('=======================================');

    // ✅ WHITELIST - Add your sales agent PC IP addresses here
    const ALLOWED_IPS = process.env.ALLOWED_OTC_IPS 
      ? process.env.ALLOWED_OTC_IPS.split(',').map(ip => ip.trim())
      : [
          '127.0.0.1',         // Localhost IPv4 (for testing)
          '::1',               // Localhost IPv6 (for testing)
          '::ffff:127.0.0.1',  // IPv6-mapped IPv4 localhost
          // ADD YOUR OFFICE/SALES AGENT IPs HERE:
          // '192.168.1.100',     // Example: Office PC local IP
          // '203.177.xxx.xxx',   // Example: Office public IP
        ];

    console.log('Allowed IPs:', ALLOWED_IPS);

    // ✅ CHECK IF CLIENT IP IS IN WHITELIST
    const hasAccess = ALLOWED_IPS.some(allowedIP => {
      // Support for wildcard matching (e.g., "192.168.1.*")
      if (allowedIP.includes('*')) {
        const pattern = allowedIP.replace(/\./g, '\\.').replace(/\*/g, '.*');
        const regex = new RegExp(`^${pattern}$`);
        return regex.test(clientIP);
      }
      
      // Direct IP match
      return clientIP === allowedIP || clientIP.includes(allowedIP);
    });

    console.log('Has OTC Access:', hasAccess);
    console.log('=======================================');

    res.json({
      success: true,
      hasOTCAccess: hasAccess,
      clientIP: clientIP,
      message: hasAccess 
        ? 'OTC payment feature enabled for this location' 
        : 'OTC payment not available for your location'
    });

  } catch (error) {
    console.error('IP Check Error:', error);
    res.status(500).json({
      success: false,
      hasOTCAccess: false,
      clientIP: null,
      message: 'IP verification failed'
    });
  }
};

module.exports = { checkIPAccess };