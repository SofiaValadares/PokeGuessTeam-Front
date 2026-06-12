const { createProxyMiddleware } = require('http-proxy-middleware');

/** CRA dev server: API/auth → Spring :8080; Socket.io → :9092. */
module.exports = function setupProxy(app) {
  const apiTarget = process.env.REACT_APP_API_URL || 'http://localhost:8080';
  const socketTarget = process.env.REACT_APP_SOCKET_URL || 'http://localhost:9092';

  app.use(
    ['/api', '/auth'],
    createProxyMiddleware({
      target: apiTarget,
      changeOrigin: true,
      logLevel: 'silent',
    }),
  );

  app.use(
    '/socket.io',
    createProxyMiddleware({
      target: socketTarget,
      changeOrigin: true,
      ws: true,
      logLevel: 'silent',
      proxyTimeout: 60_000,
      timeout: 60_000,
    }),
  );
};
