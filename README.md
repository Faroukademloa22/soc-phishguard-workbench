# 🛡️ PhishGuard — SOC Email Forensic & Phishing Triage Workbench

> A lightweight, client-side email forensic triage platform and sandboxed phishing landing page visualizer designed for SOC Tier-1 & Tier-2 security analysts.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-emerald.svg)
![Platform](https://img.shields.io/badge/platform-Firebase%20%7C%20Docker%20%7C%20Web-purple.svg)

---

## 🌟 Key Features

### 1. Ingestion Engine (3 Modes)
* **Raw Headers & Source:** Paste raw RFC 822 email headers or full email source code.
* **`.EML` File Drag & Drop:** Drop `.eml` or `.msg` files directly into the browser.
* **Screenshot OCR Reader:** Paste (`Cmd+V`) or drop screenshots of suspicious emails; uses in-browser neural optical character recognition (Tesseract.js) to extract text and links.

### 2. Forensic Analysis & Spoof Detection
* **Sender Spoofing & Domain Alignment:** Compares display names against underlying sender addresses, reply-to fields, and return paths. Flags executive impersonation and typosquatted / lookalike cousin domains.
* **Protocol Verification:** Instant evaluations of SPF, DKIM, and DMARC with clear plain-English security verdicts.
* **Origin Geolocation & Coordinates:** Pinpoints originating sender IP addresses, exact latitude/longitude coordinates, ISP, ASN, and renders an interactive OpenStreetMap view.
* **Relay Hop Mapping:** Visualizes the journey from the originating mail transfer agent (MTA) through relay gateways to the target MX destination.

### 3. Deceptive Button & Link Inspector
* **Visible Text vs. Hidden Target:** Compares visible anchor/button text with the actual underlying destination URL to catch phishing redirection traps.
* **Automatic Defanging:** Automatically converts `http://` to `hxxp://` and dots to `[.]` for safe ticket reporting.
* **Threat Heuristics:** Flags raw IP links, suspicious top-level domains (`.ru`, `.xyz`, etc.), and known URL shorteners.

### 4. Sandboxed Phishing Landing Page Visualizer
* Displays a live visual representation of what victims see when clicking deceptive links or opening attachments:
  * **Microsoft 365 Credential Harvester Clone:** Recreates the deceptive sign-in dialog and flags credential theft endpoints.
  * **DHL Payment & Malware Drop:** Highlights fee payment scams and automatic `.iso` malware download triggers.
  * **HTML Smuggling Gateway:** Analyzes embedded base64 payloads executed in browser memory.
  * **Verified Corporate Portals:** Visual confirmation of legitimate internal resources.

### 5. Urgency & Social Engineering Scorer
* Detects psychological coercion triggers (e.g., *"24 Hours Before Termination"*, *"Confidential Wire Transfer"*, *"Account Suspended"*) and calculates a threat score from 0 to 100.

### 6. One-Click SOC Incident Report
* Formats all forensic findings into a clean Markdown incident summary ready to paste straight into Jira, ServiceNow, or SIEM ticketing queues.

---

## 🚀 Quick Start (Local Run)

You can run PhishGuard with zero external dependencies using Python:

```bash
# Clone the repository
git clone https://github.com/Faroukademloa22/soc-phishguard-workbench.git
cd soc-phishguard-workbench

# Start the local server
python3 -m http.server 5050 --bind 127.0.0.1
```

Open [http://127.0.0.1:5050](http://127.0.0.1:5050) in any browser.

---

## 🐳 Docker Deployment

To run in an isolated Docker container:

```bash
docker build -t phishguard-workbench .
docker run -p 8080:80 phishguard-workbench
```

Open [http://localhost:8080](http://localhost:8080).

---

## ☁️ Firebase Hosting Deployment

Deploy directly to Google Firebase Hosting for free:

```bash
firebase login
firebase deploy --only hosting
```

---

## 👤 Author
* **Farouk Ademola** ([@Faroukademloa22](https://github.com/Faroukademloa22))
