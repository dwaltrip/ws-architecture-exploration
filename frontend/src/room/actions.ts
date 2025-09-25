import type {
  RoomJoinedPayload,
  RoomLeftPayload,
  RoomListPayload,
  RoomUserJoinedPayload,
  RoomUserLeftPayload,
} from '../../../common/src';

export class RoomClientActions {
  handleJoined(payload: RoomJoinedPayload) {
    console.log('[RoomClientActions] joined', payload);
  }

  handleLeft(payload: RoomLeftPayload) {
    console.log('[RoomClientActions] left', payload);
  }

  handleList(payload: RoomListPayload) {
    console.log('[RoomClientActions] list', payload);
  }

  handleUserJoined(payload: RoomUserJoinedPayload) {
    console.log('[RoomClientActions] user joined', payload);
  }

  handleUserLeft(payload: RoomUserLeftPayload) {
    console.log('[RoomClientActions] user left', payload);
  }
}
