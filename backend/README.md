# Contest Reminder Backend

A Node.js/Express backend that fetches upcoming coding contests from **LeetCode**, **Codeforces**, and **CodeChef** and provides a REST API for frontend integration.

## Features

- 🔄 **Automated Contest Fetching**: Fetches contests every 30 minutes via cron jobs
- 📅 **Smart Filtering**: Shows only contests starting within the next 2 weeks
- 🗂️ **Organized Data**: Returns contests grouped by platform
- 🔔 **Reminder System**: (Ready for implementation) Send reminders before contests start
- 🚀 **RESTful API**: Simple JSON API for frontend consumption

## Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express 5
- **Database**: MongoDB (via Mongoose)
- **Scheduling**: node-cron
- **HTTP Client**: Axios

## Setup

### Prerequisites

- Node.js 16+ installed
- MongoDB running (local or MongoDB Atlas)
- npm or yarn

### Installation

```bash
cd backend
npm install
```

### Environment Variables

Create a `.env` file in the `backend/` directory:

```env
MONGO_URL=mongodb://localhost:27017/contest-reminder
# or use MongoDB Atlas:
# MONGO_URL=mongodb+srv://user:password@cluster.mongodb.net/contest-reminder

PORT=5000
```

### Run

**Development (with auto-reload):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

Server starts on `http://localhost:5000`

## API Documentation

### Base URL
```
http://localhost:5000
```

---

### `GET /contests`

Fetch upcoming contests grouped by platform (LeetCode, Codeforces, CodeChef).

#### Query Parameters

| Parameter | Type   | Description                                    | Default |
|-----------|--------|------------------------------------------------|---------|
| `platform`| string | Filter by platform: `LeetCode`, `Codeforces`, `CodeChef` | - |
| `status`  | string | Filter by status: `upcoming`, `running`, `finished` | - |
| `sort`    | string | Sort by startTime: `asc` or `desc`             | `asc`   |
| `limit`   | number | Limit number of results                        | -       |

#### Example Requests

**Get all upcoming contests:**
```bash
GET /contests
```

**Filter by platform:**
```bash
GET /contests?platform=LeetCode
```

**Get only upcoming contests, sorted descending:**
```bash
GET /contests?status=upcoming&sort=desc
```

**Limit to 10 results:**
```bash
GET /contests?limit=10
```

#### Response Format

```json
{
  "count": 11,
  "platforms": ["Codeforces", "CodeChef", "LeetCode"],
  "contests": {
    "LeetCode": [
      {
        "id": "6930431666e0016c71d91f94",
        "name": "Biweekly Contest 171",
        "slug": "biweekly-contest-171",
        "url": "https://leetcode.com/contest/biweekly-contest-171",
        "startTime": "2025-12-06T14:30:00.000Z",
        "endTime": "2025-12-06T16:00:00.000Z",
        "status": "upcoming"
      }
    ],
    "Codeforces": [...],
    "CodeChef": [...]
  }
}
```

#### Response Fields

| Field       | Type   | Description                                        |
|-------------|--------|----------------------------------------------------|
| `count`     | number | Total number of contests returned                  |
| `platforms` | array  | List of platforms with contests                    |
| `contests`  | object | Contests grouped by platform name                  |
| `id`        | string | MongoDB document ID                                |
| `name`      | string | Contest name                                       |
| `slug`      | string | Unique identifier (used in updates)                |
| `url`       | string | Direct link to contest page                        |
| `startTime` | string | ISO 8601 timestamp of contest start               |
| `endTime`   | string | ISO 8601 timestamp of contest end                 |
| `status`    | string | `upcoming`, `running`, or `finished`               |

---

## Architecture

### Data Flow

```
External APIs → Cron Jobs → MongoDB → Express API → Frontend
```

1. **Cron Jobs** run every 30 minutes
2. Fetch contests from LeetCode, Codeforces, CodeChef APIs
3. Filter contests (next 2 weeks only)
4. Upsert into MongoDB (by `slug` to avoid duplicates)
5. Frontend calls `/contests` to display data

### Project Structure

```
backend/
├── config/
│   └── db.js              # MongoDB connection
├── jobs/
│   ├── contestUpdater.js  # Fetch & update contests from external APIs
│   └── reminderSender.js  # Send reminders (placeholder)
├── models/
│   ├── Contest.js         # Contest schema
│   ├── Reminder.js        # Reminder schema
│   └── User.js            # User schema
├── utils/
│   └── axiosClient.js     # Axios instance with timeout & headers
├── server.js              # Express app & cron setup
├── package.json
├── .env
└── README.md
```

### Database Models

#### Contest
```javascript
{
  name: String,
  platform: String,        // "LeetCode", "Codeforces", "CodeChef"
  slug: String (unique),   // e.g., "weekly-contest-479", "cf-2173"
  startTime: Date,
  endTime: Date,
  status: String,          // "upcoming", "running", "finished"
  url: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### User
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  createdAt: Date,
  updatedAt: Date
}
```

#### Reminder
```javascript
{
  user: ObjectId (ref: User),
  contest: ObjectId (ref: Contest),
  reminderTime: Date,
  sent: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Frontend Integration

### JavaScript/React Example

```javascript
// Fetch all upcoming contests
const fetchContests = async () => {
  const response = await fetch('http://localhost:5000/contests?status=upcoming');
  const data = await response.json();
  
  console.log(`Total: ${data.count}`);
  console.log(`Platforms: ${data.platforms.join(', ')}`);
  
  // Access contests by platform
  const leetcodeContests = data.contests.LeetCode || [];
  const codeforcesContests = data.contests.Codeforces || [];
  const codechefContests = data.contests.CodeChef || [];
  
  return data.contests;
};

// Display contests
fetchContests().then(contests => {
  Object.keys(contests).forEach(platform => {
    console.log(`\n${platform}:`);
    contests[platform].forEach(contest => {
      console.log(`  - ${contest.name}`);
      console.log(`    Starts: ${new Date(contest.startTime).toLocaleString()}`);
      console.log(`    URL: ${contest.url}`);
    });
  });
});
```

### React Component Example

```jsx
import { useState, useEffect } from 'react';

function ContestList() {
  const [contests, setContests] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/contests?status=upcoming')
      .then(res => res.json())
      .then(data => {
        setContests(data.contests);
        setLoading(false);
      })
      .catch(err => console.error(err));
  }, []);

  if (loading) return <div>Loading contests...</div>;

  return (
    <div>
      <h1>Upcoming Contests</h1>
      {Object.keys(contests).map(platform => (
        <div key={platform}>
          <h2>{platform}</h2>
          <ul>
            {contests[platform].map(contest => (
              <li key={contest.id}>
                <strong>{contest.name}</strong>
                <br />
                Starts: {new Date(contest.startTime).toLocaleString()}
                <br />
                <a href={contest.url} target="_blank" rel="noopener noreferrer">
                  Join Contest →
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default ContestList;
```

### Axios Example

```javascript
import axios from 'axios';

const API_BASE = 'http://localhost:5000';

export const getContests = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await axios.get(`${API_BASE}/contests?${params}`);
  return response.data;
};

// Usage
getContests({ platform: 'LeetCode', sort: 'asc' })
  .then(data => console.log(data))
  .catch(err => console.error(err));
```

---

## Cron Jobs

### Contest Updater
- **Schedule**: Every 30 minutes (`0,30 * * * *`)
- **Function**: Fetches contests from LeetCode, Codeforces, CodeChef
- **Filter**: Only contests starting within next 2 weeks
- **Action**: Upserts into MongoDB (by `slug`)

### Reminder Sender
- **Schedule**: Every minute (`* * * * *`)
- **Function**: Checks for due reminders and sends notifications
- **Status**: Placeholder implementation (needs email/push service)

---

## Customization

### Change Contest Window (from 2 weeks to X days)

Edit `backend/jobs/contestUpdater.js`:

```javascript
// Change 14 to your desired number of days
const daysAhead = 7; // 1 week
const futureLimit = now + (daysAhead * 24 * 60 * 60);
```

### Disable a Platform

Remove platform from `platforms` array in `contestUpdater.js`:

```javascript
const platforms = [
  { name: 'LeetCode', fetchFunction: fetchLeetCodeContests },
  // { name: 'CodeChef', fetchFunction: fetchCodechefContests }, // disabled
  { name: 'Codeforces', fetchFunction: fetchCodeforcesContests },
];
```

---

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `mongod` or check Atlas connection string
- Verify `MONGO_URL` in `.env`

### No Contests Returned
- Check server logs for API fetch errors
- Verify internet connection
- External APIs might be down temporarily

### CORS Issues (Frontend)
Already configured with `cors()` middleware. If issues persist:
```javascript
app.use(cors({
  origin: 'http://localhost:3000', // your frontend URL
}));
```

---

## Production Deployment

### Environment Variables
Set in your hosting platform (Heroku, Vercel, Railway, etc.):
- `MONGO_URL`
- `PORT` (usually auto-assigned)

### Recommended Hosting
- **Backend**: Railway, Render, Heroku, DigitalOcean
- **Database**: MongoDB Atlas (free tier available)

### Health Check Endpoint (optional)
Add to `server.js`:
```javascript
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});
```

---

## Future Enhancements

- [ ] User authentication (JWT)
- [ ] Create/manage reminders via API
- [ ] Email notifications (Nodemailer + SendGrid/AWS SES)
- [ ] Push notifications (Firebase Cloud Messaging)
- [ ] Telegram bot integration
- [ ] Rate limiting
- [ ] Pagination for large result sets
- [ ] WebSocket for real-time updates

---

## License

MIT

## Author

Built with ❤️ for competitive programmers
