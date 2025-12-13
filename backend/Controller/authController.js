import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { User } from "../models/User.js";

// SignUp
export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const user = await User.findOne({ email });
    if (user) res.status(400).json({ message: "User already exists" });

    const hashedPass = bcrypt.hash(password, 10);
    user = await User.create({
      name: name,
      email: email,
      password: hashedPass,
    });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.status(400).json({ message: "Signup successfull", token, user });
  } catch (error) {
    res.status().json({ message: "Signup failed", error: error.message });
  }
};

// LogIn

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = User.findOne({ email });
    if (!user) {
      res.status(400).json({ message: "Invalid email or password" });
    }
    const isMatch = bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ message: "Invalid email or password" });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.status(400).json({ message: "Login Successfull", token, user });
  } catch (error) {
    res.status(500).json({ message: "Login failed", message: "error.message" });
  }
};
