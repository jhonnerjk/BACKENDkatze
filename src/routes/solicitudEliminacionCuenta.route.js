import express from 'express';
import { protect } from '../middlewares/auth.js';
import { requerirRol } from '../middlewares/roles.js';
import {
  crearSolicitudEliminacion,
  obtenerSolicitudesEliminacion,
  obtenerSolicitudEliminacionPorUsuario,
  aprobarSolicitudEliminacion,
  rechazarSolicitudEliminacion,
  cancelarSolicitudEliminacion
} from '../controllers/solicitudEliminacionCuenta.controller.js';

const router = express.Router();

// Rutas específicas PRIMERO (para evitar conflictos con /:id)
router.get('/usuario/miSolicitud', protect, obtenerSolicitudEliminacionPorUsuario);
router.delete('/cancelar', protect, cancelarSolicitudEliminacion);

// Rutas de admin (requieren rol Administrador)
router.get('/', protect, requerirRol('Administrador'), obtenerSolicitudesEliminacion);
router.patch('/:id/aprobar', protect, requerirRol('Administrador'), aprobarSolicitudEliminacion);
router.patch('/:id/rechazar', protect, requerirRol('Administrador'), rechazarSolicitudEliminacion);

// Rutas de creación
router.post('/', protect, crearSolicitudEliminacion);

export default router;
