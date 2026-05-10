import React, { useContext, useState } from "react";
import { Context } from "..";
import { Container, Row, Col, Card, Modal, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button/Button";
import { SETUP_ROUTE, LOBBY_ROUTE, LOGIN_ROUTE } from "../utils/consts";
import styles from "./HomePage.module.css";
import { observer } from "mobx-react-lite";

const HomePage = observer(() => {
  const { user } = useContext(Context);

  const navigate = useNavigate();

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteUrl, setInviteUrl] = useState("");

  const handleJoinRoom = () => {
    let roomId = inviteUrl.trim();

    if (roomId.includes("/")) {
      roomId = roomId.split("/").pop();
    }

    if (roomId) {
      navigate(`/lobby/${roomId}`, { state: { isOnline: true } });
      setShowJoinModal(false);
      setInviteUrl("");
    }
  };

  const startLocalGame = () => {
    navigate(SETUP_ROUTE, {
      state: {
        isOnline: false,
      },
    });
  };

  const startOnlineGame = () => {
    if (!user.isAuth) {
      navigate(LOGIN_ROUTE);
      return;
    }

    const uniqueRoomId = Math.random().toString(36).substring(2, 9);

    navigate(`${LOBBY_ROUTE}/${uniqueRoomId}`, {
      state: {
        isOnline: true,
        matchId: `room_${uniqueRoomId}`,
      },
    });
  };

  return (
    <div className={styles.homeBackground}>
      <Container>
        <h1 className="text-center text-white mb-5 fw-bold">
          Выберите режим игры
        </h1>

        <Row className="justify-content-center g-4">
          <Col md={5}>
            <Card className={styles.selectionCard}>
              <Card.Body className="p-5 d-flex flex-column justify-content-between">
                <div>
                  <div className={styles.iconWrapper}>🏠</div>
                  <Card.Title className={styles.cardTitle}>
                    Локальная игра
                  </Card.Title>
                  <Card.Text as="div" className={styles.cardText}>
                    Играйте с друзьями на одном устройстве или практикуйтесь в
                    одиночку.
                    <div
                      className={styles.guestWarning}
                      style={{ visibility: user.isAuth ? "hidden" : "visible" }}
                    >
                      <div className={styles.warningText}>
                        <span>⚠️</span> Результаты не сохраняются в режиме гостя
                      </div>
                    </div>
                  </Card.Text>
                </div>
                <Button className="mt-4" fluid onClick={startLocalGame}>
                  Начать игру
                </Button>
              </Card.Body>
            </Card>
          </Col>

          <Col md={5}>
            <Card className={styles.selectionCard}>
              <Card.Body className="p-5 d-flex flex-column justify-content-between">
                <div>
                  <div className={styles.iconWrapper}>🌐</div>
                  <Card.Title className={styles.cardTitle}>
                    Онлайн-игра
                  </Card.Title>
                  <Card.Text className={styles.cardText}>
                    Бросайте вызов игрокам по всему миру в реальном времени и
                    поднимайтесь по рейтинговой таблице.
                  </Card.Text>
                </div>
                <Button className="mt-4" fluid onClick={startOnlineGame}>
                  Найти матч
                </Button>
                <Button
                  className="mt-2"
                  onClick={() => {
                    if (!user.isAuth) {
                      navigate(LOGIN_ROUTE);
                      return;
                    }
                    setShowJoinModal(true);
                  }}
                >
                  Войти по ссылке
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        <Modal
          show={showJoinModal}
          onHide={() => setShowJoinModal(false)}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Присоединиться к игре</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group>
              <Form.Label>Вставьте ссылку на комнату или её ID:</Form.Label>
              <Form.Control
                type="text"
                placeholder="https://..."
                value={inviteUrl}
                onChange={(e) => setInviteUrl(e.target.value)}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={handleJoinRoom} disabled={!inviteUrl.trim()}>
              Войти
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
});

export default HomePage;
