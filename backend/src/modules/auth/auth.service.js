// src/modules/auth/auth.service.js

import bcrypt from "bcrypt";

export class AuthService {
  constructor(fastify) {
    this.prisma = fastify.prisma;
    this.jwt = fastify.jwt;
  }

  async register({ username, email, password }) {
    const existingEmail = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      const error = new Error("Email already registered.");
      error.statusCode = 409;
      throw error;
    }

    const existingUsername = await this.prisma.user.findUnique({
      where: { username },
    });

    if (existingUsername) {
      const error = new Error("Username already taken.");
      error.statusCode = 409;
      throw error;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await this.prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
      },
      select: {
        id: true,
        username: true,
        email: true,
      },
    });

    return {
      success: true,
      message: "User registered successfully.",
      user,
    };
  }

  async login({ email, password }) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      const error = new Error("Invalid email or password.");
      error.statusCode = 401;
      throw error;
    }

    const validPassword = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!validPassword) {
      const error = new Error("Invalid email or password.");
      error.statusCode = 401;
      throw error;
    }

    const token = this.jwt.sign(
      {
        sub: user.id,
        email: user.email,
        username: user.username,
      },
      {
        expiresIn: "1h",
      }
    );

    return {
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    };
  }
}