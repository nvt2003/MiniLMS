require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const authRoutes = require('./src/routes/authRoutes');
const courseRoutes = require('./src/routes/courseRoutes');
const studentRoutes = require('./src/routes/studentRoutes');
const lessonRoutes = require('./src/routes/lessionRoutes');
const enrollmentRoutes = require('./src/routes/enrollmentRoutes');
const lessonImagesRoutes = require('./src/routes/imageRoutes');
const questionRoutes = require('./src/routes/questionRoutes');
const examRoutes = require('./src/routes/examRoutes');
const initCleanOrphanImagesJob = require('./src/jobs/cleanOrphanImagesJob');
const FRONT_END = process.env.FRONT_END;
const app = express();
const cors = require("cors");
const corsOptions = {
  origin:FRONT_END,
  methods:["GET","POST","PUT","DELETE"],
  allowedHeaders:["Content-Type","Authorization"]
}

app.use(cors(corsOptions));

// Cấu hình Middleware để Express hiểu dữ liệu JSON từ request body gửi lên
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/lessonImages',lessonImagesRoutes);
app.use('/api/images',lessonImagesRoutes);
app.use('/api/questions',questionRoutes)
app.use('/api/exams',examRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: FRONT_END }
});

io.on('connection', (socket) => {
  socket.on('join_user_room', (studentId) => {
    socket.join(`student_${studentId}`);
    console.log(`Học sinh ${studentId} đã kết nối vào phòng cá nhân.`);
  });

  socket.on('disconnect', () => {
    console.log('Một kết nối đã ngắt.');
  });
});

global.io = io;

initCleanOrphanImagesJob();

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server chạy tại port ${PORT}`));