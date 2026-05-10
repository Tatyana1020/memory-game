import { makeAutoObservable } from "mobx";

export default class UserStore {
  constructor() {
    this._players = [];
    this._playersCount = 1;
    this._cardsCount = 4;
    this._difficulty = "Easy";
    this._difficultyTranslations = {
      Easy: "Легко",
      Medium: "Средне",
      Hard: "Сложно",
    };
    this._difficultyTime = {
      Easy: 2000,
      Medium: 1000,
      Hard: 0,
    };
    makeAutoObservable(this);
  }

  setPlayers(arr) {
    this._players = arr;
  }

  setPlayersCount(count) {
    this._playersCount = count;
  }

  setCardsCount(count) {
    this._cardsCount = count;
  }

  setDifficulty(str) {
    this._difficulty = str;
  }

  setGameSettings(count, players) {
    this._cardsCount = count;
    this._playersCount = players;
    this._players = Array.from({ length: players }, (e, index) => ({
      id: index,
      winPair: 0,
      winner: false,
    }));
  }

  resetSettings() {
    this._players = [];
    this._playersCount = 1;
    this._cardsCount = 4;
    this._difficulty = "Easy";
  }

  resetPlayersScore() {
    this._players = this._players.map((player) => ({
      ...player,
      winPair: 0,
      winner: false,
    }));
  }

  get difficultyTranslations() {
    return this._difficultyTranslations;
  }

  get players() {
    return this._players;
  }

  get playersCount() {
    return this._playersCount;
  }

  get cardsCount() {
    return this._cardsCount;
  }

  get difficulty() {
    return this._difficulty;
  }

  get difficultyTime() {
    return this._difficultyTime;
  }
}
