import express from 'express';
import { requerirAutenticacion } from '../middlewares/auth.js';
import {
  obtenerNotificaciones,
  marcarComoLeida,
  marcarTodasComoLeidas,
  eliminarNotificacion,
  contarNoLeidas
} from '../controllers/notificacion.controller.js';

const router = express.Router();

// Rutas protegidas
router.get('/', requerirAutenticacion, obtenerNotificaciones);
router.get('/contar/no-leidas', requerirAutenticacion, contarNoLeidas);
router.patch('/:id/marcar-leida', requerirAutenticacion, marcarComoLeida);
router.patch('/marcar-todas-leidas', requerirAutenticacion, marcarTodasComoLeidas);
router.delete('/:id', requerirAutenticacion, eliminarNotificacion);

export default router;
