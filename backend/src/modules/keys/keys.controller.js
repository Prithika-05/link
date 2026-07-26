// src/modules/keys/keys.controller.js

import { KeysService } from './keys.service.js';
import { successResponse } from '../../utils/response.js';

export class KeysController {

  constructor(fastify) {
    this.keysService = new KeysService(fastify);
  }

  upload = async (request, reply) => {
    const key =
      await this.keysService.upload(
        request.user.publicId,
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


  get = async (request, reply) => {
    const key =
      await this.keysService.get(
        request.params.publicId
      );

    return successResponse(
      reply,
      key,
      'Public key retrieved successfully.'
    );
  };


  list = async (request, reply) => {
    const keys =
      await this.keysService.list(
        request.user.publicId
      );

    return successResponse(
      reply,
      keys,
      'Public keys retrieved successfully.'
    );
  };


  delete = async (request, reply) => {
    const result =
      await this.keysService.delete(
        request.user.publicId
      );

    return successResponse(
      reply,
      null,
      result.message
    );
  };
}