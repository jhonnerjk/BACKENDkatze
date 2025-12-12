import mongoose from 'mongoose';
import { connectDB } from './src/config/db.js';
import Usuario from './src/models/Usuario.js';

async function listAllUsers() {
  try {
    await connectDB('mongodb://localhost:27017/Katze');
    
    const users = await Usuario.find();
    console.log('Todos los usuarios:');
    users.forEach(u => {
      console.log(`- _id: ${u._id}, nombre: ${u.nombre}, correo: ${u.correo}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

listAllUsers();
