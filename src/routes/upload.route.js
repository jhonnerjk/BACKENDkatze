import express from 'express';
import upload from '../middlewares/upload.js';
import { uploadImage, getImage, deleteImage } from '../controllers/upload.controller.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

// OJO: 'image' debe coincidir con lo que pusimos en uploadService.js del frontend
router.post('/upload', protect, upload.single('image'), uploadImage);

router.get('/:id', getImage);
router.delete('/:id', protect, deleteImage);

export default router;