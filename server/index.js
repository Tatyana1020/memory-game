require("dotenv").config();
const express = require("express");
const sequelize = require("./db");
const models = require("./models/models");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const router = require("./routes/index");
const errorHandler = require("./middleware/ErrorHandingMiddleware");
const { ALL_SYMBOLS } = require("../client/src/constants/symbols.js");
const { shuffle } = require("../client/src/utils/shuffle.js");

const http = require("http");
const { Server } = require("socket.io");

const PORT = process.env.PORT || 5000;

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST"],
  },
});

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use("/api", router);
app.use(errorHandler);

const getUsersInRoom = (matchId) => {
  const socketsInRoom = Array.from(io.sockets.adapter.rooms.get(matchId) || []);
  return socketsInRoom
    .map((sId) => {
      const s = io.sockets.sockets.get(sId);
      return s
        ? { id: s.dbUserId, username: s.username || "Аноним", socketId: sId }
        : null;
    })
    .filter(Boolean);
};

const roomsState = {};

io.on("connection", (socket) => {
  socket.on("join-room", ({ matchId, username, userId }) => {
    socket.join(matchId);
    socket.username = username;
    socket.dbUserId = userId;

    if (!roomsState[matchId]) {
      roomsState[matchId] = {
        users: [],
        cardsCount: 4,
        difficulty: "Easy",
        shouldSum: false,
        isChecking: false,
        isFinished: false,
      };
    }

    const room = roomsState[matchId];
    const users = getUsersInRoom(matchId);

    room.users = users.map((u) => {
      const prev = room.users.find((p) => String(p.id) === String(u.id));

      return {
        id: u.id,
        username: u.username,
        winPair: 0,
        sessionWinPair: prev?.sessionWinPair || 0,
      };
    });

    if (!room.activePlayerId) {
      room.activePlayerId = room.users[0]?.id;
    }

    io.to(matchId).emit("room-info", { users: room.users });
  });

  socket.on("update-settings", ({ matchId, settings }) => {
    if (!roomsState[matchId]) {
      roomsState[matchId] = {
        users: [],
        isChecking: false,
        isFinished: false,
      };
    }

    roomsState[matchId] = {
      ...roomsState[matchId],
      cardsCount: settings.cardsCount,
      difficulty: settings.difficulty,
      shouldSum: settings.shouldSum,
    };

    io.to(matchId).emit("settings-updated", {
      cardsCount: settings.cardsCount,
      difficulty: settings.difficulty,
      shouldSum: settings.shouldSum,
    });
  });

  socket.on("get-game-state", ({ matchId }) => {
    const room = roomsState[matchId];
    if (room && room.board) {
      socket.emit("game-state", {
        board: room.board,
        activePlayerId: room.activePlayerId,
        users: room.users,
        shouldSum: room.shouldSum,
        previewTime: room.preview_time,
      });
    } else if (room) {
      socket.emit("game-state", {
        board: [],
        users: room.users || [],
        shouldSum: room.shouldSum || false,
        previewTime: 0,
      });
    }
  });

  socket.on("host-start-game", async ({ matchId, settings }) => {
    const previousRoom = roomsState[matchId];
    const previousUsers = previousRoom?.users || [];

    const { cardsCount, difficulty, previewTime, shouldSum } = settings;

    if (getUsersInRoom(matchId).length === 0) {
      return;
    }

    const selected = ALL_SYMBOLS.slice(0, cardsCount / 2);
    const combined = [...selected, ...selected];
    const shuffled = shuffle(combined);

    const board = shuffled.map((symbol, index) => ({
      id: index,
      symbol: symbol,
      isFlipped: false,
      isMatched: false,
    }));

    const users = getUsersInRoom(matchId).map((u) => {
      const prev = previousUsers.find((p) => String(p.id) === String(u.id));

      return {
        ...u,
        winPair: 0,
        sessionWinPair: shouldSum ? prev?.sessionWinPair || 0 : 0,
      };
    });

    const match = await models.Matches.create({
      game_mode: "online",
      status: "active",
    });

    const playerIds = users.map((u) => u.id);
    await match.addUsers(playerIds);

    roomsState[matchId] = {
      dbMatchId: match.id,
      gameId: Date.now(),
      board: board,
      users: users,
      activePlayerId: users[0]?.id,
      difficulty: difficulty,
      preview_time: previewTime,
      shouldSum: shouldSum,
      cardsCount: cardsCount,
      isChecking: false,
      isFinished: false,
    };

    io.to(matchId).emit("start-game", {
      matchId,
      board,
      activePlayerId: users[0]?.id,
      difficulty: difficulty,
      previewTime: previewTime,
      shouldSum: shouldSum,
      users: roomsState[matchId].users,
    });
  });

  socket.on("card-flipped", ({ matchId, cardId }) => {
    const room = roomsState[matchId];

    if (!room || room.isChecking || room.isFinished) return;

    if (!room.activePlayerId) {
      room.activePlayerId = room.users?.[0]?.id;
    }

    const isHisTurn = String(room.activePlayerId) === String(socket.dbUserId);

    if (!isHisTurn) {
      return;
    }
    const card = room.board.find((c) => c.id === cardId);

    if (!card || card.isFlipped || card.isMatched) return;

    const flippedCountBefore = room.board.filter(
      (c) => c.isFlipped && !c.isMatched,
    ).length;

    if (flippedCountBefore >= 2) {
      return;
    }

    card.isFlipped = true;

    const openedCards = room.board.filter((c) => c.isFlipped && !c.isMatched);

    io.to(matchId).emit("board-updated", {
      board: room.board,
      activePlayerId: room.activePlayerId,
      users: room.users,
      isChecking: openedCards.length === 2,
    });

    if (openedCards.length === 2) {
      room.isChecking = true;
      const [first, second] = openedCards;
      const currentGameId = room.gameId;
      const playerId = socket.dbUserId;

      setTimeout(async () => {
        const latestRoom = roomsState[matchId];

        if (!latestRoom || latestRoom.gameId !== currentGameId) {
          return;
        }

        const room = latestRoom;

        if (first.symbol === second.symbol) {
          room.board = room.board.map((card) =>
            card.symbol === first.symbol
              ? {
                  ...card,
                  isMatched: true,
                  isFlipped: true,
                }
              : card,
          );

          room.users = room.users.map((u) => {
            if (String(u.id) === String(playerId)) {
              const newWinPair = u.winPair + 1;
              return { ...u, winPair: newWinPair };
            }
            return u;
          });
        } else {
          room.board = room.board.map((card) =>
            card.id === first.id || card.id === second.id
              ? { ...card, isFlipped: false }
              : card,
          );

          const currentIndex = room.users.findIndex(
            (u) => String(u.id) === String(room.activePlayerId),
          );

          const nextIndex = (currentIndex + 1) % room.users.length;

          room.activePlayerId = room.users[nextIndex].id;
        }

        room.isChecking = false;

        const isFinished = room.board.every((c) => c.isMatched);

        if (isFinished) {
          room.isFinished = true;

          const winner = room.users.reduce((prev, current) =>
            current.winPair > prev.winPair ? current : prev,
          );

          await models.Matches.update(
            {
              status: "finished",
              winner_id: winner.id,
            },
            {
              where: {
                id: room.dbMatchId,
              },
            },
          );

          for (const player of room.users) {
            const score = player.winPair || 0;

            if (room.shouldSum) {
              player.sessionWinPair =
                (player.sessionWinPair || 0) + player.winPair;
            }

            await models.Results.create({
              score,
              cards_count: room.board.length,
              difficulty: room.difficulty,
              preview_time: room.preview_time,
              userId: player.id,
              matchId: room.dbMatchId,
            });
          }

          const finalUsersState = room.users.map((u) => ({ ...u }));

          io.to(matchId).emit("game-over", {
            users: finalUsersState,
            board: room.board,
            winnerId: winner.id,
            dbMatchId: room.dbMatchId,
            shouldSum: room.shouldSum,
          });
          room.users.forEach((u) => (u.winPair = 0));
        } else {
          io.to(matchId).emit("board-updated", {
            board: room.board,
            activePlayerId: room.activePlayerId,
            users: room.users,
            isChecking: false,
          });
        }
      }, 1000);
    }
  });

  socket.on("player-exit-match", ({ matchId, username }) => {
    const room = roomsState[matchId];
    if (!room) return;

    socket.to(matchId).emit("match-aborted-by-player", {
      username: username || "Игрок",
      message: "Игрок покинул матч",
    });

    room.isFinished = true;
  });

  socket.on("leave-room", ({ matchId }) => {
    const room = roomsState[matchId];

    socket.leave(matchId);

    const users = getUsersInRoom(matchId);

    if (room && room.isFinished && users.length > 0) {
      io.to(matchId).emit("game-aborted-after-finish", {
        username: socket.username || "Игрок",
      });
    }

    io.to(matchId).emit("room-info", { users });

    if (users.length === 0) {
      delete roomsState[matchId];
    }
  });

  socket.on("disconnect", () => {
    for (const matchId of Object.keys(roomsState)) {
      const room = roomsState[matchId];
      const users = getUsersInRoom(matchId);

      if (users.length === 0) {
        delete roomsState[matchId];
        io.to(matchId).emit("force-reset-room");
      } else {
        if (!room.isFinished) {
          io.to(matchId).emit("player-left-notice", {
            username: socket.username || "Игрок",
          });
        }
        io.to(matchId).emit("room-info", { users });
      }
    }
  });
});

const start = async () => {
  await sequelize.authenticate();
  await sequelize.sync();
  server.listen(PORT, () => console.log(`server started on port ${PORT}`));
};

start();
