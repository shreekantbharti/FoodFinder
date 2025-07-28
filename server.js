import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import "dotenv/config";
import cookieParser from "cookie-parser";
import ConnectDB from "./DB/MongoDB.js";
import authRoutes from "./routes/auth.routes.js";
import vendorRouter from "./routes/vendor.routes.js";

ConnectDB();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  },
});

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);

// Logger
app.use((req, res, next) => {
  console.log(
    `[${new Date().toISOString()}] ${req.method} ${
      req.url
    } - Body: ${JSON.stringify(req.body)}`
  );
  next();
});

// Static Files
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/vendor", vendorRouter);

// Default route - redirect to login page
app.get("/", (_, res) => {
  res.redirect("/landingPage.html");
});

// Socket.IO
io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id);

  socket.on("locationUpdate", (coords) => {
    console.log(`📍 Location from ${socket.id}:`, coords);
    socket.broadcast.emit("locationUpdate", coords);
  });

  socket.on("disconnect", () => {
    console.log("🔴 Socket disconnected:", socket.id);
  });
});

// Fallback 404
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () =>
  console.log(`🚀 Server running at http://localhost:${PORT}`)
);

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.log(`Port ${PORT} is in use, trying ${PORT + 1}...`);
    server.listen(PORT + 1);
  } else {
    console.error("Server error:", err);
  }
});
