// src/controllers/solicitudController.js

import SolicitudAdopcion from '../models/SolicitudAdopcion.js';
import Mascota from '../models/Mascota.js';
import mongoose from 'mongoose';

/**
 * Crea una nueva solicitud de adopción.
 * @route POST /api/solicitudes
 * REQUIERE: requerirRol('Adoptante')
 */
export const crearSolicitud = async (req, res) => {
    try {
        console.log('Creando solicitud con body:', req.body);
        console.log('Usuario:', req.usuario?._id);
        
        const adoptanteId = req.usuario._id;
        const { mascotaId, preguntasAdicionales } = req.body;

        if (!mongoose.Types.ObjectId.isValid(mascotaId)) {
            console.log('❌ ID inválido:', mascotaId);
            return res.status(400).json({ mensaje: 'ID de Mascota inválido.' });
        }

        const mascota = await Mascota.findById(mascotaId);
        console.log('Mascota encontrada:', mascota?.nombre, 'Estado:', mascota?.estadoAdopcion);
        console.log('RescatistaId de la mascota:', mascota?.rescatistaId);

        if (!mascota) {
            console.log('❌ Mascota no encontrada');
            return res.status(404).json({ mensaje: 'Mascota no encontrada.' });
        }

        if (mascota.estadoAdopcion !== 'Disponible') {
            console.log('❌ Mascota no disponible:', mascota.estadoAdopcion);
            return res.status(400).json({ mensaje: `La mascota no está disponible para adopción (Estado: ${mascota.estadoAdopcion}).` });
        }
        
        // Si la mascota no tiene rescatista asignado, usar el admin
        let rescatistaIdFinal = mascota.rescatistaId;
        if (!rescatistaIdFinal) {
            console.log('⚠️ Mascota sin rescatista, buscando admin...');
            const Usuario = (await import('../models/Usuario.js')).default;
            const admin = await Usuario.findOne({ tipoUsuario: 'Administrador' });
            if (admin) {
                rescatistaIdFinal = admin._id;
                console.log('✅ Usando admin como rescatista:', admin.nombre);
                // Actualizar la mascota para que tenga rescatista
                await Mascota.findByIdAndUpdate(mascotaId, { rescatistaId: admin._id });
            } else {
                return res.status(500).json({ mensaje: 'No se pudo asignar un rescatista a la mascota.' });
            }
        }

        const solicitudExistente = await SolicitudAdopcion.findOne({ adoptanteId, mascotaId });
        if (solicitudExistente) {
            console.log('❌ Solicitud ya existe');
            return res.status(400).json({ mensaje: 'Ya existe una solicitud pendiente para esta mascota.' });
        }

        console.log('✅ Creando nueva solicitud...');
        const nuevaSolicitud = await SolicitudAdopcion.create({
            adoptanteId: adoptanteId,
            mascotaId: mascotaId,
            rescatistaId: rescatistaIdFinal,
            preguntasAdicionales
        });

        await Mascota.findByIdAndUpdate(mascotaId, { estadoAdopcion: 'Pendiente' });
        console.log('✅ Solicitud creada exitosamente');

        // Crear notificación para el rescatista
        const Notificacion = (await import('../models/Notificacion.js')).default;
        await Notificacion.create({
            usuarioId: rescatistaIdFinal,
            tipo: 'solicitud',
            titulo: 'Nueva solicitud de adopción',
            mensaje: `Has recibido una nueva solicitud para adoptar a ${mascota.nombre}`,
            icono: '📋',
            referencia: `/solicitudes`
        });

        // Emitir evento Socket.io
        const io = req.app.get('io');
        io.emit('nueva-notificacion', {
            usuarioId: rescatistaIdFinal.toString(),
            tipo: 'solicitud',
            titulo: 'Nueva solicitud de adopción',
            mensaje: `Has recibido una nueva solicitud para adoptar a ${mascota.nombre}`,
            icono: '📋'
        });

        res.status(201).json({ 
            mensaje: 'Solicitud enviada exitosamente. El estado de la mascota ha cambiado a Pendiente.',
            solicitud: nuevaSolicitud 
        });
    } catch (error) {
        console.error('Error en crearSolicitud:', error);
        res.status(500).json({ mensaje: 'Error al crear la solicitud.', error: error.message });
    }
};

/**
 * Obtiene las solicitudes enviadas por el usuario autenticado (Adoptante).
 * @route GET /api/solicitudes/mias
 * REQUIERE: requerirRol('Adoptante')
 */
export const obtenerSolicitudesPorAdoptante = async (req, res) => {
    try {
        const solicitudes = await SolicitudAdopcion.find({ adoptanteId: req.usuario._id })
            .populate('mascotaId', 'nombre urlsImagenes')
            .populate('rescatistaId', 'nombre telefono');
        res.status(200).json(solicitudes);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener solicitudes del adoptante.', error: error.message });
    }
};

/**
 * Obtiene las solicitudes recibidas por el usuario autenticado (Rescatista o Admin).
 * @route GET /api/solicitudes/recibidas
 * REQUIERE: requerirRol('Rescatista', 'Administrador')
 */
export const obtenerSolicitudesRecibidas = async (req, res) => {
    try {
        const filtros = req.usuario.tipoUsuario === 'Rescatista' ? 
            { rescatistaId: req.usuario._id } : {};
        const solicitudes = await SolicitudAdopcion.find(filtros)
            .populate('adoptanteId', 'nombre correo telefono tipoUsuario')
            .populate('mascotaId', 'nombre tipoAnimal edad edadUnidad tamaño raza ubicacion historia estadoAdopcion urlsImagenes');
        res.status(200).json(solicitudes);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener solicitudes recibidas.', error: error.message });
    }
};

/**
 * Actualiza el estado de una solicitud (Aprobada/Rechazada).
 * @route PUT /api/solicitudes/:id
 * REQUIERE: requerirRol('Rescatista', 'Administrador')
 */
export const actualizarEstadoSolicitud = async (req, res) => {
    try {
        // Aceptar ambos 'estado' y 'estadoSolicitud' para compatibilidad con frontend
        const estadoSolicitud = req.body.estadoSolicitud || req.body.estado;
        const estadosValidos = ['Aprobada', 'Rechazada', 'Cancelada', 'aprobada', 'rechazada', 'cancelada'];
        
        if (!estadosValidos.includes(estadoSolicitud)) {
            return res.status(400).json({ mensaje: 'Estado de solicitud no válido.' });
        }
        
        // Normalizar a mayúsculas
        const estadoNormalizado = estadoSolicitud.charAt(0).toUpperCase() + estadoSolicitud.slice(1).toLowerCase();
        
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ mensaje: 'ID de solicitud inválido.' });
        }
        const solicitud = await SolicitudAdopcion.findById(req.params.id);
        if (!solicitud) {
            return res.status(404).json({ mensaje: 'Solicitud no encontrada.' });
        }
        const esRescatistaDueño = solicitud.rescatistaId.toString() === req.usuario._id.toString();
        const esAdmin = req.usuario.tipoUsuario === 'Administrador';
        if (!esRescatistaDueño && !esAdmin) {
            return res.status(403).json({ mensaje: 'No tiene permiso para modificar esta solicitud.' });
        }
        solicitud.estadoSolicitud = estadoNormalizado;
        await solicitud.save();
        if (estadoNormalizado === 'Aprobada') {
            await Mascota.findByIdAndUpdate(solicitud.mascotaId, { estadoAdopcion: 'Adoptado' });
            await SolicitudAdopcion.updateMany(
                { mascotaId: solicitud.mascotaId, _id: { $ne: solicitud._id } },
                { estadoSolicitud: 'Rechazada' }
            );
        } else if (estadoNormalizado === 'Rechazada' || estadoNormalizado === 'Cancelada') {
            const otrasPendientes = await SolicitudAdopcion.countDocuments({
                mascotaId: solicitud.mascotaId,
                estadoSolicitud: 'Enviada'
            });
            if (otrasPendientes === 0) {
                await Mascota.findByIdAndUpdate(solicitud.mascotaId, { estadoAdopcion: 'Disponible' });
            }
        }
        res.status(200).json({ 
            mensaje: `Estado de la solicitud actualizado a: ${estadoNormalizado}.`,
            solicitud 
        });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al actualizar la solicitud.', error: error.message });
    }
};