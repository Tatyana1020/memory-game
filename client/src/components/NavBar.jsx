import React, { useContext, useState } from "react";
import { Context } from "..";
import { Modal, Nav, Navbar, Container } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import {
  GAME_ROUTE,
  HOME_ROUTE,
  LOGIN_ROUTE,
  LEADERBOARD_ROUTE,
  PROFILE_ROUTE,
} from "../utils/consts";
import Button from "./Button/Button";
import { observer } from "mobx-react-lite";
import styles from "./NavBar.module.css";
import { socket } from "../socket";

const NavBar = observer(() => {
  const [showExitModal, setShowExitModal] = useState(false);
  const [pendingRoute, setPendingRoute] = useState(null);
  const { user, setup } = useContext(Context);
  const location = useLocation();
  const navigate = useNavigate();

  const isGamePage = location.pathname.includes(GAME_ROUTE.split(":")[0]);
  const isOnline = location.state?.isOnline || false;
  const matchId = location.state?.matchId;

  const logOut = () => {
    user.setUser({});
    user.setIsAuth(false);
    localStorage.removeItem("token");
  };

  const confirmExit = () => {
    setShowExitModal(false);
    if (isOnline && matchId) {
      socket.emit("player-exit-match", {
        matchId,
        username: user.user?.username || "Игрок",
      });
      setTimeout(() => {
        socket.emit("leave-room", { matchId });
      }, 100);
    }

    setup.resetSettings();

    navigate(pendingRoute || HOME_ROUTE);
    setPendingRoute(null);
  };

  const handleNavClick = (route) => {
    if (isGamePage) {
      setPendingRoute(route);
      setShowExitModal(true);
    } else {
      navigate(route);
    }
  };

  return (
    <>
      <Navbar className={styles.customNavbar} variant="dark">
        <Container>
          <Navbar.Brand
            className={styles.logo}
            onClick={() => handleNavClick(HOME_ROUTE)}
          >
            Memory game
          </Navbar.Brand>

          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link
                onClick={() => handleNavClick(LEADERBOARD_ROUTE)}
                disabled={isGamePage}
                className={isGamePage ? styles.disabledLink : ""}
              >
                Лидеры
              </Nav.Link>

              {user.isAuth ? (
                <Nav.Link
                  onClick={() => handleNavClick(PROFILE_ROUTE)}
                  disabled={isGamePage}
                  className={isGamePage ? styles.disabledLink : ""}
                >
                  Профиль
                </Nav.Link>
              ) : (
                ""
              )}
            </Nav>

            <Nav className="ms-auto d-flex align-items-center">
              {user.isAuth ? (
                <div className="d-flex align-items-center gap-3">
                  <span className="text-white opacity-75 me-2">
                    Игрок: {""}
                    <strong>{user.user?.username || "Пользователь"}</strong>
                  </span>
                  <Button
                    disabled={isGamePage}
                    onClick={() => {
                      if (isGamePage) {
                        setPendingRoute(HOME_ROUTE);
                        setShowExitModal(true);
                      } else {
                        logOut();
                        navigate(HOME_ROUTE);
                      }
                    }}
                  >
                    Выйти
                  </Button>
                </div>
              ) : (
                <div className="d-flex align-items-center gap-3">
                  <span className="text-white-50 small italic">
                    Режим гостя
                  </span>
                  <Button
                    disabled={isGamePage}
                    onClick={() => handleNavClick(LOGIN_ROUTE)}
                  >
                    Войти в аккаунт
                  </Button>
                </div>
              )}
            </Nav>

            {isGamePage && (
              <div className="ms-4 ps-4 border-start border-secondary">
                <Button
                  variant="danger"
                  onClick={() => {
                    setPendingRoute(HOME_ROUTE);
                    setShowExitModal(true);
                  }}
                >
                  Выйти из игры
                </Button>
              </div>
            )}
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Modal
        show={showExitModal}
        onHide={() => setShowExitModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Выход из игры</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {isOnline
            ? "Вы уверены? При выходе из онлайн-игры вы покинете матч, и он может быть прерван для других игроков."
            : "Вы уверены, что хотите выйти? Ваш текущий прогресс в игре будет потерян."}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowExitModal(false)}>
            Остаться
          </Button>
          <Button variant="danger" onClick={confirmExit}>
            Да, выйти
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
});

export default NavBar;
