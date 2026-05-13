import { makeAutoObservable } from "mobx";

export default class UserStore {
  constructor() {
    this._players = [];
    this._playersCount = 1;
    this._cardsCount = 4;
    this._difficulty = "Easy";
    this._shouldSum = false;
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

  setShouldSum(bool) {
    this._shouldSum = bool;
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
      sessionWinPair: 0,
      winner: false,
    }));
  }

  addWinPair(playerId) {
    const player = this._players.find((p) => p.id === playerId);
    if (player) {
      player.winPair += 1;
      if (this._shouldSum) {
        player.sessionWinPair += 1;
      }
    }
  }

  resetSettings() {
    this._players = [];
    this._playersCount = 1;
    this._cardsCount = 4;
    this._difficulty = "Easy";
    this._shouldSum = false;
  }

  resetPlayersScore() {
    this._players = this._players.map((player) => ({
      ...player,
      sessionWinPair: this._shouldSum ? player.sessionWinPair : 0,
      winPair: 0,
      winner: false,
    }));
  }

  incrementCardsCount() {
    if (this._cardsCount < 100) {
      this._cardsCount += 2;
    }
  }

  get shouldSum() {
    return this._shouldSum;
  }

  get sessionScore() {
    return this._players.length > 0 ? this._players[0].sessionWinPair : 0;
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
