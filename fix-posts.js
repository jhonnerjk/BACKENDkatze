import mongoose from 'mongoose';
import { connectDB } from './src/config/db.js';
import Post from './src/models/Post.js';
import Usuario from './src/models/Usuario.js';

async function fixPosts() {
  try {
    await connectDB('mongodb://localhost:27017/Katze');
    
    // Get all posts without autor
    const postsWithoutAutor = await Post.find({ $or: [{ autor: null }, { autor: { $exists: false } }] });
    console.log(`Found ${postsWithoutAutor.length} posts without autor`);
    
    // Get the first user from database (Admin Katze)
    const adminUser = await Usuario.findOne({ nombre: 'Admin Katze' });
    
    if (!adminUser) {
      console.log('No admin user found in database!');
      process.exit(1);
    }
    
    console.log(`Using admin user: ${adminUser._id} (${adminUser.nombre})`);
    
    // Update all posts with broken referencias to use admin user
    const result = await Post.updateMany(
      { autor: new mongoose.Types.ObjectId('69388db3788340c8686a816d') },
      { $set: { autor: adminUser._id } }
    );
    
    console.log(`Updated ${result.modifiedCount} posts with broken autor reference`);
    
    // Delete all posts that still have null autor after update
    const deleteResult = await Post.deleteMany({ autor: null });
    console.log(`Deleted ${deleteResult.deletedCount} posts with null autor`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixPosts();
