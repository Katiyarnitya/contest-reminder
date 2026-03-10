import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bell, Settings, Trophy, RefreshCw, Search, X } from "lucide-react";

import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";

import { cn } from "../lib/utils";
import { fetchContests, getPlatformFromContest } from "../lib/api";

function formatTimeRemaining(date) {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  if (diff < 0) return "Started";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours < 1) return `${minutes}m`;
  if (hours < 24) return `${hours}h ${minutes}m`;

  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

export default function ContestDashboard() {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("All");
  const [sortBy, setSortBy] = useState("time"); // <-- declare sortBy

  // Filter and sort contests
  const filteredContests = contests
    .filter((contest) => {
      const platformMatch =
        selectedPlatform === "All" || contest.platform === selectedPlatform;

      const searchMatch =
        searchQuery === "" ||
        contest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contest.platform.toLowerCase().includes(searchQuery.toLowerCase());

      return platformMatch && searchMatch;
    })
    .sort((a, b) => {
      if (sortBy === "time") {
        return (
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        );
      } else if (sortBy === "duration") {
        const durationA =
          new Date(a.endTime).getTime() - new Date(a.startTime).getTime();
        const durationB =
          new Date(b.endTime).getTime() - new Date(b.startTime).getTime();
        return durationB - durationA;
      } else {
        return a.platform.localeCompare(b.platform);
      }
    });
  // Active Reminders Count
  const activeReminders = contests.filter((c) => c.reminded).length;

  const loadContests = async () => {
    try {
      setRefreshing(true);
      const data = await fetchContests();

      const transformed = data.map((contest, index) => ({
        ...contest,
        id: contest.slug || `contest-${index}`,
        reminded: false, // Default inactive
        platform: getPlatformFromContest(contest),
      }));

      setContests(transformed);
    } catch (error) {
      console.error("Failed to load contests:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Toggle Reminder
  const toggleReminder = (id) => {
    setContests(
      contests.map((c) => (c.id === id ? { ...c, reminded: !c.reminded } : c)),
    );
  };

  useEffect(() => {
    const savedDarkMode = localStorage.getItem("darkMode");
    const savedAutoRefresh = localStorage.getItem("autoRefresh");
    const savedPlatform = localStorage.getItem("selectedPlatform");

    if (savedDarkMode !== null) setDarkMode(savedDarkMode === "true");
    if (savedAutoRefresh !== null) setAutoRefresh(savedAutoRefresh === "true");
    if (savedPlatform) setSelectedPlatform(savedPlatform);

    loadContests();
  }, []);

  useEffect(() => {
    localStorage.setItem("darkMode", darkMode.toString());
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem("autoRefresh", autoRefresh.toString());
  }, [autoRefresh]);

  useEffect(() => {
    localStorage.setItem("selectedPlatform", selectedPlatform);
  }, [selectedPlatform]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(loadContests, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Trophy className="w-12 h-12 text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className={cn(darkMode && "dark")}>
      <div className="min-h-screen bg-background text-foreground">
        {/* HEADER */}
        <header className="border-b border-border/50 backdrop-blur sticky top-0 bg-background/80">
          <div className="max-w-8xl mx-auto px-4 py-4 flex justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/cp.jpg"
                className="w-12 h-12 rounded-full"
                alt="Logo"
              />
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Contest Tracker
                </h1>
                <p className="text-sm text-muted-foreground">
                  Never miss a coding contest
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={loadContests}
                disabled={refreshing}
              >
                <RefreshCw className={cn(refreshing && "animate-spin")} />
              </Button>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Bell />
                  </Button>
                </PopoverTrigger>

                <PopoverContent>
                  <div className="p-4">
                    <h3 className="font-semibold mb-2">Active Reminders</h3>
                    {activeReminders === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No active reminders
                      </p>
                    ) : (
                      <ul className="text-sm">
                        {contests
                          .filter((c) => c.reminded)
                          .map((c) => (
                            <li key={c.id}>
                              {c.name} ({c.platform})
                            </li>
                          ))}
                      </ul>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Settings />
                  </Button>
                </DialogTrigger>

                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Settings</DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Dark Mode</span>
                      <Switch
                        checked={darkMode}
                        onCheckedChange={setDarkMode}
                      />
                    </div>

                    <div className="flex justify-between">
                      <span>Auto Refresh</span>
                      <Switch
                        checked={autoRefresh}
                        onCheckedChange={setAutoRefresh}
                      />
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </header>

        {/* MAIN */}
        <main className="max-w-6xl mx-auto px-4 py-8">
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold text-foreground">
              Upcoming Contests
            </h2>

            <p className="text-muted-foreground">{contests.length} contests</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Total Contests</p>
                <p className="text-2xl font-bold">{contests.length}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  Active Reminders
                </p>
                <p className="text-2xl font-bold text-primary">
                  {activeReminders}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Platforms</p>
                <p className="text-2xl font-bold">NA</p>
                {/* <p className="text-2xl font-bold">{platformCount}</p> */}
              </div>
            </div>
          </Card>

          <div>
            {/* Search & Sort */}
            <div className="flex gap-3 flex-col sm:flex-row mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search contests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              >
                <option value="time">Sort by Time</option>
                <option value="duration">Sort by Duration</option>
                <option value="platform">Sort by Platform</option>
              </select>
            </div>
            {/* Platform Buttons */}
            <div className="flex gap-2 mb-6">
              {["All", "LeetCode", "Codeforces", "CodeChef"].map((platform) => {
                const count =
                  platform === "All"
                    ? contests.length
                    : contests.filter((c) => c.platform === platform).length;
                return (
                  <Button
                    key={platform}
                    variant={
                      selectedPlatform === platform ? "default" : "outline"
                    }
                    onClick={() => setSelectedPlatform(platform)}
                  >
                    {platform} ({count})
                  </Button>
                );
              })}
            </div>
            {/* Contests List */}

            {/* <div className="flex flex-col gap-3">
              {filteredContests.map((contest) => (
                <div
                  key={contest.name + contest.startTime}
                  className="p-4 border rounded-xl"
                >
                  <h3 className="font-bold">{contest.name}</h3>
                  <p>{contest.platform}</p>
                  <p>
                    {new Date(contest.startTime).toLocaleString()} -{" "}
                    {new Date(contest.endTime).toLocaleString()}
                  </p>
                </div>
              ))}
            </div> */}
          </div>
          {filteredContests.length === 0 ? (
            <Card className="p-12 text-center">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No contests found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery
                  ? "Try different search terms"
                  : "Check back later or refresh to see upcoming contests"}
              </p>
              <Button onClick={loadContests} disabled={refreshing}>
                <RefreshCw
                  className={cn("w-4 h-4 mr-2", refreshing && "animate-spin")}
                />
                Refresh
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredContests.map((contest) => (
                // <Card key={contest.id} className="p-4">
                //   <Badge>{contest.platform}</Badge>

                //   <h3 className="font-semibold text-foreground">
                //     {contest.name}
                //   </h3>

                //   <p className="text-sm text-muted-foreground">
                //     {formatTimeRemaining(new Date(contest.startTime))}
                //   </p>

                //   <Button asChild className="mt-3">
                //     <a href={contest.url} target="_blank">
                //       Open Contest
                //     </a>
                //   </Button>
                // </Card>
                <Card key={contest.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{contest.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {contest.platform}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Starts in:{" "}
                        {formatTimeRemaining(new Date(contest.startTime))}
                      </p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => toggleReminder(contest.id)}
                      className={cn(
                        "rounded-full p-1.5 transition-colors",
                        contest.reminded
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      <Bell
                        className="w-4 h-4"
                        fill={contest.reminded ? "currentColor" : "none"}
                      />
                    </motion.button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
