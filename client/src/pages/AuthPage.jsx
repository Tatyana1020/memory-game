import React, { useState, useMemo, useContext } from "react";
import { Container, Card, Form, Row } from "react-bootstrap";
import Button from "../components/Button/Button";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { HOME_ROUTE, LOGIN_ROUTE, REGISTRATION_ROUTE } from "../utils/consts";
import styles from "./AuthPage.module.css";
import { observer } from "mobx-react-lite";
import { Context } from "..";
import { login, registration } from "../http/userAPI";

const AuthPage = () => {
  const location = useLocation();
  const isLogin = location.pathname === LOGIN_ROUTE;
  const navigate = useNavigate();
  const { user } = useContext(Context);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [validated, setValidated] = useState({
    username: false,
    password: false,
  });
  const [error, setError] = useState("");

  const validations = useMemo(() => {
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]{6,}$/;
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;

    return {
      password: passwordRegex.test(password),
      username: isLogin ? true : usernameRegex.test(username),
    };
  }, [email, password, username, isLogin]);

  const isFormValid = validations.password && validations.username;

  const handleBlur = (e) => {
    const { name } = e.target;
    setValidated((prev) => ({ ...prev, [name]: true }));
  };

  const click = async (e) => {
    e.preventDefault();
    setError("");
    try {
      let data;
      if (isLogin) {
        data = await login(username, password);
      } else {
        data = await registration(username, password);
      }

      user.setUser(data);
      user.setIsAuth(true);
      navigate(HOME_ROUTE);
    } catch (e) {
      setError(e.response?.data?.message || "Произошла ошибка");
    }
  };

  return (
    <div className={styles.authBackground}>
      <Container className="d-flex justify-content-center align-items-center h-100">
        <Card className={`${styles.authCard} p-5`}>
          <h2 className={`text-center mb-4 ${styles.authTitle}`}>
            {isLogin ? "Вход в аккаунт" : "Регистрация"}
          </h2>

          <Form className="d-flex flex-column" onSubmit={click}>
            <Form.Group className="mb-3">
              <Form.Label className={styles.authLabel}>Имя пользователя</Form.Label>
              <Form.Control
                name="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onBlur={handleBlur}
                isInvalid={validated.username && !validations.username}
                className={styles.authInput}
                placeholder="От 3 до 20 символов..."
              />
              <Form.Control.Feedback type="invalid">
                Никнейм должен содержать 3-20 символов (только латиница, цифры
                или _).
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <div className="d-flex justify-content-between">
                <Form.Label className={styles.authLabel}>Пароль</Form.Label>
              </div>
              <Form.Control
                className={styles.authInput}
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={handleBlur}
                isInvalid={validated.password && !validations.password}
                placeholder="Минимум 6 символов (латинские буквы и цифры)..."
              />
              <Form.Control.Feedback type="invalid">
                Пароль должен содержать латиницу и цифры (мин. 6 символов).
              </Form.Control.Feedback>
            </Form.Group>

            {error && (
              <div
                style={{
                  color: "red",
                  marginBottom: "10px",
                  textAlign: "center",
                }}
              >
                {error}
              </div>
            )}

            <Button
              className={`${styles.authBtn} mt-3`}
              disabled={!isFormValid}
              type="submit"
            >
              {isLogin ? "Войти в аккаунт" : "Зарегистрироваться"}
            </Button>

            <Row className="mt-4 justify-content-center">
              <div className={`text-center ${styles.authFooter}`}>
                {isLogin ? (
                  <>
                    Нет аккаунта?{" "}
                    <NavLink to={REGISTRATION_ROUTE}>Зарегистрироваться</NavLink>
                  </>
                ) : (
                  <>
                    Уже есть аккаунт?{" "}
                    <NavLink to={LOGIN_ROUTE}>Войти</NavLink>
                  </>
                )}
              </div>
            </Row>
          </Form>
        </Card>
      </Container>
    </div>
  );
};

export default observer(AuthPage);
