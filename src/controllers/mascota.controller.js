// src/controllers/mascotaController.js

import Mascota from '../models/Mascota.js';
import Usuario from '../models/Usuario.js';
import SolicitudAdopcion from '../models/SolicitudAdopcion.js';
import mongoose from 'mongoose';

/**
 * Obtiene todas las mascotas con opciones de filtro y paginación.
 * @route GET /api/mascotas
 */
export const obtenerMascotas = async (req, res) => {
    try {
        const { tipoAnimal, genero, ubicacion, disponible } = req.query;
        const filtros = {};
        if (tipoAnimal) filtros.tipoAnimal = tipoAnimal;
        if (genero) filtros.genero = genero;
        if (ubicacion) filtros.ubicacion = ubicacion;
        if (disponible) filtros.estadoAdopcion = 'Disponible';

        const pagina = parseInt(req.query.pagina) || 1;
        const limite = parseInt(req.query.limite) || 100; // Aumentar límite para mostrar más mascotas
        const saltar = (pagina - 1) * limite;

        // Siempre traer todos sin paginación para actualización rápida
        const mascotas = await Mascota.find(filtros)
            .sort({ createdAt: -1 })
            .populate('rescatistaId', 'nombre telefono _id');

        const totalMascotas = await Mascota.countDocuments(filtros);

        res.status(200).json({
            total: totalMascotas,
            paginaActual: pagina,
            paginasTotales: Math.ceil(totalMascotas / limite),
            mascotas
        });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener mascotas.', error: error.message });
    }
};


/**
 * Obtiene una mascota por su ID.
 * @route GET /api/mascotas/:id
 */
export const obtenerMascotaPorId = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ mensaje: 'ID de mascota inválido.' });
        }
        const mascota = await Mascota.findById(req.params.id)
            .populate('rescatistaId', 'nombre correo telefono direccionResguardo');
        if (!mascota) {
            return res.status(404).json({ mensaje: 'Mascota no encontrada.' });
        }
        res.status(200).json(mascota);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener la mascota.', error: error.message });
    }
};


/**
 * Crea una nueva mascota.
 * @route POST /api/mascotas
 * REQUIERE: requerirRol('Rescatista', 'Administrador')
 */
export const crearMascota = async (req, res) => {
    try {
        const rescatistaId = req.usuario._id;
        const nuevaMascota = new Mascota({
            ...req.body,
            rescatistaId,
            urlsImagenes: req.body.urlsImagenes || ['/default/placeholder.jpg'],
            // Si el usuario proporciona ubicación, úsala. Si no, usa la del rescatista
            ubicacion: req.body.ubicacion || req.usuario.direccionResguardo || (req.usuario.direccion?.ciudad || 'Ciudad')
        });
        await nuevaMascota.save();
        await Usuario.findByIdAndUpdate(rescatistaId, {
            $push: { mascotasEnCuidado: nuevaMascota._id }
        });
        res.status(201).json({ mensaje: 'Mascota creada exitosamente.', mascota: nuevaMascota });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al crear la mascota.', error: error.message });
    }
};


/**
 * Actualiza los datos de una mascota.
 * @route PUT /api/mascotas/:id
 * REQUIERE: requerirRol('Rescatista', 'Administrador')
 */
export const actualizarMascota = async (req, res) => {
    try {
        const mascota = await Mascota.findById(req.params.id);
        if (!mascota) {
            return res.status(404).json({ mensaje: 'Mascota no encontrada.' });
        }
        const esDueño = mascota.rescatistaId.toString() === req.usuario._id.toString();
        const esAdmin = req.usuario.tipoUsuario === 'Administrador';
        if (!esDueño && !esAdmin) {
            return res.status(403).json({ mensaje: 'No tiene permiso para actualizar esta mascota.' });
        }
        const mascotaActualizada = await Mascota.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        res.status(200).json({ mensaje: 'Mascota actualizada exitosamente.', mascota: mascotaActualizada });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al actualizar la mascota.', error: error.message });
    }
};


/**
 * Elimina una mascota.
 * @route DELETE /api/mascotas/:id
 * REQUIERE: requerirRol('Rescatista', 'Administrador')
 * Nota: Solo el dueño (rescatista) o un admin puede eliminar
 */
export const eliminarMascota = async (req, res) => {
    try {
        console.log('Intentando eliminar mascota:', req.params.id);
        
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            console.log('❌ ID inválido');
            return res.status(400).json({ mensaje: 'ID de mascota inválido.' });
        }
        
        const mascota = await Mascota.findById(req.params.id);
        console.log('Mascota encontrada:', mascota?.nombre);
        
        if (!mascota) {
            console.log('❌ Mascota no encontrada');
            return res.status(404).json({ mensaje: 'Mascota no encontrada.' });
        }
        
        // Verificar permisos: solo el rescatista dueño o admin pueden eliminar
        const esDueño = mascota.rescatistaId?.toString() === req.usuario._id.toString();
        const esAdmin = req.usuario.tipoUsuario === 'Administrador';
        
        console.log('Usuario:', req.usuario.nombre, 'Es dueño:', esDueño, 'Es admin:', esAdmin);
        
        if (!esDueño && !esAdmin) {
            console.log('❌ Sin permisos');
            return res.status(403).json({ mensaje: 'Solo puedes eliminar tus propias mascotas.' });
        }
        
        console.log('Eliminando solicitudes asociadas...');
        await SolicitudAdopcion.deleteMany({ mascotaId: req.params.id });
        
        console.log('Eliminando mascota...');
        await Mascota.deleteOne({ _id: req.params.id });
        
        console.log('Actualizando usuario...');
        if (mascota.rescatistaId) {
            await Usuario.findByIdAndUpdate(mascota.rescatistaId, {
                $pull: { mascotasEnCuidado: mascota._id }
            });
        }
        
        console.log('✅ Mascota eliminada exitosamente');
        res.status(200).json({ mensaje: 'Mascota eliminada y referencias limpiadas.' });
    } catch (error) {
        console.error('Error eliminando mascota:', error);
        res.status(500).json({ mensaje: 'Error al eliminar la mascota.', error: error.message });
    }
};