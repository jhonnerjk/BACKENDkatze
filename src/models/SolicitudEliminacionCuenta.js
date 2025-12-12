import mongoose from 'mongoose';

const SolicitudEliminacionCuentaSchema = new mongoose.Schema({
  usuarioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  
  razonEliminacion: {
    type: String,
    enum: ['Ya no uso la aplicacion', 'Problemas de privacidad', 'Cambio de plataforma', 'Razones personales', 'Otra'],
    required: true
  },
  
  detalles: {
    type: String,
    trim: true,
    maxlength: 500
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
  }
}, {
  timestamps: true
});

const SolicitudEliminacionCuenta = mongoose.model('SolicitudEliminacionCuenta', SolicitudEliminacionCuentaSchema);
export default SolicitudEliminacionCuenta;
