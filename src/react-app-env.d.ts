/// <reference types="react-scripts" />

declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module 'pusher-js' {
  export class Channel {
    name: string;
    bind_global(callback: (eventName: string, data: unknown) => void): this;
    unbind_global(callback?: (eventName: string, data: unknown) => void): this;
  }

  export type ChannelAuthorizationCallback = (
    error: Error | null,
    authData: { auth: string; channel_data?: string; shared_secret?: string } | null,
  ) => void;

  export default class Pusher {
    constructor(
      appKey: string,
      options: {
        cluster: string;
        authorizer?: (channel: Channel) => {
          authorize: (
            socketId: string,
            callback: ChannelAuthorizationCallback,
          ) => void;
        };
      },
    );
    subscribe(channelName: string): Channel;
    unsubscribe(channelName: string): void;
  }
}
