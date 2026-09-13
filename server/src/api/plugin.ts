export default function(fastify, opts, done) {
  fastify.get('/user', (request, reply) => {
    reply.send({ hello: 'world' });
  });

  done();
}
