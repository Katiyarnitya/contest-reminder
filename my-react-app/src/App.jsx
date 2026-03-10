import { useEffect, useState } from "react";
import { API } from "../src/api/api";
import Page from "../src/app/page";

function App() {
  const [contests, setContests] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/contests")
      .then((res) => {
        console.log(res.data);
        setContests(res.data.contests);
        setLoading(false);
      })
      .catch((err) => {
        console.log("Error:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <h2>Loading contests...</h2>;

  return (
    <div>
      <Page />
    </div>
  );
}

export default App;
