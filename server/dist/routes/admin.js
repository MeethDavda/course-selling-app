"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = require("../db");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_1 = require("../middleware/auth");
const auth_2 = require("../middleware/auth");
const zod_1 = require("zod");
const router = express_1.default.Router();
const adminType = zod_1.z.object({
    username: zod_1.z.string().min(3),
    password: zod_1.z.string(),
});
const courseType = zod_1.z.object({
    title: zod_1.z.string(),
    description: zod_1.z.string(),
    price: zod_1.z.number(),
    imageLink: zod_1.z.string(),
    published: zod_1.z.boolean(),
});
router.get("/me", auth_2.authenticateJwt, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const admin = yield db_1.Admin.findOne({ _is: req.headers["userId"] });
    if (!admin) {
        res.status(403).json({ msg: "Admin doesnt exist" });
        return;
    }
    res.json({
        username: admin.username,
    });
}));
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
        }
        else {
            const obj = {
                username: parsedInput.data.username,
                password: parsedInput.data.password,
            };
            const newAdmin = new db_1.Admin(obj);
            newAdmin.save();
            const token = jsonwebtoken_1.default.sign({ username: obj.username, role: "admin" }, auth_1.SECRET, {
                expiresIn: "1h",
            });
            res.json({ message: "Admin created successfully", token });
        }
    }
    db_1.Admin.findOne({ username: parsedInput.data.username }).then(callback);
});
router.post("/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // const { username, password } = req.body;
    const parsedInput = adminType.safeParse(req.body);
    // console.log(parsedInput)
    if (parsedInput.success == false) {
        res.status(411).json({
            error: parsedInput.error,
        });
        return;
    }
    const admin = yield db_1.Admin.findOne({
        username: parsedInput.data.username,
        password: parsedInput.data.password,
    });
    if (admin) {
        const token = jsonwebtoken_1.default.sign({ username: parsedInput.data.username, role: "admin" }, auth_1.SECRET, {
            expiresIn: "1h",
        });
        res.json({ message: "Logged in successfully", token });
    }
    else {
        res.status(403).json({ message: "Invalid username or password" });
    }
}));
router.post("/courses", auth_2.authenticateJwt, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const parsedInput = courseType.safeParse(req.body);
    // console.log(parsedInput);
    if (parsedInput.success == false) {
        res.status(411).json({
            error: parsedInput.error,
        });
        return;
    }
    const course = new db_1.Course(parsedInput.data);
    yield course.save();
    res.json({ message: "Course created successfully", courseId: course.id });
}));
router.put("/courses/:courseId", auth_2.authenticateJwt, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const course = yield db_1.Course.findByIdAndUpdate(req.params.courseId, req.body, {
        new: true,
    });
    if (course) {
        res.json({ message: "Course updated successfully" });
    }
    else {
        res.status(404).json({ message: "Course not found" });
    }
}));
router.get("/courses", auth_2.authenticateJwt, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const courses = yield db_1.Course.find({});
    res.json({ courses });
}));
router.get("/course/:courseId", auth_2.authenticateJwt, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const courseId = req.params.courseId;
    const course = yield db_1.Course.findById(courseId);
    res.json({ course });
}));
exports.default = router;
