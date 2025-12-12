import Notificacion from '../models/Notificacion.js';

export const obtenerNotificaciones = async (req, res) => {
  try {
    const usuarioId = req.usuario._id;

    const notificaciones = await Notificacion.find({ usuarioId })
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json(notificaciones);
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({ mensaje: 'Error al obtener notificaciones', error: error.message });
  }
};

export const marcarComoLeida = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario._id;

    const notificacion = await Notificacion.findByIdAndUpdate(
      id,
      { leida: true },
      { new: true }
    );

    if (!notificacion) {
      return res.status(404).json({ mensaje: 'Notificación no encontrada' });
    }

    res.status(200).json(notificacion);
  } catch (error) {
    console.error('Error al marcar como leida:', error);
    res.status(500).json({ mensaje: 'Error al marcar como leida', error: error.message });
  }
};

export const marcarTodasComoLeidas = async (req, res) => {
  try {
    const usuarioId = req.usuario._id;

    await Notificacion.updateMany(
      { usuarioId, leida: false },
      { leida: true }
    );

    res.status(200).json({ mensaje: 'Todas las notificaciones marcadas como leídas' });
  } catch (error) {
    console.error('Error al marcar todas como leidas:', error);
    res.status(500).json({ mensaje: 'Error al marcar todas como leidas', error: error.message });
  }
};

export const eliminarNotificacion = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario._id;

    const notificacion = await Notificacion.findOneAndDelete({
      _id: id,
      usuarioId
    });

    if (!notificacion) {
      return res.status(404).json({ mensaje: 'Notificación no encontrada' });
    }

    res.status(200).json({ mensaje: 'Notificación eliminada' });
  } catch (error) {
    console.error('Error al eliminar notificación:', error);
    res.status(500).json({ mensaje: 'Error al eliminar notificación', error: error.message });
  }
};

export const contarNoLeidas = async (req, res) => {
  try {
    const usuarioId = req.usuario._id;

    const count = await Notificacion.countDocuments({ usuarioId, leida: false });

    res.status(200).json({ noLeidas: count });
  } catch (error) {
    console.error('Error al contar no leídas:', error);
    res.status(500).json({ mensaje: 'Error al contar no leídas', error: error.message });
  }
};
