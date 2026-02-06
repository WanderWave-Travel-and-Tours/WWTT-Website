// backend/controller/authController.js
// Using RESEND - Works on Render FREE and PAID tier!
const User = require('../models/user');
const bcrypt = require('bcrypt');
const axios = require('axios');
const { Resend } = require('resend');
const crypto = require('crypto'); 
const path = require('path');
const fs = require('fs');

// 🎯 IMPORT ACTIVITY LOGGER
const { 
    logLogin, 
    logLogout, 
    logCreate,
    logActivity,
    getIpAddress, 
    getUserAgent 
} = require('../utils/activityLogger');

const LOGO_PATH = path.join(__dirname, '..', 'assets', 'LOGOPIC.png'); 

// --------------------------------------------------------------------
// 🎯 IN-MEMORY STORAGE FOR UNVERIFIED USERS (OTP SESSION)
// --------------------------------------------------------------------
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
// RESEND API CONFIGURATION - Works on Render FREE tier!
// Uses HTTPS (port 443) - NEVER blocked
// --------------------------------------------------------------------
console.log('📧 Email Config Check:', {
    EMAIL_SERVICE: process.env.EMAIL_SERVICE || 'Not set',
    RESEND_API_KEY: process.env.RESEND_API_KEY ? `✅ Set (${process.env.RESEND_API_KEY.substring(0, 10)}...)` : '❌ Missing',
    EMAIL_FROM: process.env.EMAIL_FROM ? '✅ Set' : '❌ Missing'
});

// 🎯 INITIALIZE RESEND
let resend;
if (process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
    console.log('✅ Resend API configured successfully');
    console.log('✅ Email sending will use HTTPS (port 443) - Works on Render FREE tier!');
} else {
    console.error('❌ RESEND_API_KEY not found in environment variables!');
    console.error('⚠️ Email functionality will NOT work!');
}

// --------------------------------------------------------------------
// EMAIL SENDING FUNCTION - Using Resend API
// --------------------------------------------------------------------
const sendEmail = async (to, subject, html) => {
    console.log(`\n📧 === EMAIL SENDING ATTEMPT (Resend API) ===`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`From: ${process.env.EMAIL_FROM}`);
    console.log(`Method: HTTPS (port 443) - Works on Render FREE tier!`);
    
    try {
        if (!process.env.RESEND_API_KEY) {
            console.error("❌ Resend API key missing: RESEND_API_KEY not set");
            return false;
        }

        if (!process.env.EMAIL_FROM) {
            console.error("❌ Sender email missing: EMAIL_FROM not set");
            return false;
        }

        const fromEmail = process.env.EMAIL_FROM;
        const fromName = process.env.EMAIL_FROM_NAME || 'WanderWave Customer Service';

        console.log('🚀 Sending email via Resend API (HTTPS)...');
        
        // Send email using Resend API
        const data = await resend.emails.send({
            from: `${fromName} <${fromEmail}>`,
            to: [to],
            subject: subject,
            html: html,
        });

        console.log(`✅ EMAIL SENT SUCCESSFULLY via Resend!`);
        console.log(`Message ID: ${data.id}`);
        console.log(`Status: Email queued for delivery`);
        
        return true;
        
    } catch (error) {
        console.error("\n❌ ========== RESEND EMAIL ERROR ==========");
        console.error("Error Message:", error.message);
        
        if (error.message.includes('API key')) {
            console.error("\n⚠️ RESEND AUTHENTICATION FAILED!");
            console.error("Possible causes:");
            console.error("1. Invalid API Key");
            console.error("2. API Key not verified");
            console.error("\nSolutions:");
            console.error("1. Get API Key from: https://resend.com/api-keys");
            console.error("2. Make sure you verified your domain/email");
        }
        
        if (error.message.includes('not verified')) {
            console.error("\n⚠️ SENDER EMAIL NOT VERIFIED!");
            console.error("You need to verify your email/domain first:");
            console.error("1. Go to: https://resend.com/domains");
            console.error("2. Add and verify your domain");
            console.error("3. OR use Resend's test domain: onboarding@resend.dev");
        }
        
        console.error("\nFull Error:", error);
        console.error("========================================\n");
        return false;
    }
};

// --------------------------------------------------------------------
// EMAIL HTML TEMPLATE
// --------------------------------------------------------------------
const getOtpEmailHtml = (fullName, otp, otpDurationMinutes) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WanderWave OTP Verification</title>
    <style>
        body { margin: 0; padding: 0; background-color: #ffffff; font-family: Arial, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #001b3e; color: #ffffff; padding: 30px; text-align: center; border-bottom: 4px solid #FF8C00; }
        .logo { font-size: 28px; font-weight: bold; margin: 0; }
        .tagline { font-size: 11px; letter-spacing: 2px; margin: 10px 0 0 0; opacity: 0.9; }
        .content { background-color: #ffffff; padding: 40px; }
        .otp-box { background-color: #001b3e; color: #ffffff; padding: 30px; border-radius: 10px; text-align: center; margin: 30px 0; }
        .otp-label { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 15px 0; opacity: 0.9; }
        .otp-code { font-size: 42px; font-weight: bold; letter-spacing: 12px; font-family: 'Courier New', monospace; margin: 0; }
        .warning { background-color: #FFF7ED; border-left: 4px solid #FF8C00; padding: 15px 20px; margin: 20px 0; color: #92400e; border-radius: 4px; }
        .footer { background-color: #001b3e; color: #ffffff; padding: 25px; text-align: center; font-size: 12px; }
        @media screen and (max-width: 600px) {
            .content { padding: 20px; }
            .otp-code { font-size: 36px; letter-spacing: 8px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="logo">WanderWave</h1>
            <p class="tagline">OTP VERIFICATION</p>
        </div>
        <div class="content">
            <p style="font-size: 16px; font-weight: 600; color: #001b3e; margin: 0 0 8px 0;">Hi ${fullName || 'New User'},</p>
            <p style="font-size: 14px; color: #64748b; line-height: 1.7; margin: 0 0 30px 0;">Thank you for signing up with <strong style="color: #FF8C00;">WanderWave</strong>! To complete your registration, please use the verification code below:</p>
            
            <div class="otp-box">
                <p class="otp-label">Your Verification Code</p>
                <p class="otp-code">${otp}</p>
            </div>
            
            <div class="warning">
                <p style="margin: 0; line-height: 1.6;"><strong>⏱ Valid for ${otpDurationMinutes} minutes</strong> • This code will expire shortly. Please complete verification soon.</p>
            </div>
            
            <p style="margin-top: 30px; font-size: 14px; color: #001b3e;">
                <strong>Best regards,</strong><br>
                <span style="color: #FF8C00; font-weight: bold;">WanderWave Team</span>
            </p>
        </div>
        <div class="footer">
            <p style="margin: 0 0 8px 0; line-height: 1.6;">If you did not request this verification code, please ignore this email.</p>
            <p style="margin: 0; opacity: 0.9;">This is an automated message. Please do not reply to this email.</p>
        </div>
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
    console.log(`\n🔐 OTP Generated for ${email}: ${otp}`);
    console.log(`⏰ OTP expires at: ${new Date(otpExpires).toLocaleString()}`);

    const emailBody = getOtpEmailHtml(userData.fullName, otp, OTP_DURATION_MINUTES);
    const emailSent = await sendEmail(email, 'WanderWave - Verification Code', emailBody);

    return { success: true, emailSent };
};

// REST OF CONTROLLERS (signup, login, etc.) - same as before

// --------------------------------------------------------------------
// SIGNUP CONTROLLER
// --------------------------------------------------------------------
const signup = async (req, res) => {
    console.log('\n==============================================');
    console.log('📝 SIGNUP Controller Hit');
    console.log('==============================================');
    const startTime = Date.now();
    const { fullName, email: emailInput, username: usernameInput, password, confirmPassword, recaptchaToken } = req.body;

    const email = emailInput.toLowerCase();
    const username = usernameInput.toLowerCase();

    console.log(`User: ${fullName} (${email})`);

    try {
        if (!fullName || !email || !username || !password || !confirmPassword) {
            await logActivity({
                action: 'CREATE', module: 'Auth', user: email || 'Unknown', severity: 'ERROR',
                description: `Failed signup attempt: Missing required fields`,
                ipAddress: getIpAddress(req), userAgent: getUserAgent(req),
                details: { method: req.method, endpoint: req.originalUrl, statusCode: 400, duration: `${Date.now() - startTime}ms` }
            });
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }

        if (password !== confirmPassword) {
            await logActivity({
                action: 'CREATE', module: 'Auth', user: email, severity: 'WARNING',
                description: `Failed signup attempt: Password mismatch for ${email}`,
                ipAddress: getIpAddress(req), userAgent: getUserAgent(req),
                details: { method: req.method, endpoint: req.originalUrl, statusCode: 400, duration: `${Date.now() - startTime}ms` }
            });
            return res.status(400).json({ success: false, message: 'Passwords do not match.' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            await logActivity({
                action: 'CREATE', module: 'Auth', user: email, severity: 'WARNING',
                description: `Failed signup attempt: Email already registered - ${email}`,
                ipAddress: getIpAddress(req), userAgent: getUserAgent(req),
                details: { method: req.method, endpoint: req.originalUrl, statusCode: 400, duration: `${Date.now() - startTime}ms` }
            });
            return res.status(400).json({ success: false, message: 'This email is already registered. Please log in.' });
        }

        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            await logActivity({
                action: 'CREATE', module: 'Auth', user: email, severity: 'WARNING',
                description: `Failed signup attempt: Username already taken - ${username}`,
                ipAddress: getIpAddress(req), userAgent: getUserAgent(req),
                details: { method: req.method, endpoint: req.originalUrl, statusCode: 400, duration: `${Date.now() - startTime}ms` }
            });
            return res.status(400).json({ success: false, message: 'This username is already taken.' });
        }

        if (!recaptchaToken) {
            return res.status(400).json({ success: false, message: 'Please complete the reCAPTCHA.' });
        }

        const isValidRecaptcha = await verifyRecaptcha(recaptchaToken);
        if (!isValidRecaptcha) {
            await logActivity({
                action: 'CREATE', module: 'Auth', user: email, severity: 'WARNING',
                description: `Failed signup attempt: reCAPTCHA verification failed for ${email}`,
                ipAddress: getIpAddress(req), userAgent: getUserAgent(req),
                details: { method: req.method, endpoint: req.originalUrl, statusCode: 400, duration: `${Date.now() - startTime}ms` }
            });
            return res.status(400).json({ success: false, message: 'reCAPTCHA failed. Please try again.' });
        }

        if (unverifiedUsers.has(email)) unverifiedUsers.delete(email);

        const hashedPassword = await bcrypt.hash(password, 12);
        unverifiedUsers.set(email, { fullName, email, username, password: hashedPassword });

        console.log('🔄 Generating and sending OTP via Resend...');
        const result = await generateAndSendOtp(email);

        if (!result.success) {
            unverifiedUsers.delete(email);
            return res.status(500).json({ success: false, message: 'Failed to send verification code. Please try again.' });
        }

        await logActivity({
            action: 'CREATE', module: 'Auth', user: email, severity: 'INFO',
            description: `OTP verification code sent to ${email} (User: ${fullName})`,
            ipAddress: getIpAddress(req), userAgent: getUserAgent(req),
            details: { method: req.method, endpoint: req.originalUrl, statusCode: 200, duration: `${Date.now() - startTime}ms`, recordTitle: `Signup initiated - ${email}` }
        });

        console.log('✅ Signup initiated successfully via Resend');
        console.log('==============================================\n');

        return res.status(200).json({
            success: true,
            message: result.emailSent ? 'Verification code sent! Check your inbox.' : 'Code generated. Try resending if not received.',
            verificationRequired: true,
            email
        });

    } catch (error) {
        console.error('❌ Signup error:', error);
        await logActivity({
            action: 'CREATE', module: 'Auth', user: email || 'System', severity: 'ERROR',
            description: `Signup system error: ${error.message}`,
            ipAddress: getIpAddress(req), userAgent: getUserAgent(req),
            details: { method: req.method, endpoint: req.originalUrl, statusCode: 500, duration: `${Date.now() - startTime}ms` }
        });
        return res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
    }
};

// --------------------------------------------------------------------
// RESEND OTP
// --------------------------------------------------------------------
const resendOtp = async (req, res) => {
    console.log('\n--- RESEND OTP Controller Hit ---');
    const startTime = Date.now();
    const { email: emailInput } = req.body;
    const email = emailInput.toLowerCase();

    try {
        if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });
        if (!unverifiedUsers.has(email)) return res.status(400).json({ success: false, message: 'No active signup session. Please start over.' });

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            unverifiedUsers.delete(email);
            return res.status(400).json({ success: false, message: 'Account already verified. Please log in.' });
        }

        const result = await generateAndSendOtp(email);

        await logActivity({
            action: 'CREATE', module: 'Auth', user: email, severity: 'INFO',
            description: `OTP verification code resent to ${email}`,
            ipAddress: getIpAddress(req), userAgent: getUserAgent(req),
            details: { method: req.method, endpoint: req.originalUrl, statusCode: 200, duration: `${Date.now() - startTime}ms`, recordTitle: `OTP Resent - ${email}` }
        });

        if (result.emailSent) {
            return res.status(200).json({ success: true, message: 'New code sent! Check your inbox & spam folder.' });
        } else {
            return res.status(200).json({ success: true, message: 'New code generated. Check spam or try resending again.', warning: 'Email delivery delayed, but code is active.' });
        }

    } catch (error) {
        console.error('❌ Resend OTP error:', error);
        await logActivity({
            action: 'CREATE', module: 'Auth', user: email || 'System', severity: 'ERROR',
            description: `Resend OTP error: ${error.message}`,
            ipAddress: getIpAddress(req), userAgent: getUserAgent(req),
            details: { method: req.method, endpoint: req.originalUrl, statusCode: 500, duration: `${Date.now() - startTime}ms` }
        });
        return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
    }
};

// --------------------------------------------------------------------
// VERIFY OTP
// --------------------------------------------------------------------
const verifyOtp = async (req, res) => {
    console.log('\n--- VERIFY OTP Controller Hit ---');
    const startTime = Date.now();
    const { email: emailInput, otp } = req.body;
    const email = emailInput.toLowerCase();

    try {
        const userData = unverifiedUsers.get(email);

        if (!userData) {
            await logActivity({
                action: 'CREATE', module: 'Auth', user: email, severity: 'WARNING',
                description: `Failed OTP verification: Session expired for ${email}`,
                ipAddress: getIpAddress(req), userAgent: getUserAgent(req),
                details: { method: req.method, endpoint: req.originalUrl, statusCode: 400, duration: `${Date.now() - startTime}ms` }
            });
            return res.status(400).json({ success: false, message: 'Session expired. Please sign up again.' });
        }

        if (userData.otp !== otp) {
            await logActivity({
                action: 'CREATE', module: 'Auth', user: email, severity: 'WARNING',
                description: `Failed OTP verification: Invalid code entered for ${email}`,
                ipAddress: getIpAddress(req), userAgent: getUserAgent(req),
                details: { method: req.method, endpoint: req.originalUrl, statusCode: 400, duration: `${Date.now() - startTime}ms` }
            });
            return res.status(400).json({ success: false, message: 'Invalid code. Please check and try again.' });
        }

        if (Date.now() > userData.otpExpires) {
            unverifiedUsers.delete(email);
            await logActivity({
                action: 'CREATE', module: 'Auth', user: email, severity: 'WARNING',
                description: `Failed OTP verification: Code expired for ${email}`,
                ipAddress: getIpAddress(req), userAgent: getUserAgent(req),
                details: { method: req.method, endpoint: req.originalUrl, statusCode: 400, duration: `${Date.now() - startTime}ms` }
            });
            return res.status(400).json({ success: false, message: 'Code has expired. Please request a new one.' });
        }

        const newUser = new User({
            fullName: userData.fullName,
            email: userData.email,
            username: userData.username,
            password: userData.password,
        });

        const savedUser = await newUser.save();
        unverifiedUsers.delete(email);

        await logCreate(req, 'Users', `${savedUser.fullName} (${savedUser.email})`);

        console.log('✅ User registered and verified successfully:', email);

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
            await logActivity({
                action: 'CREATE', module: 'Auth', user: email, severity: 'ERROR',
                description: `Failed OTP verification: Duplicate user error for ${email}`,
                ipAddress: getIpAddress(req), userAgent: getUserAgent(req),
                details: { method: req.method, endpoint: req.originalUrl, statusCode: 409, duration: `${Date.now() - startTime}ms` }
            });
            return res.status(409).json({ success: false, message: 'Email or username already in use.' });
        }

        await logActivity({
            action: 'CREATE', module: 'Auth', user: email || 'System', severity: 'ERROR',
            description: `OTP verification system error: ${error.message}`,
            ipAddress: getIpAddress(req), userAgent: getUserAgent(req),
            details: { method: req.method, endpoint: req.originalUrl, statusCode: 500, duration: `${Date.now() - startTime}ms` }
        });

        return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
    }
};

// --------------------------------------------------------------------
// LOGIN CONTROLLER
// --------------------------------------------------------------------
const login = async (req, res) => {
    console.log('\n--- LOGIN Controller Hit ---');
    const startTime = Date.now();
    const { email: emailInput, password, recaptchaToken } = req.body;
    const email = emailInput ? emailInput.toLowerCase() : '';

    try {
        if (!recaptchaToken) return res.status(400).json({ success: false, message: 'Please complete reCAPTCHA.' });

        const isValidRecaptcha = await verifyRecaptcha(recaptchaToken);
        if (!isValidRecaptcha) {
            await logActivity({
                action: 'LOGIN', module: 'Auth', user: email || 'Unknown', severity: 'WARNING',
                description: `Failed login attempt: reCAPTCHA verification failed`,
                ipAddress: getIpAddress(req), userAgent: getUserAgent(req),
                details: { method: req.method, endpoint: req.originalUrl, statusCode: 400, duration: `${Date.now() - startTime}ms` }
            });
            return res.status(400).json({ success: false, message: 'reCAPTCHA failed.' });
        }

        if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required.' });

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            await logActivity({
                action: 'LOGIN', module: 'Auth', user: email, severity: 'WARNING',
                description: `Failed login attempt: User not found - ${email}`,
                ipAddress: getIpAddress(req), userAgent: getUserAgent(req),
                details: { method: req.method, endpoint: req.originalUrl, statusCode: 401, duration: `${Date.now() - startTime}ms` }
            });
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            console.log('Password mismatch for user:', email);
            await logActivity({
                action: 'LOGIN', module: 'Auth', user: email, userId: user._id, severity: 'WARNING',
                description: `Failed login attempt: Invalid password for ${email}`,
                ipAddress: getIpAddress(req), userAgent: getUserAgent(req),
                details: { method: req.method, endpoint: req.originalUrl, statusCode: 401, duration: `${Date.now() - startTime}ms`, recordId: user._id.toString() }
            });
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        await logLogin(req, user);
        console.log('✅ User logged in successfully:', email);

        return res.json({
            success: true,
            message: 'Login successful!',
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
        await logActivity({
            action: 'LOGIN', module: 'Auth', user: email || 'System', severity: 'ERROR',
            description: `Login system error: ${error.message}`,
            ipAddress: getIpAddress(req), userAgent: getUserAgent(req),
            details: { method: req.method, endpoint: req.originalUrl, statusCode: 500, duration: `${Date.now() - startTime}ms` }
        });
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// --------------------------------------------------------------------
// LOGOUT CONTROLLER
// --------------------------------------------------------------------
const logout = async (req, res) => {
    console.log('\n--- LOGOUT Controller Hit ---');
    const startTime = Date.now();

    try {
        const userEmail = req.body.email || req.user?.email || 'Unknown';
        const userId = req.body.userId || req.user?._id || null;

        await logActivity({
            action: 'LOGOUT', module: 'Auth', user: userEmail, userId: userId, severity: 'INFO',
            description: `User logged out: ${userEmail}`,
            ipAddress: getIpAddress(req), userAgent: getUserAgent(req),
            details: { method: req.method, endpoint: req.originalUrl, statusCode: 200, duration: `${Date.now() - startTime}ms` }
        });

        console.log('✅ User logged out:', userEmail);
        return res.status(200).json({ success: true, message: 'Logout successful' });

    } catch (error) {
        console.error('❌ Logout error:', error);
        await logActivity({
            action: 'LOGOUT', module: 'Auth', user: 'System', severity: 'ERROR',
            description: `Logout error: ${error.message}`,
            ipAddress: getIpAddress(req), userAgent: getUserAgent(req),
            details: { method: req.method, endpoint: req.originalUrl, statusCode: 500, duration: `${Date.now() - startTime}ms` }
        });
        return res.status(500).json({ success: false, message: 'Logout failed.' });
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