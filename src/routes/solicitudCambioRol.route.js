import express from 'express';
import {
  crearSolicitudCambioRol,
  obtenerSolicitudesCambioRol,
  obtenerSolicitudCambioRolPorUsuario,
  aprobarSolicitudCambioRol,
  rechazarSolicitudCambioRol,
  cancelarSolicitudCambioRol
} from '../controllers/solicitudCambioRol.controller.js';
import { requerirAutenticacion } from '../middlewares/auth.js';
import { requerirRol } from '../middlewares/roles.js';

const router = express.Router();

// Rutas específicas PRIMERO (para evitar conflictos)
router.get('/usuario/mi-solicitud', requerirAutenticacion, obtenerSolicitudCambioRolPorUsuario);
router.delete('/cancelar', requerirAutenticacion, cancelarSolicitudCambioRol);

// Rutas de admin
router.get('/', requerirAutenticacion, requerirRol('Administrador'), obtenerSolicitudesCambioRol);
router.patch('/:id/aprobar', requerirAutenticacion, requerirRol('Administrador'), aprobarSolicitudCambioRol);
router.patch('/:id/rechazar', requerirAutenticacion, requerirRol('Administrador'), rechazarSolicitudCambioRol);

// Rutas de creación
router.post('/', requerirAutenticacion, crearSolicitudCambioRol);

export default router;
