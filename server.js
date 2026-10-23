import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { randomUUID } from "node:crypto";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

const PORT = process.env.PORT || 3000;
const players = new Map();

app.use(express.static("public"));

app.get("/health", (_req, res) => {
  res.json({ status: "House Edge Party is running!" });
});

io.on("connection", (socket) => {
  const player = {
    id: socket.id,
    name: `Player ${players.size + 1}`,
    x: Math.random() * 8 - 4,
    z: Math.random() * 8 - 4,
    color: Math.floor(Math.random() * 0xffffff),
    chips: 1000,
    sessionId: randomUUID()
  };

  players.set(socket.id, player);

  socket.emit("welcome", {
    id: socket.id,
    players: Object.fromEntries(players)
  });

  socket.broadcast.emit("playerJoined", player);

  socket.on("move", (position) => {
    if (!position || !Number.isFinite(position.x) ||
        !Number.isFinite(position.z)) return;

    player.x = Math.max(-100, Math.min(100, position.x));
    player.z = Math.max(-100, Math.min(100, position.z));

    socket.broadcast.emit("playerMoved", {
      id: socket.id,
      x: player.x,
      z: player.z
    });
  });

  socket.on("disconnect", () => {
    players.delete(socket.id);
    io.emit("playerLeft", socket.id);
  });
});

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`House Edge Party running on port ${PORT}`);
});
