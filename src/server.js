// src/server.js

// Importar variables de entorno (debe ser el primero)
import 'dotenv/config'; 
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
// Usaremos express-async-errors para manejar try/catch automáticamente en controladores
import 'express-async-errors';
import path from 'path';

// --- Configuración y Conexión ---
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.route.js';
import mascotaRoutes from './routes/mascota.route.js';
import solicitudRoutes from './routes/solicitud.route.js';
import usuarioRoutes from './routes/usuario.route.js';
import uploadRoutes from './routes/upload.route.js';
import postRoutes from './routes/post.route.js';
import solicitudEliminacionCuentaRoutes from './routes/solicitudEliminacionCuenta.route.js';
import solicitudCambioRolRoutes from './routes/solicitudCambioRol.route.js';
import notificacionRoutes from './routes/notificacion.route.js';


const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  }
});

const PORT = process.env.PORT || 5000;
// Usamos la variable de entorno MONGO_URI configurada en Render/entornos
const MONGO_URI = process.env.MONGO_URI;

// Conectar a la base de datos
connectDB(MONGO_URI); 

// --- Middlewares Básicos ---
// CORS mejorado
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173'
].filter(Boolean);

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.use(express.json());

// Registrar io en la app para acceso global
app.set('io', io);

const __dirname = path.resolve();
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// --- Rutas ---
// Rutas
app.use('/api/auth', authRoutes); 
app.use('/api/mascotas', mascotaRoutes);
app.use('/api/solicitudes', solicitudRoutes);
app.use('/api/solicitudes-eliminacion', solicitudEliminacionCuentaRoutes);
app.use('/api/solicitudes-cambio-rol', solicitudCambioRolRoutes);
app.use('/api/notificaciones', notificacionRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/posts', postRoutes);

// --- Manejo de Errores Global ---
// Middleware de error personalizado (debe estar al final)
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const mensaje = err.mensaje || err.message || 'Error interno del servidor';
  
  console.error(`[ERROR ${status}]: ${mensaje}`, err);
  
  res.status(status).json({
    mensaje,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});


// --- Iniciar Servidor ---
httpServer.listen(PORT, () => {
    console.log(`Servidor Express corriendo en http://localhost:${PORT}`);
});

// Socket.io eventos básicos
io.on('connection', (socket) => {
  console.log(`✅ Usuario conectado: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`❌ Usuario desconectado: ${socket.id}`);
  });
});