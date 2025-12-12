import mongoose from 'mongoose';
import { connectDB } from './src/config/db.js';
import Post from './src/models/Post.js';
import Usuario from './src/models/Usuario.js';

async function debugPopulate() {
  try {
    await connectDB('mongodb://localhost:27017/Katze');
    
    // Get one post
    const post = await Post.findOne();
    console.log('Post encontrado:', post?._id);
    console.log('Post autor ID:', post?.autor);
    
    // Try to find the usuario
    const user = await Usuario.findById(post?.autor);
    console.log('Usuario encontrado:', user?.nombre);
    
    // Try populate
    const postWithAutor = await Post.findOne().populate('autor', 'nombre tipoUsuario');
    console.log('Post con populate:');
    console.log('- autor:', postWithAutor?.autor);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugPopulate();
