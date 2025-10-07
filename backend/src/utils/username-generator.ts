const ADJECTIVES = [
  'Swift', 'Clever', 'Brave', 'Silent', 'Mighty',
  'Wise', 'Bold', 'Quick', 'Calm', 'Fierce'
];

const ANIMALS = [
  'Panda', 'Tiger', 'Eagle', 'Wolf', 'Fox',
  'Bear', 'Hawk', 'Lion', 'Owl', 'Shark'
];

export function generateUsername(): string {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  return `${adjective} ${animal}`;
}
