// src/seed/seed.js

import 'dotenv/config'; 
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import Usuario from '../models/Usuario.js';
import Mascota from '../models/Mascota.js';
import SolicitudAdopcion from '../models/SolicitudAdopcion.js';

// --- CONFIGURACIÓN Y DATOS DUMMY ---
const MONGO_URI = process.env.MONGO_URI;
const PASSWORD_BASE = '123456';
const SALT_ROUNDS = 10;

// 1. Datos de Usuarios
const usuariosDummy = [
    { nombre: 'Admin Master', correo: 'admin@test.com', contrasena: PASSWORD_BASE, tipoUsuario: 'Administrador' },
    { nombre: 'Maria Rescatista', correo: 'maria@test.com', contrasena: PASSWORD_BASE, tipoUsuario: 'Rescatista', ubicacion: 'Santa Cruz' },
    { nombre: 'Pedro Adoptante', correo: 'pedro@test.com', contrasena: PASSWORD_BASE, tipoUsuario: 'Adoptante' },
];

// 2. Función Principal
const sembrarDB = async () => {
    try {
        if (!MONGO_URI) {
            console.error('❌ Error: MONGO_URI no está definida. Revise su archivo .env');
            process.exit(1);
        }

        // Conexión a la DB
        await mongoose.connect(MONGO_URI);
        console.log('✅ Conexión a MongoDB establecida para sembrar.');

        // 3. Limpiar la base de datos (Borrar datos existentes)
        await Usuario.deleteMany({});
        await Mascota.deleteMany({});
        await SolicitudAdopcion.deleteMany({});
        console.log('Datos existentes borrados exitosamente.');

        // 4. Crear Usuarios
        const contrasenaHashed = await bcrypt.hash(PASSWORD_BASE, SALT_ROUNDS);
        
        // Reemplazar la contraseña en los datos dummy
        usuariosDummy.forEach(user => user.contrasena = contrasenaHashed);

        const usuariosCreados = await Usuario.insertMany(usuariosDummy);
        
        // Asignar IDs para referencias futuras
        const adminId = usuariosCreados.find(u => u.tipoUsuario === 'Administrador')._id;
        const rescatistaId = usuariosCreados.find(u => u.tipoUsuario === 'Rescatista')._id;
        const adoptanteId = usuariosCreados.find(u => u.tipoUsuario === 'Adoptante')._id;
        
        console.log(`${usuariosCreados.length} usuarios creados. (Admin: ${adminId})`);


        // 5. Crear Mascotas (referenciando al Rescatista)
        const mascotasDummy = [
            { 
                nombre: 'Sol', tipoAnimal: 'Gato', raza: 'Siamés', edad: 2, genero: 'Hembra', 
                descripcion: 'Gata muy juguetona, sociable y cariñosa. Ideal para familias.', 
                urlsImagenes: ['/uploads/pets/gato_sol.jpg'], estaEsterilizado: true, vacunasAlDia: true, 
                estadoAdopcion: 'Disponible', ubicacion: 'Santa Cruz', rescatistaId: rescatistaId 
            },
            { 
                nombre: 'Rocco', tipoAnimal: 'Perro', raza: 'Labrador', edad: 5, genero: 'Macho', 
                descripcion: 'Perro guardián tranquilo, necesita espacio amplio.', 
                urlsImagenes: ['/uploads/pets/perro_rocco.jpg'], estaEsterilizado: false, vacunasAlDia: true, 
                estadoAdopcion: 'Pendiente', ubicacion: 'Santa Cruz', rescatistaId: rescatistaId 
            }
        ];

        await Mascota.insertMany(mascotasDummy);
        console.log(`${mascotasDummy.length} mascotas creadas.`);


        // 6. Crear una Solicitud de Ejemplo (referenciando al Adoptante)
        const mascotaRocco = await Mascota.findOne({ nombre: 'Rocco' });
        
        if (mascotaRocco) {
            await SolicitudAdopcion.create({
                adoptanteId: adoptanteId,
                mascotaId: mascotaRocco._id,
                rescatistaId: rescatistaId,
                preguntasAdicionales: 'Tengo un patio grande y dos niños que aman los perros.'
            });
            console.log('1 solicitud de adopción de ejemplo creada.');
        }

        console.log('\n✨ ¡Proceso de siembra finalizado con éxito! ✨');
        process.exit();

    } catch (error) {
        console.error('Fatal error en el Script Seed:', error.message);
        process.exit(1);
    }
};

sembrarDB();