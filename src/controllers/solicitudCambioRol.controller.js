import SolicitudCambioRol from '../models/SolicitudCambioRol.js';
import Usuario from '../models/Usuario.js';
import Notificacion from '../models/Notificacion.js';
import mongoose from 'mongoose';

export const crearSolicitudCambioRol = async (req, res) => {
  try {
    const { motivacion, detalles } = req.body;
    const usuarioId = req.usuario._id;

    // Verificar si ya existe una solicitud pendiente
    const solicitudExistente = await SolicitudCambioRol.findOne({
      usuarioId,
      estado: 'Pendiente'
    });

    if (solicitudExistente) {
      return res.status(400).json({ mensaje: 'Ya tienes una solicitud de cambio de rol pendiente' });
    }

    // Verificar que no sea ya rescatista
    const usuario = await Usuario.findById(usuarioId);
    if (usuario.tipoUsuario === 'Rescatista') {
      return res.status(400).json({ mensaje: 'Ya eres rescatista' });
    }

    const solicitud = new SolicitudCambioRol({
      usuarioId,
      nuevoRol: 'Rescatista',
      motivacion: motivacion || '',
      detalles: detalles || ''
    });

    await solicitud.save();

    const solicitudPopulada = await SolicitudCambioRol.findById(solicitud._id)
      .populate('usuarioId', 'nombre correo');

    res.status(201).json({
      mensaje: 'Solicitud de cambio de rol creada exitosamente',
      solicitud: solicitudPopulada
    });
  } catch (error) {
    console.error('Error al crear solicitud de cambio de rol:', error);
    res.status(500).json({ mensaje: 'Error al crear solicitud', error: error.message });
  }
};

export const obtenerSolicitudesCambioRol = async (req, res) => {
  try {
    const { estado } = req.query;
    const filtros = {};

    if (estado) {
      filtros.estado = estado;
    }

    const solicitudes = await SolicitudCambioRol.find(filtros)
      .populate('usuarioId', 'nombre correo telefono direccion tipoUsuario')
      .populate('respuestaAdmin.respondidoPor', 'nombre')
      .sort({ createdAt: -1 });

    res.status(200).json(solicitudes);
  } catch (error) {
    console.error('Error al obtener solicitudes:', error);
    res.status(500).json({ mensaje: 'Error al obtener solicitudes', error: error.message });
  }
};

export const obtenerSolicitudCambioRolPorUsuario = async (req, res) => {
  try {
    const usuarioId = req.usuario._id;

    const solicitud = await SolicitudCambioRol.findOne({ usuarioId })
      .sort({ createdAt: -1 });

    if (!solicitud) {
      return res.status(404).json({ mensaje: 'No hay solicitud de cambio de rol' });
    }

    res.status(200).json(solicitud);
  } catch (error) {
    console.error('Error al obtener solicitud:', error);
    res.status(500).json({ mensaje: 'Error al obtener solicitud', error: error.message });
  }
};

export const aprobarSolicitudCambioRol = async (req, res) => {
  try {
    const { id } = req.params;
    const { comentario } = req.body;
    const adminId = req.usuario._id;
    const io = req.app.get('io');

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ mensaje: 'ID inválido' });
    }

    const solicitud = await SolicitudCambioRol.findById(id);
    if (!solicitud) {
      return res.status(404).json({ mensaje: 'Solicitud no encontrada' });
    }

    // Obtener datos del usuario ANTES de actualizar
    const usuario = await Usuario.findById(solicitud.usuarioId);

    // Cambiar el rol del usuario a Rescatista
    await Usuario.findByIdAndUpdate(solicitud.usuarioId, {
      tipoUsuario: 'Rescatista'
    });

    // Actualizar solicitud
    solicitud.estado = 'Aprobada';
    solicitud.respuestaAdmin = {
      comentario: comentario || 'Solicitud aprobada',
      respondidoPor: adminId,
      fechaRespuesta: new Date()
    };
    await solicitud.save();

    const solicitudActualizada = await SolicitudCambioRol.findById(id)
      .populate('usuarioId', 'nombre correo')
      .populate('respuestaAdmin.respondidoPor', 'nombre');

    // Emitir notificación al usuario por Socket.io
    if (io) {
      io.emit('solicitud-cambio-rol-aprobada', {
        usuarioId: solicitud.usuarioId._id.toString(),
        mensaje: `¡Felicidades ${usuario.nombre}! Tu solicitud para ser Rescatista ha sido aprobada. ¡Bienvenido a Katze!`,
        solicitud: solicitudActualizada
      });
    }

    // Guardar notificación en base de datos
    const notificacion = new Notificacion({
      usuarioId: solicitud.usuarioId,
      tipo: 'solicitud-aprobada',
      titulo: 'Solicitud Aprobada',
      mensaje: `¡Felicidades! Tu solicitud para ser Rescatista ha sido aprobada. ¡Bienvenido a Katze!`,
      icono: '🚑',
      referencia: {
        solicitudId: id,
        tipo: 'cambio-rol'
      }
    });
    await notificacion.save();

    res.status(200).json({
      mensaje: 'Rol cambiado a Rescatista exitosamente',
      solicitud: solicitudActualizada
    });
  } catch (error) {
    console.error('Error al aprobar solicitud:', error);
    res.status(500).json({ mensaje: 'Error al procesar solicitud', error: error.message });
  }
};

export const rechazarSolicitudCambioRol = async (req, res) => {
  try {
    const { id } = req.params;
    const { comentario } = req.body;
    const adminId = req.usuario._id;
    const io = req.app.get('io');

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ mensaje: 'ID inválido' });
    }

    const solicitud = await SolicitudCambioRol.findById(id);
    if (!solicitud) {
      return res.status(404).json({ mensaje: 'Solicitud no encontrada' });
    }

    // Obtener datos del usuario
    const usuario = await Usuario.findById(solicitud.usuarioId);

    solicitud.estado = 'Rechazada';
    solicitud.respuestaAdmin = {
      comentario: comentario || 'Solicitud rechazada',
      respondidoPor: adminId,
      fechaRespuesta: new Date()
    };
    await solicitud.save();

    const solicitudActualizada = await SolicitudCambioRol.findById(id)
      .populate('usuarioId', 'nombre correo')
      .populate('respuestaAdmin.respondidoPor', 'nombre');

    // Emitir notificación al usuario por Socket.io
    if (io) {
      io.emit('solicitud-cambio-rol-rechazada', {
        usuarioId: solicitud.usuarioId._id.toString(),
        mensaje: `Tu solicitud para ser Rescatista ha sido revisada. Motivo: ${comentario || 'Solicitud rechazada'}`,
        solicitud: solicitudActualizada
      });
    }

    // Guardar notificación en base de datos
    const notificacion = new Notificacion({
      usuarioId: solicitud.usuarioId,
      tipo: 'solicitud-rechazada',
      titulo: '❌ Solicitud Rechazada',
      mensaje: `Tu solicitud para ser Rescatista ha sido revisada. ${comentario ? `Motivo: ${comentario}` : ''}`,
      icono: '❌',
      referencia: {
        solicitudId: id,
        tipo: 'cambio-rol'
      }
    });
    await notificacion.save();

    res.status(200).json({
      mensaje: 'Solicitud rechazada',
      solicitud: solicitudActualizada
    });
  } catch (error) {
    console.error('Error al rechazar solicitud:', error);
    res.status(500).json({ mensaje: 'Error al rechazar solicitud', error: error.message });
  }
};

export const cancelarSolicitudCambioRol = async (req, res) => {
  try {
    const usuarioId = req.usuario._id;

    const solicitud = await SolicitudCambioRol.findOneAndDelete({
      usuarioId,
      estado: 'Pendiente'
    });

    if (!solicitud) {
      return res.status(404).json({ mensaje: 'No hay solicitud pendiente para cancelar' });
    }

    res.status(200).json({ mensaje: 'Solicitud cancelada' });
  } catch (error) {
    console.error('Error al cancelar solicitud:', error);
    res.status(500).json({ mensaje: 'Error al cancelar solicitud', error: error.message });
  }
};
