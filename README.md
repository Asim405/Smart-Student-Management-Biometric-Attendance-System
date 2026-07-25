# Smart Student Management & Biometric Attendance System

A dual-panel system for a school/university: teachers manage courses, marks,
and live biometric attendance; students track their academic record,
enroll in courses, and monitor attendance health — all synced in real time
via an ESP32 + AS608 fingerprint station.

```
project/
├── backend/    Node.js + Express + PostgreSQL + Socket.io REST API
└── mobile/     React Native (Expo) app — Admin & Student panels
```

## 1. System Workflow

1. **Login** — `POST /api/auth/login` returns a JWT with `{ id, role, email }`.
   The mobile app decodes the stored user's `role` and renders either the
   `AdminNavigator` or `StudentNavigator` (see `mobile/navigation/RootNavigator.js`).
2. **Teacher** enters/updates marks per student per course
   (`POST /api/teacher/marks`); the backend recomputes `total_percentage`
   server-side and classifies students into tiers (Top ≥80%, Mid 50–79%,
   Lower <50%).
3. **ESP32 + AS608** — a finger is scanned, matched locally on the sensor
   against a stored `fingerprint_id`, and the ESP32 sends one HTTP POST to
   `/api/attendance/mark-biometric` with `{ fingerprint_id, device_key }`.
   The server:
   - Authenticates the device (`X-Device-Key` header + its own `device_key` row)
   - Looks up which student and course the scan belongs to
   - Writes an `attendance_logs` row
   - Emits a `attendance:new` Socket.io event to every connected client
4. **Real-time UI update** — the teacher's Biometric Hub screen and the
   scanned student's own Performance screen both listen for `attendance:new`
   and refresh instantly, no polling required.

## 2. Backend Setup (`/backend`)

### Prerequisites
- Node.js installed
- PostgreSQL installed and running
- `createdb` / `psql` available on your PATH

### 2.1 Install backend dependencies
```bash
cd backend
npm install
```

### 2.2 Create `.env`
Copy the example env file and edit the values:

```bash
cd backend
copy .env.example .env
```

Open `backend/.env` and set the database credentials if they differ from the defaults:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=student_system
DB_USER=postgres
DB_PASSWORD=postgres

JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRES_IN=7d
HARDWARE_SHARED_SECRET=change_this_too
```

> `backend/config/db.js` reads these values and creates the PostgreSQL connection pool.

### 2.3 Create the PostgreSQL database and load schema
Run one of these command sets depending on your environment:

Option A: using `createdb`:
```bash
cd backend
createdb student_system
psql -U postgres -d student_system -f schema.sql
```

Option B: using `psql` directly:
```bash
cd backend
psql -U postgres -c "CREATE DATABASE student_system;"
psql -U postgres -d student_system -f schema.sql
```

If your PostgreSQL user or password are different, update `backend/.env` and use:
```bash
psql -h <host> -p <port> -U <user> -d student_system -f schema.sql
```

### 2.4 Start the backend server
```bash
cd backend
npm run dev
```

The backend should now be running at `http://localhost:5000`.

### 2.5 Default seeded users
The schema seeds default users with the password `Passw0rd!`.
| Email | Role |
|---|---|
| teacher@school.edu | admin |
| bilal@school.edu | student |
| hina@school.edu | student |

> If you want to reset the seeded password hash, run:
> `node -e "console.log(require('bcryptjs').hashSync('Passw0rd!', 10))"`
> and replace the hash in `schema.sql` before seeding.

### Environment variables (`.env`)
The backend expects these values in `backend/.env`:
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `JWT_SECRET`, `JWT_EXPIRES_IN`
- `HARDWARE_SHARED_SECRET`

### API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | none | Create an admin or student account |
| POST | `/api/auth/login` | none | Returns `{ token, user }` |
| GET | `/api/teacher/dashboard` | admin | Enrolled counts, class average, tier distribution, device list |
| GET | `/api/teacher/roster?course_id=` | admin | Students + marks for one course |
| POST | `/api/teacher/marks` | admin | Upsert `{ student_id, course_id, quiz, assignment, mid, final }` |
| GET | `/api/student/profile` | student | Name, CGPA, current-term SGPA, credits |
| GET | `/api/student/courses` | student | All courses with seat counts + `is_enrolled` |
| POST | `/api/student/enroll` | student | `{ course_id }` |
| GET | `/api/student/attendance/:course_id` | student | Attendance % + `below_threshold` flag |
| POST | `/api/attendance/mark-biometric` | device key | `{ fingerprint_id, device_key }` — called by the ESP32 |
| GET | `/api/attendance/devices` | any logged-in user | Device online/offline status |

### Socket.io events
- `attendance:new` — broadcast on every successful scan:
  `{ student: {id, name, student_code}, course_id, device_id, room_label, scanned_at }`

## 3. Mobile Setup (`/mobile`)

```bash
cd mobile
npm install
```

Edit `services/api.js` and set `API_BASE_URL` to your backend's LAN IP
(e.g. `http://192.168.1.20:5000/api`) — `localhost` only resolves inside
an iOS simulator, not on a physical device.

```bash
npx expo start
```

Scan the QR code with Expo Go, or press `a` / `i` for an emulator/simulator.

### Screens
**Admin/Teacher:** Dashboard, Biometric Hub (live station status + scan
feed), Course & Roster (mark entry), Performance Tier Analytics.
**Student:** Academic Overview (CGPA/SGPA/credits), Enrollment Portal,
Attendance & Performance Tracker (bar chart + subject health bars, 75%
warning).

### Styling — NativeWind v4
All screens and components use Tailwind utility classes via `className`
(NativeWind v4), configured in `babel.config.js`, `tailwind.config.js`,
and `metro.config.js`, with `global.css` imported once in `App.js`.
Brand colors (`brand`, `brandSky`, `brandAmber`, and the tier
background/foreground pairs) are defined in `tailwind.config.js` so tier
badges and stat cards share one palette. `react-native-chart-kit`'s
`BarChart` still takes its colors via `chartConfig` since it renders its
own SVG internally — Tailwind classes don't reach into that.

## 4. ESP32 + AS608 Hardware (reference sketch)

The firmware itself isn't part of this repo (it's not JS), but here's the
integration contract the backend expects. On a successful local match:

```cpp
// Pseudocode outline — fill in your WiFi credentials, AS608 library
// (e.g. Adafruit_Fingerprint), and error handling.
HTTPClient http;
http.begin("http://<server-ip>:5000/api/attendance/mark-biometric");
http.addHeader("Content-Type", "application/json");
http.addHeader("X-Device-Key", HARDWARE_SHARED_SECRET);

String body = "{\"fingerprint_id\":" + String(matchedId) +
              ",\"device_key\":\"ESP32-DEVKEY-ROOM-A1\"}";
int code = http.POST(body);
http.end();
```

Each classroom station has its own row in `biometric_devices` (`device_key`,
`room_label`, `course_id`). Assign a device to a course by updating that
row's `course_id` before a class session starts.

## 5. Suggested next steps
- Add refresh-token rotation instead of a single long-lived JWT.
- Add a scheduled-sessions table so attendance % is computed against
  actual class meetings rather than "any day someone scanned."
- Add push notifications (Expo Notifications) for the "Flag" action on
  the Lower Tier list.
