import { axiosClient } from '../utils/axiosClient.js';
import { Contest } from '../models/Contest.js';

// -- LeetCode
const fetchLeetCodeContests = async () => {
  try {
    const query = `query { allContests { title titleSlug startTime duration } }`;
    const res = await axiosClient.post('https://leetcode.com/graphql', { query });
    const all = res?.data?.data?.allContests || [];
    const now = Date.now() / 1000;
    const twoWeeksFromNow = now + (14 * 24 * 60 * 60); // 2 weeks ahead
    // Filter: upcoming contests within next 2 weeks
    return all
      .filter((c) => c.startTime > now && c.startTime <= twoWeeksFromNow)
      .map((c) => ({
        name: c.title,
        slug: c.titleSlug,
        startTime: new Date(c.startTime * 1000),
        endTime: new Date((c.startTime + (c.duration || 0)) * 1000),
        url: `https://leetcode.com/contest/${c.titleSlug}`,
      }));
  } catch (err) {
    console.warn('LeetCode fetch failed:', err.message);
    return [];
  }
};// -- Codeforces
const codeforcesTimeToDate = (seconds) => new Date(seconds * 1000);
const fetchCodeforcesContests = async () => {
  try {
    const res = await axiosClient.get('https://codeforces.com/api/contest.list');
    const contests = res?.data?.result || [];
    const now = Date.now() / 1000;
    const twoWeeksFromNow = now + (14 * 24 * 60 * 60);
    // Filter: upcoming contests within next 2 weeks
    return contests
      .filter((c) => c.startTimeSeconds && c.startTimeSeconds > now && c.startTimeSeconds <= twoWeeksFromNow)
      .map((c) => ({
        name: c.name,
        slug: `cf-${c.id}`,
        startTime: codeforcesTimeToDate(c.startTimeSeconds),
        endTime: codeforcesTimeToDate(c.startTimeSeconds + c.durationSeconds),
        url: `https://codeforces.com/contest/${c.id}`,
      }));
  } catch (err) {
    console.warn('Codeforces fetch failed:', err.message);
    return [];
  }
};

// -- CodeChef
const fetchCodechefContests = async () => {
  try {
    const res = await axiosClient.get('https://www.codechef.com/api/list/contests/all');
    // Only use future_contests (upcoming ones)
    const combined = res.data.future_contests || [];
    const parseDate = (d) => {
      const date = new Date(d);
      return isNaN(date) ? null : date;
    };
    const now = new Date();
    const twoWeeksFromNow = new Date(now.getTime() + (14 * 24 * 60 * 60 * 1000));
    return combined
      .map((c) => {
        // Use ISO dates from API
        const start = parseDate(c.contest_start_date_iso);
        const end = parseDate(c.contest_end_date_iso);
        // Only include contests within next 2 weeks
        if (!start || !end || start <= now || start > twoWeeksFromNow) return null;
        return {
          name: c.contest_name,
          slug: `cc-${c.contest_code}`,
          startTime: start,
          endTime: end,
          url: `https://www.codechef.com/${c.contest_code}`,
        };
      })
      .filter(Boolean);
  } catch (err) {
    console.warn('CodeChef fetch failed:', err.message);
    return [];
  }
};

// Main job
export const updateContestsJob = async () => {
  console.log('Running contest updater job...');
  const platforms = [
    { name: 'LeetCode', fetchFunction: fetchLeetCodeContests },
    { name: 'CodeChef', fetchFunction: fetchCodechefContests },
    { name: 'Codeforces', fetchFunction: fetchCodeforcesContests },
  ];


  try {
    for (const platform of platforms) {
      console.log(`Fetching ${platform.name}...`);
      const contests = await platform.fetchFunction();
      console.log(`${platform.name} fetched:`, contests.length);


      // Upsert in parallel but bounded — use Promise.allSettled to avoid failing whole job
      const upsertPromises = contests.map((c) =>
        Contest.updateOne(
          { slug: c.slug },
          {
            name: c.name,
            platform: platform.name,
            startTime: c.startTime,
            endTime: c.endTime,
            // running when now between start and end
            status: c.startTime > new Date() ? 'upcoming' : c.endTime > new Date() ? 'running' : 'finished',
            url: c.url,
            slug: c.slug,
          },
          { upsert: true }
        )
      );


      await Promise.allSettled(upsertPromises);
    }


    // Mark finished contests
    await Contest.updateMany({ endTime: { $lt: new Date() } }, { status: 'finished' });


    console.log('Contest updater job completed successfully.');
  } catch (err) {
    console.error('Error in contest updater job:', err.message);
  }
};