import type { ServerMessage } from '../../../common/src';
import type { MessageType, PayloadFor } from '../../../common/src';

export interface HandlerContext {
  userId: string;
  username: string;
  rooms: {
    join: (roomId: string) => Promise<void>;
    leave: (roomId: string) => Promise<void>;
    getMembers: (roomId: string) => Promise<Set<string> | null>;
    isMember: (roomId: string, userId?: string) => Promise<boolean>;
  };
  send: (message: ServerMessage) => void;
  sendError: (code: string, message: string, details?: unknown) => void;
  broadcast: (message: ServerMessage, excludeSelf?: boolean) => void;
  broadcastToRoom: (roomId: string, message: ServerMessage, excludeSelf?: boolean) => Promise<void>;
  isInRoom: (roomId: string) => Promise<boolean>;
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
