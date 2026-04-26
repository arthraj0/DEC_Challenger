const API_BASE = window.location.origin;

// DOM Elements
const stepLogin = document.getElementById("step-login");
const stepOtp = document.getElementById("step-otp");
const stepSuccess = document.getElementById("step-success");

const loginForm = document.getElementById("login-form");
const otpForm = document.getElementById("otp-form");
const identifierInput = document.getElementById("identifier");

const sendOtpBtn = document.getElementById("send-otp-btn");
const verifyOtpBtn = document.getElementById("verify-otp-btn");
const resendBtn = document.getElementById("resend-btn");
const backBtn = document.getElementById("back-btn");
const logoutBtn = document.getElementById("logout-btn");

const loginError = document.getElementById("login-error");
const otpError = document.getElementById("otp-error");
const otpSubtitle = document.getElementById("otp-subtitle");
const resendTimer = document.getElementById("resend-timer");
const successMessage = document.getElementById("success-message");
const userInfo = document.getElementById("user-info");

const devOtpDisplay = document.getElementById("dev-otp-display");
const devOtpCode = document.getElementById("dev-otp-code");

const otpBoxes = document.querySelectorAll(".otp-box");

let currentIdentifier = "";
let resendCountdown = null;

// ===== UTILITY FUNCTIONS =====

function showStep(step) {
  stepLogin.classList.add("hidden");
  stepOtp.classList.add("hidden");
  stepSuccess.classList.add("hidden");
  step.classList.remove("hidden");
}

function showError(element, message) {
  element.textContent = message;
  element.classList.remove("hidden");
}

function hideError(element) {
  element.classList.add("hidden");
}

function setLoading(btn, loading) {
  const text = btn.querySelector(".btn-text");
  const loader = btn.querySelector(".btn-loader");
  if (loading) {
    text.classList.add("hidden");
    loader.classList.remove("hidden");
    btn.disabled = true;
  } else {
    text.classList.remove("hidden");
    loader.classList.add("hidden");
    btn.disabled = false;
  }
}

function clearOtpInputs() {
  otpBoxes.forEach((box) => {
    box.value = "";
    box.classList.remove("filled");
  });
  otpBoxes[0].focus();
}

function getOtpValue() {
  return Array.from(otpBoxes)
    .map((box) => box.value)
    .join("");
}

function startResendTimer() {
  let seconds = 30;
  resendBtn.disabled = true;
  resendTimer.textContent = seconds;

  clearInterval(resendCountdown);
  resendCountdown = setInterval(() => {
    seconds -= 1;
    resendTimer.textContent = seconds;
    if (seconds <= 0) {
      clearInterval(resendCountdown);
      resendBtn.disabled = false;
      resendBtn.innerHTML = "Resend OTP";
    }
  }, 1000);
}

// ===== OTP INPUT HANDLING =====

otpBoxes.forEach((box, index) => {
  box.addEventListener("input", (e) => {
    const value = e.target.value;

    // Allow only digits
    if (!/^\d$/.test(value)) {
      e.target.value = "";
      e.target.classList.remove("filled");
      return;
    }

    e.target.classList.add("filled");

    // Move to next input
    if (index < otpBoxes.length - 1) {
      otpBoxes[index + 1].focus();
    }

    // Auto-submit when all filled
    if (getOtpValue().length === 6) {
      otpForm.dispatchEvent(new Event("submit"));
    }
  });

  box.addEventListener("keydown", (e) => {
    if (e.key === "Backspace" && !box.value && index > 0) {
      otpBoxes[index - 1].focus();
      otpBoxes[index - 1].value = "";
      otpBoxes[index - 1].classList.remove("filled");
    }
  });

  // Handle paste
  box.addEventListener("paste", (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    pastedData.split("").forEach((digit, i) => {
      if (otpBoxes[i]) {
        otpBoxes[i].value = digit;
        otpBoxes[i].classList.add("filled");
      }
    });
    const nextIndex = Math.min(pastedData.length, otpBoxes.length - 1);
    otpBoxes[nextIndex].focus();

    if (pastedData.length === 6) {
      otpForm.dispatchEvent(new Event("submit"));
    }
  });
});

// ===== SEND OTP =====

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideError(loginError);

  const identifier = identifierInput.value.trim();
  if (!identifier) return;

  currentIdentifier = identifier;
  setLoading(sendOtpBtn, true);

  try {
    const res = await fetch(`${API_BASE}/api/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier }),
    });

    const data = await res.json();

    if (!res.ok) {
      showError(loginError, data.message);
      return;
    }

    // Show dev OTP if provided
    if (data.devOtp) {
      devOtpCode.textContent = data.devOtp;
      devOtpDisplay.classList.remove("hidden");
    } else {
      devOtpDisplay.classList.add("hidden");
    }

    otpSubtitle.textContent = data.message;
    showStep(stepOtp);
    clearOtpInputs();
    startResendTimer();
  } catch (err) {
    showError(loginError, "Network error. Please try again.");
  } finally {
    setLoading(sendOtpBtn, false);
  }
});

// ===== VERIFY OTP =====

otpForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideError(otpError);

  const otp = getOtpValue();
  if (otp.length !== 6) {
    showError(otpError, "Please enter all 6 digits.");
    return;
  }

  setLoading(verifyOtpBtn, true);

  try {
    const res = await fetch(`${API_BASE}/api/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: currentIdentifier, otp }),
    });

    const data = await res.json();

    if (!res.ok) {
      showError(otpError, data.message);
      clearOtpInputs();
      return;
    }

    // Success
    devOtpDisplay.classList.add("hidden");
    successMessage.textContent = data.message;
    userInfo.innerHTML = `Logged in as <strong>${data.user.identifier}</strong><br/>
      <small>at ${new Date(data.user.loginTime).toLocaleString()}</small>`;
    showStep(stepSuccess);
  } catch (err) {
    showError(otpError, "Network error. Please try again.");
  } finally {
    setLoading(verifyOtpBtn, false);
  }
});

// ===== RESEND OTP =====

resendBtn.addEventListener("click", async () => {
  hideError(otpError);
  resendBtn.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/api/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: currentIdentifier }),
    });

    const data = await res.json();

    if (data.devOtp) {
      devOtpCode.textContent = data.devOtp;
      devOtpDisplay.classList.remove("hidden");
    }

    clearOtpInputs();
    startResendTimer();
  } catch (err) {
    showError(otpError, "Failed to resend OTP. Please try again.");
    resendBtn.disabled = false;
  }
});

// ===== BACK BUTTON =====

backBtn.addEventListener("click", () => {
  clearInterval(resendCountdown);
  devOtpDisplay.classList.add("hidden");
  hideError(otpError);
  showStep(stepLogin);
  identifierInput.focus();
});

// ===== LOGOUT =====

logoutBtn.addEventListener("click", () => {
  currentIdentifier = "";
  identifierInput.value = "";
  hideError(loginError);
  hideError(otpError);
  devOtpDisplay.classList.add("hidden");
  showStep(stepLogin);
  identifierInput.focus();
});
