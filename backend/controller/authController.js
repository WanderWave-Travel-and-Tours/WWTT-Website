// backend/controller/authController.js
const User = require('../models/user');
const bcrypt = require('bcrypt');
const axios = require('axios');
const nodemailer = require('nodemailer'); 
const crypto = require('crypto'); 
const path = require('path');

// ====================================================================
// TEMPORARY STORAGE FOR UNVERIFIED USERS AND OTP
const unverifiedUsers = new Map();
console.log('--- Auth Controller Initialized ---');
console.log(`Unverified users map initialized. Current size: ${unverifiedUsers.size}`);
// ====================================================================

// --- LOGO PATH CONFIGURATION ---
const LOGO_PATH = path.join(__dirname, '..', 'assets', 'LOGOPIC.png'); 
console.log(`Logo path configured: ${LOGO_PATH}`);
// -------------------------------

// Helper function to verify reCAPTCHA
const verifyRecaptcha = async (token) => {
  console.log('🔍 Starting reCAPTCHA verification...');
  try {
    const response = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: {
          secret: process.env.RECAPTCHA_SECRET_KEY,
          response: token
        }
      }
    );
    const success = response.data.success;
    console.log(`✅ reCAPTCHA verification result: ${success ? 'SUCCESS' : 'FAILURE'}`);
    if (!success) console.warn('reCAPTCHA response details:', response.data);
    return success;
  } catch (error) {
    console.error('❌ reCAPTCHA verification error:', error.message);
    return false;
  }
};

// --------------------------------------------------------------------
// NODEMAILER TRANSPORT AND EMAIL HELPER
// --------------------------------------------------------------------
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, 
    },
    logger: true, 
    debug: true
});

const sendEmail = async (to, subject, html) => {
    console.log(`📧 Attempting to send email to: ${to} with subject: "${subject}"`);
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.error("❌ Email configuration missing: EMAIL_USER or EMAIL_PASS not set in .env");
            return false;
        }

        const mailOptions = {
            from: `WanderWave Customer Service <${process.env.EMAIL_USER}>`, 
            to, 
            subject,
            html,
            attachments: [{
                filename: 'LOGOPIC.png',
                path: LOGO_PATH, 
                cid: 'logo@wanderwave.com'
            }]
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent successfully. Message ID: ${info.messageId}`);
        return true; 
    } catch (error) {
        console.error("❌ Nodemailer Error:", error); 
        if (error.code === 'ENOENT') {
            console.error(`⚠️ Logo file not found at path: ${LOGO_PATH}`);
        }
        return false;
    }
};

const getOtpEmailHtml = (fullName, otp, otpDurationMinutes) => {
    return `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="x-apple-disable-message-reformatting">
    <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <title>WanderWave OTP Verification</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
            background-color: #ffffff !important;
        }
        table {
            border-collapse: collapse;
            border-spacing: 0;
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
        }
        img {
            border: 0;
            height: auto;
            line-height: 100%;
            outline: none;
            text-decoration: none;
            -ms-interpolation-mode: bicubic;
        }
        a {
            text-decoration: none;
        }
        
        /* Force white background in dark mode */
        @media (prefers-color-scheme: dark) {
            body {
                background-color: #ffffff !important;
            }
            .email-body {
                background-color: #ffffff !important;
            }
            .email-container {
                background-color: #ffffff !important;
            }
            .white-bg {
                background-color: #ffffff !important;
            }
        }
        
        /* Mobile responsive styles */
        @media screen and (max-width: 600px) {
            .email-container {
                width: 100% !important;
                max-width: 100% !important;
                border-radius: 0 !important;
            }
            .mobile-padding {
                padding: 20px !important;
            }
            .mobile-padding-sm {
                padding: 15px 20px !important;
            }
            .otp-text {
                font-size: 36px !important;
                letter-spacing: 8px !important;
            }
            .logo-img {
                max-width: 110px !important;
            }
            .header-label {
                font-size: 10px !important;
                padding: 6px 18px !important;
            }
        }
        
        @media screen and (max-width: 480px) {
            .otp-text {
                font-size: 32px !important;
                letter-spacing: 6px !important;
            }
        }
    </style>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;width:100%;">
    <div style="background-color:#ffffff;padding:20px 0;">
        <center>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#ffffff;">
                <tr>
                    <td align="center" style="padding:0;">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="email-container" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1);overflow:hidden;">
                            
                            <!-- HEADER SECTION - Navy Blue with Orange Border -->
                            <tr>
                                <td style="background-color:#001b3e !important;border-bottom:4px solid #FF8C00;padding:25px 30px 20px;text-align:right;" class="mobile-padding-sm">
                                    <span class="header-label" style="display:inline-block;background-color:#FFF3E0 !important;color:#001b3e !important;padding:8px 24px;border-radius:6px;font-size:11px;font-weight:700;letter-spacing:1.5px;font-family:Arial,sans-serif;">OTP VERIFICATION</span>
                                </td>
                            </tr>
                            
                            <!-- LOGO SECTION - White BG with Navy Border -->
                            <tr>
                                <td class="white-bg mobile-padding-sm" style="background-color:#ffffff !important;padding:25px 30px;border-bottom:1px dashed #001b3e;">
                                    <img src="cid:logo@wanderwave.com" alt="WanderWave Logo" class="logo-img" style="max-width:130px;height:auto;display:block;border:0;" width="130" />
                                </td>
                            </tr>
                            
                            <!-- MAIN CONTENT - White Background -->
                            <tr>
                                <td class="white-bg mobile-padding" style="background-color:#ffffff !important;padding:35px 40px;">
                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                        <tr>
                                            <td style="padding:0;">
                                                <!-- Greeting - Navy Blue Text -->
                                                <p style="font-size:16px;color:#001b3e !important;margin:0 0 8px 0;font-weight:600;font-family:Arial,sans-serif;">Hi ${fullName || 'New User'},</p>
                                                
                                                <!-- Message - Secondary Text with Orange Brand -->
                                                <p style="font-size:14px;color:#64748b !important;line-height:1.7;margin:0 0 30px 0;font-family:Arial,sans-serif;">Thank you for signing up with <span style="color:#FF8C00 !important;font-weight:600;">WanderWave</span>! To complete your registration, please use the verification code below:</p>
                                                
                                                <!-- OTP BOX - Navy Blue Background -->
                                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:25px 0;">
                                                    <tr>
                                                        <td style="background-color:#001b3e !important;border-radius:10px;padding:35px 20px;text-align:center;">
                                                            <p style="font-size:11px;color:#ffffff !important;text-transform:uppercase;letter-spacing:2px;margin:0 0 15px 0;font-weight:700;opacity:0.9;font-family:Arial,sans-serif;">Your Verification Code</p>
                                                            <p class="otp-text" style="font-size:42px;font-weight:800;color:#ffffff !important;letter-spacing:12px;font-family:'Courier New',Consolas,monospace;margin:0;">${otp}</p>
                                                        </td>
                                                    </tr>
                                                </table>
                                                
                                                <!-- WARNING BOX - Light Orange BG with Orange Border -->
                                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:25px 0;">
                                                    <tr>
                                                        <td style="background-color:#FFF7ED !important;border-left:4px solid #FF8C00;padding:15px 20px;border-radius:4px;">
                                                            <p style="font-size:13px;color:#ea580c !important;margin:0;line-height:1.6;font-family:Arial,sans-serif;"><strong>⏱️ Valid for ${OTP_DURATION_MINUTES} minutes</strong><br/>Please do not share this code with anyone for security purposes.</p>
                                                        </td>
                                                    </tr>
                                                </table>
                                                
                                                <!-- SIGNATURE - Border with Navy Text -->
                                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-top:1px dashed #e2e8f0;margin-top:30px;padding-top:25px;">
                                                    <tr>
                                                        <td style="padding:0;">
                                                            <p style="font-size:13px;color:#64748b !important;margin:0 0 5px 0;font-family:Arial,sans-serif;">Best regards,</p>
                                                            <p style="font-size:14px;color:#001b3e !important;font-weight:700;margin:0;font-family:Arial,sans-serif;">WanderWave Team</p>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            
                            <!-- FOOTER - Navy Blue Background -->
                            <tr>
                                <td class="mobile-padding" style="background-color:#001b3e !important;padding:25px 40px;text-align:center;">
                                    <p style="font-size:12px;color:#ffffff !important;margin:0 0 8px 0;line-height:1.6;font-family:Arial,sans-serif;">If you did not request this verification code, please ignore this email.</p>
                                    <p style="font-size:11px;color:#ffffff !important;margin:0;opacity:0.9;font-family:Arial,sans-serif;">This is an automated message. Please do not reply to this email.</p>
                                </td>
                            </tr>
                            
                        </table>
                    </td>
                </tr>
            </table>
        </center>
    </div>
</body>
</html>
        `;
};

// --------------------------------------------------------------------
// OTP LOGIC
// --------------------------------------------------------------------
const OTP_DURATION_MINUTES = 5; 

const generateAndSendOtp = async (email) => {
    const userData = unverifiedUsers.get(email);
    if (!userData) return { success: false, emailSent: false };

    const otp = crypto.randomInt(100000, 999999).toString(); 
    const otpExpires = Date.now() + OTP_DURATION_MINUTES * 60 * 1000; 

    unverifiedUsers.set(email, { ...userData, otp, otpExpires });

    const emailBody = getOtpEmailHtml(userData.fullName, otp, OTP_DURATION_MINUTES);
    const emailSent = await sendEmail(email, 'WanderWave - Verification Code', emailBody);

    return { success: true, emailSent };
};

// --------------------------------------------------------------------
// SIGNUP CONTROLLER - Clear messages for frontend
// --------------------------------------------------------------------
const signup = async (req, res) => {
    console.log('\n--- SIGNUP Controller Hit ---');
    const { fullName, email, username, password, confirmPassword, recaptchaToken } = req.body;

    try {
        // Validation
        if (!fullName || !email || !username || !password || !confirmPassword) {
            return res.status(400).json({ 
                success: false, 
                message: 'All fields are required.' 
            });
        }
        if (password !== confirmPassword) {
            return res.status(400).json({ 
                success: false, 
                message: 'Passwords do not match.' 
            });
        }

        // Check existing user
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: 'This email is already registered. Please log in.' 
            });
        }

        // reCAPTCHA
        if (!recaptchaToken) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please complete the reCAPTCHA.' 
            });
        }
        const isValidRecaptcha = await verifyRecaptcha(recaptchaToken);
        if (!isValidRecaptcha) {
            return res.status(400).json({ 
                success: false, 
                message: 'reCAPTCHA failed. Please try again.' 
            });
        }

        // Clean old session
        if (unverifiedUsers.has(email)) unverifiedUsers.delete(email);

        const hashedPassword = await bcrypt.hash(password, 10);
        unverifiedUsers.set(email, { fullName, email, username, password: hashedPassword });

        const result = await generateAndSendOtp(email);

        if (!result.success) {
            unverifiedUsers.delete(email);
            return res.status(500).json({ 
                success: false, 
                message: 'Failed to send verification code. Please try again.' 
            });
        }

        return res.status(200).json({
            success: true,
            message: result.emailSent 
                ? 'Verification code sent! Check your inbox.'
                : 'Code generated. Try resending if not received.',
            verificationRequired: true,
            email
        });

    } catch (error) {
        console.error('❌ Signup error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Server error. Please try again later.' 
        });
    }
};

// --------------------------------------------------------------------
// RESEND OTP - Clear, frontend-friendly messages
// --------------------------------------------------------------------
const resendOtp = async (req, res) => {
    console.log('\n--- RESEND OTP Controller Hit ---');
    const { email } = req.body;

    try {
        if (!email) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email is required.' 
            });
        }

        if (!unverifiedUsers.has(email)) {
            return res.status(400).json({ 
                success: false, 
                message: 'No active signup session. Please start over.' 
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            unverifiedUsers.delete(email);
            return res.status(400).json({ 
                success: false, 
                message: 'Account already verified. Please log in.' 
            });
        }

        const result = await generateAndSendOtp(email);

        if (result.emailSent) {
            return res.status(200).json({
                success: true,
                message: 'New code sent! Check your inbox & spam folder.'
            });
        } else {
            return res.status(200).json({
                success: true,
                message: 'New code generated. Check spam or try resending again.',
                warning: 'Email delivery delayed, but code is active.'
            });
        }

    } catch (error) {
        console.error('❌ Resend OTP error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Server error. Please try again.' 
        });
    }
};

// --------------------------------------------------------------------
// VERIFY OTP - Clear error messages (no reload needed)
// --------------------------------------------------------------------
const verifyOtp = async (req, res) => {
    console.log('\n--- VERIFY OTP Controller Hit ---');
    const { email, otp } = req.body;

    try {
        const userData = unverifiedUsers.get(email);

        if (!userData) {
            return res.status(400).json({ 
                success: false, 
                message: 'Session expired. Please sign up again.' 
            });
        }

        if (userData.otp !== otp) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid code. Please check and try again.' 
            });
        }

        if (Date.now() > userData.otpExpires) { 
            unverifiedUsers.delete(email);
            return res.status(400).json({ 
                success: false, 
                message: 'Code has expired. Please request a new one.' 
            });
        }

        const newUser = new User({
            fullName: userData.fullName,
            email: userData.email,
            username: userData.username,
            password: userData.password, 
        });
        
        const savedUser = await newUser.save();
        unverifiedUsers.delete(email);

        return res.status(201).json({
            success: true,
            message: 'Account verified successfully!',
            user: {
                id: savedUser._id,
                fullName: savedUser.fullName,
                email: savedUser.email,
                username: savedUser.username,
            }
        });

    } catch (error) {
        console.error('❌ Verify OTP error:', error);
        if (error.code === 11000) {
            unverifiedUsers.delete(email);
            return res.status(409).json({ 
                success: false, 
                message: 'Email or username already in use.' 
            });
        }
        return res.status(500).json({ 
            success: false, 
            message: 'Server error. Please try again.' 
        });
    }
};

// --------------------------------------------------------------------
// LOGIN CONTROLLER
// --------------------------------------------------------------------
const login = async (req, res) => {
    console.log('\n--- LOGIN Controller Hit ---');
    const { email, password, recaptchaToken } = req.body;
  
    try {
        if (!recaptchaToken) {
            return res.status(400).json({ success: false, message: 'Please complete reCAPTCHA.' });
        }

        const isValidRecaptcha = await verifyRecaptcha(recaptchaToken);
        if (!isValidRecaptcha) {
            return res.status(400).json({ success: false, message: 'reCAPTCHA failed.' });
        }
        
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password required.' });
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        return res.json({
            success: true,
            message: 'Login successful!',
            user: { 
                id: user._id, 
                fullName: user.fullName, 
                email: user.email, 
                username: user.username, 
                role: user.role || 'user'
            }
        });

    } catch (error) {
        console.error('❌ Login error:', error);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// --------------------------------------------------------------------
// EXPORTS
// --------------------------------------------------------------------
module.exports = {
    signup,
    login,
    verifyOtp,
    resendOtp
};