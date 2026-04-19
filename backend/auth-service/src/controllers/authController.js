const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const ApiResponse = require('../../../common/utils/apiResponse');
const sendEmail = require('../utils/emailSender');

const generateToken = (id, role, isFirstLogin = false) => {
  return jwt.sign({ id, role, isFirstLogin }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); 
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) return ApiResponse.error(res, 'User already exists', 400);

    const tempPassword = crypto.randomBytes(4).toString('hex');

    const user = await User.create({
      name,
      email,
      password: tempPassword,
      role,
      isFirstLogin: true,
      isEmailVerified: false
    });

    // Real Email for Temporary Password
    try {
      await sendEmail({
        email: user.email,
        subject: 'Welcome to ConstructSync - Your Temporary Account Details',
        html: `
          <h1>Welcome to ConstructSync, ${user.name}!</h1>
          <p>Your account has been created by the administrator. Please use the temporary details below to log in for the first time:</p>
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>Temporary Password:</strong> ${tempPassword}</p>
          <p>Upon login, you will be required to verify your email and set a permanent password.</p>
        `
      });
    } catch (err) {
      console.error('Email could not be sent during registration:', err);
      // We don't return error here to let the API finish, but we log it.
    }

    return ApiResponse.success(res, 'User registered. Temporary password sent to email.', {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    }, 201);
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return ApiResponse.error(res, 'Invalid email or password', 401);
    }

    if (!user.isActive) return ApiResponse.error(res, 'Account deactivated', 403);

    const token = generateToken(user._id, user.role, user.isFirstLogin);
    user.lastLogin = Date.now();
    await user.save();

    return ApiResponse.success(res, 'Login successful', {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isFirstLogin: user.isFirstLogin,
      isEmailVerified: user.isEmailVerified,
      token,
    });
  } catch (error) {
    next(error);
  }
};

exports.requestEmailOTP = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return ApiResponse.error(res, 'User not found', 404);

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    // Real Email for OTP
    try {
      await sendEmail({
        email: user.email,
        subject: 'ConstructSync - Your Email Verification OTP',
        html: `
          <h3>Email Verification Required</h3>
          <p>Your one-time password (OTP) for verifying your account is:</p>
          <h2 style="color: #4CAF50;">${otp}</h2>
          <p>This code will expire in 10 minutes.</p>
        `
      });
      return ApiResponse.success(res, 'OTP sent successfully to your email.');
    } catch (err) {
      console.error('Email Error:', err);
      return ApiResponse.error(res, 'Failed to send OTP email. Check server logs.', 500);
    }
  } catch (error) {
    next(error);
  }
};

exports.verifyEmail = async (req, res, next) => {
  try {
    const { otp, newEmail } = req.body;
    const user = await User.findById(req.user.id);

    if (!user.otp || user.otp !== otp || user.otpExpires < Date.now()) {
      return ApiResponse.error(res, 'Invalid or expired OTP', 400);
    }

    if (newEmail && (!user.isEmailVerified || user.isFirstLogin)) {
      const emailTaken = await User.findOne({ email: newEmail });
      if (emailTaken) return ApiResponse.error(res, 'Email already in use', 400);
      user.email = newEmail;
    }

    user.isEmailVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    return ApiResponse.success(res, 'Email verified successfully', { email: user.email });
  } catch (error) {
    next(error);
  }
};

exports.completeOnboarding = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    const user = await User.findById(req.user.id);

    if (!user.isEmailVerified) return ApiResponse.error(res, 'Please verify your email first', 400);

    user.password = newPassword;
    user.isFirstLogin = false;
    await user.save();

    return ApiResponse.success(res, 'Onboarding complete. Password updated.');
  } catch (error) {
    next(error);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return ApiResponse.error(res, 'User not found', 404);
    return ApiResponse.success(res, 'Profile fetched', user);
  } catch (error) {
    next(error);
  }
};
