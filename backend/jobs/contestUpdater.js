import axios from "axios";
import { Contest } from "../models/Contest";

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
      slung: c.titleSlung,
      startTime: new Date(c.startTime * 1000),
      endTime: new Date((c.startTime + c.duration) * 1000),
      url: `https://leetcode.com/contest/${c.titleSlug}`,
    }));
  } catch (error) {
    console.error("Error fetching LeetCode contests:", err.message);
    return [];
  }
};

// For codeforces
