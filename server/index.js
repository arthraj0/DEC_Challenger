const express = require("express");
const path = require("path");
const cors = require("cors");
const { generateOTP, verifyOTP, cleanupExpired } = require("./otpService");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

// Send OTP to email/phone
app.post("/api/send-otp", (req, res) => {
  const { identifier } = req.body;

  if (!identifier || !identifier.trim()) {
    return res.status(400).json({ success: false, message: "Email or phone number is required." });
  }

  const trimmed = identifier.trim();
  const otp = generateOTP(trimmed);

  // In production, send OTP via email/SMS service
  console.log(`[OTP] Generated OTP for ${trimmed}: ${otp}`);

  const isEmail = trimmed.includes("@");
  const maskedIdentifier = isEmail
    ? trimmed.replace(/^(.{2})(.*)(@.*)$/, "$1***$3")
    : trimmed.replace(/^(.{2})(.*)(.{2})$/, "$1***$3");

  return res.json({
    success: true,
    message: `OTP sent to ${maskedIdentifier}`,
    // Include OTP in development mode for easy testing
    ...(process.env.NODE_ENV !== "production" && { devOtp: otp }),
  });
});

// Verify OTP
app.post("/api/verify-otp", (req, res) => {
  const { identifier, otp } = req.body;

  if (!identifier || !otp) {
    return res.status(400).json({ success: false, message: "Identifier and OTP are required." });
  }

  const result = verifyOTP(identifier.trim(), otp.trim());

  if (result.valid) {
    return res.json({
      success: true,
      message: "OTP verified successfully! You are now logged in.",
      user: { identifier: identifier.trim(), loginTime: new Date().toISOString() },
    });
  }

  return res.status(401).json({ success: false, message: result.message });
});

// Serve the frontend
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

// Cleanup expired OTPs every 5 minutes
setInterval(cleanupExpired, 5 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
