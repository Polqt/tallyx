export function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function compactKey(key: string) {
  if (key.length <= 14) return key;
  return `${key.slice(0, 6)}...${key.slice(-6)}`;
}
