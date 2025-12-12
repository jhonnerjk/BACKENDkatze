import express from 'express';
import { protect } from '../middlewares/auth.js';
import { body, param, validationResult } from 'express-validator';
import {
  obtenerPosts,
  obtenerPostPorId,
  crearPost,
  agregarLike,
  agregarComentario,
  eliminarComentario,
  agregarRespuesta,
  eliminarRespuesta,
  eliminarPost
} from '../controllers/post.controller.js';

const router = express.Router();

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errores: errors.array() });
  }
  next();
};

// Rutas públicas
router.get('/', obtenerPosts);
router.get('/:id', obtenerPostPorId);

// Rutas autenticadas
router.post(
  '/', 
  protect, 
  [
    body('titulo').trim().notEmpty().withMessage('El título es obligatorio'),
    body('contenido').trim().notEmpty().withMessage('El contenido es obligatorio')
  ],
  handleValidation,
  crearPost
);
router.post('/:id/like', protect, [param('id').isMongoId().withMessage('ID inválido')], handleValidation, agregarLike);
router.post(
  '/:id/comentario', 
  protect, 
  [param('id').isMongoId().withMessage('ID inválido'), body('texto').trim().notEmpty().withMessage('El texto es obligatorio')],
  handleValidation,
  agregarComentario
);
router.delete(
  '/:id/comentario/:comentarioId', 
  protect, 
  [param('id').isMongoId(), param('comentarioId').isMongoId()],
  handleValidation,
  eliminarComentario
);
router.post(
  '/:id/comentario/:comentarioId/respuesta', 
  protect, 
  [param('id').isMongoId(), param('comentarioId').isMongoId(), body('texto').trim().notEmpty().withMessage('El texto es obligatorio')],
  handleValidation,
  agregarRespuesta
);
router.delete(
  '/:id/comentario/:comentarioId/respuesta/:respuestaId', 
  protect, 
  [param('id').isMongoId(), param('comentarioId').isMongoId(), param('respuestaId').isMongoId()],
  handleValidation,
  eliminarRespuesta
);
router.delete('/:id', protect, [param('id').isMongoId().withMessage('ID inválido')], handleValidation, eliminarPost);

export default router;
