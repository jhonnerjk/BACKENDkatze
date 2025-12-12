import mongoose from 'mongoose';

const PostSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: [true, 'El título es obligatorio'],
    trim: true
  },
  contenido: {
    type: String,
    required: [true, 'El contenido es obligatorio'],
    trim: true
  },
  categoria: {
    type: String,
    enum: ['General', 'Historias', 'Consejos', 'Preguntas', 'Eventos'],
    default: 'General'
  },
  imageIds: {
    type: [String],
    default: []
  },
  autor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  }],
  comentarios: [{
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario'
    },
    contenido: String,
    respuestas: [{
      usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario'
      },
      contenido: String,
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

const Post = mongoose.model('Post', PostSchema);
export default Post;
