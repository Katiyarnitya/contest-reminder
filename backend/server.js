import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectDb } from "./config/db.js";

const app = express();

// middleware
app.use(express.json()); //parse the json bodies

dotenv.config();
connectDb();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`listening to ${PORT}`);
});
