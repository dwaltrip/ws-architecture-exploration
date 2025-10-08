
function buildUserInfoMessage(userId: string, username: string) {
  return {
    type: 'system:user-info',
    payload: { userId, username },
  };
}

export { buildUserInfoMessage };
