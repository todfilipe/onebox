export function snoozeOptions(from: Date) {
  const inThreeHours = new Date(from.getTime() + 3 * 3600_000);

  const tomorrowAtNine = new Date(from);
  tomorrowAtNine.setDate(tomorrowAtNine.getDate() + 1);
  tomorrowAtNine.setHours(9, 0, 0, 0);

  const mondayAtNine = new Date(from);
  const daysUntilMonday = (8 - mondayAtNine.getDay()) % 7 || 7;
  mondayAtNine.setDate(mondayAtNine.getDate() + daysUntilMonday);
  mondayAtNine.setHours(9, 0, 0, 0);

  return [
    { label: "Daqui a 3 horas", until: inThreeHours },
    { label: "Amanhã às 9:00", until: tomorrowAtNine },
    { label: "Segunda às 9:00", until: mondayAtNine },
  ];
}
