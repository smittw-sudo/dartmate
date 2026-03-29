export const haptics = {
  confirm: () => navigator.vibrate?.(50),
  bust: () => navigator.vibrate?.(300),
  oneEighty: () => navigator.vibrate?.([50, 50, 50]),
  legWon: () => navigator.vibrate?.([100, 50, 100]),
  tap: () => navigator.vibrate?.(20),
};
