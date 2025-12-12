// src/controllers/usuarioController.js

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import Usuario from '../models/Usuario.js';
import Mascota from '../models/Mascota.js';
import SolicitudAdopcion from '../models/SolicitudAdopcion.js';

/**
 * Lista usuarios con estadoCuenta = 'pendiente'.
 * @route GET /api/usuarios/pendientes
 * REQUIERE: requerirRol('Administrador')
 */
export const obtenerUsuariosPendientes = async (req, res) => {
    try {
        const usuarios = await Usuario.find({ estadoCuenta: 'pendiente' }).select('-contrasena');
        res.status(200).json(usuarios);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener usuarios pendientes.', error: error.message });
    }
};

/**
 * Aprueba un usuario (estadoCuenta = 'aprobado').
 * @route PATCH /api/usuarios/:id/aprobar
 * REQUIERE: requerirRol('Administrador')
 */
export const aprobarUsuario = async (req, res) => {
    try {
        const usuarioId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(usuarioId)) {
            return res.status(400).json({ mensaje: 'ID de usuario inválido.' });
        }
        const usuario = await Usuario.findByIdAndUpdate(
            usuarioId,
            { estadoCuenta: 'aprobado' },
            { new: true, runValidators: true }
        ).select('-contrasena');

        if (!usuario) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
        }

        res.status(200).json({ mensaje: 'Usuario aprobado.', usuario });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al aprobar usuario.', error: error.message });
    }
};

/**
 * Rechaza un usuario (estadoCuenta = 'rechazado').
 * @route PATCH /api/usuarios/:id/rechazar
 * REQUIERE: requerirRol('Administrador')
 */
export const rechazarUsuario = async (req, res) => {
    try {
        const usuarioId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(usuarioId)) {
            return res.status(400).json({ mensaje: 'ID de usuario inválido.' });
        }
        const usuario = await Usuario.findByIdAndUpdate(
            usuarioId,
            { estadoCuenta: 'rechazado' },
            { new: true, runValidators: true }
        ).select('-contrasena');

        if (!usuario) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
        }

        res.status(200).json({ mensaje: 'Usuario rechazado.', usuario });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al rechazar usuario.', error: error.message });
    }
};

/**
 * Obtiene la lista de todos los usuarios del sistema.
 * @route GET /api/usuarios
 * REQUIERE: requerirRol('Administrador')
 */
export const obtenerUsuarios = async (req, res) => {
    try {
        // El Administrador debe ver todos los datos excepto contraseñas
        const usuarios = await Usuario.find().select('-contrasena');
        res.status(200).json(usuarios);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener usuarios.', error: error.message });
    }
};

/**
 * Obtiene un usuario específico por su ID.
 * @route GET /api/usuarios/:id
 * REQUIERE: requerirRol('Administrador')
 */
export const obtenerUsuarioPorId = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ mensaje: 'ID de usuario inválido.' });
        }
        const usuario = await Usuario.findById(req.params.id).select('-contrasena');
        if (!usuario) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
        }
        res.status(200).json(usuario);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener el usuario.', error: error.message });
    }
};


/**
 * Actualiza los datos de un usuario por su ID (función administrativa).
 * @route PUT /api/usuarios/:id
 * REQUIERE: requerirRol('Administrador')
 */
export const actualizarUsuario = async (req, res) => {
    try {
        const usuarioId = req.params.id;
        const { contrasena, ...restoDatos } = req.body;
        if (!mongoose.Types.ObjectId.isValid(usuarioId)) {
            return res.status(400).json({ mensaje: 'ID de usuario inválido.' });
        }
        if (contrasena) {
            const salt = await bcrypt.genSalt(10);
            restoDatos.contrasena = await bcrypt.hash(contrasena, salt);
        }
        const usuarioActualizado = await Usuario.findByIdAndUpdate(
            usuarioId,
            restoDatos,
            { new: true, runValidators: true }
        ).select('-contrasena');
        if (!usuarioActualizado) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
        }
        res.status(200).json({ mensaje: 'Usuario actualizado exitosamente.', usuario: usuarioActualizado });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al actualizar el usuario.', error: error.message });
    }
};


/**
 * Elimina un usuario por su ID.
 * @route DELETE /api/usuarios/:id
 * REQUIERE: requerirRol('Administrador')
 */
export const eliminarUsuario = async (req, res) => {
    try {
        const usuarioId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(usuarioId)) {
            return res.status(400).json({ mensaje: 'ID de usuario inválido.' });
        }
        const resultado = await Usuario.findByIdAndDelete(usuarioId);
        if (!resultado) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
        }
        if (resultado.tipoUsuario === 'Rescatista') {
            await Mascota.updateMany(
                { rescatistaId: usuarioId },
                { rescatistaId: null }
            );
        }
        await SolicitudAdopcion.deleteMany({ $or: [{ adoptanteId: usuarioId }, { rescatistaId: usuarioId }] });
        res.status(200).json({ mensaje: 'Usuario eliminado exitosamente y referencias limpiadas.' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar el usuario.', error: error.message });
    }
};