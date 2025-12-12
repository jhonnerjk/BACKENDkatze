import mongoose from 'mongoose';
import { connectDB } from './src/config/db.js';
import Mascota from './src/models/Mascota.js';

async function checkMascotas() {
  try {
    await connectDB('mongodb://localhost:27017/Katze');
    
    const mascotas = await Mascota.find().limit(3);
    console.log('Total mascotas:', await Mascota.countDocuments());
    
    mascotas.forEach(m => {
      console.log(`- _id: ${m._id}, nombre: ${m.nombre}, rescatistaId: ${m.rescatistaId}, estadoAdopcion: ${m.estadoAdopcion}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkMascotas();
