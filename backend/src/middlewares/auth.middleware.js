// src/middlewares/auth.middleware.js

export async function authenticate(request, reply) {
  try {
    await request.jwtVerify();
  } catch (error) {
    reply.code(401).send({
      success: false,
      message: 'Unauthorized',
    });
  }
}