// src/modules/auth/auth.service.js

import bcrypt from "bcrypt";
import { TokenService } from "./auth.tokens.js";

export class AuthService {
  constructor(fastify) {
    this.prisma = fastify.prisma;
    this.tokenService = new TokenService(fastify);
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
      error.statusCode =401;
      throw error;
    }

    const token = this.tokenService.generateAccessToken(user);

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
  async logout(token) {
    const payload = this.tokenService.decodeToken(token);

    if (!payload) {
      const error = new Error('Invalid token.');
      error.statusCode = 401;
      throw error;
    }

    const expiresInSeconds = Math.max(
      payload.exp - Math.floor(Date.now() / 1000),
      0
    );

    await this.tokenService.blacklistToken(
      payload.jti,
      expiresInSeconds
    );

    return {
      success: true,
      message: 'Logged out successfully.',
    };
  }
}