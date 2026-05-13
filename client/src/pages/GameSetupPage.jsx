import React, { useContext } from "react";
import { Context } from "..";
import { Container } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { ALL_SYMBOLS } from "../constants/symbols";
import InputRange from "../components/Input/InputRange";
import styles from "./GameSetupPage.module.css";
import Button from "../components/Button/Button";
import { observer } from "mobx-react-lite";
import { GAME_ROUTE } from "../utils/consts";

const difficultyDescriptions = {
  Easy: "Карточки откроются на 2 секунды перед стартом",
  Medium: "Карточки откроются на 1 секунду перед стартом",
  Hard: "Карточки не откроются перед стартом",
};

const GameSetupPage = () => {
  const { setup } = useContext(Context);
  const navigate = useNavigate();

  const isCardsInvalid =
    setup.cardsCount % 2 !== 0 ||
    setup.cardsCount <= 0 ||
    setup.cardsCount > 100;
  const isPlayersInvalid = setup.playersCount > 4 || setup.playersCount <= 0;

  const handleStartGame = () => {
    setup.setGameSettings(setup.cardsCount, setup.playersCount);
    navigate(GAME_ROUTE, {
      state: {
        isOnline: false,
        cardsCount: setup.cardsCount,
      },
    });
  };

  return (
    <div className={styles.setupBackground}>
      <Container className="d-flex justify-content-center">
        <div
          className={styles.setupCard}
          style={{ width: "100%", maxWidth: "600px" }}
        >
          <h2 className="text-center mb-4">Настроки игры</h2>

          <div className={styles.setupSection}>
            <label className={styles.optionLabel}>Количество игроков</label>
            <div className={styles.inputWrapper}>
              <InputRange
                value={setup.playersCount}
                onChange={(value) => setup.setPlayersCount(value)}
                placeholder="Сколько игроков?"
                min={1}
                max={4}
                step={1}
              />
            </div>
          </div>

          <div className={styles.setupSection}>
            <label className={styles.optionLabel}>Количество карточек</label>
            <div className={styles.inputWrapper}>
              <InputRange
                value={setup.cardsCount}
                onChange={(value) => setup.setCardsCount(value)}
                placeholder="Сколько карточек?"
                min={4}
                max={ALL_SYMBOLS.length * 2}
                step={2}
              />
            </div>
          </div>

          <div className={styles.setupSection}>
            <label className={styles.optionLabelSum}>
              <input
                type="checkbox"
                className={styles.checkboxInput}
                checked={setup.shouldSum}
                onChange={(e) => setup.setShouldSum(e.target.checked)}
              />
              <span className={styles.checkboxCustom}></span>
              Складывать результаты
            </label>
          </div>

          <div className={styles.setupSection}>
            <label className={styles.optionLabel}>Сложность игры</label>
            <div className={styles.btnGroupCustom}>
              {["Easy", "Medium", "Hard"].map((e) => (
                <div
                  key={e}
                  className={`${styles.selectableOption} ${setup.difficulty === e ? styles.active : ""}`}
                  onClick={() => setup.setDifficulty(e)}
                >
                  {setup.difficultyTranslations[e]}
                </div>
              ))}
            </div>
            <div className={styles.difficultyInfo}>
              <small className={styles.helperText}>
                {difficultyDescriptions[setup.difficulty]}
              </small>
            </div>
          </div>

          <Button
            fluid
            className="mt-4"
            onClick={handleStartGame}
            disabled={isCardsInvalid || isPlayersInvalid}
          >
            Начать игру
          </Button>
        </div>
      </Container>
    </div>
  );
};

export default observer(GameSetupPage);
