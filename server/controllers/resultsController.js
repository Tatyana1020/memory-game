const { Results, User, Matches, sequelize } = require("../models/models");
const ApiError = require("../error/ApiError");
const { Op, where, col } = require("sequelize");

class ResultsController {
  async create(req, res, next) {
    try {
      console.log("BODY:", req.body);
      const userId = req.user.id;
      const { matchId, score, cards_count, difficulty, preview_time } =
        req.body;

      const match = await Matches.findByPk(matchId);
      if (!match) {
        return next(
          ApiError.badRequest("Матч не найден, невозможно сохранить результат"),
        );
      }

      const result = await Results.create({
        userId,
        matchId,
        score,
        cards_count,
        difficulty,
        preview_time,
      });
      return res.json(result);
    } catch (e) {
      next(ApiError.badRequest(e.message));
    }
  }

  async getAll(req, res, next) {
    try {
      const { difficulty, mode } = req.query;

      if (mode === "single") {
        const results = await Results.findAll({
          where: { difficulty },
          attributes: [
            "userId",
            [sequelize.fn("MAX", sequelize.col("score")), "score"],
            [
              sequelize.fn("MAX", sequelize.col("results.createdAt")),
              "createdAt",
            ],
          ],
          include: [
            {
              model: User,
              attributes: ["username"],
              required: true,
            },
            {
              model: Matches,
              as: "match",
              where: { game_mode: "single" },
              attributes: [],
              required: true,
            },
          ],
          group: ["results.userId", "user.id", "user.username"],
          order: [[sequelize.literal("score"), "DESC"]],
          limit: 50,
        });
        return res.json(results);
      }

      if (mode === "online") {
        const results = await Results.findAll({
          where: {
            difficulty,
            [Op.and]: sequelize.where(
              sequelize.col("results.userId"),
              "=",
              sequelize.col("match.winner_id"),
            ),
          },
          attributes: [
            "userId",
            [sequelize.fn("MAX", sequelize.col("score")), "score"],
            [
              sequelize.fn("MAX", sequelize.col("results.createdAt")),
              "createdAt",
            ],
          ],
          include: [
            {
              model: User,
              attributes: ["username"],
              required: true
            },
            {
              model: Matches,
              as: "match",
              where: {
                game_mode: "online",
                status: "finished",
              },
              attributes: [],
              required: true,
            },
          ],
          group: ["results.userId", "user.id", "user.username"],
        order: [[sequelize.literal("score"), "DESC"]],
        limit: 50,
          
        });
        return res.json(results);
      }
    } catch (e) {
      next(ApiError.badRequest(e.message));
    }
  }

  async getByUser(req, res) {
    try {
      const { userId } = req.params;
      const results = await Results.findAll({
        where: { userId: Number(userId) },
        order: [["createdAt", "DESC"]],
      });
      return res.json(results);
    } catch (e) {
      next(ApiError.badRequest(e.message));
    }
  }
}

module.exports = new ResultsController();
