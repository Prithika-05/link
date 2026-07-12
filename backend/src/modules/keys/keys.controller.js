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
    const key = await this.keysService.upload(
      request.user.sub,
      request.body
    );

    return successResponse(
      reply,
      key,
      'Public key uploaded successfully.',
      201
    );
  };

  /**
   * Retrieve a user's public key.
   *
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  get = async (request, reply) => {
    const key = await this.keysService.get(
      request.params.userId
    );

    return successResponse(
      reply,
      key,
      'Public key retrieved successfully.'
    );
  };
}