# Security Policy / 보안 정책

URLComments takes the security of our software and the privacy of our users seriously. We appreciate the efforts of security researchers and community members who help keep our extension and backend services secure.

URLComments는 사용자의 프라이버시와 소프트웨어의 보안을 최우선으로 여깁니다. 취약점을 책임감 있게 제보해 주시는 연구원 및 커뮤니티 기여자분들께 감사드립니다.

---

## Supported Versions / 지원되는 버전

Security updates and patches are actively maintained for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0.0 | :x:                |

---

## Reporting a Vulnerability / 취약점 제보 방법

> [!IMPORTANT]
> **Please DO NOT report security vulnerabilities via public GitHub issues, discussions, or pull requests.**  
> **공개된 GitHub Issue, Discussions, PR에는 절대로 보안 취약점을 게시하지 말아주세요.**

If you discover a security vulnerability in URLComments, please report it privately through one of the following methods:

### Method 1: GitHub Private Vulnerability Reporting (Recommended / 권장)
1. Navigate to the repository's **Security** tab: [Security Advisories](https://github.com/s4ngwoo/URLComments/security/advisories).
2. Click **"Report a vulnerability"** to submit your report confidentially.
3. This creates a secure, private advisory where maintainers can collaborate with you directly to investigate and patch the issue before any public disclosure.

### Method 2: Contact Maintainer
If Private Vulnerability Reporting is unavailable, you can reach out directly via GitHub by opening a confidential discussion or contacting the repository owner.

---

## What to Include in Your Report / 제보 시 포함 사항

To help us investigate and reproduce the issue quickly, please include as much of the following information as possible:

1. **Vulnerability Type**: (e.g., SQL Injection, XSS, Broken Authentication, RLS Bypass, Sensitive Data Exposure)
2. **Impact**: A description of the potential impact of the issue and what an attacker could achieve.
3. **Step-by-Step Reproduction**: Detailed steps, proof-of-concept (PoC) code, or HTTP request payloads.
4. **Environment**: Browser version, OS, extension version, or relevant configuration details.
5. **Suggested Fix**: Any recommended patches or mitigations (optional).

---

## Our Response Process / 취약점 처리 및 대응 절차

When a vulnerability report is received, the project team will:

1. **Acknowledge**: Confirm receipt of the report within **48 hours**.
2. **Investigate**: Validate and assess the severity and impact of the reported vulnerability.
3. **Patch**: Develop, test, and package a fix in a private branch.
4. **Release & Notify**: Publish a new extension release and publicly credit the reporter (unless anonymity is requested).

---

## Scope / 보안 검토 범위

### In Scope
- Chrome Extension client codebase (`popup/`, `content/`, `background.js`, `lib/`).
- Manifest V3 security compliance and permissions.
- Supabase Row Level Security (RLS) policies, triggers, and RPC functions (`supabase_schema.sql`, `supabase/migrations/`).
- Google OAuth token handling and session storage mechanisms.

### Out of Scope
- Denial of Service (DoS/DDoS) attacks against upstream third-party infrastructures (e.g., Supabase, Google Cloud).
- Issues requiring physical access to an unlocked, compromised user machine.
- Social engineering attacks.
