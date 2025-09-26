import type { ServerMessage } from '../../../common/src';
import type { MessageType, PayloadFor } from '../../../common/src';

export interface HandlerContext {
  userId: string;
  username: string;
  rooms: {
    join: (roomId: string) => void;
    leave: (roomId: string) => void;
    getMembers: (roomId: string) => Set<string> | null;
    isMember: (roomId: string, userId?: string) => boolean;
  };
  send: (message: ServerMessage) => void;
  broadcast: (message: ServerMessage, excludeSelf?: boolean) => void;
  broadcastToRoom: (roomId: string, message: ServerMessage, excludeSelf?: boolean) => void;
  isInRoom: (roomId: string) => boolean;
}

export type DomainHandler<
  TUnion extends { type: string; payload: unknown },
  TType extends MessageType<TUnion>
> = (
  payload: PayloadFor<TUnion, TType>,
  ctx: HandlerContext
) => void | Promise<void>;

export type DomainHandlers<TUnion extends { type: string; payload: unknown }> = {
  [K in MessageType<TUnion>]: DomainHandler<TUnion, K>;
};
