import React, { useEffect, useState, useContext } from "react";
import { Context } from "..";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Container, Spinner, Card, Row, Col, Modal } from "react-bootstrap";
import { io } from "socket.io-client";
import Button from "../components/Button/Button";
import InputRange from "../components/Input/InputRange";
import styles from "./LobbyPage.module.css";
import { SETUP_ROUTE, GAME_ROUTE, LOBBY_ROUTE } from "../utils/consts";
import { observer } from "mobx-react-lite";
import { socket } from "../socket";

const LobbyPage = () => {
  const { setup, user } = useContext(Context);
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [players, setPlayers] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [copied, setCopied] = useState(false);

  const isOnline = location.state?.isOnline || !!id;
  const matchId = location.state?.matchId || "room_default";

  const inviteLink = `${window.location.origin}${LOBBY_ROUTE}/${id}`;

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  useEffect(() => {
    return () => {
      socket.emit("leave-room", { matchId: id });
    };
  }, [id]);

  useEffect(() => {
    if (!setup.cardsCount || setup.cardsCount < 4) {
      setup.setCardsCount(4);
    }
  }, []);

  useEffect(() => {
    if (!isOnline) {
      navigate("/");
      return;
    }

    const joinRoom = () => {
      socket.emit("join-room", {
        matchId: id,
        username: user.user?.username || "Игрок",
        userId: user.user?.id,
      });
    };

    if (!socket.connected) {
      socket.connect();
      socket.on("connect", joinRoom);
    } else {
      joinRoom();
    }

    socket.on("room-info", ({ users }) => {
      setPlayers(users);
      if (users.length > 0 && users[0].id === user.user.id) {
        setIsHost(true);
      } else {
        setIsHost(false);
      }
    });

    socket.on("settings-updated", (newSettings) => {
      setup.setCardsCount(newSettings.cardsCount);
      setup.setDifficulty(newSettings.difficulty);
      setup.setShouldSum(newSettings.shouldSum);
    });

    socket.on("start-game", (gameData) => {
      if (gameData.settings) {
        setup.setCardsCount(gameData.settings.cardsCount);
      }

      navigate(`${GAME_ROUTE}/${id}`, {
        state: {
          isOnline: true,
          matchId: gameData.matchId,
          initialUsers: gameData.initialUsers,
          board: gameData.board,
          activePlayerId: gameData.activePlayerId,
          previewTime: gameData.previewTime,
        },
      });
    });

    return () => {
      socket.off("connect", joinRoom);
      socket.off("room-info");
      socket.off("settings-updated");
      socket.off("start-game");
    };
  }, [isOnline, id, navigate, setup, user.user?.id]);

  const updateRoomSettings = (type, value) => {
    if (type === "cards") setup.setCardsCount(value);
    if (type === "diff") setup.setDifficulty(value);
    if (type === "sum") setup.setShouldSum(value);

    socket.emit("update-settings", {
      matchId: id,
      settings: {
        cardsCount: type === "cards" ? value : setup.cardsCount,
        difficulty: type === "diff" ? value : setup.difficulty,
        shouldSum: type === "sum" ? value : setup.shouldSum,
      },
    });
  };

  const handleStartGame = () => {
    if (socket && id) {
      socket.emit("host-start-game", {
        matchId: id,
        settings: {
          cardsCount: setup.cardsCount,
          difficulty: setup.difficulty,
          previewTime: setup.difficultyTime[setup.difficulty],
          shouldSum: setup.shouldSum,
        },
      });
    }
  };

  return (
    <div className={styles.lobbyContainer}>
      <Container fluid className="p-0 d-flex justify-content-center">
        <Card className={styles.lobbyCard}>
          <Card.Body className="p-5">
            <Row>
              <Col>
                <div className={styles.inviteSection}>
                  <p>Пригласить друзей:</p>
                  <div>
                    <code>{inviteLink}</code>
                    <Button onClick={copyInviteLink}>
                      {copied ? "Скопировано" : "Копировать"}
                    </Button>
                  </div>
                </div>
              </Col>
            </Row>
            <Row>
              <Col md={7} className={styles.divider}>
                <div className={styles.playerList}>
                  {players.map((p, index) => (
                    <div key={p.id} className={styles.playerItem}>
                      <span className={styles.playerIcon}>👤</span>
                      <span className={styles.playerName}>
                        {p.username}{" "}
                        {p.id === user.user?.id && (
                          <span className={styles.youBadge}>(Вы)</span>
                        )}
                      </span>
                      {index === 0 && (
                        <span className={styles.hostBadge}>Лидер</span>
                      )}
                    </div>
                  ))}
                  {players.length < 4 &&
                    [...Array(4 - players.length)].map((_, i) => (
                      <div
                        key={`empty-${i}`}
                        className={`${styles.playerItem} ${styles.emptySlot}`}
                      >
                        <span className={styles.playerName}>
                          Ожидание игрока...
                        </span>
                      </div>
                    ))}
                </div>
              </Col>

              <Col md={5}>
                <div className={styles.settingsPreview}>
                  <h5>Параметры матча:</h5>
                  <p>
                    Количество карт: <strong>{setup.cardsCount}</strong>
                  </p>
                  <p>
                    Сложность:{" "}
                    <strong>
                      {setup.difficultyTranslations[setup.difficulty]}
                    </strong>
                  </p>
                  <p>
                    Складывать результаты игр?
                    <strong>{setup.shouldSum ? "Да" : "Нет"}</strong>
                  </p>
                </div>

                {isHost ? (
                  <div className={styles.hostActions}>
                    <Button
                      className="w-100 mb-3"
                      onClick={() => setShowSettings(true)}
                    >
                      Настроить
                    </Button>
                    <Button
                      className="w-100"
                      onClick={handleStartGame}
                      disabled={players.length < 2}
                    >
                      Начать игру
                    </Button>
                    {players.length < 2 && (
                      <small className="text-muted mt-2 d-block">
                        Нужно минимум 2 игрока
                      </small>
                    )}
                  </div>
                ) : (
                  <div className={styles.clientWaiting}>
                    <Spinner animation="grow" variant="primary" size="sm" />
                    <p className="mt-3">Лидер настраивает игру...</p>
                  </div>
                )}
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <Modal
          show={showSettings}
          onHide={() => setShowSettings(false)}
          centered
          className={styles.settingsModal}
        >
          <Modal.Header closeButton>
            <Modal.Title>Настройки комнаты</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="mb-4">
              <h6>Сложность:</h6>
              <div className="d-flex gap-2">
                {["Easy", "Medium", "Hard"].map((d) => (
                  <Button key={d} onClick={() => updateRoomSettings("diff", d)}>
                    {setup.difficultyTranslations[d]}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <h6>Количество карт:</h6>
              <InputRange
                min={4}
                max={100}
                step={2}
                value={setup.cardsCount}
                onChange={(e) => updateRoomSettings("cards", e)}
                className="w-100"
              />
            </div>
            <div className={styles.setupSection}>
              <label className={styles.optionLabelSum}>
                <input
                  type="checkbox"
                  className={styles.checkboxInput}
                  checked={setup.shouldSum}
                  onChange={(e) => updateRoomSettings("sum", e.target.checked)}
                />
                <span className={styles.checkboxCustom}></span>
                Складывать результаты
              </label>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={() => setShowSettings(false)}>Готово</Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
};

export default observer(LobbyPage);
