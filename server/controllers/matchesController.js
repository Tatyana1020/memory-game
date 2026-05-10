const { Matches, User, Results, UserMatches } = require("../models/models");
const ApiError = require("../error/ApiError");

class MatchesController {
  async create(req, res, next) {
    try {
      const { game_mode, difficulty, playerIds } = req.body;

      const validDifficulties = ["easy", "medium", "hard"];
      if (difficulty && !validDifficulties.includes(difficulty)) {
        return next(ApiError.badRequest("Неверный уровень сложности"));
      }

      const match = await Matches.create({
        game_mode,
        status: 'active'
      });

      if (playerIds && Array.isArray(playerIds)) {
        await match.addUsers(playerIds);
      } else {
        await match.addUsers(req.user.id);
      }

      const fullMatch = await Matches.findByPk(match.id, {
        include: [{ model: User, attributes: ["id", "username"] }],
      });

      return res.json(fullMatch);
    } catch (e) {
      next(ApiError.badRequest(e.message));
    }
  }

  async getAll(req, res, next) {
    try {
      const userId = req.user.id;
      const matches = await Matches.findAll({
        include: [
          {
            model: User,
            where: { id: userId },
            attributes: [],
          },
        ],
        order: [["createdAt", "DESC"]],
      });
      return res.json(matches);
    } catch (e) {
      next(ApiError.badRequest(e.message));
    }
  }

  async getOne(req, res, next) {
    try {
      const { id } = req.params;
      const match = await Matches.findOne({
        where: { id },
        include: [
          {
            model: User,
            attributes: ["id", "username", "is_guest"],
            through: { attributes: [] },
          },
          {
            model: User,
            as: "winner",
            attributes: ["id", "username"],
          },
          {
            model: Results,
            attributes: ["score", "cards_count", "preview_time"],
          },
        ],
      });

      if (!match) {
        return next(ApiError.badRequest("Матч не найден"));
      }

      return res.json(match);
    } catch (e) {
      next(ApiError.badRequest(e.message));
    }
  }

  async finish(req, res, next) {
    try {
      const { id } = req.params;
      const { winner_id } = req.body;
      const match = await Matches.findOne({ where: { id } });

      if (!match) {
        return next(ApiError.badRequest("Матч не найден"));
      }

      await match.update({
        status: "finished",
        winner_id: winner_id || null,
      });

      return res.json({
        message: "Матч завершен",
        matchId: id,
        winnerId: winner_id,
      });
    } catch (e) {
      next(ApiError.badRequest(e.message));
    }
  }
}

module.exports = new MatchesController();
