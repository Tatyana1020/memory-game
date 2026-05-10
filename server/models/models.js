const sequelize = require("../db");
const { DataTypes } = require("sequelize");

const User = sequelize.define(
  "users",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    username: { type: DataTypes.STRING, unique: true, allowNull: false },
    password: { type: DataTypes.STRING },
    role: { type: DataTypes.STRING, defaultValue: "USER" },
    is_guest: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { timestamps: true },
);

const Results = sequelize.define(
  "results",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    score: { type: DataTypes.INTEGER, defaultValue: 0 },
    cards_count: { type: DataTypes.INTEGER, allowNull: false },
    difficulty: { type: DataTypes.STRING, allowNull: false },
    preview_time: { type: DataTypes.INTEGER, allowNull: false },
  },
  { timestamps: true },
);

const Matches = sequelize.define("matches", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  winner_id: { type: DataTypes.INTEGER, allowNull: true },
  game_mode: { type: DataTypes.STRING, allowNull: false },
  status: { type: DataTypes.STRING, defaultValue: "pending" },
});

const UserMatches = sequelize.define("user_matches", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
});

User.hasMany(Results);
Results.belongsTo(User);

Matches.hasMany(Results, { foreignKey: "matchId" });
Results.belongsTo(Matches, { foreignKey: "matchId", as: "match" });

User.belongsToMany(Matches, { through: UserMatches });
Matches.belongsToMany(User, { through: UserMatches });

Matches.belongsTo(User, { as: "winner", foreignKey: "winner_id" });

module.exports = {
  User,
  Results,
  Matches,
  UserMatches,
  sequelize,
};
