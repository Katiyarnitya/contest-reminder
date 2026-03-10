const API_BASE_URL = "http://localhost:5000";

export async function fetchContests() {
  try {
    const response = await fetch(`${API_BASE_URL}/contests`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Error fetching contests: ${response.statusText}`);
    }

    const data = await response.json();

    console.log("RAW API:", data);

    // ✅ Flatten contests object → single array
    const allContests = Object.entries(data.contests || {}).flatMap(
      ([platform, contests]) =>
        contests.map(contest => ({
          ...contest,
          platform, // inject platform name
        }))
    );

    console.log("FLATTENED:", allContests.length);

    return allContests;

  } catch (error) {
    console.error("Failed to fetch contests:", error);
    return [];
  }
}

export function getPlatformFromContest(contest) {
  if (contest.platform) {
    return contest.platform;
  }

  if (contest.url.includes("leetcode")) {
    return "LeetCode";
  } else if (contest.url.includes("codeforces")) {
    return "Codeforces";
  } else if (contest.url.includes("codechef")) {
    return "CodeChef";
  }

  return "Unknown";
}
