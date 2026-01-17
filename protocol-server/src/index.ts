import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server, LobbyRoom } from "colyseus";
import { WebSocketTransport } from "@colyseus/ws-transport";

// IMPORT YOUR ROOMS
import { CombatRoom } from "./rooms/CombatRoom";

const port = Number(process.env.PORT || 8080);
const app = express();

// 1. FORCED HEADER INJECTION (Place this BEFORE anything else)
app.all('*', (req, res, next) => {
    const origin = req.headers.origin;
    
    // Explicitly reflect the origin (Required for Codespaces)
    if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cache-Control, Pragma, X-Requested-With');

    // 2. IMMEDIATELY kill the OPTIONS request before Colyseus sees it
    if (req.method === 'OPTIONS') {
        return res.status(204).send();
    }
    next();
});

app.use(express.json());
// !!! REMOVE any app.use(cors()) lines - they are fighting with the code above !!!

// 2. HEALTH CHECK (Visit this in your browser to test port 8080)
app.get("/", (req, res) => {
    res.send("Server is LIVE and CORS is configured.");
});



const httpServer = createServer(app); // 'app' is your Express instance

const gameServer = new Server({
    transport: new WebSocketTransport({
        server: httpServer // This attaches Colyseus to the HTTP server
    })
});

// 4. ROOM DEFINITIONS
// Ensure "combat_room" matches what your client is calling
gameServer.define("combat_room", CombatRoom);

// Optional: Add a Lobby for matchmaking visibility
gameServer.define("lobby", LobbyRoom);

// 5. BOOT ENGINE - The 'Proper' Colyseus way for Express
httpServer.listen(port, "0.0.0.0", () => {
    console.log(`
    🚀 PROTOCOL: BLACKOUT SERVER LIVE
    ---------------------------------
    Port: ${port} (0.0.0.0)
    ---------------------------------
    `);
});