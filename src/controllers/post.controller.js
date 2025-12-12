import Post from '../models/Post.js';
import mongoose from 'mongoose';

export const obtenerPosts = async (req, res) => {
  try {
    const { categoria } = req.query;
    const filtros = {};
    if (categoria && categoria !== 'Todas') {
      filtros.categoria = categoria;
    }

    const posts = await Post.find(filtros)
      .populate('autor', 'nombre tipoUsuario correo')
      .populate('likes', 'nombre')
      .populate('comentarios.usuario', 'nombre tipoUsuario')
      .populate('comentarios.respuestas.usuario', 'nombre tipoUsuario')
      .sort({ createdAt: -1 });

    res.status(200).json(posts);
  } catch (error) {
    console.error('Error al obtener posts:', error);
    res.status(500).json({ mensaje: 'Error al obtener posts', error: error.message });
  }
};

export const obtenerPostPorId = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ mensaje: 'ID inválido' });
    }

    const post = await Post.findById(req.params.id)
      .populate('autor', 'nombre tipoUsuario correo')
      .populate('likes', 'nombre')
      .populate('comentarios.usuario', 'nombre tipoUsuario')
      .populate('comentarios.respuestas.usuario', 'nombre tipoUsuario');

    if (!post) {
      return res.status(404).json({ mensaje: 'Post no encontrado' });
    }

    res.status(200).json(post);
  } catch (error) {
    console.error('Error al obtener post:', error);
    res.status(500).json({ mensaje: 'Error al obtener post', error: error.message });
  }
};

export const crearPost = async (req, res) => {
  try {
    const { titulo, contenido, categoria, imageIds } = req.body;
    const autorId = req.usuario._id;

    if (!titulo || !contenido) {
      return res.status(400).json({ mensaje: 'Título y contenido son obligatorios' });
    }

    const nuevoPost = new Post({
      titulo,
      contenido,
      categoria: categoria || 'General',
      imageIds: imageIds || [],
      autor: autorId,
      likes: [],
      comentarios: []
    });

    await nuevoPost.save();
    
    const postCompleto = await Post.findById(nuevoPost._id)
      .populate('autor', 'nombre tipoUsuario correo')
      .populate('likes', 'nombre')
      .populate('comentarios.usuario', 'nombre tipoUsuario')
      .populate('comentarios.respuestas.usuario', 'nombre tipoUsuario');

    res.status(201).json({
      mensaje: 'Post creado exitosamente',
      post: postCompleto
    });
  } catch (error) {
    console.error('Error al crear post:', error);
    res.status(500).json({ mensaje: 'Error al crear post', error: error.message });
  }
};

export const agregarLike = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ mensaje: 'ID inválido' });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ mensaje: 'Post no encontrado' });
    }

    const yaLiked = post.likes.includes(usuarioId);
    
    if (yaLiked) {
      post.likes = post.likes.filter(id => id.toString() !== usuarioId.toString());
    } else {
      post.likes.push(usuarioId);
    }

    await post.save();

    const postActualizado = await Post.findById(id)
      .populate('autor', 'nombre tipoUsuario correo')
      .populate('likes', 'nombre')
      .populate('comentarios.usuario', 'nombre tipoUsuario')
      .populate('comentarios.respuestas.usuario', 'nombre tipoUsuario');

    res.status(200).json(postActualizado);
  } catch (error) {
    console.error('Error al dar like:', error);
    res.status(500).json({ mensaje: 'Error al dar like', error: error.message });
  }
};

export const agregarComentario = async (req, res) => {
  try {
    const { id } = req.params;
    const { contenido } = req.body;
    const usuarioId = req.usuario._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ mensaje: 'ID inválido' });
    }

    if (!contenido || contenido.trim() === '') {
      return res.status(400).json({ mensaje: 'El comentario no puede estar vacío' });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ mensaje: 'Post no encontrado' });
    }

    post.comentarios.push({
      usuario: usuarioId,
      contenido: contenido.trim()
    });

    await post.save();

    const postActualizado = await Post.findById(id)
      .populate('autor', 'nombre tipoUsuario correo')
      .populate('likes', 'nombre')
      .populate('comentarios.usuario', 'nombre tipoUsuario')
      .populate('comentarios.respuestas.usuario', 'nombre tipoUsuario');

    res.status(200).json(postActualizado);
  } catch (error) {
    console.error('Error al agregar comentario:', error);
    res.status(500).json({ mensaje: 'Error al agregar comentario', error: error.message });
  }
};

export const eliminarComentario = async (req, res) => {
  try {
    const { id, comentarioId } = req.params;
    const usuarioId = req.usuario._id;
    const esAdmin = req.usuario.tipoUsuario === 'Administrador';

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(comentarioId)) {
      return res.status(400).json({ mensaje: 'ID inválido' });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ mensaje: 'Post no encontrado' });
    }

    const comentario = post.comentarios.id(comentarioId);
    if (!comentario) {
      return res.status(404).json({ mensaje: 'Comentario no encontrado' });
    }

    const esAutorComentario = comentario.usuario.toString() === usuarioId.toString();
    
    if (!esAutorComentario && !esAdmin) {
      return res.status(403).json({ mensaje: 'No tienes permiso para eliminar este comentario' });
    }

    post.comentarios.pull(comentarioId);
    await post.save();

    const postActualizado = await Post.findById(id)
      .populate('autor', 'nombre tipoUsuario correo')
      .populate('likes', 'nombre')
      .populate('comentarios.usuario', 'nombre tipoUsuario')
      .populate('comentarios.respuestas.usuario', 'nombre tipoUsuario');

    res.status(200).json(postActualizado);
  } catch (error) {
    console.error('Error al eliminar comentario:', error);
    res.status(500).json({ mensaje: 'Error al eliminar comentario', error: error.message });
  }
};

export const agregarRespuesta = async (req, res) => {
  try {
    const { id, comentarioId } = req.params;
    const { contenido } = req.body;
    const usuarioId = req.usuario._id;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(comentarioId)) {
      return res.status(400).json({ mensaje: 'ID inválido' });
    }

    if (!contenido || contenido.trim() === '') {
      return res.status(400).json({ mensaje: 'La respuesta no puede estar vacía' });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ mensaje: 'Post no encontrado' });
    }

    const comentario = post.comentarios.id(comentarioId);
    if (!comentario) {
      return res.status(404).json({ mensaje: 'Comentario no encontrado' });
    }

    comentario.respuestas.push({
      usuario: usuarioId,
      contenido: contenido.trim()
    });

    await post.save();

    const postActualizado = await Post.findById(id)
      .populate('autor', 'nombre tipoUsuario correo')
      .populate('likes', 'nombre')
      .populate('comentarios.usuario', 'nombre tipoUsuario')
      .populate('comentarios.respuestas.usuario', 'nombre tipoUsuario');

    res.status(200).json(postActualizado);
  } catch (error) {
    console.error('Error al agregar respuesta:', error);
    res.status(500).json({ mensaje: 'Error al agregar respuesta', error: error.message });
  }
};

export const eliminarRespuesta = async (req, res) => {
  try {
    const { id, comentarioId, respuestaId } = req.params;
    const usuarioId = req.usuario._id;
    const esAdmin = req.usuario.tipoUsuario === 'Administrador';

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(comentarioId) || !mongoose.Types.ObjectId.isValid(respuestaId)) {
      return res.status(400).json({ mensaje: 'ID inválido' });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ mensaje: 'Post no encontrado' });
    }

    const comentario = post.comentarios.id(comentarioId);
    if (!comentario) {
      return res.status(404).json({ mensaje: 'Comentario no encontrado' });
    }

    const respuesta = comentario.respuestas.id(respuestaId);
    if (!respuesta) {
      return res.status(404).json({ mensaje: 'Respuesta no encontrada' });
    }

    const esAutorRespuesta = respuesta.usuario.toString() === usuarioId.toString();
    
    if (!esAutorRespuesta && !esAdmin) {
      return res.status(403).json({ mensaje: 'No tienes permiso para eliminar esta respuesta' });
    }

    comentario.respuestas.pull(respuestaId);
    await post.save();

    const postActualizado = await Post.findById(id)
      .populate('autor', 'nombre tipoUsuario correo')
      .populate('likes', 'nombre')
      .populate('comentarios.usuario', 'nombre tipoUsuario')
      .populate('comentarios.respuestas.usuario', 'nombre tipoUsuario');

    res.status(200).json(postActualizado);
  } catch (error) {
    console.error('Error al eliminar respuesta:', error);
    res.status(500).json({ mensaje: 'Error al eliminar respuesta', error: error.message });
  }
};

export const eliminarPost = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ mensaje: 'ID inválido' });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ mensaje: 'Post no encontrado' });
    }

    // Solo el autor o admin pueden eliminar
    const esAutor = post.autor.toString() === usuarioId.toString();
    const esAdmin = req.usuario.tipoUsuario === 'Administrador';

    if (!esAutor && !esAdmin) {
      return res.status(403).json({ mensaje: 'No tienes permiso para eliminar este post' });
    }

    await Post.findByIdAndDelete(id);

    res.status(200).json({ mensaje: 'Post eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar post:', error);
    res.status(500).json({ mensaje: 'Error al eliminar post', error: error.message });
  }
};
