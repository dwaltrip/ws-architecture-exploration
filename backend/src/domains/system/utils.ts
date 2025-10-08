
function normalizeRoomId(roomId: unknown): string | null {
  if (typeof roomId !== 'string') {
    return null;
  }
  const trimmed = roomId.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export { normalizeRoomId };
