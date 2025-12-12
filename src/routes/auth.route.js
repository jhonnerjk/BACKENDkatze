// src/routes/autenticacionRoutes.js

import express from 'express';
import { 
    registrarUsuario,
    iniciarSesion,
    obtenerPerfilUsuario,
    actualizarPerfilUsuario
} from '../controllers/auth.controller.js';

import { requerirAutenticacion } from '../middlewares/auth.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Manejo de errores de validación
const handleValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errores: errors.array() });
    }
    next();
};

// Ruta: POST /api/auth/registro
router.post(
    '/registro',
    [
        body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio'),
        body('correo').isEmail().withMessage('Correo inválido').normalizeEmail(),
        body('contrasena').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
        body('tipoUsuario').optional().isIn(['Adoptante', 'Rescatista', 'Administrador']).withMessage('Tipo de usuario inválido')
    ],
    handleValidation,
    registrarUsuario
);

// Ruta: POST /api/auth/login
router.post(
    '/login',
    [
        body('correo').isEmail().withMessage('Correo inválido').normalizeEmail(),
        body('contrasena').notEmpty().withMessage('La contraseña es obligatoria')
    ],
    handleValidation,
    iniciarSesion
);

// Ruta: GET /api/auth/perfil
// Requiere JWT válido para acceder
router.get('/perfil', requerirAutenticacion, obtenerPerfilUsuario);

// Ruta: PUT /api/auth/perfil
// Actualizar perfil del usuario autenticado
router.put('/perfil', requerirAutenticacion, actualizarPerfilUsuario);

export default router;