# DEC_Challenger — Login with OTP Verification

A login page with OTP (One-Time Password) verification built with Node.js, Express, and vanilla HTML/CSS/JS.

## Features

- Email or phone number login
- 6-digit OTP generation with 5-minute expiry
- Individual OTP input boxes with auto-advance and paste support
- Max 3 verification attempts per OTP
- Resend OTP with 30-second cooldown timer
- Dev mode displays OTP on-screen for easy testing
- Responsive dark-theme UI

## Getting Started

### Prerequisites

- Node.js >= 16

### Install & Run

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── server/
│   ├── index.js         # Express server & API routes
│   └── otpService.js    # OTP generation, verification, cleanup
├── public/
│   ├── index.html       # Login page markup
│   ├── styles.css       # Dark-theme styles
│   └── script.js        # Frontend logic & OTP input handling
├── package.json
└── README.md
```

## API Endpoints

| Method | Endpoint           | Body                          | Description          |
| ------ | ------------------ | ----------------------------- | -------------------- |
| POST   | `/api/send-otp`    | `{ "identifier": "..." }`    | Generate & send OTP  |
| POST   | `/api/verify-otp`  | `{ "identifier": "...", "otp": "..." }` | Verify OTP |
