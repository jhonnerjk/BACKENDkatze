import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import streamifier from 'streamifier';
import { v2 as cloudinary } from 'cloudinary';

// Helper para obtener __dirname en módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const uploadImage = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se subió ningún archivo' });
    }

    // Si Cloudinary está configurado, subir allá
    if (process.env.CLOUDINARY_URL || (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)) {
      if (!process.env.CLOUDINARY_URL) {
        cloudinary.config({
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET
        });
      }

      const folder = process.env.CLOUDINARY_FOLDER || 'katze/uploads';
      const fileBuffer = req.file.buffer || fs.readFileSync(path.join(process.cwd(), 'uploads', req.file.filename));

      const uploadStream = cloudinary.uploader.upload_stream({ folder }, (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return res.status(500).json({ message: 'Error al subir la imagen a Cloudinary' });
        }
        return res.json({
          message: 'Imagen subida correctamente',
          fileId: result.public_id,
          filename: result.public_id,
          downloadUrl: result.secure_url
        });
      });

      streamifier.createReadStream(fileBuffer).pipe(uploadStream);
      return;
    }

    // Fallback: almacenamiento local
    const fullUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({
      message: 'Imagen subida correctamente',
      fileId: req.file.filename,
      filename: req.file.filename,
      downloadUrl: fullUrl 
    });
  } catch (error) {
    console.error('Error en upload:', error);
    res.status(500).json({ message: 'Error al subir la imagen' });
  }
};

export const getImage = (req, res) => {
  try {
    const filename = req.params.id; // Aquí el "id" es el nombre del archivo
    const filepath = path.join(process.cwd(), 'uploads', filename);

    if (fs.existsSync(filepath)) {
      res.sendFile(filepath);
    } else {
      res.status(404).json({ message: 'Imagen no encontrada' });
    }
  } catch (error) {
    console.error('Error obteniendo imagen:', error);
    res.status(500).json({ message: 'Error al obtener la imagen' });
  }
};

export const deleteImage = (req, res) => {
  try {
    const filename = req.params.id;
    const filepath = path.join(process.cwd(), 'uploads', filename);

    // Si existe en disco local, eliminar
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      return res.json({ message: 'Imagen eliminada correctamente' });
    }

    // Intentar eliminar en Cloudinary si está configurado
    if (process.env.CLOUDINARY_URL || (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)) {
      if (!process.env.CLOUDINARY_URL) {
        cloudinary.config({
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET
        });
      }
      return cloudinary.uploader.destroy(filename)
        .then(() => res.json({ message: 'Imagen eliminada correctamente (Cloudinary)' }))
        .catch(err => {
          console.error('Error borrando imagen en Cloudinary:', err);
          return res.status(500).json({ message: 'Error al eliminar la imagen en Cloudinary' });
        });
    }

    return res.status(404).json({ message: 'Imagen no encontrada para eliminar' });
  } catch (error) {
    console.error('Error borrando imagen:', error);
    res.status(500).json({ message: 'Error al eliminar la imagen' });
  }
};