export function splitIntoTeams<Player>(players: readonly Player[], teamCount: number): Player[][] {
  const shuffled = [...players]

  for (let index = shuffled.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const player = shuffled[index]!
    shuffled[index] = shuffled[swapIndex]!
    shuffled[swapIndex] = player
  }

  const teams: Player[][] = Array.from({ length: teamCount }, () => [])
  shuffled.forEach((player, index) => teams[index % teamCount]!.push(player))
  return teams
}
