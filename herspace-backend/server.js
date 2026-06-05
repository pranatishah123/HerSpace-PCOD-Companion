require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const connectDB = require("./config/db");

const authRoutes          = require("./routes/authRoutes");
const aboutRoutes         = require("./routes/aboutRoutes");
const rapidFireRoutes     = require("./routes/rapidFireRoutes");
const skinRoutes          = require("./routes/skinRoutes");
const periodTrackerRoutes = require("./routes/periodTrackerRoutes");
const zonesTrackerRoutes  = require("./routes/zonesTrackerRoutes");
const wellnessRoutes      = require("./routes/Wellnessroutes");
const doctorRoutes        = require("./routes/doctorRoutes");
const timelineRoutes      = require("./routes/timeline");              // ← ADD


const app = express();

connectDB();

// ✅ CORS Setup
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth",      authRoutes);
app.use("/api/about",     aboutRoutes);
app.use("/api/rapidfire", rapidFireRoutes);
app.use("/api/skin",      skinRoutes);
app.use("/api/period",    periodTrackerRoutes);
app.use("/api/zones",     zonesTrackerRoutes);
app.use("/api/wellness",  wellnessRoutes);
app.use("/api/doctor",    doctorRoutes);
app.use("/api/timeline",  timelineRoutes);

app.get("/", (req, res) => res.send("HerSpace Backend Running ✅"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
