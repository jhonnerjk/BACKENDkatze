import mongoose from 'mongoose';
import { connectDB } from './src/config/db.js';
import Post from './src/models/Post.js';
import Usuario from './src/models/Usuario.js';

async function checkData() {
  try {
    await connectDB('mongodb://localhost:27017/Katze');
    
    const posts = await Post.find().limit(3);
    const users = await Usuario.find().limit(3);
    
    console.log('Total posts:', await Post.countDocuments());
    console.log('Total users:', await Usuario.countDocuments());
    
    console.log('\nFirst 3 posts:');
    posts.forEach(p => {
      console.log(`- _id: ${p._id}, autor: ${p.autor}, contenido: ${p.contenido?.substring(0, 30)}...`);
    });
    
    console.log('\nFirst 3 users:');
    users.forEach(u => {
      console.log(`- _id: ${u._id}, nombre: ${u.nombre}, correo: ${u.correo}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkData();
