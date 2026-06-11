const { createProxyMiddleware } = require('http-proxy-middleware');

/** CRA dev server: API/auth → Spring :8080. */
module.exports = function setupProxy(app) {
  const apiTarget = process.env.REACT_APP_API_URL || 'http://localhost:8080';

  app.use(
    ['/api', '/auth'],
    createProxyMiddleware({
      target: apiTarget,
      changeOrigin: true,
      logLevel: 'silent',
    }),
  );
};
