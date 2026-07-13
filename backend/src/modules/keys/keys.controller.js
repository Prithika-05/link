// src/modules/keys/keys.controller.js

import { KeysService } from './keys.service.js';
import { successResponse } from '../../utils/response.js';

export class KeysController {
  /**
   * @param {import('fastify').FastifyInstance} fastify
   */
  constructor(fastify) {
    this.keysService = new KeysService(fastify);
  }

  /**
   * Upload or update the authenticated user's public key.
   *
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  upload = async (request, reply) => {
    const key =
      await this.keysService.upload(
        request.user.sub,
        request.body
      );

    return successResponse(
      reply,
      key,
      'Public key uploaded successfully.',
      key.createdAt?.getTime() ===
        key.updatedAt?.getTime()
        ? 201
        : 200
    );
  };

  /**
   * Retrieve a user's public key.
   *
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  get = async (request, reply) => {
    const key =
      await this.keysService.get(
        request.params.userId
      );

    return successResponse(
      reply,
      key,
      'Public key retrieved successfully.'
    );
  };

  /**
   * List the authenticated user's public keys.
   *
   * Currently returns one key, but supports
   * future multi-device implementations.
   *
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  list = async (request, reply) => {
    const keys =
      await this.keysService.list(
        request.user.sub
      );

    return successResponse(
      reply,
      keys,
      'Public keys retrieved successfully.'
    );
  };

  /**
   * Delete the authenticated user's public key.
   *
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  delete = async (request, reply) => {
    const result =
      await this.keysService.delete(
        request.user.sub
      );

    return successResponse(
      reply,
      null,
      result.message
    );
  };
}