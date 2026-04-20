const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const ApiResponse = require("../../../common/utils/apiResponse");
const sendEmail = require("../utils/emailSender");

const generateToken = (id, role, isFirstLogin = false) => {
  return jwt.sign({ id, role, isFirstLogin }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
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
              <p>Failure to complete onboarding may result in restricted access to site deployment and attendance logs.</p>
            </div>
            ${emailFooter}
          </div>
        `,
      });
    } catch (err) {
      console.error("Email registration error:", err);
    }

    return ApiResponse.success(
      res,
      "User registered. Temporary password sent to email.",
      {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      201,
    );
  } catch (error) {
    next(error);
  }
};

exports.requestEmailOTP = async (req, res, next) => {
  try {
    const { newEmail } = req.body || {};
    const user = await User.findById(req.user.id);
    if (!user) return ApiResponse.error(res, "User not found", 404);

    let targetEmail = user.email;

    // Special logic for Admin initialization:
    // If the admin is using the default placeholder and provides a new email, send OTP there.
    if (user.role === 'ADMIN' && user.email === 'admin@test.com' && newEmail) {
      targetEmail = newEmail;
      // We don't update user.email yet, we wait for verification.
      // But we need to keep track of where we sent the OTP if it's different from current.
      user.otp = generateOTP();
      user.otpExpires = Date.now() + 10 * 60 * 1000;
      await user.save();
    } else {
      const otp = generateOTP();
      user.otp = otp;
      user.otpExpires = Date.now() + 10 * 60 * 1000;
      await user.save();
    }

    try {
      await sendEmail({
        email: targetEmail,
        subject: `🔑 Verification Code: [${user.otp}] - ConstructSync`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd;">
            ${emailHeader}
            <div style="padding: 30px; text-align: center; color: #333;">
              <h2 style="margin-bottom: 10px;">Security Verification</h2>
              <p>Please use the following code to verify your identity and finalize your account setup.</p>
              ${targetEmail !== user.email ? `<p><strong>Verification for new email: ${targetEmail}</strong></p>` : ''}
              <div style="margin: 30px 0;">
                <span style="background-color: #333; color: #FF8C00; padding: 15px 30px; font-size: 32px; font-weight: bold; border-radius: 4px; letter-spacing: 5px; border: 2px solid #FF8C00;">
                  ${user.otp}
                </span>
              </div>
              <p style="font-size: 13px; color: #666;">This verification code is valid for <strong>10 minutes</strong>. If you did not request this, please contact site support.</p>
            </div>
            ${emailFooter}
          </div>
        `,
      });
      return ApiResponse.success(res, `OTP sent successfully to ${targetEmail}`);
    } catch (err) {
      console.error("Email Error:", err);
      return ApiResponse.error(res, "Failed to send OTP email.", 500);
    }
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return ApiResponse.error(res, "Invalid email or password", 401);
    }
    if (!user.isActive)
      return ApiResponse.error(res, "Account deactivated", 403);
    const token = generateToken(user._id, user.role, user.isFirstLogin);
    user.lastLogin = Date.now();
    await user.save();
    return ApiResponse.success(res, "Login successful", {
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

exports.verifyEmail = async (req, res, next) => {
  try {
    const { otp, newEmail } = req.body;
    const user = await User.findById(req.user.id);

    if (!user.otp || user.otp !== otp || user.otpExpires < Date.now()) {
      return ApiResponse.error(res, "Invalid or expired OTP", 400);
    }

    // Only Admin can change their email during verification if they want to.
    // Others must use the email provided by the admin.
    if (newEmail && user.role === 'ADMIN') {
      const emailTaken = await User.findOne({ email: newEmail });
      if (emailTaken)
        return ApiResponse.error(res, "Email already in use", 400);
      user.email = newEmail;
    } else if (newEmail && user.role !== 'ADMIN') {
      return ApiResponse.error(res, "Only administrators can change their registered email.", 403);
    }

    user.isEmailVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    
    const updatedUser = await user.save();
    console.log(`Admin email updated to: ${updatedUser.email}`);

    return ApiResponse.success(res, "Email verified successfully", {
      email: updatedUser.email,
    });
  } catch (error) {
    next(error);
  }
};

exports.completeOnboarding = async (req, res, next) => {
  try {
    const { newPassword } = req.body;

    // Password Validation
    if (!newPassword || newPassword.length < 6) {
      return ApiResponse.error(res, "Password must be at least 6 characters long", 400);
    }

    // Stronger validation (optional but recommended based on prompt "use of validations")
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return ApiResponse.error(res, "Password must be at least 8 characters, include uppercase, lowercase, number and special character.", 400);
    }

    const user = await User.findById(req.user.id);
    if (!user.isEmailVerified)
      return ApiResponse.error(res, "Please verify your email first", 400);
    
    user.password = newPassword;
    user.isFirstLogin = false;
    await user.save();

    return ApiResponse.success(res, "Onboarding complete. Password updated.");
  } catch (error) {
    next(error);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return ApiResponse.error(res, "User not found", 404);
    return ApiResponse.success(res, "Profile fetched", user);
  } catch (error) {
    next(error);
  }
};
