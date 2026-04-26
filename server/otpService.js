// In-memory OTP store: { identifier: { otp, expiresAt, attempts } }
const otpStore = new Map();

const OTP_LENGTH = 6;
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 3;

function generateOTP(identifier) {
  const otp = Array.from({ length: OTP_LENGTH }, () =>
    Math.floor(Math.random() * 10)
  ).join("");

  otpStore.set(identifier, {
    otp,
    expiresAt: Date.now() + OTP_EXPIRY_MS,
    attempts: 0,
  });

  return otp;
}

function verifyOTP(identifier, inputOtp) {
  const record = otpStore.get(identifier);

  if (!record) {
    return { valid: false, message: "No OTP was requested for this identifier. Please request a new OTP." };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(identifier);
    return { valid: false, message: "OTP has expired. Please request a new one." };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(identifier);
    return { valid: false, message: "Too many failed attempts. Please request a new OTP." };
  }

  if (record.otp !== inputOtp) {
    record.attempts += 1;
    const remaining = MAX_ATTEMPTS - record.attempts;
    return {
      valid: false,
      message: remaining > 0
        ? `Invalid OTP. ${remaining} attempt(s) remaining.`
        : "Too many failed attempts. Please request a new OTP.",
    };
  }

  // OTP is valid — remove it so it can't be reused
  otpStore.delete(identifier);
  return { valid: true };
}

function cleanupExpired() {
  const now = Date.now();
  for (const [identifier, record] of otpStore) {
    if (now > record.expiresAt) {
      otpStore.delete(identifier);
    }
  }
}

module.exports = { generateOTP, verifyOTP, cleanupExpired };
