import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import 'dotenv/config';
import cookieParser from 'cookie-parser';
import ConnectDB from './DB/MongoDB.js';
import authRoutes from './routes/auth.routes.js';
import vendorRoutes from './routes/vendor.routes.js';
import { userModel } from './Models/User.models.js';

ConnectDB();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
}));

app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url}`);
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (_, res) => {
  res.send("API working at '/' route");
});

app.use('/api/auth', authRoutes);
app.use('/api/vendor', vendorRoutes);

// Socket.IO logic for vendor location updates
io.on('connection', (socket) => {
  console.log('🟢 Socket connected:', socket.id);

  socket.on('locationUpdate', async (data) => {
    const { userId, latitude, longitude } = data;
    console.log(`📍 Location from ${socket.id}:`, data);

    try {
      // Update vendor location in MongoDB
      await userModel.findByIdAndUpdate(userId, {
        location: {
          type: 'Point',
          coordinates: [longitude, latitude]
        }
      });

      // Broadcast to all clients
      socket.broadcast.emit('vendorLocationUpdate', {
        userId,
        name: (await userModel.findById(userId)).name,
        latitude,
        longitude
      });
    } catch (err) {
      console.error('Error updating location:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('🔴 Socket disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));