import React, { useContext, useState, useEffect } from "react";
import {
  Container,
  Table,
  Nav,
  Spinner,
  ButtonGroup,
  Card,
} from "react-bootstrap";
import styles from "./LeaderboardPage.module.css";
import { Context } from "..";
import Button from "../components/Button/Button";
import { fetchResults } from "../http/resultAPI";
import { observer } from "mobx-react-lite";

const LeaderboardPage = () => {
  const [viewMode, setViewMode] = useState("records");
  const [difficulty, setDifficulty] = useState("Easy");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { setup } = useContext(Context);

  useEffect(() => {
    if (!difficulty) return;
    const mode = viewMode === "records" ? "single" : "online";
    const onlyWinners = viewMode !== "records";

    setLoading(true);

    fetchResults(difficulty, mode)
      .then((res) => setData(res))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [viewMode, difficulty]);

  return (
    <div className={styles.leaderContainer}>
      <Container className="mt-1">
        <div className="d-flex justify-content-center mb-4">
          <Nav
            className={styles.navGroup}
            activeKey={viewMode}
            onSelect={(k) => setViewMode(k)}
          >
            <Nav.Item>
              <Nav.Link
                eventKey="records"
                className={`${styles.navLink} ${viewMode === "records" ? styles.activeNav : ""}`}
              >
                Локальная игра
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                eventKey="wins"
                className={`${styles.navLink} ${viewMode === "wins" ? styles.activeNav : ""}`}
              >
                Онлайн-игра
              </Nav.Link>
            </Nav.Item>
          </Nav>
        </div>
        <div className="d-flex justify-content-center mb-4">
          <ButtonGroup className={styles.diffGroup}>
            {["Easy", "Medium", "Hard"].map((diff) => (
              <Button
                key={diff}
                className={`${styles.diffButton} ${difficulty === diff ? styles.activeDiff : ""}`}
                onClick={() => setDifficulty(diff)}
              >
                {setup.difficultyTranslations[diff]}
              </Button>
            ))}
          </ButtonGroup>
        </div>

        <div className={styles.tableWrapper}>
          {loading ? (
            <Spinner animation="border" className="d-block mx-auto" />
          ) : (
            <Card className={`${styles.leaderCard} p-4`}>
              <h3>Таблица лидеров</h3>
              <Table responsive className={`${styles.leaderTable} mt-3`}>
                <thead>
                  <tr>
                    <th>№</th>
                    <th>Игрок</th>
                    <th>Пар найдено</th>
                    <th>Дата</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, index) => (
                    <tr key={item.userId || index}>
                      <td>{index + 1}</td>
                      <td>{item.user?.username || "Аноним"}</td>
                      <td>{item.score}</td>
                      <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card>
          )}
        </div>
      </Container>
    </div>
  );
};

export default observer(LeaderboardPage);
