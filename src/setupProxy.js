const { createProxyMiddleware } = require('http-proxy-middleware');

/**
 * CRA dev server: API/auth → Spring :8080; Socket.io → :9092.
 * Não uses o campo "proxy" do package.json — conflita com /socket.io.
 */
module.exports = function setupProxy(app) {
  const apiTarget = process.env.REACT_APP_API_URL || 'http://localhost:8080';
  const socketTarget = process.env.REACT_APP_SOCKET_URL || 'http://localhost:9092';

  app.use(
    '/socket.io',
    createProxyMiddleware({
      target: socketTarget,
      changeOrigin: true,
      ws: true,
    }),
  );

  app.use(
    ['/api', '/auth'],
    createProxyMiddleware({
      target: apiTarget,
      changeOrigin: true,
    }),
  );
};
