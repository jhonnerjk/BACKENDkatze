// src/routes/solicitudRoutes.js

import express from 'express';
import { requerirAutenticacion } from '../middlewares/auth.js';
import { requerirRol } from '../middlewares/roles.js';
import { body, param, validationResult } from 'express-validator';

import { 
    crearSolicitud,
    obtenerSolicitudesPorAdoptante,
    obtenerSolicitudesRecibidas,
    actualizarEstadoSolicitud
} from '../controllers/solicitud.controller.js';

const router = express.Router();

const handleValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errores: errors.array() });
    }
    next();
};

// Ruta: POST /api/solicitudes
// Crear una nueva solicitud de adopción. Solo Adoptantes.
router.post(
    '/', 
    requerirAutenticacion, 
    requerirRol('Adoptante'), 
    [
        body('mascotaId').isMongoId().withMessage('mascotaId inválido'),
        body('preguntasAdicionales').optional().isArray().withMessage('preguntasAdicionales debe ser un arreglo')
    ],
    handleValidation,
    crearSolicitud
);

// Ruta: GET /api/solicitudes/mias
// Obtener las solicitudes que el usuario Adoptante ha enviado.
router.get(
    '/mias', 
    requerirAutenticacion, 
    requerirRol('Adoptante'), 
    obtenerSolicitudesPorAdoptante
);

// Ruta: GET /api/solicitudes/recibidas
// Obtener las solicitudes que el usuario Rescatista ha recibido para sus mascotas.
router.get(
    '/recibidas', 
    requerirAutenticacion, 
    requerirRol('Rescatista', 'Administrador'), // Admin también puede ver todas si se ajusta el controlador
    obtenerSolicitudesRecibidas
);

// Ruta: PUT /api/solicitudes/:id
// Actualizar el estado de una solicitud (Aprobar/Rechazar). Solo Rescatistas (dueño de la mascota) y Admin.
router.put(
    '/:id', 
    requerirAutenticacion, 
    requerirRol('Rescatista', 'Administrador'), 
    [
        param('id').isMongoId().withMessage('ID inválido'),
        body('estadoSolicitud').isString().withMessage('estadoSolicitud requerido')
    ],
    handleValidation,
    actualizarEstadoSolicitud
);

export default router;