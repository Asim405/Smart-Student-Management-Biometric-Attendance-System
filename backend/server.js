require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const authRoutes = require('./routes/authRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const studentRoutes = require('./routes/studentRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const initSockets = require('./sockets');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Make io reachable from controllers via req.app.get('io'), so the
// attendance controller can broadcast without importing the socket
// module directly (avoids a circular import between server.js and
// controllers/attendanceController.js).
app.set('io', io);

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/attendance', attendanceRoutes);

// Central error handler — catches anything a controller forgot to try/catch.
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

initSockets(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  
  
});
