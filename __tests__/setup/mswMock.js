// Mock for MSW (Mock Service Worker) in test environment
const setupServer = () => ({
  listen: () => {},
  close: () => {},
  use: () => {},
  resetHandlers: () => {}
});

const rest = {
  get: () => {},
  post: () => {},
  put: () => {},
  delete: () => {},
  patch: () => {}
};

const http = {
  get: () => {},
  post: () => {},
  put: () => {},
  delete: () => {},
  patch: () => {}
};

module.exports = {
  setupServer,
  rest,
  http
};