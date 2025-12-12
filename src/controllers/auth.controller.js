// src/controllers/autenticacionController.js

import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import Usuario from '../models/Usuario.js';

// --- Funciones de Utilidad ---
const generarToken = (usuario) => {
    return jwt.sign(
        {
            sub: usuario._id,
            rol: usuario.tipoUsuario
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );
};
/**
 * Función para registrar un nuevo usuario (Adoptante por defecto).
 * @route POST /api/auth/registro
 */
export const registrarUsuario = async (req, res) => {
    const { nombre, correo, contrasena, tipoUsuario } = req.body;
    const usuarioExistente = await Usuario.findOne({ correo });
    if (usuarioExistente) {
        return res.status(400).json({ mensaje: 'El correo ya está registrado.' });
    }
    const salt = await bcrypt.genSalt(10);
    const contrasenaHash = await bcrypt.hash(contrasena, salt);

    // Usuarios no admin quedan pendientes por aprobación manual
    const estadoCuenta = tipoUsuario === 'Administrador' ? 'aprobado' : 'pendiente';

    const nuevoUsuario = await Usuario.create({
        nombre,
        correo,
        contrasena: contrasenaHash,
        tipoUsuario: tipoUsuario || 'Adoptante',
        estadoCuenta
    });
    const token = generarToken(nuevoUsuario);
    res.status(201).json({
        id: nuevoUsuario._id,
        nombre: nuevoUsuario.nombre,
        correo: nuevoUsuario.correo,
        tipoUsuario: nuevoUsuario.tipoUsuario,
        token
    });
};


/**
 * Función para que un usuario inicie sesión.
 * @route POST /api/auth/login
 */
export const iniciarSesion = async (req, res) => {
    const { correo, contrasena } = req.body;
    const usuario = await Usuario.findOne({ correo });
    
    // Verificar si la cuenta fue eliminada
    if (usuario && usuario.eliminado) {
        return res.status(403).json({ 
            mensaje: 'Esta cuenta ha sido eliminada y no puede acceder al sistema.' 
        });
    }
    
    if (!usuario || !(await bcrypt.compare(contrasena, usuario.contrasena))) {
        return res.status(401).json({ mensaje: 'Credenciales inválidas.' });
    }

    // Si tiene control de aprobación y no está aprobado, no deja iniciar
    if (usuario.estadoCuenta && usuario.estadoCuenta !== 'aprobado') {
        return res.status(403).json({ mensaje: 'Cuenta pendiente de aprobación por un administrador.' });
    }
    const token = generarToken(usuario);
    res.json({
        id: usuario._id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        tipoUsuario: usuario.tipoUsuario,
        estadoCuenta: usuario.estadoCuenta || 'aprobado',
        token
    });
};


/**
 * Función para obtener el perfil del usuario logueado.
 * @route GET /api/auth/perfil
 * REQUIERE: requerirAutenticacion (req.usuario ya está adjunto)
 */
export const obtenerPerfilUsuario = (req, res) => {
    res.json({
        id: req.usuario._id,
        nombre: req.usuario.nombre,
        correo: req.usuario.correo,
        tipoUsuario: req.usuario.tipoUsuario,
        telefono: req.usuario.telefono,
        direccion: req.usuario.direccion?.ciudad || req.usuario.direccion || '',
        fotoPerfil: req.usuario.fotoPerfil,
    });
};

/**
 * Función para actualizar el perfil del usuario.
 * @route PUT /api/auth/perfil
 * REQUIERE: requerirAutenticacion
 */
export const actualizarPerfilUsuario = async (req, res) => {
    try {
        const { nombre, telefono, direccion, fotoPerfil } = req.body;
        const usuarioId = req.usuario._id;

        // Construir objeto con los campos a actualizar
        const actualizaciones = {};
        if (nombre) actualizaciones.nombre = nombre;
        if (telefono) actualizaciones.telefono = telefono;
        // Manejar dirección: si es string, ponerla en ciudad; si es objeto, usar tal cual
        if (direccion) {
            if (typeof direccion === 'string') {
                actualizaciones['direccion.ciudad'] = direccion;
            } else {
                actualizaciones.direccion = direccion;
            }
        }
        if (fotoPerfil) actualizaciones.fotoPerfil = fotoPerfil;

        // Actualizar usuario
        const usuarioActualizado = await Usuario.findByIdAndUpdate(
            usuarioId,
            actualizaciones,
            { new: true, runValidators: true }
        );

        if (!usuarioActualizado) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
        }

        res.json({
            mensaje: 'Perfil actualizado exitosamente.',
            usuario: {
                id: usuarioActualizado._id,
                nombre: usuarioActualizado.nombre,
                correo: usuarioActualizado.correo,
                tipoUsuario: usuarioActualizado.tipoUsuario,
                telefono: usuarioActualizado.telefono,
                direccion: usuarioActualizado.direccion?.ciudad || usuarioActualizado.direccion || '',
                fotoPerfil: usuarioActualizado.fotoPerfil,
            }
        });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al actualizar perfil.', error: error.message });
    }
};