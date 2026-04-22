const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const mongoose = require("mongoose");
const User = require("../models/User");
const ApiResponse = require("../../../common/utils/apiResponse");
const sendEmail = require("../utils/emailSender");
const { logAudit } = require("../../../common/utils/auditLogger");

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
  path: '/', // Ensure cookie is sent for all paths
};

// --- Construction Themed Email Wrappers (Industrial Modern) ---
const emailHeader = `
  <div style="background-color: #0f172a; padding: 40px 20px; text-align: center; border-bottom: 8px solid #ea580c;">
    <div style="display: inline-block; background-color: #ea580c; padding: 10px; margin-bottom: 15px;">
      <span style="font-size: 32px;">🏗️</span>
    </div>
    <h1 style="color: #ea580c; margin: 0; font-family: 'Arial Black', sans-serif; text-transform: uppercase; letter-spacing: -1px; font-size: 28px;">
      CONSTRUCT<span style="color: #ffffff;">SYNC</span>
    </h1>
    <div style="height: 2px; width: 50px; background-color: #ea580c; margin: 15px auto;"></div>
    <p style="color: #94a3b8; margin: 0; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 3px;">Infrastructure Management Systems</p>
  </div>
`;

const emailFooter = `
  <div style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 2px solid #0f172a;">
    <p style="font-family: 'Arial', sans-serif; font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">
      Authorized Security Protocol • ConstructSync Stable v2.4.0
    </p>
    <div style="color: #94a3b8; font-size: 9px; line-height: 1.5;">
      © 2026 ConstructSync Infrastructure Ltd.<br/>
      Safety First. Precision Always.
    </div>
  </div>
`;

exports.register = async (req, res, next) => {
  try {
    const { name, email, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) return ApiResponse.error(res, "User already exists", 400);

    const tempPassword = crypto.randomBytes(4).toString("hex");

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const loginUrl = `${frontendUrl}/login`;

    const user = await User.create({
      name,
      email,
      password: tempPassword,
      role,
      isFirstLogin: true,
      isEmailVerified: true,
    });

    try {
      await sendEmail({
        email: user.email,
        subject: "🚧 Action Required: Your New ConstructSync Account",
        html: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; border: 2px solid #0f172a; background-color: #ffffff;">
            ${emailHeader}
            <div style="padding: 40px; line-height: 1.6; color: #334155;">
              <h2 style="color: #0f172a; font-family: 'Arial Black', sans-serif; text-transform: uppercase; margin-top: 0;">Welcome to the Site, ${user.name}</h2>
              <p style="font-size: 14px;">Your professional account has been provisioned on the <strong>ConstructSync</strong> platform with the following role: <span style="color: #ea580c; font-weight: bold;">${role}</span>.</p>
              
              <div style="background-color: #f8fafc; border-left: 4px solid #0f172a; padding: 25px; margin: 30px 0; box-shadow: 4px 4px 0px 0px #0f172a;">
                <p style="margin: 0 0 10px 0; font-size: 11px; font-weight: bold; text-transform: uppercase; color: #64748b; letter-spacing: 1px;">Access Credentials</p>
                <p style="margin: 5px 0; font-size: 15px;"><strong>Username:</strong> ${user.email}</p>
                <p style="margin: 5px 0; font-size: 15px;"><strong>Temporary Password:</strong> <span style="font-family: 'Courier New', monospace; font-weight: bold; color: #ea580c; background-color: #fff7ed; padding: 2px 6px; border: 1px solid #fed7aa;">${tempPassword}</span></p>
              </div>

              <h3 style="color: #0f172a; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px;">Required Activation Protocol:</h3>
              <ol style="font-size: 14px; padding-left: 20px;">
                <li style="margin-bottom: 10px;">Log in to the portal using the temporary credentials above.</li>
                <li style="margin-bottom: 10px;">Verify your professional email address via OTP.</li>
                <li style="margin-bottom: 10px;">Establish your permanent master security password.</li>
              </ol>

              <div style="margin-top: 40px; text-align: center;">
                <a href="${loginUrl}" style="background-color: #ea580c; color: #ffffff; padding: 15px 30px; text-decoration: none; font-weight: bold; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; border: 2px solid #0f172a; box-shadow: 4px 4px 0px 0px #0f172a;">Access Authorization Terminal</a>
              </div>
            </div>
            ${emailFooter}
          </div>
        `,
      });
    } catch (err) {
      console.error("Email registration error:", err);
    }

    await logAudit(mongoose, {
      userId: user._id,
      action: 'USER_REGISTERED',
      module: 'AUTH',
      details: { email: user.email, role: user.role },
      ipAddress: req.ip
    });

    return ApiResponse.success(res, "User registered. Temp password sent.", { _id: user._id, email: user.email }, 201);
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password, rememberMe } = req.body;
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

    await logAudit(mongoose, {
      userId: user._id,
      action: 'LOGIN_SUCCESS',
      module: 'AUTH',
      details: { email: user.email },
      ipAddress
    });

    // Adjust cookie expiration based on rememberMe
    const maxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 1 * 24 * 60 * 60 * 1000; // 30 days vs 1 day

    res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge });

    return ApiResponse.success(res, "Login successful", {
      _id: user._id,
      name: user.name,
      email: user.email,
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
      await logAudit(mongoose, {
        userId: user._id,
        action: 'LOGOUT',
        module: 'AUTH',
        details: { email: user.email },
        ipAddress: req.ip
      });
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

    // Keep existing refresh token to prevent race conditions during simultaneous refreshes
    const { accessToken } = generateTokens(user._id, user.role, user.isFirstLogin);
    
    res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
    // Refresh token cookie remains the same, just extending its life in the browser if needed
    res.cookie('refreshToken', token, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 });

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
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; border: 2px solid #0f172a; background-color: #ffffff;">
          ${emailHeader}
          <div style="padding: 40px; text-align: center; color: #334155;">
            <h2 style="color: #0f172a; font-family: 'Arial Black', sans-serif; text-transform: uppercase; margin-top: 0; font-size: 20px;">Identity Verification Required</h2>
            <p style="font-size: 14px; margin-bottom: 30px;">Please use the following high-security authorization code to verify your professional email address.</p>
            
            <div style="background-color: #f8fafc; border: 2px dashed #94a3b8; padding: 30px; margin: 20px auto; max-width: 300px; box-shadow: 6px 6px 0px 0px #ea580c;">
              <p style="margin: 0 0 10px 0; font-size: 10px; font-weight: bold; text-transform: uppercase; color: #64748b; letter-spacing: 2px;">Verification OTP</p>
              <span style="font-family: 'Courier New', monospace; font-size: 42px; font-weight: 900; color: #0f172a; letter-spacing: 8px;">${user.otp}</span>
            </div>

            <p style="font-size: 11px; color: #94a3b8; margin-top: 30px; text-transform: uppercase; font-weight: bold;">
              ⚠️ This code will expire in 10 minutes.
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #f1f5f9; text-align: left;">
              <p style="font-size: 12px; color: #64748b; margin: 0;">
                <strong>Security Notice:</strong> If you did not request this code, please ignore this email or contact the System Administrator immediately.
              </p>
            </div>
          </div>
          ${emailFooter}
        </div>
      `
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

/**
 * Update current user profile
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return ApiResponse.error(res, "User not found", 404);

    if (name) user.name = name;
    if (email) user.email = email;

    await user.save();

    await logAudit(mongoose, {
      userId: user._id,
      action: 'PROFILE_UPDATED',
      module: 'AUTH',
      details: { changes: req.body },
      ipAddress: req.ip
    });

    return ApiResponse.success(res, "Profile updated successfully", user);
  } catch (error) {
    next(error);
  }
};

/**
 * Forgot Password (FR-2.7)
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return ApiResponse.error(res, "No user found with that email", 404);

    // Get reset token
    const resetToken = user.getResetPasswordToken();
    await user.save();

    // Create reset url (points to Frontend)
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    const message = `Security Protocol: Password Reset Requested.\n\nPlease use the following link to establish a new security key:\n\n${resetUrl}\n\nIf you did not initiate this request, please disregard this transmission. Link expires in 10 minutes.`;

    try {
      await sendEmail({
        email: user.email,
        subject: "🔐 Security Protocol: Password Reset Requested",
        html: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; border: 2px solid #0f172a; background-color: #ffffff;">
            ${emailHeader}
            <div style="padding: 40px; text-align: center; color: #334155;">
              <h2 style="color: #0f172a; font-family: 'Arial Black', sans-serif; text-transform: uppercase; margin-top: 0; font-size: 20px;">Password Reset Requested</h2>
              <p style="font-size: 14px; margin-bottom: 30px;">A request to reset your system access key has been initiated. If you did not authorize this, please contact the System Administrator.</p>
              
              <div style="margin: 40px 0;">
                <a href="${resetUrl}" style="background-color: #ea580c; color: #ffffff; padding: 15px 30px; text-decoration: none; font-weight: bold; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; border: 2px solid #0f172a; box-shadow: 4px 4px 0px 0px #0f172a;">Execute Reset Protocol</a>
              </div>

              <p style="font-size: 11px; color: #94a3b8; margin-top: 30px; text-transform: uppercase; font-weight: bold;">
                ⚠️ This authorization link will expire in 10 minutes.
              </p>
            </div>
            ${emailFooter}
          </div>
        `,
      });

      return ApiResponse.success(res, "Recovery email dispatched");
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      return ApiResponse.error(res, "Email could not be sent", 500);
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Reset Password (FR-2.7)
 */
exports.resetPassword = async (req, res, next) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.resettoken)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) return ApiResponse.error(res, "Invalid or expired recovery token", 400);

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.authLogs.push({ event: 'PASSWORD_RESET', ipAddress: req.ip });
    
    await user.save();

    return ApiResponse.success(res, "Security key updated successfully");
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Get all users
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password -refreshToken');
    return ApiResponse.success(res, "Users fetched successfully", users);
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Update user
 */
exports.updateUser = async (req, res, next) => {
  try {
    const { name, email, role, isActive } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return ApiResponse.error(res, "User not found", 404);

    // SECURITY: Administrative Protection (FR-2.10)
    // Prevent deactivation or demotion of ANY admin account (self or others)
    if (user.role === 'ADMIN') {
      if (isActive === false) {
        return ApiResponse.error(res, "Security Protocol: Administrative accounts cannot be deactivated.", 403);
      }
      if (role && role !== 'ADMIN') {
        return ApiResponse.error(res, "Security Protocol: Administrative roles cannot be demoted.", 403);
      }
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    await logAudit(mongoose, {
      userId: req.user.id,
      action: 'USER_UPDATED',
      module: 'AUTH',
      details: { targetUserId: user._id, changes: req.body },
      ipAddress: req.ip
    });

    return ApiResponse.success(res, "User updated successfully", user);
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Kill user session (Force Logout)
 */
exports.killSession = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return ApiResponse.error(res, "User not found", 404);

    user.refreshToken = undefined;
    await user.save();

    await logAudit(mongoose, {
      userId: req.user.id,
      action: 'SESSION_KILLED',
      module: 'AUTH',
      details: { targetUserId: user._id, targetEmail: user.email },
      ipAddress: req.ip
    });

    return ApiResponse.success(res, `Session terminated for ${user.name}`);
  } catch (error) {
    next(error);
  }
};
