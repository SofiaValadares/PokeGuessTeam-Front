/** Ajuda o TypeScript (CRA / TS 4.9) a resolver tipos do socket.io-client. */
declare module 'socket.io-client' {
  export * from 'socket.io-client/build/esm/index';
  export { io } from 'socket.io-client/build/esm/index';
}
