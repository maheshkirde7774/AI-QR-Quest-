# ⚡ AI QR Quest — Team Registration Dashboard & Backend

Official Full-Stack Team Registration Portal for **AI QR Quest** at **Swayambhu Tech Fest**, organized by the **Department of Artificial Intelligence & Data Science (AI&DS)** at **JNEC**.

---

## 📌 Event Overview

- **Event Name**: AI QR Quest
- **Organizing Department**: Artificial Intelligence & Data Science (AI&DS)
- **Fest Name**: Swayambhu Tech Fest
- **Venue**: JNEC Campus
- **Objective**: Test technical problem-solving, logical reasoning, and AI/DS core concepts through a high-energy campus QR code treasure hunt.
- **Registration**: Solo or Team (Up to 3 members)
- **Estimated Budget**: ₹8,000

---

## 🏗️ Technology Stack

- **Frontend**: HTML5, Vanilla CSS3 (Custom AI Tech Fest Design System), JavaScript (ES6+).
- **Backend Runtime**: Node.js v24 (LTS).
- **Web Framework**: Express.js (CORS & JSON body parser).
- **Database**: SQLite via Node.js native `node:sqlite` (`database/quest.db`) — zero external native drivers, fast, persistent, and self-contained.
- **Email Service**: Asynchronous HTML email generator with dispatch logging (`logs/emails.log`) and plug-and-play SMTP support.

---

## 🎯 Key Features

### 1. Event Header & Real-Time Telemetry
- Prominent branding for **AI QR Quest**, **Swayambhu Tech Fest | JNEC**, and the **AI & DS Department**.
- **🔴 Live Registration Counter**: Pulsing emerald badge in the header that automatically updates from the SQLite database.

### 2. Event Overview Card
- Real-time display of key parameters:
  - Event objective
  - Venue: JNEC Campus
  - Department: AI & DS
  - Registration Type: Solo / Team
  - Max Team Size: 3 members
  - Event Budget: ₹8,000

### 3. Dynamic Team Registration Form
- **Registration Type Selector**: Interactive segmented toggle between **Solo (1 Member)** and **Team (2–3 Members)**.
- **Dynamic Field Adaptation**:
  - In **Solo** mode: Leader is the sole participant; Member 2 and Member 3 fields are cleanly hidden.
  - In **Team** mode: Member 2 is required, and Member 3 is optional.
- **Form Fields**:
  - Registration Type (Solo / Team)
  - Team Name
  - Team Leader Name (synchronized automatically with Member 1)
  - Member 1 Name (Leader)
  - Member 2 Name (for teams)
  - Member 3 Name (optional, for teams)
  - Mobile Number (10-digit validation)
  - Email ID (format validation)
  - College & Department (with presets for JNEC engineering departments)
- **Duplicate Prevention**: Database constraints and validation checks prevent duplicate emails, mobile numbers, or team names.

### 4. Sequential Unique Team ID Generation
- Automatically generates sequential, formatted Team IDs: `QRQ-0001`, `QRQ-0002`, `QRQ-0003`, etc.
- 100% uniqueness guaranteed across registrations.

### 5. Professional Success Modal
- Semantic `<dialog>` with smooth entrance animation and blurred backdrop.
- Animated checkmark with pulsing glow.
- Large monospace display of the generated Team ID.
- **“Copy Team ID”** button with 1-click clipboard copy and confirmation feedback (*“Copied!”*).
- **📲 “Share to WhatsApp”** button: Opens WhatsApp with a pre-formatted message containing Team ID, roster, and venue details ready to send to teammates.
- Detailed registration summary slip (Team ID, Team Name, Leader, Squad roster, Contact, College).
- **“Register Another Team”** button to quickly register subsequent squads.

### 6. 🔐 Organizer Admin Portal & CSV Export (`/admin`)
- Accessible at: **`http://localhost:3000/admin`**
- **Security PIN**: Protected with an organizer passcode (default:jnec2026).
- **Live Search**: Instant real-time filtering by Team ID, Leader, Team Name, Phone, or College.
- **📥 1-Click Excel / CSV Export**: Downloads complete roster with UTF-8 formatting for Excel / Google Sheets (`/api/admin/export-csv`).
- **Delete Management**: Organizers can remove test entries directly from the dashboard.

### 7. 📧 Automated Email Confirmation
- When a team registers, an HTML receipt is automatically generated.
- Logged to `logs/emails.log` (and dispatches via SMTP if `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` are set in environment).

---

## 📡 REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Backend status confirmation (`"status": "online"`) |
| `GET` | `/api/stats` | Live count of total registered teams, solo participants, and squads |
| `GET` | `/api/teams` | Real live JSON list of all teams saved in `database/quest.db` |
| `GET` | `/api/teams/:id` | Lookup team details by Team ID (e.g. `QRQ-0001`) |
| `POST` | `/api/teams/register` | Register a new team/solo, assigns sequential `QRQ-xxxx` |
| `GET` | `/api/admin/export-csv` | Stream full team roster formatted for Excel / Google Sheets |
| `DELETE` | `/api/teams/:id` | Delete a team record (requires Admin PIN header/query) |

---

## 🚀 How to Run

### 1. Start the Server
```bash
npm start
```

Both the frontend dashboard and backend REST API will be served on port `3000`.

### 2. Quick Links
- **Team Registration Portal**: [http://localhost:3000]
- **Organizer Admin Portal**: [http://localhost:3000/admin] *(PIN: `jnec2026`)*
- **1-Click CSV Export**: [http://localhost:3000/api/admin/export-csv]
- **Live Roster JSON**: [http://localhost:3000/api/teams]
- **Live Stats JSON**: [http://localhost:3000/api/stats]
- **Server Health Check**: [http://localhost:3000/api/health]

### 3. Run Automated Tests
```bash
npm test
```

### 4. Reset / Delete All Registrations
To wipe test registrations and reset the counter back to `QRQ-0001`:
- **Via Admin Portal**: Click the red **"🗑️ Clear All"** button at [http://localhost:3000/admin](PIN: `XXXX`).
- **Via Terminal**:
  ```bash
  npm run reset-db
  ```

---

## 📁 File Structure

```
QUEST/
├── server.js                  # Express backend server & REST API
├── package.json               # Node.js dependencies & run scripts
├── admin.html                 # Organizer Admin Portal (Roster & CSV export)
├── database/
│   ├── db.js                  # Native SQLite database schema & queries
│   └── quest.db               # Persistent SQLite database file
├── index.html                 # Frontend registration dashboard
├── css/
│   ├── main.css               # Design tokens, theme, typography, layout
│   └── registration.css       # Form controls, live counter, WhatsApp button, dialog
├── js/
│   ├── registrationService.js # Connects to /api/teams/register with offline fallback
│   └── app.js                 # UI controller, solo/team toggle, live counter, WhatsApp link
├── services/
│   └── emailService.js        # HTML email confirmation generator & logger
├── logs/
│   └── emails.log             # Log of dispatched confirmation emails
├── test/
│   └── api.test.js            # Automated verification test suite
└── README.md                  # Documentation
```
