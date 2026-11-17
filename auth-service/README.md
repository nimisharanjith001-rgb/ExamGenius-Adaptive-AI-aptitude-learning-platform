# PowerPulse AI - Node.js Authentication Service

Standalone, high-security Node.js authentication microservice for PowerPulse AI.

## Features
- **Strict Real-World Email Validation:** Rejects disposable, spam, fake, and mistyped domain names.
- **Password Complexity Rules:** Enforces 8+ characters, digits, uppercase/lowercase letters, and special symbols (`!@#$%^&*`).
- **Cryptographic Security:** 12-round bcrypt password hashing, 100% compatible with existing SQLite user databases.
- **JWT Issuance (HS256):** Issues cryptographically signed tokens containing user claims, fully interoperable with the FastAPI analytics/ML backend.
- **Two-Factor 6-Digit Security OTP:** Dispatches and validates 6-digit OTP codes with 10-minute validity for new accounts.

## Running the Service
```bash
cd auth-service
npm install
node server.js
```
The service listens on port `5002` (or `PORT` environment variable).
