
import type { ClientMessage, ServerMessage } from "../../../common/src";
import { WSClient } from "./client";

type AppIncomingMessage = ServerMessage;
type AppOutgoingMessage = ClientMessage;

type AppWsClient = WSClient<AppIncomingMessage, AppOutgoingMessage>;

export type {
  AppIncomingMessage,
  AppOutgoingMessage,
  AppWsClient
};
