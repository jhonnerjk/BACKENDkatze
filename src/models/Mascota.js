import mongoose from 'mongoose';

const MascotaSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre de la mascota es obligatorio'],
    trim: true
  },
  tipoAnimal: {
    type: String,
    enum: ['Perro', 'Gato', 'Otro'],
    required: [true, 'El tipo de animal es obligatorio']
  },
  raza: {
    type: String,
    default: 'Mestizo',
    trim: true
  },
  edad: {
    type: Number,
    required: [true, 'La edad es obligatoria']
  },
  unidadEdad: {
    type: String,
    enum: ['meses', 'años'],
    default: 'meses'
  },
  tamano: {
    type: String,
    enum: ['Chico', 'Mediano', 'Grande'],
    required: true
  },
  genero: {
    type: String,
    enum: ['Macho', 'Hembra', 'Desconocido'],
    default: 'Desconocido'
  },
  historia: {
    type: String,
    default: '',
    trim: true
  },
  urlsImagenes: {
    type: [String],
    required: [true, 'Se requiere al menos una imagen']
  },
  tags: {
    salud: {
      type: [String],
      enum: ['Esterilizado', 'Vacunado'],
      default: []
    },
    caracter: {
      type: [String],
      enum: ['Sociable', 'Juguetón', 'Tímido', 'Independiente', 'Cariñoso'],
      default: []
    }
  },
  estaEsterilizado: {
    type: Boolean,
    default: false
  },
  vacunasAlDia: {
    type: Boolean,
    default: false
  },
  estadoAdopcion: {
    type: String,
    enum: ['Disponible', 'Pendiente', 'Adoptado'],
    default: 'Disponible'
  },
  ubicacion: {
    type: String,
    required: [true, 'La ubicación es obligatoria']
  },
  rescatistaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  }
}, {
  timestamps: true
});

const Mascota = mongoose.model('Mascota', MascotaSchema);
export default Mascota;