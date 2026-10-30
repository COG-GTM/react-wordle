export const formatElapsedTime = milliseconds => {
  if (milliseconds === null) return '—';

  const seconds = Math.floor(milliseconds / 1000);
  const parts = [Math.floor(seconds / 60) % 60, seconds % 60];
  if (seconds >= 3600) parts.unshift(Math.floor(seconds / 3600));

  return parts.map(part => String(part).padStart(2, '0')).join(':');
};
