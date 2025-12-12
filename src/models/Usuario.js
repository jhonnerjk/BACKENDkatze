import mongoose from 'mongoose';

const usuarioSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true
  },
  correo: {
    type: String,
    required: [true, 'El correo electrónico es obligatorio'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Por favor, usa un correo electrónico válido']
  },
  contrasena: {
    type: String,
    required: [true, 'La contraseña es obligatoria'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres']
  },
  telefono: {
    type: String,
    trim: true
  },
  direccion: {
    ciudad: { type: String, trim: true },
    pais: { type: String, trim: true }
  },
  
  // Campo clave para diferenciar roles
  tipoUsuario: {
    type: String,
    enum: ['Adoptante', 'Rescatista', 'Administrador'],
    default: 'Adoptante',
    required: true
  },

  // Campos específicos para Rescatista
  direccionResguardo: { type: String, trim: true },
  capacidadMaxima: { type: Number, default: 0 },
  
  // Foto de perfil
  fotoPerfil: {
    type: String,
    default: null
  },
  // Estado de eliminación
  eliminado: {
    type: Boolean,
    default: false
  },
  fechaEliminacion: {
    type: Date,
    default: null
  },
  // Referencias a otros modelos
  mascotasEnCuidado: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mascota'
  }],
  mascotasFavoritas: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mascota'
  }],
  solicitudesPendientes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SolicitudAdopcion'
  }]
}, {
  timestamps: true // Añade campos createdAt y updatedAt automáticamente
}); 

const Usuario = mongoose.model('Usuario', usuarioSchema);
export default Usuario;