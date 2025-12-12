import mongoose from 'mongoose';

const SolicitudAdopcionSchema = new mongoose.Schema({
  // Referencia al Adoptante que envía la solicitud
  adoptanteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  
  // Referencia a la Mascota solicitada
  mascotaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mascota',
    required: true
  },

  // Referencia al Rescatista dueño de la Mascota
  rescatistaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  
  preguntasAdicionales: {
    type: String,
    default: 'No se proveyó información adicional.'
  },
  
  estadoSolicitud: {
    type: String,
    enum: ['Enviada', 'Revisando', 'Aprobada', 'Rechazada', 'Cancelada'],
    default: 'Enviada'
  }
}, {
  timestamps: true
});

const SolicitudAdopcion = mongoose.model('SolicitudAdopcion', SolicitudAdopcionSchema);
export default SolicitudAdopcion;