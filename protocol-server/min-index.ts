// min-index.ts
import { Server } from "colyseus";
import { createServer } from "http";
const gameServer = new Server({ server: createServer() });
gameServer.listen(8080);
console.log("SERVER LIVE");