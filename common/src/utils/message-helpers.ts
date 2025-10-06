export type MessageShapeMap = Record<string, unknown>;

export type MessageUnion<TMap extends MessageShapeMap> = {
  [TType in keyof TMap]: {
    type: TType extends string ? TType : never;
    payload: TMap[TType];
  }
}[keyof TMap];

export type MessageType<TUnion extends { type: string }> = TUnion['type'];

export type PayloadFor<
  TUnion extends { type: string; payload: unknown },
  TType extends MessageType<TUnion>
> = Extract<TUnion, { type: TType }>['payload'];

export type MessageHandler<
  TUnion extends { type: string; payload: unknown },
  TType extends MessageType<TUnion>
> = (payload: PayloadFor<TUnion, TType>) => void;

// TODO: Not being used? Remove?
export type HandlerPayloadMap<TUnion extends { type: string; payload: unknown }> = {
  [TType in MessageType<TUnion>]: PayloadFor<TUnion, TType>;
};

export type HandlerMap<TUnion extends { type: string; payload: unknown }> = {
  [TType in MessageType<TUnion>]: (payload: PayloadFor<TUnion, TType>) => void;
};

export type MessageHandlerWithCtx<
  TUnion extends { type: string; payload: unknown },
  TCtx,
  TType extends MessageType<TUnion>
> = (payload: PayloadFor<TUnion, TType>, ctx: TCtx) => void;

export type HandlerMapWithCtx<
  TUnion extends { type: string; payload: unknown },
  TCtx
> = {
  [TType in MessageType<TUnion>]: (payload: PayloadFor<TUnion, TType>, ctx: TCtx) => void;
};

// TODO: Not being used? Remove?
export function mergeHandlerMaps<TUnion extends { type: string; payload: unknown }>(
  ...maps: HandlerMap<TUnion>[]
) {
  return maps.reduce<HandlerMap<TUnion>>((merged, map) => {
    (Object.keys(map) as Array<MessageType<TUnion>>).forEach((type) => {
      merged[type] = map[type];
    });
    return merged;
  }, {} as HandlerMap<TUnion>);
}
