export function getUserColor(userId: string, userName: string): string {
  // Hash userId to hue (0-360)
  const inputStr = userId + userName;
  let hash = 0;
  for (let i = 0; i < inputStr.length; i++) {
    hash = inputStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 70%, 60%)`;
}
