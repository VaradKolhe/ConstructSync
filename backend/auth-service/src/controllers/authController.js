const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const ApiResponse = require("../../../common/utils/apiResponse");
const sendEmail = require("../utils/emailSender");

// FR-2.3: short-lived access token (15m) and long-lived refresh token (7d)
const generateTokens = (id, role, isFirstLogin = false) => {
  const accessToken = jwt.sign({ id, role, isFirstLogin }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
  return { accessToken, refreshToken };
};

// FR-2.9: Cookie Options
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'Lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// --- Construction Themed Email Wrappers ---
const emailHeader = `
  <div style="background-color: #333; padding: 20px; text-align: center; border-bottom: 5px solid #FF8C00;">
    <h1 style="color: #FF8C00; margin: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-transform: uppercase; letter-spacing: 2px;">
      🏗️ CONSTRUCT<span style="color: #fff;">SYNC</span>
    </h1>
    <p style="color: #bbb; margin: 5px 0 0 0; font-size: 12px;">Building Progress, Together.</p>
  </div>
`;

const emailFooter = `
  <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 12px; color: #777; border-top: 1px solid #ddd;">
    <p>This is an automated message from the ConstructSync Management System.</p>
    <p>© 2026 ConstructSync Infrastructure Ltd. | Safety First.</p>
  </div>
`;

exports.register = async (req, res, next) => {
  try {
    const { name, email, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) return ApiResponse.error(res, "User already exists", 400);

    const tempPassword = crypto.randomBytes(4).toString("hex");

    const user = await User.create({
      name,
      email,
      password: tempPassword,
      role,
      isFirstLogin: true,
      isEmailVerified: false,
    });

    try {
      await sendEmail({
        email: user.email,
        subject: "🚧 Action Required: Your New ConstructSync Account",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd;">
            ${emailHeader}
            <div style="padding: 30px; line-height: 1.6; color: #333;">
              <h2 style="color: #333;">Welcome to the Site, ${user.name}!</h2>
              <p>Your professional account has been provisioned on the <strong>ConstructSync</strong> platform as a <strong>${role}</strong>.</p>
              <div style="background-color: #fff8e1; border-left: 5px solid #FF8C00; padding: 15px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Username:</strong> ${user.email}</p>
                <p style="margin: 5px 0;"><strong>Temporary Password:</strong> <span style="font-family: monospace; font-size: 18px; color: #d32f2f;">${tempPassword}</span></p>
              </div>
              <p><strong>Next Steps:</strong></p>
              <ol>
                <li>Log in to the portal using the temporary credentials above.</li>
                <li>Verify your professional email address.</li>
                <li>Set your permanent security password.</li>
              </ol>
            </div>
            ${emailFooter}
          </div>
        `,
      });
    } catch (err) {
      console.error("Email registration error:", err);
    }

    return ApiResponse.success(res, "User registered. Temp password sent.", { _id: user._id, email: user.email }, 201);
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip;

    const user = await User.findOne({ email }).select("+password +refreshToken");
    if (!user) return ApiResponse.error(res, "Invalid email or password", 401);

    if (user.isLocked()) {
      return ApiResponse.error(res, "Account is locked. Contact Admin.", 403);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      user.loginAttempts += 1;
      user.authLogs.push({ event: 'LOGIN_FAILED', ipAddress });
      if (user.loginAttempts >= 5) {
        user.lockUntil = Date.now() + 24 * 60 * 60 * 1000;
        user.authLogs.push({ event: 'ACCOUNT_LOCKED', ipAddress });
      }
      await user.save();
      return ApiResponse.error(res, "Invalid email or password", 401);
    }

    if (!user.isActive) return ApiResponse.error(res, "Account deactivated", 403);

    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLogin = Date.now();
    user.authLogs.push({ event: 'LOGIN_SUCCESS', ipAddress });

    const { accessToken, refreshToken } = generateTokens(user._id, user.role, user.isFirstLogin);
    user.refreshToken = refreshToken;
    await user.save();

    res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, cookieOptions);

    return ApiResponse.success(res, "Login successful", {
      _id: user._id,
      name: user.name,
      role: user.role,
      isFirstLogin: user.isFirstLogin,
      isEmailVerified: user.isEmailVerified
    });
  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      user.refreshToken = undefined;
      user.authLogs.push({ event: 'LOGOUT', ipAddress: req.ip });
      await user.save();
    }
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    return ApiResponse.success(res, "Logged out successfully");
  } catch (error) {
    next(error);
  }
};

exports.refresh = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return ApiResponse.error(res, "No refresh token", 401);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ _id: decoded.id, refreshToken: token });
    if (!user) return ApiResponse.error(res, "Invalid refresh token", 401);

    const { accessToken, refreshToken } = generateTokens(user._id, user.role, user.isFirstLogin);
    user.refreshToken = refreshToken;
    await user.save();

    res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, cookieOptions);

    return ApiResponse.success(res, "Token refreshed");
  } catch (error) {
    return ApiResponse.error(res, "Session expired", 401);
  }
};

exports.requestEmailOTP = async (req, res, next) => {
  try {
    const { newEmail } = req.body || {};
    const user = await User.findById(req.user.id);
    if (!user) return ApiResponse.error(res, "User not found", 404);

    let targetEmail = user.email;
    if (user.role === 'ADMIN' && user.email === 'admin@test.com' && newEmail) {
      targetEmail = newEmail;
    }

    user.otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    await sendEmail({
      email: targetEmail,
      subject: `🔑 Verification Code: [${user.otp}]`,
      html: `${emailHeader}<div style="padding:30px; text-align:center;"><h2>OTP: ${user.otp}</h2></div>${emailFooter}`
    });

    return ApiResponse.success(res, `OTP sent to ${targetEmail}`);
  } catch (error) {
    next(error);
  }
};

exports.verifyEmail = async (req, res, next) => {
  try {
    const { otp, newEmail } = req.body;
    const user = await User.findById(req.user.id);
    if (!user.otp || user.otp !== otp || user.otpExpires < Date.now()) {
      return ApiResponse.error(res, "Invalid or expired OTP", 400);
    }
    if (newEmail && user.role === 'ADMIN') user.email = newEmail;
    user.isEmailVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();
    return ApiResponse.success(res, "Email verified successfully");
  } catch (error) {
    next(error);
  }
};

exports.completeOnboarding = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return ApiResponse.error(res, "Password must be at least 8 characters, include uppercase, lowercase, number and special character.", 400);
    }
    const user = await User.findById(req.user.id);
    if (!user.isEmailVerified) return ApiResponse.error(res, "Verify email first", 400);
    user.password = newPassword;
    user.isFirstLogin = false;
    await user.save();
    return ApiResponse.success(res, "Onboarding complete.");
  } catch (error) {
    next(error);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    return ApiResponse.success(res, "Profile fetched", user);
  } catch (error) {
    next(error);
  }
};
