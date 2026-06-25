// backend/controller/authController.js
const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const crypto = require('crypto');
const path = require('path');

const USER_JWT_SECRET = process.env.USER_JWT_SECRET || process.env.JWT_SECRET || 'wanderwaveph_user25';
const USER_JWT_EXPIRES_IN = '7d';

// 🎯 IMPORT ACTIVITY LOGGER
const { 
    logLogin, 
    logLogout, 
    logCreate,
    logActivity,
    getIpAddress, 
    getUserAgent 
} = require('../utils/activityLogger');

const GHL_OTP_WEBHOOK_URL = 'https://services.leadconnectorhq.com/hooks/yTzQYPFRZAWXGWiXtIt2/webhook-trigger/175cba0c-4604-4d50-9818-2d407219f9ca';

const unverifiedUsers = new Map();

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
// GHL WEBHOOK - OTP EMAIL
// --------------------------------------------------------------------
const sendOtpViaGHL = async (email, fullName, otp, otpDurationMinutes) => {
    console.log(`📧 Sending OTP via GHL webhook to: ${email}`);
    try {
        const response = await axios.post(GHL_OTP_WEBHOOK_URL, {
            type: 'OTP_VERIFICATION',
            event: 'otp_requested',
            source: 'WanderWave',
            email,
            fullName,
            first_name: fullName.split(' ')[0] || fullName,
            otp,
            otp_code: otp,
            otp_expiry_minutes: otpDurationMinutes,
            timestamp: new Date().toISOString(),
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000,
        });

        console.log(`✅ OTP webhook sent. Status: ${response.status}`);
        return true;
    } catch (error) {
        console.error('❌ GHL OTP Webhook Error:', error.response?.data || error.message);
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
                            
                            <tr>
                                <td style="background-color:#001b3e !important;border-bottom:4px solid #FF8C00;padding:25px 30px 20px;text-align:right;" class="mobile-padding-sm">
                                    <span class="header-label" style="display:inline-block;background-color:#FFF3E0 !important;color:#001b3e !important;padding:8px 24px;border-radius:6px;font-size:11px;font-weight:700;letter-spacing:1.5px;font-family:Arial,sans-serif;">OTP VERIFICATION</span>
                                </td>
                            </tr>
                            
                            <tr>
                                <td class="white-bg mobile-padding-sm" style="background-color:#ffffff !important;padding:25px 30px;border-bottom:1px dashed #001b3e;">
                                    <img src="cid:logo@wanderwave.com" alt="WanderWave Logo" class="logo-img" style="max-width:130px;height:auto;display:block;border:0;" width="130" />
                                </td>
                            </tr>
                            
                            <tr>
                                <td class="white-bg mobile-padding" style="background-color:#ffffff !important;padding:35px 40px;">
                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                        <tr>
                                            <td style="padding:0;">
                                                <p style="font-size:16px;color:#001b3e !important;margin:0 0 8px 0;font-weight:600;font-family:Arial,sans-serif;">Hi ${fullName || 'New User'},</p>
                                                
                                                <p style="font-size:14px;color:#64748b !important;line-height:1.7;margin:0 0 30px 0;font-family:Arial,sans-serif;">Thank you for signing up with <span style="color:#FF8C00 !important;font-weight:600;">WanderWave</span>! To complete your registration, please use the verification code below:</p>
                                                
                                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:25px 0;">
                                                    <tr>
                                                        <td style="background-color:#001b3e !important;border-radius:10px;padding:35px 20px;text-align:center;">
                                                            <p style="font-size:11px;color:#ffffff !important;text-transform:uppercase;letter-spacing:2px;margin:0 0 15px 0;font-weight:700;opacity:0.9;font-family:Arial,sans-serif;">Your Verification Code</p>
                                                            <p class="otp-text" style="font-size:42px;font-weight:800;color:#ffffff !important;letter-spacing:12px;font-family:'Courier New',Consolas,monospace;margin:0;">${otp}</p>
                                                        </td>
                                                    </tr>
                                                </table>
                                                
                                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:25px 0;">
                                                    <tr>
                                                        <td style="background-color:#FFF7ED !important;border-left:4px solid #FF8C00;padding:15px 20px;border-radius:4px;">
                                                            <p style="font-size:13px;color:#92400e !important;margin:0;line-height:1.6;font-family:Arial,sans-serif;"><strong>⏱ Valid for ${otpDurationMinutes} minutes</strong> • This code will expire shortly. Please complete verification soon.</p>
                                                        </td>
                                                    </tr>
                                                </table>
                                                
                                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:30px 0 0 0;">
                                                    <tr>
                                                        <td>
                                                            <p style="font-size:14px;color:#001b3e !important;margin:0 0 6px 0;font-weight:700;font-family:Arial,sans-serif;">Best regards,</p>
                                                            <p style="font-size:14px;color:#FF8C00 !important;font-weight:700;margin:0;font-family:Arial,sans-serif;">WanderWave Team</p>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            
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

    const emailSent = await sendOtpViaGHL(email, userData.fullName, otp, OTP_DURATION_MINUTES);

    return { success: true, emailSent };
};

// --------------------------------------------------------------------
// SIGNUP CONTROLLER - WITH ACTIVITY LOGGING
// --------------------------------------------------------------------
const signup = async (req, res) => {
    console.log('\n--- SIGNUP Controller Hit ---');
    const startTime = Date.now();
    const { fullName, email: emailInput, username: usernameInput, password, confirmPassword, recaptchaToken } = req.body;

    const email = emailInput.toLowerCase();
    const username = usernameInput.toLowerCase();

    try {
        // Validation
        if (!fullName || !email || !username || !password || !confirmPassword) {
            // 🎯 LOG FAILED SIGNUP ATTEMPT
            await logActivity({
                action: 'CREATE',
                module: 'Auth',
                user: email || 'Unknown',
                severity: 'ERROR',
                description: `Failed signup attempt: Missing required fields`,
                ipAddress: getIpAddress(req),
                userAgent: getUserAgent(req),
                details: {
                    method: req.method,
                    endpoint: req.originalUrl,
                    statusCode: 400,
                    duration: `${Date.now() - startTime}ms`
                }
            });

            return res.status(400).json({ 
                success: false, 
                message: 'All fields are required.' 
            });
        }

        if (password !== confirmPassword) {
            // 🎯 LOG PASSWORD MISMATCH
            await logActivity({
                action: 'CREATE',
                module: 'Auth',
                user: email,
                severity: 'WARNING',
                description: `Failed signup attempt: Password mismatch for ${email}`,
                ipAddress: getIpAddress(req),
                userAgent: getUserAgent(req),
                details: {
                    method: req.method,
                    endpoint: req.originalUrl,
                    statusCode: 400,
                    duration: `${Date.now() - startTime}ms`
                }
            });

            return res.status(400).json({ 
                success: false, 
                message: 'Passwords do not match.' 
            });
        }

        // Check existing user
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            // 🎯 LOG DUPLICATE EMAIL ATTEMPT
            await logActivity({
                action: 'CREATE',
                module: 'Auth',
                user: email,
                severity: 'WARNING',
                description: `Failed signup attempt: Email already registered - ${email}`,
                ipAddress: getIpAddress(req),
                userAgent: getUserAgent(req),
                details: {
                    method: req.method,
                    endpoint: req.originalUrl,
                    statusCode: 400,
                    duration: `${Date.now() - startTime}ms`
                }
            });

            return res.status(400).json({ 
                success: false, 
                message: 'This email is already registered. Please log in.' 
            });
        }

        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            // 🎯 LOG DUPLICATE USERNAME ATTEMPT
            await logActivity({
                action: 'CREATE',
                module: 'Auth',
                user: email,
                severity: 'WARNING',
                description: `Failed signup attempt: Username already taken - ${username}`,
                ipAddress: getIpAddress(req),
                userAgent: getUserAgent(req),
                details: {
                    method: req.method,
                    endpoint: req.originalUrl,
                    statusCode: 400,
                    duration: `${Date.now() - startTime}ms`
                }
            });

            return res.status(400).json({ 
                success: false, 
                message: 'This username is already taken.' 
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
            // 🎯 LOG RECAPTCHA FAILURE
            await logActivity({
                action: 'CREATE',
                module: 'Auth',
                user: email,
                severity: 'WARNING',
                description: `Failed signup attempt: reCAPTCHA verification failed for ${email}`,
                ipAddress: getIpAddress(req),
                userAgent: getUserAgent(req),
                details: {
                    method: req.method,
                    endpoint: req.originalUrl,
                    statusCode: 400,
                    duration: `${Date.now() - startTime}ms`
                }
            });

            return res.status(400).json({ 
                success: false, 
                message: 'reCAPTCHA failed. Please try again.' 
            });
        }

        // Clean old session
        if (unverifiedUsers.has(email)) unverifiedUsers.delete(email);

        const hashedPassword = await bcrypt.hash(password, 12);
        unverifiedUsers.set(email, { fullName, email, username, password: hashedPassword });

        const result = await generateAndSendOtp(email);

        if (!result.success) {
            unverifiedUsers.delete(email);
            return res.status(500).json({ 
                success: false, 
                message: 'Failed to send verification code. Please try again.' 
            });
        }

        // 🎯 LOG SUCCESSFUL OTP SENT
        await logActivity({
            action: 'CREATE',
            module: 'Auth',
            user: email,
            severity: 'INFO',
            description: `OTP verification code sent to ${email} (User: ${fullName})`,
            ipAddress: getIpAddress(req),
            userAgent: getUserAgent(req),
            details: {
                method: req.method,
                endpoint: req.originalUrl,
                statusCode: 200,
                duration: `${Date.now() - startTime}ms`,
                recordTitle: `Signup initiated - ${email}`
            }
        });

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

        // 🎯 LOG SYSTEM ERROR
        await logActivity({
            action: 'CREATE',
            module: 'Auth',
            user: email || 'System',
            severity: 'ERROR',
            description: `Signup system error: ${error.message}`,
            ipAddress: getIpAddress(req),
            userAgent: getUserAgent(req),
            details: {
                method: req.method,
                endpoint: req.originalUrl,
                statusCode: 500,
                duration: `${Date.now() - startTime}ms`
            }
        });

        return res.status(500).json({ 
            success: false, 
            message: 'Server error. Please try again later.' 
        });
    }
};

// --------------------------------------------------------------------
// RESEND OTP - WITH ACTIVITY LOGGING
// --------------------------------------------------------------------
const resendOtp = async (req, res) => {
    console.log('\n--- RESEND OTP Controller Hit ---');
    const startTime = Date.now();
    const { email: emailInput } = req.body;
    const email = emailInput.toLowerCase();

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

        // 🎯 LOG OTP RESEND
        await logActivity({
            action: 'CREATE',
            module: 'Auth',
            user: email,
            severity: 'INFO',
            description: `OTP verification code resent to ${email}`,
            ipAddress: getIpAddress(req),
            userAgent: getUserAgent(req),
            details: {
                method: req.method,
                endpoint: req.originalUrl,
                statusCode: 200,
                duration: `${Date.now() - startTime}ms`,
                recordTitle: `OTP Resent - ${email}`
            }
        });

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

        // 🎯 LOG RESEND ERROR
        await logActivity({
            action: 'CREATE',
            module: 'Auth',
            user: email || 'System',
            severity: 'ERROR',
            description: `Resend OTP error: ${error.message}`,
            ipAddress: getIpAddress(req),
            userAgent: getUserAgent(req),
            details: {
                method: req.method,
                endpoint: req.originalUrl,
                statusCode: 500,
                duration: `${Date.now() - startTime}ms`
            }
        });

        return res.status(500).json({ 
            success: false, 
            message: 'Server error. Please try again.' 
        });
    }
};

// --------------------------------------------------------------------
// VERIFY OTP - WITH ACTIVITY LOGGING
// --------------------------------------------------------------------
const verifyOtp = async (req, res) => {
    console.log('\n--- VERIFY OTP Controller Hit ---');
    const startTime = Date.now();
    const { email: emailInput, otp } = req.body;
    const email = emailInput.toLowerCase();

    try {
        const userData = unverifiedUsers.get(email);

        if (!userData) {
            // 🎯 LOG EXPIRED SESSION
            await logActivity({
                action: 'CREATE',
                module: 'Auth',
                user: email,
                severity: 'WARNING',
                description: `Failed OTP verification: Session expired for ${email}`,
                ipAddress: getIpAddress(req),
                userAgent: getUserAgent(req),
                details: {
                    method: req.method,
                    endpoint: req.originalUrl,
                    statusCode: 400,
                    duration: `${Date.now() - startTime}ms`
                }
            });

            return res.status(400).json({ 
                success: false, 
                message: 'Session expired. Please sign up again.' 
            });
        }

        if (userData.otp !== otp) {
            // 🎯 LOG INVALID OTP
            await logActivity({
                action: 'CREATE',
                module: 'Auth',
                user: email,
                severity: 'WARNING',
                description: `Failed OTP verification: Invalid code entered for ${email}`,
                ipAddress: getIpAddress(req),
                userAgent: getUserAgent(req),
                details: {
                    method: req.method,
                    endpoint: req.originalUrl,
                    statusCode: 400,
                    duration: `${Date.now() - startTime}ms`
                }
            });

            return res.status(400).json({ 
                success: false, 
                message: 'Invalid code. Please check and try again.' 
            });
        }

        if (Date.now() > userData.otpExpires) { 
            unverifiedUsers.delete(email);

            // 🎯 LOG EXPIRED OTP
            await logActivity({
                action: 'CREATE',
                module: 'Auth',
                user: email,
                severity: 'WARNING',
                description: `Failed OTP verification: Code expired for ${email}`,
                ipAddress: getIpAddress(req),
                userAgent: getUserAgent(req),
                details: {
                    method: req.method,
                    endpoint: req.originalUrl,
                    statusCode: 400,
                    duration: `${Date.now() - startTime}ms`
                }
            });

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

        // 🎯 LOG SUCCESSFUL USER REGISTRATION
        await logCreate(req, 'Users', `${savedUser.fullName} (${savedUser.email})`);

        console.log('✅ User registered and verified successfully:', email);

        const token = jwt.sign({ id: savedUser._id }, USER_JWT_SECRET, { expiresIn: USER_JWT_EXPIRES_IN });

        return res.status(201).json({
            success: true,
            message: 'Account verified successfully!',
            token,
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

            // 🎯 LOG DUPLICATE ERROR
            await logActivity({
                action: 'CREATE',
                module: 'Auth',
                user: email,
                severity: 'ERROR',
                description: `Failed OTP verification: Duplicate user error for ${email}`,
                ipAddress: getIpAddress(req),
                userAgent: getUserAgent(req),
                details: {
                    method: req.method,
                    endpoint: req.originalUrl,
                    statusCode: 409,
                    duration: `${Date.now() - startTime}ms`
                }
            });

            return res.status(409).json({ 
                success: false, 
                message: 'Email or username already in use.' 
            });
        }

        // 🎯 LOG SYSTEM ERROR
        await logActivity({
            action: 'CREATE',
            module: 'Auth',
            user: email || 'System',
            severity: 'ERROR',
            description: `OTP verification system error: ${error.message}`,
            ipAddress: getIpAddress(req),
            userAgent: getUserAgent(req),
            details: {
                method: req.method,
                endpoint: req.originalUrl,
                statusCode: 500,
                duration: `${Date.now() - startTime}ms`
            }
        });

        return res.status(500).json({ 
            success: false, 
            message: 'Server error. Please try again.' 
        });
    }
};

// --------------------------------------------------------------------
// LOGIN CONTROLLER - WITH ACTIVITY LOGGING
// --------------------------------------------------------------------
const login = async (req, res) => {
    console.log('\n--- LOGIN Controller Hit ---');
    const startTime = Date.now();
    const { email: emailInput, password, recaptchaToken } = req.body;
    const email = emailInput ? emailInput.toLowerCase() : '';
  
    try {
        if (!recaptchaToken) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please complete reCAPTCHA.' 
            });
        }

        const isValidRecaptcha = await verifyRecaptcha(recaptchaToken);
        if (!isValidRecaptcha) {
            // 🎯 LOG RECAPTCHA FAILURE
            await logActivity({
                action: 'LOGIN',
                module: 'Auth',
                user: email || 'Unknown',
                severity: 'WARNING',
                description: `Failed login attempt: reCAPTCHA verification failed`,
                ipAddress: getIpAddress(req),
                userAgent: getUserAgent(req),
                details: {
                    method: req.method,
                    endpoint: req.originalUrl,
                    statusCode: 400,
                    duration: `${Date.now() - startTime}ms`
                }
            });

            return res.status(400).json({ 
                success: false, 
                message: 'reCAPTCHA failed.' 
            });
        }
         
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email and password required.' 
            });
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            // 🎯 LOG FAILED LOGIN - USER NOT FOUND
            await logActivity({
                action: 'LOGIN',
                module: 'Auth',
                user: email,
                severity: 'WARNING',
                description: `Failed login attempt: User not found - ${email}`,
                ipAddress: getIpAddress(req),
                userAgent: getUserAgent(req),
                details: {
                    method: req.method,
                    endpoint: req.originalUrl,
                    statusCode: 401,
                    duration: `${Date.now() - startTime}ms`
                }
            });

            return res.status(401).json({ 
                success: false, 
                message: 'Invalid email or password.' 
            });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            console.log('Password mismatch for user:', email);

            // 🎯 LOG FAILED LOGIN - WRONG PASSWORD
            await logActivity({
                action: 'LOGIN',
                module: 'Auth',
                user: email,
                userId: user._id,
                severity: 'WARNING',
                description: `Failed login attempt: Invalid password for ${email}`,
                ipAddress: getIpAddress(req),
                userAgent: getUserAgent(req),
                details: {
                    method: req.method,
                    endpoint: req.originalUrl,
                    statusCode: 401,
                    duration: `${Date.now() - startTime}ms`,
                    recordId: user._id.toString()
                }
            });

            return res.status(401).json({ 
                success: false, 
                message: 'Invalid email or password.' 
            });
        }

        // 🎯 LOG SUCCESSFUL LOGIN
        await logLogin(req, user);

        console.log('✅ User logged in successfully:', email);

        const token = jwt.sign({ id: user._id }, USER_JWT_SECRET, { expiresIn: USER_JWT_EXPIRES_IN });

        return res.json({
            success: true,
            message: 'Login successful!',
            token,
            user: {
                _id: user._id,
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                username: user.username,
                role: user.role || 'user'
            }
        });

    } catch (error) {
        console.error('❌ Login error:', error);

        // 🎯 LOG SYSTEM ERROR
        await logActivity({
            action: 'LOGIN',
            module: 'Auth',
            user: email || 'System',
            severity: 'ERROR',
            description: `Login system error: ${error.message}`,
            ipAddress: getIpAddress(req),
            userAgent: getUserAgent(req),
            details: {
                method: req.method,
                endpoint: req.originalUrl,
                statusCode: 500,
                duration: `${Date.now() - startTime}ms`
            }
        });

        return res.status(500).json({ 
            success: false, 
            message: 'Server error.' 
        });
    }
};

// --------------------------------------------------------------------
// LOGOUT CONTROLLER - WITH ACTIVITY LOGGING
// --------------------------------------------------------------------
const logout = async (req, res) => {
    console.log('\n--- LOGOUT Controller Hit ---');
    const startTime = Date.now();
    
    try {
        // Get user info from request (if available from middleware)
        const userEmail = req.body.email || req.user?.email || 'Unknown';
        const userId = req.body.userId || req.user?._id || null;

        // 🎯 LOG LOGOUT
        await logActivity({
            action: 'LOGOUT',
            module: 'Auth',
            user: userEmail,
            userId: userId,
            severity: 'INFO',
            description: `User logged out: ${userEmail}`,
            ipAddress: getIpAddress(req),
            userAgent: getUserAgent(req),
            details: {
                method: req.method,
                endpoint: req.originalUrl,
                statusCode: 200,
                duration: `${Date.now() - startTime}ms`
            }
        });

        console.log('✅ User logged out:', userEmail);

        return res.status(200).json({
            success: true,
            message: 'Logout successful'
        });

    } catch (error) {
        console.error('❌ Logout error:', error);

        // 🎯 LOG LOGOUT ERROR
        await logActivity({
            action: 'LOGOUT',
            module: 'Auth',
            user: 'System',
            severity: 'ERROR',
            description: `Logout error: ${error.message}`,
            ipAddress: getIpAddress(req),
            userAgent: getUserAgent(req),
            details: {
                method: req.method,
                endpoint: req.originalUrl,
                statusCode: 500,
                duration: `${Date.now() - startTime}ms`
            }
        });

        return res.status(500).json({ 
            success: false, 
            message: 'Logout failed.' 
        });
    }
};

// --------------------------------------------------------------------
// GET ME CONTROLLER
// --------------------------------------------------------------------
const getMe = (req, res) => {
    res.status(200).json({
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
    });
};

// --------------------------------------------------------------------
// EXPORTS
// --------------------------------------------------------------------
module.exports = {
    signup,
    login,
    logout,
    verifyOtp,
    resendOtp,
    getMe
};