import mongoose from "mongoose";
import express from "express";
import { User, Course, Admin } from "../db";
import jwt from "jsonwebtoken";
import { SECRET } from "../middleware/auth";
import { authenticateJwt } from "../middleware/auth";
import { z } from "zod";

const router = express.Router();
const adminType = z.object({
  username: z.string().min(3),
  password: z.string(),
});

const courseType = z.object({
  title: z.string(),
  description: z.string(),
  price: z.number(),
  imageLink: z.string(),
  published: z.boolean(),
});

router.get("/me", authenticateJwt, async (req, res) => {
  const admin = await Admin.findOne({ _is: req.headers["userId"] });
  if (!admin) {
    res.status(403).json({ msg: "Admin doesnt exist" });
    return;
  }
  res.json({
    username: admin.username,
  });
});

router.post("/signup", (req, res) => {
  // const { username, password } = req.body;
  const parsedInput = adminType.safeParse(req.body);

  if (parsedInput.success == false) {
    res.status(411).json({
      error: parsedInput.error,
    });
    return;
  }
  function callback(admin) {
    if (admin) {
      res.status(403).json({ message: "Admin already exists" });
    } else {
      const obj = {
        username: parsedInput.data.username,
        password: parsedInput.data.password,
      };
      const newAdmin = new Admin(obj);
      newAdmin.save();

      const token = jwt.sign(
        { username: obj.username, role: "admin" },
        SECRET,
        {
          expiresIn: "1h",
        }
      );
      res.json({ message: "Admin created successfully", token });
    }
  }
  Admin.findOne({ username: parsedInput.data.username }).then(callback);
});

router.post("/login", async (req, res) => {
  // const { username, password } = req.body;
  const parsedInput = adminType.safeParse(req.body);
  // console.log(parsedInput)
  if (parsedInput.success == false) {
    res.status(411).json({
      error: parsedInput.error,
    });
    return;
  }
  const admin = await Admin.findOne({
    username: parsedInput.data.username,
    password: parsedInput.data.password,
  });
  if (admin) {
    const token = jwt.sign(
      { username: parsedInput.data.username, role: "admin" },
      SECRET,
      {
        expiresIn: "1h",
      }
    );
    res.json({ message: "Logged in successfully", token });
  } else {
    res.status(403).json({ message: "Invalid username or password" });
  }
});

router.post("/courses", authenticateJwt, async (req, res) => {
  const parsedInput = courseType.safeParse(req.body);
  // console.log(parsedInput);
  if (parsedInput.success == false) {
    res.status(411).json({
      error: parsedInput.error,
    });
    return;
  }
  const course = new Course(parsedInput.data);
  await course.save();
  res.json({ message: "Course created successfully", courseId: course.id });
});

router.put("/courses/:courseId", authenticateJwt, async (req, res) => {
  const course = await Course.findByIdAndUpdate(req.params.courseId, req.body, {
    new: true,
  });
  if (course) {
    res.json({ message: "Course updated successfully" });
  } else {
    res.status(404).json({ message: "Course not found" });
  }
});

router.get("/courses", authenticateJwt, async (req, res) => {
  const courses = await Course.find({});
  res.json({ courses });
});

router.get("/course/:courseId", authenticateJwt, async (req, res) => {
  const courseId = req.params.courseId;
  const course = await Course.findById(courseId);
  res.json({ course });
});

export default router;
