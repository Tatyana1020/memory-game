const { User } = require("../models/models");
const ApiError = require("../error/ApiError");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const generateJwt = (id, role, username) => {
  return jwt.sign({ id, role, username }, process.env.SECRET_KEY, {
    expiresIn: "24h",
  });
};

const generateGuestName = () => {
  return `Guest_${Math.floor(Math.random() * 1000000)}`;
};

class UserController {
  async registration(req, res, next) {
    const { password, username, role } = req.body;
    if (!password || !username) {
      return next(ApiError.badRequest("Некорректный password или username"));
    }

    const candidateName = await User.findOne({ where: { username } });
    if (candidateName) {
      return next(
        ApiError.badRequest("Пользователь с таким username уже существует"),
      );
    }

    const hashPassword = await bcrypt.hash(password, 5);
    const user = await User.create({
      username,
      role: "USER",
      password: hashPassword,
    });

    const token = generateJwt(user.id, user.role, user.username);
    return res.json({
      token,
    });
  }

  async login(req, res, next) {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return next(ApiError.internal("Пользователь с таким именем не найден"));
    }

    let comparePassword = bcrypt.compareSync(password, user.password);
    if (!comparePassword) {
      return next(ApiError.badRequest("Указан неверный пароль"));
    }

    const token = generateJwt(user.id, user.role, user.username);
    return res.json({
      token,
    });
  }

  async guestLogin(req, res, next) {
    try {
      const username = generateGuestName();
      const password = Math.random().toString(36).slice(-8);
      const hashPassword = await bcrypt.hash(password, 5);

      const user = await User.create({
        username,
        role: "USER",
        password: hashPassword,
      });

      const token = generateJwt(user.id, user.role, user.username);
      return res.json({
        token,
      });
    } catch (e) {
      next(
        ApiError.badRequest(
          "Ошибка при создании гостевого входа: " + e.message,
        ),
      );
    }
  }

  async check(req, res, next) {
    try {
      const token = generateJwt(req.user.id, req.user.role, req.user.username);

      return res.json({
        token,
      });
    } catch (e) {
      return next(ApiError.internal("Ошибка при проверке авторизации"));
    }
  }

  async info(req, res, next) {
    try {
      const { id } = req.params;
      const user = await User.findOne({
        where: { id },
        attributes: ["id", "username", "role", "is_guest"],
      });
      if (!user) {
        return next(ApiError.badRequest("Пользователь не найден"));
      }
      return res.json(user);
    } catch (e) {
      next(ApiError.internal(e.message));
    }
  }

  async update(req, res, next) {
    try {
      const userId = req.user.id;
      const { username, password, email } = req.body;

      const user = await User.findOne({ where: { id: userId } });
      if (!user) {
        return next(ApiError.badRequest("Пользователь не найден"));
      }

      let newPassword = user.password;
      if (password && password.trim() !== "") {
        newPassword = await bcrypt.hash(password, 5);
      }

      if (username && username !== user.username) {
        const candidate = await User.findOne({ where: { username } });
        if (candidate) {
          return next(ApiError.badRequest("Этот никнейм уже занят"));
        }
      }

      await User.update(
        {
          username: username || user.username,
          password: newPassword,
        },
        { where: { id: userId } },
      );

      const updatedUser = await User.findOne({
        where: { id: userId },
        attributes: { exclude: ["password"] },
      });

      const token = generateJwt(
        updatedUser.id,
        updatedUser.role,
        updatedUser.username,
      );
      return res.json({ user: updatedUser, token });
    } catch (e) {
      next(ApiError.internal("Ошибка при обновлении профиля: " + e.message));
    }
  }

  async delete(req, res, next) {
    try {
      const userId = req.user.id;

      const deletedRows = await User.destroy({ where: { id: userId } });

      if (deletedRows === 0) {
        return next(ApiError.badRequest("Пользователь не найден"));
      }

      return res.json({
        message: "Твой аккаунт и все достижения были удалены.",
      });
    } catch (e) {
      next(ApiError.internal("Ошибка при удалении: " + e.message));
    }
  }
}

module.exports = new UserController();
