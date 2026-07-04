# Security Policy

## Supported Versions

Code Dungeon currently supports the following versions with security updates.

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability within Code Dungeon, please send an e-mail to the project organizers rather than creating a public issue. 

All security vulnerabilities will be promptly addressed.

## Security Practices Used
* **DDoS Protection**: Implemented via custom, proxy-safe rate limiters that won't block the entire college network while protecting against brute-force attacks on specific accounts.
* **HTTP Headers**: Enforced securely using Helmet.
* **CORS Policies**: Restricted appropriately via origin checking.
* **Sensitive Files**: Safely managed with an exposed `.env.example` file while securely ignoring `.env` files containing live keys.
