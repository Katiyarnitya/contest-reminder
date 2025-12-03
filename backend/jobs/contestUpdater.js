import axios from "axios";
import { Contest } from "../models/Contest.js";

// leetcode contest fetching
const fetchLeetCodeContests = async () => {
  try {
    const response = await axios.post("https://leetcode.com/graphql", {
      query: `
          query {
            allContests {
              title
              titleSlug
              startTime
              duration
            }
          }
        `,
    });
    return response.data.data.allContests.map((c) => ({
      //  Array of contest objects
      name: c.title,
      slug: c.titleSlug,
      startTime: new Date(c.startTime * 1000),
      endTime: new Date((c.startTime + c.duration) * 1000),
      url: `https://leetcode.com/contest/${c.titleSlug}`,
    }));
  } catch (error) {
    console.error("Error fetching LeetCode contests:", error.message);
    return [];
  }
};

const codeforcesTimeToDate = (seconds) => new Date(seconds * 1000); //Convert Codeforces time (seconds since epoch) to JS Date
// For codeforces
const fetchCodeforcesContests = async () => {
  try {
    const response = await axios.get("https://codeforces.com/api/contest.list");
    const contests = response.data.result;

    return contests.map((c) => ({
      name: c.name,
      slug: `cf-${c.id}`,
      startTime: codeforcesTimeToDate(c.startTimeSeconds),
      endTime: codeforcesTimeToDate(c.startTimeSeconds + c.durationSeconds),
      url: `https://codeforces.com/contests/${c.id}`,
    }));
  } catch (error) {
    console.error("Error fetching Codeforces contests:", error.message);
    return [];
  }
};

//  Fetch CodeChef Contests
const fetchCodechefContests = async () => {
  try {
    const response = await axios.get(
      "https://www.codechef.com/api/list/contests/all"
    );
    const combined = [
      ...(response.data.future_contests || []),
      ...(response.data.present_contests || []),
    ];

    return combined.map((c) => ({
      name: c.contest_name,
      slug: `cc-${c.contest_code}`,
      startTime: new Date(c.start_date),
      endTime: new Date(c.end_date),
      url: `https://www.codechef.com/${c.contest_code}`,
    }));
  } catch (error) {
    console.error("Error fetching CodeChef contests:", error.message);
    return [];
  }
};

//  Main Cron Job: Update DB

export const updateContestsJob = async () => {
  console.log("Running contest updater job...");

  const platforms = [
    { name: "LeetCode", fetchFunction: fetchLeetCodeContests },
    { name: "CodeChef", fetchFunction: fetchCodechefContests },
    { name: "Codeforces", fetchFunction: fetchCodeforcesContests },
  ];
  try {
    for (const platform of platforms) {
      console.log(`Fetching ${platform.name} contests...`);
      const contests = await platform.fetchFunction();
      console.log(`${platform.name} fetched:`, contests.length);
      for (const c of contests) {
        await Contest.updateOne(
          { slug: c.slug },
          {
            name: c.name,
            platform: platform.name,
            startTime: c.startTime,
            endTime: c.endTime,
            status: c.startTime > new Date() ? "upcoming" : "finished",
            url: c.url,
            slug: c.slug,
          },
          { upsert: true } //(If found → update, If not found → insert new)
        );
      }
    }
    await Contest.updateMany(
      // Mark the status of all the contest as "finished" which are ended
      { endTime: { $lt: new Date() } },
      { status: "finished" }
    );
    console.log("Contest updater job completed successfully.");
  } catch (err) {
    console.error("Error in contest updater job:", err.message);
  }
};
