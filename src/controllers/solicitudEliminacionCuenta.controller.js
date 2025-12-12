import SolicitudEliminacionCuenta from '../models/SolicitudEliminacionCuenta.js';
import Usuario from '../models/Usuario.js';
import Notificacion from '../models/Notificacion.js';
import mongoose from 'mongoose';

export const crearSolicitudEliminacion = async (req, res) => {
  try {
    const { razonEliminacion, detalles } = req.body;
    const usuarioId = req.usuario._id;

    if (!razonEliminacion) {
      return res.status(400).json({ mensaje: 'La razón de eliminación es obligatoria' });
    }

    // Verificar si ya existe una solicitud pendiente
    const solicitudExistente = await SolicitudEliminacionCuenta.findOne({
      usuarioId,
      estado: 'Pendiente'
    });

    if (solicitudExistente) {
      return res.status(400).json({ mensaje: 'Ya tienes una solicitud de eliminación pendiente' });
    }

    const solicitud = new SolicitudEliminacionCuenta({
      usuarioId,
      razonEliminacion,
      detalles: detalles || ''
    });

    await solicitud.save();

    const solicitudPopulada = await SolicitudEliminacionCuenta.findById(solicitud._id)
      .populate('usuarioId', 'nombre correo');

    res.status(201).json({
      mensaje: 'Solicitud de eliminación creada exitosamente',
      solicitud: solicitudPopulada
    });
  } catch (error) {
    console.error('Error al crear solicitud de eliminación:', error);
    res.status(500).json({ mensaje: 'Error al crear solicitud', error: error.message });
  }
};

export const obtenerSolicitudesEliminacion = async (req, res) => {
  try {
    const { estado } = req.query;
    const filtros = {};

    if (estado) {
      filtros.estado = estado;
    }

    const solicitudes = await SolicitudEliminacionCuenta.find(filtros)
      .populate('usuarioId', 'nombre correo telefono tipoUsuario')
      .populate('respuestaAdmin.respondidoPor', 'nombre')
      .sort({ createdAt: -1 });

    res.status(200).json(solicitudes);
  } catch (error) {
    console.error('Error al obtener solicitudes:', error);
    res.status(500).json({ mensaje: 'Error al obtener solicitudes', error: error.message });
  }
};

export const obtenerSolicitudEliminacionPorUsuario = async (req, res) => {
  try {
    const usuarioId = req.usuario._id;

    const solicitud = await SolicitudEliminacionCuenta.findOne({ usuarioId })
      .sort({ createdAt: -1 });

    if (!solicitud) {
      return res.status(200).json(null);
    }

    res.status(200).json(solicitud);
  } catch (error) {
    console.error('Error al obtener solicitud:', error);
    res.status(500).json({ mensaje: 'Error al obtener solicitud', error: error.message });
  }
};

export const aprobarSolicitudEliminacion = async (req, res) => {
  try {
    const { id } = req.params;
    const { comentario } = req.body;
    const adminId = req.usuario._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ mensaje: 'ID inválido' });
    }

    const solicitud = await SolicitudEliminacionCuenta.findById(id);
    if (!solicitud) {
      return res.status(404).json({ mensaje: 'Solicitud no encontrada' });
    }

    // Marcar usuario como eliminado en lugar de borrarlo
    await Usuario.findByIdAndUpdate(solicitud.usuarioId, {
      eliminado: true,
      fechaEliminacion: new Date()
    });

    // Actualizar solicitud
    solicitud.estado = 'Aprobada';
    solicitud.respuestaAdmin = {
      comentario: comentario || 'Solicitud aprobada',
      respondidoPor: adminId,
      fechaRespuesta: new Date()
    };
    await solicitud.save();

    // Guardar notificación
    await Notificacion.create({
      usuarioId: solicitud.usuarioId,
      tipo: 'solicitud-aprobada',
      titulo: '✅ Solicitud de Eliminación Aprobada',
      mensaje: 'Tu solicitud de eliminación de cuenta ha sido aprobada.',
      icono: '✅',
      referencia: {
        id: solicitud._id,
        tipo: 'eliminacion'
      }
    });

    res.status(200).json({
      mensaje: 'Cuenta eliminada exitosamente',
      solicitud
    });
  } catch (error) {
    console.error('Error al aprobar solicitud:', error);
    res.status(500).json({ mensaje: 'Error al procesar solicitud', error: error.message });
  }
};

export const rechazarSolicitudEliminacion = async (req, res) => {
  try {
    const { id } = req.params;
    const { comentario } = req.body;
    const adminId = req.usuario._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ mensaje: 'ID inválido' });
    }

    const solicitud = await SolicitudEliminacionCuenta.findById(id);
    if (!solicitud) {
      return res.status(404).json({ mensaje: 'Solicitud no encontrada' });
    }

    solicitud.estado = 'Rechazada';
    solicitud.respuestaAdmin = {
      comentario: comentario || 'Solicitud rechazada',
      respondidoPor: adminId,
      fechaRespuesta: new Date()
    };
    await solicitud.save();

    // Guardar notificación
    await Notificacion.create({
      usuarioId: solicitud.usuarioId,
      tipo: 'solicitud-rechazada',
      titulo: '❌ Solicitud de Eliminación Rechazada',
      mensaje: 'Tu solicitud de eliminación de cuenta ha sido rechazada.',
      icono: '❌',
      referencia: {
        id: solicitud._id,
        tipo: 'eliminacion'
      }
    });

    const solicitudActualizada = await SolicitudEliminacionCuenta.findById(id)
      .populate('usuarioId', 'nombre correo')
      .populate('respuestaAdmin.respondidoPor', 'nombre');

    res.status(200).json({
      mensaje: 'Solicitud rechazada',
      solicitud: solicitudActualizada
    });
  } catch (error) {
    console.error('Error al rechazar solicitud:', error);
    res.status(500).json({ mensaje: 'Error al rechazar solicitud', error: error.message });
  }
};

export const cancelarSolicitudEliminacion = async (req, res) => {
  try {
    const usuarioId = req.usuario._id;

    const solicitud = await SolicitudEliminacionCuenta.findOneAndDelete({
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
