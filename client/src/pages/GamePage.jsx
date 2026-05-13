import React, { useEffect, useState, useContext, useRef, useMemo } from "react";
import { Context } from "..";
import { Modal } from "react-bootstrap";
import { useNavigate, useBlocker, useLocation } from "react-router-dom";
import classes from "./GamePage.module.css";
import { ALL_SYMBOLS } from "../constants/symbols";
import Board from "../components/Board/Board";
import InputNumber from "../components/Input/InputRange";
import Button from "../components/Button/Button";
import { shuffle } from "../utils/shuffle";
import { observer } from "mobx-react-lite";
import { HOME_ROUTE } from "../utils/consts";
import { createResult } from "../http/resultAPI";
import { io } from "socket.io-client";
import { socket } from "../socket";

const GamePage = () => {
  const { setup, user } = useContext(Context);
  const navigate = useNavigate();
  const location = useLocation();

  const [cards, setCards] = useState([]);

  const [roomUsers, setRoomUsers] = useState([]);

  const [activePlayerId, setActivePlayerId] = useState(
    location.state?.activePlayerId || null,
  );

  const winPair = useMemo(() => {
    return cards.filter((c) => c.isMatched).length / 2;
  }, [cards]);

  const [disabled, setDisabled] = useState(false);
  const [firstCard, setFirstCard] = useState(null);
  const [isWon, setIsWon] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [saveStatus, setSaveStatus] = useState("");
  const [previewTime, setPreviewTime] = useState(0);
  const [isAborted, setIsAborted] = useState(false);
  const [abortedBy, setAbortedBy] = useState("");
  const [gameStarted, setGameStarted] = useState(false);
  const previewStarted = useRef(false);

  const isOnline = location.state?.isOnline || false;
  const matchId = location.state?.matchId || "default_room";

  function flipAllCards(bool) {
    setCards((e) => e.map((card) => ({ ...card, isFlipped: bool })));
  }

  const showCardsPreview = (previewTime) => {
    if (!previewTime || previewTime <= 0) return;

    setDisabled(true);

    flipAllCards(true);

    setTimeout(() => {
      flipAllCards(false);
      setDisabled(false);
    }, previewTime);
  };

  const saveGameResult = async () => {
    const isSinglePlayer = setup.players.length === 1;

    if (user.isAuth && isSinglePlayer) {
      try {
        setSaveStatus("loading");
        const currentPlayer = setup.players[0];

        await createResult({
          matchId: 1,
          score: currentPlayer.winPair,
          cards_count: setup.cardsCount,
          difficulty: setup.difficulty,
          preview_time: setup.difficultyTime[setup.difficulty],
        });
        setSaveStatus("success");
      } catch (e) {
        setSaveStatus("error");
      }
    }
  };

  useEffect(() => {
    setGameStarted(false);
    previewStarted.current = false;
    if (!isOnline) {
      startNewGame();
    } else {
      if (location.state?.board) {
        setCards(location.state.board);
        setPreviewTime(location.state.previewTime || 0);
      }
      if (!location.state?.board && cards.length === 0) {
        socket.emit("get-game-state", { matchId });
      }
    }

    return () => {
      if (isOnline) {
        socket.emit("leave-room", { matchId });
      }
    };
  }, [matchId]);

  useEffect(() => {
    if (
      cards &&
      cards.length > 0 &&
      previewTime > 0 &&
      !previewStarted.current
    ) {
      previewStarted.current = true;
      showCardsPreview(previewTime);
    }
  }, [cards, previewTime]);

  useEffect(() => {
    if (isOnline) return;

    if (!cards || cards.length === 0) return;

    const isFinished = cards.length > 0 && cards.every((c) => c.isMatched);

    if (!isFinished) return;

    setIsWon(true);
    saveGameResult();

    const max = Math.max(...setup.players.map((p) => p.winPair));

    setup.setPlayers(
      setup.players.map((p) =>
        p.winPair === max && max > 0 ? { ...p, winner: true } : p,
      ),
    );
  }, [cards, isOnline]);

  useEffect(() => {
    if (isOnline && socket) {
      if (!socket.connected) socket.connect();

      const onRoomInfo = ({ users }) => {
        setRoomUsers(users);
      };

      const onPlayerLeft = ({ username }) => {
        if (!gameStarted) return;

        setIsWon((prevIsWon) => {
          if (!prevIsWon) {
            setIsAborted(true);
            setAbortedBy(username);
            return true;
          }
          return prevIsWon;
        });
      };

      const onGameAbortedAfterFinish = ({ username }) => {
        setIsAborted(true);
        setAbortedBy(username);
        setIsWon(true);
      };

      const onMatchAbortedByPlayer = ({ username }) => {
        setAbortedBy(username);
        setIsAborted(true);
        setIsWon(true);
        setGameStarted(false);
      };

      const onStartGame = (data) => {
        setGameStarted(true);
        previewStarted.current = false;
        setIsWon(false);
        setIsAborted(false);
        setAbortedBy("");

        resetGameState();
        setFirstCard(null);
        setDisabled(false);

        setCards(data.board);
        setActivePlayerId(data.activePlayerId);
        setRoomUsers(data.users);

        setup.setDifficulty(data.difficulty);

        const time = data.previewTime ?? setup.difficultyTime[data.difficulty];

        setPreviewTime(time);
      };

      const onBoardUpdated = (data) => {
        setCards(data.board);
        setActivePlayerId(data.activePlayerId);
        setRoomUsers(data.users);

        const isMyTurn = String(user.user.id) === String(data.activePlayerId);

        setDisabled(data.isChecking || !isMyTurn);
      };

      const onGameState = (data) => {
        setCards(data.board);
        setActivePlayerId(data.activePlayerId);
        setRoomUsers(data.users);
        setPreviewTime(data.previewTime);

        const isNewGame = data.board.every((card) => !card.isMatched);
        if (isNewGame) {
          previewStarted.current = false;
        }
      };

      const onGameOver = ({ users }) => {
        setRoomUsers(users);
        setIsWon(true);
        saveGameResult();
      };

      const onForceReset = () => {
        setCards([]);
        setRoomUsers([]);
        setActivePlayerId(null);
        setFirstCard(null);
        setDisabled(false);
        previewStarted.current = false;
        setIsWon(false);
      };

      socket.on("room-info", onRoomInfo);
      socket.on("player-left-notice", onPlayerLeft);
      socket.on("start-game", onStartGame);
      socket.on("board-updated", onBoardUpdated);
      socket.on("game-over", onGameOver);
      socket.on("game-state", onGameState);
      socket.on("force-reset-room", onForceReset);
      socket.on("game-aborted-after-finish", onGameAbortedAfterFinish);
      socket.on("match-aborted-by-player", onMatchAbortedByPlayer);

      socket.emit("join-room", {
        matchId,
        username: user.user.username,
        userId: user.user.id,
      });

      return () => {
        socket.off("room-info", onRoomInfo);
        socket.off("player-left-notice", onPlayerLeft);
        socket.off("game-over", onGameOver);
        socket.off("start-game", onStartGame);
        socket.off("board-updated", onBoardUpdated);
        socket.off("game-state", onGameState);
        socket.off("force-reset-room", onForceReset);
        socket.off("game-aborted-after-finish", onGameAbortedAfterFinish);
        socket.off("match-aborted-by-player", onMatchAbortedByPlayer);
      };
    }
  }, [isOnline, matchId]);

  const startNewGame = () => {
    if (isOnline) {
      if (roomUsers[0]?.id === user.user.id) {
        const timeValue = setup.difficultyTime[setup.difficulty];
        socket.emit("host-start-game", {
          matchId: matchId,
          settings: {
            cardsCount: setup.cardsCount,
            difficulty: setup.difficulty,
            previewTime: timeValue,
          },
        });
      }
      return;
    }

    const isSinglePlayer = setup.players.length === 1;

    if (isWon && isSinglePlayer) {
      setup.incrementCardsCount();
    }

    previewStarted.current = false;
    setCards([]);
    setRoomUsers([]);
    setActivePlayerId(null);
    setIsWon(false);
    setFirstCard(null);
    setDisabled(false);

    setCurrentPlayer(0);
    setup.resetPlayersScore();

    if (setup.cardsCount > 0) {
      const selected = ALL_SYMBOLS.slice(0, setup.cardsCount / 2);
      const combined = [...selected, ...selected];
      const shuffled = shuffle(combined);

      const preparedCards = shuffled.map((symbol, index) => ({
        id: index,
        symbol: symbol,
        isFlipped: false,
        isMatched: false,
      }));
      setCards(preparedCards);

      const timeValue = setup.difficultyTime[setup.difficulty];
      setPreviewTime(timeValue);
    }
  };

  const getActivePlayerName = () => {
    if (!isOnline) {
      return `Игрок ${setup.players[currentPlayer]?.id + 1}`;
    }

    const activeUser = roomUsers.find(
      (u) => String(u.id) === String(activePlayerId),
    );

    if (activeUser) {
      return String(activeUser.id) === String(user.user.id)
        ? "ВАШ ХОД"
        : activeUser.username;
    }

    return "Ожидание хода...";
  };

  const handleCardClick = (clickedCard) => {
    if (disabled) return;
    if (isOnline && String(user.user.id) !== String(activePlayerId)) return;

    if (clickedCard.isFlipped || clickedCard.isMatched) return;

    if (isOnline) {
      // setCards((prev) =>
      //   prev.map((card) =>
      //     card.id === clickedCard.id ? { ...card, isFlipped: true } : card,
      //   ),
      // );

      socket.emit("card-flipped", { matchId, cardId: clickedCard.id });
      return;
    }

    const newCards = cards.map((card) =>
      card.id === clickedCard.id ? { ...card, isFlipped: true } : card,
    );

    setCards(newCards);

    if (!firstCard) {
      setFirstCard(clickedCard);
    } else {
      checkMatch(clickedCard);
    }
  };

  const checkMatch = (secondCard) => {
    setDisabled(true);
    if (firstCard.symbol === secondCard.symbol) {
      setTimeout(() => {
        setCards((prev) =>
          prev.map((card) =>
            card.symbol === secondCard.symbol
              ? { ...card, isMatched: true }
              : card,
          ),
        );

        if (isOnline && user.user.id === activePlayerId) {
          socket.emit("match-found", { matchId, symbol: secondCard.symbol });
        } else {
          setup.setPlayers(
            setup.players.map((e) =>
              e.id === currentPlayer ? { ...e, winPair: e.winPair + 1 } : e,
            ),
          );
        }

        setFirstCard(null);
        setDisabled(false);
      }, 1000);
    } else {
      setTimeout(() => {
        const idToClose = [firstCard.id, secondCard.id];

        setCards((prev) =>
          prev.map((card) =>
            idToClose.includes(card.id) ? { ...card, isFlipped: false } : card,
          ),
        );

        if (isOnline) {
          socket.emit("cards-unflip", { matchId, cardId: idToClose });

          const currentIndex = roomUsers.findIndex(
            (u) => u.id === activePlayerId,
          );
          const nextIndex = (currentIndex + 1) % roomUsers.length;
          const nextId = roomUsers[nextIndex].id;

          socket.emit("change-turn", { matchId, nextPlayerId: nextId });
        } else {
          setCurrentPlayer((p) => (p + 1) % setup.players.length);
        }

        setFirstCard(null);
        setDisabled(false);
      }, 1000);
    }
  };

  const resetGameState = () => {
    setGameStarted(false);
    setCards([]);
    setRoomUsers([]);
    setActivePlayerId(null);
    setFirstCard(null);
    setDisabled(false);
    setIsWon(false);
    setPreviewTime(0);
    previewStarted.current = false;
  };

  const getWinnerText = () => {
    if (isOnline) {
      const maxPairs = Math.max(...roomUsers.map((u) => u.winPair || 0));
      const winners = roomUsers.filter(
        (u) => (u.winPair || 0) === maxPairs && maxPairs > 0,
      );

      if (winners.length > 1) return "Ничья!";
      const winner = winners[0];
      if (winner?.id === user.user.id) return "ВЫ ПОБЕДИЛИ!";
      return `Победил ${winner?.username || "Игрок"}`;
    }

    if (setup.players.length === 1) {
      return "Вы нашли все пары!";
    }

    const winnersCount = setup.players.filter((p) => p.winner).length;
    if (winnersCount > 1) return "Ничья!";

    const winner = setup.players.find((p) => p.winner);
    return winner ? `Победил Игрок ${winner.id + 1}` : "Игра окончена";
  };

  const isHost = isOnline ? roomUsers[0]?.id === user.user.id : true;

  const canRender = isOnline
    ? cards?.length > 0 || roomUsers?.length > 0
    : setup?.cardsCount > 0 && setup?.players?.length > 0;

  if (!canRender) {
    return <div className={classes.loading}>Загрузка игры...</div>;
  }

  return (
    <div className={classes.app}>
      {!isWon && (
        <>
          {isOnline ? (
            <div className={classes.turnIndicator}>
              <span className={classes.textMove}>Ход: </span>
              <span className={classes.playerNumber}>
                {getActivePlayerName()}
              </span>
            </div>
          ) : (
            setup.players.length > 1 && (
              <div className={classes.turnIndicator}>
                <span className={classes.textMove}>Текущий ход: </span>
                <span className={classes.playerNumber}>
                  {getActivePlayerName()}
                </span>
              </div>
            )
          )}
          <Board
            cards={cards}
            handleCardClick={handleCardClick}
            count={setup.cardsCount}
          />
        </>
      )}

      <Modal
        show={isWon}
        onHide={() => {}}
        centered
        backdrop="static"
        keyboard={false}
      >
        <Modal.Body className="text-center pb-4">
          {isAborted ? (
            <>
              <h3 className="mb-3 text-danger">Матч завершен</h3>
              <div className="fs-5 mb-3">
                Игрок <strong>{abortedBy}</strong> покинул игру.
              </div>
              <p className="fw-bold text-primary">
                Продолжение игры невозможно.
              </p>
            </>
          ) : (
            <>
              <h3 className="mb-3">{getWinnerText()}</h3>

              {!isOnline && setup.players.length === 1 && saveStatus && (
                <div className={classes.saveStatusContainer + " mb-3"}>
                  {saveStatus === "loading" && (
                    <span className={classes.statusLoading}>
                      Сохранение рекорда...
                    </span>
                  )}
                  {saveStatus === "success" && (
                    <span className={classes.statusSuccess}>
                      Рекорд сохранен в профиле! ✓
                    </span>
                  )}
                  {saveStatus === "error" && (
                    <span className={classes.statusError}>
                      Ошибка сохранения в БД ❌
                    </span>
                  )}
                </div>
              )}

              <div className="p-3 rounded">
                {isOnline ? (
                  <>
                    <div className="fw-bold mb-2">Кол-во найденных пар:</div>
                    {roomUsers.map((u) => (
                      <div
                        key={u.id}
                        className={
                          u.id === activePlayerId ? "fw-bold text-primary" : ""
                        }
                      >
                        {u.id === user.user.id ? "Вы" : u.username}:{" "}
                        {u.winPair || 0}{" "}
                      </div>
                    ))}
                  </>
                ) : setup.players.length > 1 ? (
                  setup.players.map((p) => (
                    <div
                      key={p.id}
                      className={p.winner ? "fw-bold text-primary" : ""}
                    >
                      Игрок {p.id + 1}: {p.winPair}
                    </div>
                  ))
                ) : (
                  <div className="fs-5">
                    Кол-во найденных пар: {setup.players[0].winPair}
                  </div>
                )}
              </div>
            </>
          )}
        </Modal.Body>

        <Modal.Footer className="flex-column border-0 pb-4">
          {isAborted ? (
            <Button
              variant="primary"
              className="w-100"
              onClick={() => {
                socket.emit("leave-room", { matchId });
                navigate(HOME_ROUTE);
                setup.resetSettings();
              }}
            >
              На главную
            </Button>
          ) : (
            <>
              {isOnline ? (
                <>
                  {isHost ? (
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-100 mb-2"
                      onClick={startNewGame}
                    >
                      Сыграть ещё раз
                    </Button>
                  ) : (
                    <div className="mb-3">
                      Ожидание, пока Лидер начнет новую игру...
                    </div>
                  )}
                </>
              ) : (
                <>
                  {setup.players.length === 1 && (
                    <div className="mt-2 text-center">
                      Следующая игра: <strong>{setup.cardsCount + 2}</strong>{" "}
                      карточек
                    </div>
                  )}
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-100 mb-2"
                    onClick={startNewGame}
                  >
                    Сыграть ещё раз
                  </Button>
                </>
              )}
              <Button
                variant="outline-secondary"
                className="w-100"
                onClick={() => {
                  if (isOnline) {
                    socket.emit("leave-room", { matchId });
                  }
                  navigate(HOME_ROUTE);
                  setup.resetSettings();
                }}
              >
                На главную
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default observer(GamePage);
