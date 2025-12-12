// src/routes/usuarioRoutes.js

import express from 'express';
import { requerirAutenticacion } from '../middlewares/auth.js';
import { requerirRol } from '../middlewares/roles.js';
import { param, validationResult } from 'express-validator';

import { 
    obtenerUsuarios,
    obtenerUsuarioPorId,
    actualizarUsuario,
    eliminarUsuario,
    obtenerUsuariosPendientes,
    aprobarUsuario,
    rechazarUsuario
} from '../controllers/usuario.controller.js';

const router = express.Router();

const handleValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errores: errors.array() });
    }
    next();
};

// Todas las rutas de gestión de usuarios requieren ser Administrador

// Ruta: GET /api/usuarios
// Obtiene la lista de todos los usuarios.
router.get(
    '/', 
    requerirAutenticacion, 
    requerirRol('Administrador'), 
    obtenerUsuarios
);

// Ruta: GET /api/usuarios/pendientes
router.get(
    '/pendientes',
    requerirAutenticacion,
    requerirRol('Administrador'),
    obtenerUsuariosPendientes
);

// Ruta: GET /api/usuarios/:id
// Obtiene un usuario específico por ID.
router.get(
    '/:id', 
    requerirAutenticacion, 
    requerirRol('Administrador'), 
    [param('id').isMongoId().withMessage('ID inválido')],
    handleValidation,
    obtenerUsuarioPorId
);

// Ruta: PUT /api/usuarios/:id
// Actualiza cualquier campo de un usuario (para gestión administrativa, incluyendo tipoUsuario, activo, etc).
router.put(
    '/:id', 
    requerirAutenticacion, 
    requerirRol('Administrador'), 
    [param('id').isMongoId().withMessage('ID inválido')],
    handleValidation,
    actualizarUsuario
);

// Ruta: PATCH /api/usuarios/:id/aprobar
router.patch(
    '/:id/aprobar',
    requerirAutenticacion,
    requerirRol('Administrador'),
    [param('id').isMongoId().withMessage('ID inválido')],
    handleValidation,
    aprobarUsuario
);

// Ruta: PATCH /api/usuarios/:id/rechazar
router.patch(
    '/:id/rechazar',
    requerirAutenticacion,
    requerirRol('Administrador'),
    [param('id').isMongoId().withMessage('ID inválido')],
    handleValidation,
    rechazarUsuario
);

// Ruta: DELETE /api/usuarios/:id
// Elimina un usuario del sistema.
router.delete(
    '/:id', 
    requerirAutenticacion, 
    requerirRol('Administrador'), 
    [param('id').isMongoId().withMessage('ID inválido')],
    handleValidation,
    eliminarUsuario
);

export default router;