export type User = {
  userId: string;
  username: string;
};

let userIdCounter = 0;
const users = new Map<string, User>();

export function generateUserId(): string {
  return `user-${++userIdCounter}`;
}

export function addUser(userId: string, username: string): void {
  users.set(userId, { userId, username });
}

export function getUser(userId: string): User | undefined {
  return users.get(userId);
}

export function removeUser(userId: string): void {
  users.delete(userId);
}

export function getAllUsers(): User[] {
  return Array.from(users.values());
}
