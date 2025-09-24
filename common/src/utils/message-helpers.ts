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

