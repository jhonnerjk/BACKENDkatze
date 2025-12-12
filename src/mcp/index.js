import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import mongoose from "mongoose";
import dotenv from "dotenv";

import Mascota from "../models/Mascota.js";
import SolicitudAdopcion from "../models/SolicitudAdopcion.js";
import Usuario from "../models/Usuario.js";

dotenv.config();

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const MONGO_URI = process.env.MONGODB_URI;

if (!GEMINI_KEY || !MONGO_URI) {
  console.error("❌ Faltan variables de entorno (GEMINI_API_KEY o MONGODB_URI)");
  process.exit(1);
}

try {
  await mongoose.connect(MONGO_URI);
  console.error("✅ [MCP] Conectado a MongoDB");
} catch (err) {
  console.error("❌ [MCP] Error conectando a MongoDB:", err.message);
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const server = new Server(
  {
    name: "katze-backend-mcp",
    version: "1.0.0",
  },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "consultar_mascotas_disponibles",
        description: "Busca mascotas disponibles para adopción con filtros.",
        inputSchema: {
          type: "object",
          properties: {
            tipoAnimal: { type: "string", description: "Perro, Gato u Otro" },
            tamano: { type: "string", description: "Chico, Mediano o Grande" },
          },
        },
      },
      {
        name: "analizar_solicitud_adopcion",
        description: "Analiza una solicitud de adopción usando IA.",
        inputSchema: {
          type: "object",
          properties: {
            solicitudId: { type: "string", description: "ID de la solicitud" },
          },
          required: ["solicitudId"],
        },
      },
      {
        name: "generar_recomendacion_mascota",
        description: "Genera recomendación personalizada basada en preferencias.",
        inputSchema: {
          type: "object",
          properties: {
            usuarioId: { type: "string", description: "ID del usuario" },
            preferencias: { type: "string", description: "Preferencias del usuario" },
          },
          required: ["usuarioId", "preferencias"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    if (request.params.name === "consultar_mascotas_disponibles") {
      const { tipoAnimal, tamano } = request.params.arguments || {};
      const query = { estadoAdopcion: "Disponible" };
      if (tipoAnimal) query.tipoAnimal = new RegExp(tipoAnimal, "i");
      if (tamano) query.tamano = new RegExp(tamano, "i");

      const mascotas = await Mascota.find(query)
        .limit(10)
        .select("nombre tipoAnimal raza edad tamano historia");

      return {
        content: [{ type: "text", text: JSON.stringify(mascotas, null, 2) }],
      };
    }

    if (request.params.name === "analizar_solicitud_adopcion") {
      const { solicitudId } = request.params.arguments;
      if (!mongoose.Types.ObjectId.isValid(solicitudId)) {
        return { content: [{ type: "text", text: "ID inválido" }], isError: true };
      }

      const solicitud = await SolicitudAdopcion.findById(solicitudId)
        .populate("adoptanteId", "nombre correo edad")
        .populate("mascotaId", "nombre raza tipoAnimal edad tamano");

      if (!solicitud)
        return { content: [{ type: "text", text: "Solicitud no encontrada" }], isError: true };

      const prompt = `Analiza esta solicitud de adopción:\nMascota: ${solicitud.mascotaId.nombre}\nAdoptante: ${solicitud.adoptanteId.nombre}\nInfo: ${solicitud.preguntasAdicionales}\n¿Es compatible?`;

      const result = await model.generateContent(prompt);
      return { content: [{ type: "text", text: result.response.text() }] };
    }

    if (request.params.name === "generar_recomendacion_mascota") {
      const { usuarioId, preferencias } = request.params.arguments;
      const usuario = await Usuario.findById(usuarioId);

      const mascotas = await Mascota.find({ estadoAdopcion: "Disponible" }).limit(5);
      const lista = mascotas.map((m) => `${m.nombre} (${m.tipoAnimal})`).join(", ");

      const prompt = `Usuario: ${usuario?.nombre}. Preferencias: ${preferencias}. Mascotas: ${lista}. Recomienda 3.`;

      const result = await model.generateContent(prompt);
      return { content: [{ type: "text", text: result.response.text() }] };
    }

    throw new Error(`Herramienta no encontrada: ${request.params.name}`);
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
