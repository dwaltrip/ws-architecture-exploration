import type { MessageType, PayloadFor } from '../../../common/src';

export interface HandlerContext {
  userId: string;
}

export type { BroadcastOptions } from './bridge';

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
