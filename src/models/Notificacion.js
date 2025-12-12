import mongoose from 'mongoose';

const notificacionSchema = new mongoose.Schema({
  usuarioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  tipo: {
    type: String,
    enum: ['solicitud-aprobada', 'solicitud-rechazada', 'solicitud-pendiente'],
    required: true
  },
  titulo: {
    type: String,
    required: true
  },
  mensaje: {
    type: String,
    required: true
  },
  icono: {
    type: String,
    default: '📢'
  },
  leida: {
    type: Boolean,
    default: false
  },
  referencia: {
    solicitudId: mongoose.Schema.Types.ObjectId,
    tipo: String // 'cambio-rol' o 'eliminacion'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expire: 2592000 // Auto-eliminar después de 30 días
  }
});

const Notificacion = mongoose.model('Notificacion', notificacionSchema);
export default Notificacion;
