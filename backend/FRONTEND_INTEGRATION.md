# Frontend Integration Guide

## Quick Start

### 1. Install Dependencies

If using React/Next.js:
```bash
npm install axios
# or
npm install
```

### 2. API Configuration

Create `src/services/api.js`:

```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const contestsAPI = {
  // Get all upcoming contests
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/contests?status=upcoming`);
    if (!response.ok) throw new Error('Failed to fetch contests');
    return response.json();
  },

  // Get contests by platform
  getByPlatform: async (platform) => {
    const response = await fetch(`${API_BASE_URL}/contests?platform=${platform}&status=upcoming`);
    if (!response.ok) throw new Error('Failed to fetch contests');
    return response.json();
  },

  // Get contests with custom filters
  getFiltered: async (filters = {}) => {
    const params = new URLSearchParams({
      status: 'upcoming',
      sort: 'asc',
      ...filters
    });
    const response = await fetch(`${API_BASE_URL}/contests?${params}`);
    if (!response.ok) throw new Error('Failed to fetch contests');
    return response.json();
  }
};
```

### 3. React Hook (Custom Hook)

Create `src/hooks/useContests.js`:

```javascript
import { useState, useEffect } from 'react';
import { contestsAPI } from '../services/api';

export const useContests = (filters = {}) => {
  const [contests, setContests] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchContests = async () => {
      try {
        setLoading(true);
        const data = await contestsAPI.getFiltered(filters);
        setContests(data.contests);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchContests();

    // Refresh every 5 minutes
    const interval = setInterval(fetchContests, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [JSON.stringify(filters)]);

  return { contests, loading, error };
};
```

### 4. Example Components

#### Simple List Component

```jsx
// src/components/ContestList.jsx
import { useContests } from '../hooks/useContests';

export default function ContestList() {
  const { contests, loading, error } = useContests();

  if (loading) return <div className="text-center p-8">Loading contests...</div>;
  if (error) return <div className="text-red-500 p-8">Error: {error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Upcoming Contests</h1>
      
      {Object.keys(contests).map(platform => (
        <div key={platform} className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-blue-600">{platform}</h2>
          
          <div className="space-y-4">
            {contests[platform].map(contest => (
              <div key={contest.id} className="border rounded-lg p-4 shadow hover:shadow-md transition">
                <h3 className="text-xl font-medium">{contest.name}</h3>
                <p className="text-gray-600 mt-2">
                  Starts: {new Date(contest.startTime).toLocaleString()}
                </p>
                <p className="text-gray-600">
                  Ends: {new Date(contest.endTime).toLocaleString()}
                </p>
                <a
                  href={contest.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-3 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Join Contest →
                </a>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

#### Card Grid Component (Tailwind CSS)

```jsx
// src/components/ContestGrid.jsx
import { useContests } from '../hooks/useContests';

export default function ContestGrid() {
  const { contests, loading, error } = useContests();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="animate-pulse bg-gray-200 h-48 rounded-lg"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-500 text-lg">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  // Flatten contests into single array
  const allContests = Object.entries(contests).flatMap(([platform, items]) =>
    items.map(item => ({ ...item, platform }))
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-8 text-center">Upcoming Contests</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allContests.map(contest => (
          <div 
            key={contest.id} 
            className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-500 transition shadow-sm hover:shadow-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                {contest.platform}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(contest.startTime).toLocaleDateString()}
              </span>
            </div>
            
            <h3 className="text-lg font-bold mb-3 line-clamp-2">
              {contest.name}
            </h3>
            
            <div className="text-sm text-gray-600 mb-4 space-y-1">
              <p>⏰ {new Date(contest.startTime).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}</p>
              <p>⏱️ Duration: {calculateDuration(contest.startTime, contest.endTime)}</p>
            </div>
            
            <a
              href={contest.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition"
            >
              Register Now
            </a>
          </div>
        ))}
      </div>
      
      {allContests.length === 0 && (
        <div className="text-center text-gray-500 py-12">
          No upcoming contests in the next 2 weeks.
        </div>
      )}
    </div>
  );
}

function calculateDuration(start, end) {
  const diff = new Date(end) - new Date(start);
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}
```

#### Platform Tabs Component

```jsx
// src/components/ContestTabs.jsx
import { useState } from 'react';
import { useContests } from '../hooks/useContests';

export default function ContestTabs() {
  const { contests, loading, error } = useContests();
  const [activeTab, setActiveTab] = useState('all');

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  const platforms = Object.keys(contests);
  const displayContests = activeTab === 'all' 
    ? Object.entries(contests).flatMap(([platform, items]) => 
        items.map(item => ({ ...item, platform }))
      )
    : contests[activeTab] || [];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Contest Reminders</h1>
      
      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'all'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          All
        </button>
        {platforms.map(platform => (
          <button
            key={platform}
            onClick={() => setActiveTab(platform)}
            className={`px-4 py-2 font-medium ${
              activeTab === platform
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {platform}
          </button>
        ))}
      </div>
      
      {/* Contest List */}
      <div className="space-y-4">
        {displayContests.map(contest => (
          <div key={contest.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
            <div className="flex-1">
              <h3 className="font-semibold">{contest.name}</h3>
              <p className="text-sm text-gray-600">
                {new Date(contest.startTime).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                {activeTab === 'all' ? contest.platform : contest.status}
              </span>
              <a
                href={contest.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Join
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 5. Next.js Integration

#### API Route (Optional Server-Side)

Create `pages/api/contests.js`:

```javascript
export default async function handler(req, res) {
  try {
    const response = await fetch('http://localhost:5000/contests?status=upcoming');
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contests' });
  }
}
```

#### Server-Side Props

```javascript
// pages/contests.js
export async function getServerSideProps() {
  const response = await fetch('http://localhost:5000/contests?status=upcoming');
  const data = await response.json();

  return {
    props: { contests: data.contests }
  };
}

export default function ContestsPage({ contests }) {
  return (
    <div>
      {Object.keys(contests).map(platform => (
        <div key={platform}>
          <h2>{platform}</h2>
          {contests[platform].map(contest => (
            <div key={contest.id}>{contest.name}</div>
          ))}
        </div>
      ))}
    </div>
  );
}
```

### 6. Environment Setup

Create `.env.local`:

```env
REACT_APP_API_URL=http://localhost:5000
# For production:
# REACT_APP_API_URL=https://your-backend.com
```

### 7. TypeScript Types (Optional)

```typescript
// src/types/contest.ts
export interface Contest {
  id: string;
  name: string;
  slug: string;
  url: string;
  startTime: string;
  endTime: string;
  status: 'upcoming' | 'running' | 'finished';
  platform?: string;
}

export interface ContestsResponse {
  count: number;
  platforms: string[];
  contests: {
    [platform: string]: Contest[];
  };
}
```

## Tips

1. **Auto-refresh**: Use `setInterval` to fetch contests every 5-10 minutes
2. **Error Handling**: Always show user-friendly error messages
3. **Loading States**: Show skeletons or spinners while loading
4. **Caching**: Use React Query or SWR for better data management
5. **CORS**: Backend already has CORS enabled, but verify in production
6. **Time Zones**: Contests are in UTC, convert to local time for display
7. **Notifications**: Use browser Notification API to remind users

## Production Checklist

- [ ] Update `API_BASE_URL` to production backend URL
- [ ] Enable HTTPS for API calls
- [ ] Add error tracking (Sentry, LogRocket)
- [ ] Implement retry logic for failed requests
- [ ] Add analytics (Google Analytics, Mixpanel)
- [ ] Test on mobile devices
- [ ] Optimize images and assets
- [ ] Add meta tags for SEO

---

Happy coding! 🚀
