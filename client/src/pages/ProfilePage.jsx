import React, { useContext, useEffect, useState } from "react";
import { Container, Card, Table, Row, Col } from "react-bootstrap";
import { Context } from "..";
import { observer } from "mobx-react-lite";
import styles from "./ProfilePage.module.css";
import { fetchUserResults } from "../http/resultAPI";

const ProfilePage = observer(() => {
  const { user, setup } = useContext(Context);
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (user.user.id) {
      fetchUserResults(user.user.id).then((data) => setResults(data));
    }
  }, [user.user.id]);

  return (
    <div className={styles.profileContainer}>
      <Container className="mt-5">
        <Row>
          <Col md={4}>
            <Card className={`${styles.profileCard} p-4`}>
              <h3>Мой профиль</h3>
              <div className="mt-3">
                <p className={styles.infoLabel}>Имя пользователя</p>
                <p className={styles.infoValue}>
                  {user.user.username || "Не указано"}
                </p>
              </div>
            </Card>
          </Col>
          <Col md={8}>
            <Card className={`${styles.profileCard} p-4`}>
              <h3>История игр</h3>
              <Table responsive className={`${styles.resultsTable} mt-3`}>
                <thead>
                  <tr>
                    <th>Дата</th>
                    <th>Сложность</th>
                    <th>Очки</th>
                  </tr>
                </thead>
                <tbody>
                  {results.length > 0 ? (
                    results.map((res) => (
                      <tr key={res.id}>
                        <td>{new Date(res.createdAt).toLocaleDateString()}</td>
                        <td>
                          {setup.difficultyTranslations[res.difficulty] ||
                            res.difficulty}
                        </td>
                        <td>{res.score}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className={styles.noGamesText}>
                        Игр пока нет
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
});

export default ProfilePage;
