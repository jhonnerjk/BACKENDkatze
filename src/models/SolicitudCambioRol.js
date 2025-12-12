import mongoose from 'mongoose';

const solicitudCambioRolSchema = new mongoose.Schema({
  usuarioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  nuevoRol: {
    type: String,
    enum: ['Rescatista'],
    required: true
  },
  motivacion: {
    type: String,
    trim: true,
    maxlength: 500
  },
  detalles: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  estado: {
    type: String,
    enum: ['Pendiente', 'Aprobada', 'Rechazada'],
    default: 'Pendiente'
  },
  respuestaAdmin: {
    comentario: String,
    respondidoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario'
    },
    fechaRespuesta: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const SolicitudCambioRol = mongoose.model('SolicitudCambioRol', solicitudCambioRolSchema);
export default SolicitudCambioRol;
