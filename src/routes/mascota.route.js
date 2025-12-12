// src/routes/mascotaRoutes.js

import express from 'express';
import { requerirAutenticacion } from '../middlewares/auth.js';
import { requerirRol } from '../middlewares/roles.js';
import { body, param, validationResult } from 'express-validator';

import { 
    obtenerMascotas,
    obtenerMascotaPorId,
    crearMascota,
    actualizarMascota,
    eliminarMascota
} from '../controllers/mascota.controller.js';

// Importamos la configuración de Multer (asumiendo que está en /src/config/multer.js)
// --- Nota: Necesitas crear el archivo src/config/multer.js ---
// import { subirImagenMascota } from '../config/multer.js'; 

const router = express.Router();

const handleValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errores: errors.array() });
    }
    next();
};

// Rutas Públicas de Lectura
// Ruta: GET /api/mascotas (Filtrar y listar)
router.get('/', obtenerMascotas);

// Ruta: GET /api/mascotas/:id (Detalles de la mascota)
router.get('/:id', obtenerMascotaPorId);


// Rutas Restringidas (Necesitan Autenticación y Autorización)

// Ruta: POST /api/mascotas
// Solo Rescatistas y Administradores pueden crear mascotas.
// Se usa Multer aquí para subir la imagen (pendiente de configuración).
/* router.post(
    '/',
    requerirAutenticacion,
    requerirRol('Rescatista', 'Administrador'),
    subirImagenMascota, // Middleware de Multer para el archivo
    crearMascota
); */
router.post(
    '/',
    requerirAutenticacion,
    requerirRol('Rescatista', 'Administrador'),
    [
        body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio'),
        body('tipoAnimal').trim().notEmpty().withMessage('El tipo de animal es obligatorio'),
        body('edad').isNumeric().withMessage('La edad debe ser numérica'),
        body('estadoAdopcion').optional().isIn(['Disponible', 'Pendiente', 'Adoptado']).withMessage('Estado de adopción inválido')
    ],
    handleValidation,
    crearMascota
);


// Ruta: PUT /api/mascotas/:id
// Solo el Rescatista dueño o el Administrador pueden actualizar.
router.put(
    '/:id', 
    requerirAutenticacion, 
    requerirRol('Rescatista', 'Administrador'), 
    [
        param('id').isMongoId().withMessage('ID inválido'),
        body('nombre').optional().trim().notEmpty().withMessage('Nombre no puede ser vacío'),
        body('edad').optional().isNumeric().withMessage('Edad debe ser numérica'),
        body('estadoAdopcion').optional().isIn(['Disponible', 'Pendiente', 'Adoptado']).withMessage('Estado de adopción inválido')
    ],
    handleValidation,
    actualizarMascota
);

// Ruta: DELETE /api/mascotas/:id
// Solo el Rescatista dueño o el Administrador pueden eliminar.
router.delete(
    '/:id', 
    requerirAutenticacion, 
    requerirRol('Rescatista', 'Administrador'), 
    [param('id').isMongoId().withMessage('ID inválido')],
    handleValidation,
    eliminarMascota
);

export default router;