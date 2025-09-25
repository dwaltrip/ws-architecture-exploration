import type { WSClient } from '../ws';
import { RoomClientActions } from './actions';

export function registerRoomHandlers(client: WSClient, actions: RoomClientActions) {
  const unsubscribes = [
    client.on('room:joined', (payload) => actions.handleJoined(payload)),
    client.on('room:left', (payload) => actions.handleLeft(payload)),
    client.on('room:list', (payload) => actions.handleList(payload)),
    client.on('room:user_joined', (payload) => actions.handleUserJoined(payload)),
    client.on('room:user_left', (payload) => actions.handleUserLeft(payload)),
  ];

  return () => {
    unsubscribes.forEach((unsubscribe) => unsubscribe());
  };
}
