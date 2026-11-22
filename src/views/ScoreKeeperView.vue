<script setup lang="ts">
import BaseModal from '@/components/BaseModal.vue'
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'

type Score = number | null

interface GameSettings {
  winningCondition: 'highest' | 'lowest' | 'target'
  roundLimit: number | null
  pointTarget?: number
}

interface Game {
  players: string[]
  rounds: Score[][]
  selectedRound: number
  finished: boolean
  settings?: GameSettings
}

const storageKey = 'roll-playr:score-keeper:v1'
const initialsPattern = /^\p{L}{1,4}$/u
const confettiColors = ['#c4b5fd', '#a78bfa', '#fbbf24', '#f472b6', '#67e8f9']
const defaultSettings: GameSettings = { winningCondition: 'highest', roundLimit: null }

function newGame(players: string[] = [], settings?: GameSettings): Game {
  return {
    players: [...players],
    rounds: [players.map(() => null)],
    selectedRound: 0,
    finished: false,
    settings,
  }
}

function loadGame(): Game {
  try {
    const saved: Game | null = JSON.parse(sessionStorage.getItem(storageKey) ?? 'null')
    if (
      saved &&
      Array.isArray(saved.players) &&
      saved.players.every((player) => typeof player === 'string' && initialsPattern.test(player)) &&
      new Set(saved.players).size === saved.players.length &&
      Array.isArray(saved.rounds) &&
      saved.rounds.length > 0 &&
      saved.rounds.every(
        (round) =>
          Array.isArray(round) &&
          round.length === saved.players.length &&
          round.every((score) => score === null || Number.isSafeInteger(score)),
      ) &&
      Number.isInteger(saved.selectedRound) &&
      saved.selectedRound >= 0 &&
      saved.selectedRound < saved.rounds.length &&
      typeof saved.finished === 'boolean' &&
      (!saved.finished || saved.players.length > 0)
    ) {
      const settings = saved.settings
      if (
        !settings ||
        (settings.winningCondition !== 'highest' &&
          settings.winningCondition !== 'lowest' &&
          settings.winningCondition !== 'target') ||
        (settings.winningCondition === 'target' &&
          (settings.pointTarget === undefined ||
            !Number.isSafeInteger(settings.pointTarget) ||
            settings.pointTarget < 1)) ||
        (settings.winningCondition !== 'target' &&
          settings.roundLimit !== null &&
          (!Number.isSafeInteger(settings.roundLimit) || settings.roundLimit < saved.rounds.length))
      ) {
        delete saved.settings
      } else if (settings.winningCondition === 'target') {
        settings.roundLimit = null
      }
      return saved
    }
  } catch {
    // An unreadable session can start with an empty scorecard.
  }
  return newGame()
}

const game = ref(loadGame())
const initials = ref('')
const playerError = ref('')
const storageError = ref(false)
const celebrate = ref(false)
const editingRound = ref(false)
const playerToRemove = ref<string | null>(null)
const optionsOpen = ref(false)
const draftWinningCondition = ref<GameSettings['winningCondition']>(defaultSettings.winningCondition)
const draftRoundLimit = ref<number | ''>('')
const draftPointTarget = ref<number | ''>('')
const scoreEntryOrder = ref<{ player: string; index: number }[] | null>(null)
const initialsInput = useTemplateRef<HTMLInputElement>('initialsInput')
const roundHeading = useTemplateRef<HTMLHeadingElement>('roundHeading')
const resultHeading = useTemplateRef<HTMLHeadingElement>('resultHeading')
const editButton = useTemplateRef<HTMLButtonElement>('editButton')
const newGameDialog = useTemplateRef<HTMLDialogElement>('newGameDialog')

const latestRound = computed(() => game.value.rounds.length - 1)
const isCurrentRound = computed(() => game.value.selectedRound === latestRound.value)
const selectedScores = computed(() => game.value.rounds[game.value.selectedRound]!)
const settings = computed(() => game.value.settings ?? defaultSettings)
const roundLimit = computed(() => settings.value.roundLimit)
const isFinalRound = computed(() => roundLimit.value === game.value.rounds.length)
const pointTarget = computed(() =>
  settings.value.winningCondition === 'target' ? settings.value.pointTarget : undefined,
)
const optionsAvailable = computed(() => !game.value.finished)
const totals = computed(() => {
  const scores = game.value.players.map(() => 0)
  for (const round of game.value.rounds) {
    round.forEach((score, index) => {
      scores[index] = (scores[index] ?? 0) + (score ?? 0)
    })
  }
  return scores
})
const rankedPlayers = computed(() => {
  const scores = totals.value
  const direction = settings.value.winningCondition === 'lowest' ? 1 : -1
  return game.value.players
    .map((player, index) => ({ player, index, total: scores[index]! }))
    .sort((a, b) => direction * (a.total - b.total))
})
// Keep the focused score input in place until its entry is committed.
const scorecardOrder = computed(() => scoreEntryOrder.value ?? rankedPlayers.value)
const winningScore = computed(() => rankedPlayers.value[0]?.total)
const winners = computed(() =>
  game.value.players.filter((_, index) => totals.value[index] === winningScore.value),
)
const winnerNames = computed(() =>
  new Intl.ListFormat(undefined, { type: 'conjunction' }).format(winners.value),
)
const targetReached = computed(() => {
  const target = pointTarget.value
  return target !== undefined && (winningScore.value ?? 0) >= target
})
const playersCloseToTarget = computed(() => {
  const target = pointTarget.value
  if (target === undefined || targetReached.value) return []

  const threshold = target - Math.floor(target / 3)
  return rankedPlayers.value.filter(({ total }) => total >= threshold)
})
const canFinish = computed(() =>
  targetReached.value ||
  (roundLimit.value === null && pointTarget.value === undefined) ||
  (isCurrentRound.value && isFinalRound.value),
)

watch(
  game,
  (currentGame) => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(currentGame))
      storageError.value = false
    } catch {
      storageError.value = true
    }
  },
  { deep: true },
)

function openOptions() {
  if (!optionsAvailable.value) return
  draftWinningCondition.value = settings.value.winningCondition
  draftRoundLimit.value = roundLimit.value ?? ''
  draftPointTarget.value = pointTarget.value ?? ''
  optionsOpen.value = true
}

function saveOptions() {
  const limit = draftWinningCondition.value === 'target' ? '' : draftRoundLimit.value
  const target = draftPointTarget.value
  if (limit !== '' && (!Number.isSafeInteger(limit) || limit < game.value.rounds.length)) return

  const newSettings: GameSettings = {
    winningCondition: draftWinningCondition.value,
    roundLimit: limit === '' ? null : limit,
  }
  if (newSettings.winningCondition === 'target') {
    if (target === '' || !Number.isSafeInteger(target) || target < 1) return
    newSettings.pointTarget = target
  }
  game.value.settings = newSettings
  optionsOpen.value = false
}

defineExpose({ openOptions, optionsAvailable })

function addPlayer() {
  const player = initials.value.trim().toUpperCase()
  if (!initialsPattern.test(player)) {
    playerError.value = 'Enter 1–4 letters.'
    initialsInput.value?.focus()
    return
  }
  if (game.value.players.includes(player)) {
    playerError.value = `${player} is already playing. Use different initials.`
    initialsInput.value?.focus()
    return
  }

  game.value.players.push(player)
  for (const round of game.value.rounds) round.push(null)
  initials.value = ''
  playerError.value = ''
  initialsInput.value?.focus()
}

async function removePlayer() {
  if (playerToRemove.value === null) return

  const index = game.value.players.indexOf(playerToRemove.value)
  playerToRemove.value = null
  if (index === -1) return

  game.value.players.splice(index, 1)
  for (const round of game.value.rounds) round.splice(index, 1)

  if (game.value.players.length === 0) editingRound.value = false
  await nextTick()
  if (game.value.players.length) {
    editButton.value?.focus()
  } else {
    initialsInput.value?.focus()
  }
}

function updateScore(index: number, event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.validity.valid) return
  if (input.value === '') {
    selectedScores.value[index] = null
  } else if (Number.isSafeInteger(input.valueAsNumber)) {
    selectedScores.value[index] = input.valueAsNumber
  }
}

function commitScore(index: number, event: Event) {
  const input = event.target as HTMLInputElement
  input.value = String(selectedScores.value[index] ?? '')
  scoreEntryOrder.value = null
  if (targetReached.value) void finishGame()
}

async function selectRound(round: number) {
  editingRound.value = false
  game.value.selectedRound = round
  await nextTick()
  roundHeading.value?.focus()
}

function addRound() {
  if (game.value.finished || isFinalRound.value || targetReached.value) return
  game.value.rounds.push(game.value.players.map(() => null))
  void selectRound(latestRound.value)
}

async function finishGame() {
  if (game.value.finished || !game.value.players.length || !canFinish.value) return
  editingRound.value = false
  scoreEntryOrder.value = null
  celebrate.value = true
  game.value.finished = true
  await nextTick()
  resultHeading.value?.focus()
}

async function startNewGame(keepPlayers: boolean) {
  newGameDialog.value?.close()
  game.value = newGame(keepPlayers ? game.value.players : [], game.value.settings)
  initials.value = ''
  playerError.value = ''
  celebrate.value = false
  await nextTick()
  if (keepPlayers) {
    roundHeading.value?.focus()
  } else {
    initialsInput.value?.focus()
  }
}
</script>

<template>
  <main class="scorekeeper">
    <p v-if="storageError" class="storage-error" role="status">
      Session storage is unavailable. Reloading may lose your latest changes.
    </p>

    <template v-if="!game.finished">
      <div class="game-alerts" role="status" aria-atomic="true">
        <p v-if="isFinalRound" class="game-alert">1 round left. This is the final round.</p>
        <p v-if="targetReached" class="game-alert">
          {{ winnerNames }} reached the {{ pointTarget }}-point target.
        </p>
        <p v-for="{ player, total } in playersCloseToTarget" :key="player" class="game-alert">
          {{ player }} is close to winning with {{ total }} of {{ pointTarget }} points.
        </p>
      </div>
      <section class="panel" aria-labelledby="round-heading">
        <div class="round-bar">
          <div>
            <h2 id="round-heading" ref="roundHeading" tabindex="-1">
              Round {{ game.selectedRound + 1 }}{{ roundLimit === null ? '' : ` of ${roundLimit}` }}
            </h2>
            <p>
              {{
                isCurrentRound
                  ? 'Current round'
                  : `Past round · Round ${latestRound + 1} is current`
              }}
              <template v-if="pointTarget !== undefined">
                · First to {{ pointTarget }} points
              </template>
            </p>
          </div>
          <div class="round-controls">
            <nav aria-label="Round navigation" class="round-nav">
              <button
                class="button"
                type="button"
                :disabled="game.selectedRound === 0"
                @click="selectRound(game.selectedRound - 1)"
              >
                Previous
              </button>
              <button
                class="button"
                type="button"
                :disabled="isCurrentRound"
                @click="selectRound(game.selectedRound + 1)"
              >
                Next
              </button>
            </nav>
            <button
              ref="editButton"
              class="button edit-button"
              :class="{ 'primary-button': editingRound }"
              type="button"
              :aria-label="editingRound ? undefined : 'Edit round'"
              :title="editingRound ? undefined : 'Edit round'"
              :disabled="!game.players.length"
              @click="editingRound = !editingRound"
            >
              <svg
                v-if="!editingRound"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="m14 6 4 4M4 20l4-1 12-12a2.8 2.8 0 0 0-4-4L4 15z" />
              </svg>
              <template v-else>Done</template>
            </button>
          </div>
        </div>

        <table v-if="game.players.length" class="scores">
          <thead>
            <tr>
              <th scope="col">Player</th>
              <th scope="col">Round score</th>
              <th scope="col">Total score</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="{ player, index } in scorecardOrder" :key="player">
              <th scope="row">
                <div class="player-name">
                  <span class="initials">{{ player }}</span>
                  <button
                    v-if="editingRound"
                    class="button remove-player"
                    type="button"
                    :aria-label="`Remove ${player} and all their scores`"
                    :title="`Remove ${player}`"
                    @click="playerToRemove = player"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      aria-hidden="true"
                    >
                      <path d="m6 6 12 12M18 6 6 18" />
                    </svg>
                  </button>
                </div>
              </th>
              <td>
                <input
                  v-if="isCurrentRound || editingRound"
                  :key="game.selectedRound"
                  class="score-input"
                  type="number"
                  step="1"
                  placeholder="0"
                  :aria-label="`Round ${game.selectedRound + 1} score for ${player}`"
                  :value="selectedScores[index]"
                  @focus="scoreEntryOrder = rankedPlayers"
                  @input="updateScore(index, $event)"
                  @keydown.enter.prevent="($event.target as HTMLInputElement).blur()"
                  @blur="commitScore(index, $event)"
                />
                <span v-else>{{ selectedScores[index] ?? '—' }}</span>
              </td>
              <td class="total">{{ totals[index] }}</td>
            </tr>
          </tbody>
        </table>
        <p v-else class="empty-state">Add a player to start keeping score.</p>

        <form class="add-player" novalidate @submit.prevent="addPlayer">
          <label for="player-initials">Player initials</label>
          <div class="player-controls">
            <input
              id="player-initials"
              ref="initialsInput"
              v-model="initials"
              type="text"
              placeholder="e.g. AB"
              maxlength="4"
              autocomplete="off"
              autocapitalize="characters"
              spellcheck="false"
              :aria-invalid="playerError ? true : undefined"
              :aria-describedby="playerError ? 'player-error' : undefined"
              @input="playerError = ''"
            />
            <button class="button" type="submit">+ Add player</button>
          </div>
          <p v-if="playerError" id="player-error" class="player-error" role="alert">
            {{ playerError }}
          </p>
        </form>
      </section>

      <div v-if="game.players.length" class="game-actions">
        <button
          v-if="canFinish"
          class="button finish-button"
          :class="{ 'primary-button': isFinalRound || targetReached }"
          type="button"
          @click="finishGame"
        >
          Finish game
        </button>
        <button
          v-if="isCurrentRound && !isFinalRound && !targetReached"
          class="button primary-button"
          type="button"
          @click="addRound"
        >
          Start next round
        </button>
        <button
          v-if="!isCurrentRound && !targetReached"
          class="button primary-button"
          type="button"
          @click="selectRound(latestRound)"
        >
          Back to current round
        </button>
      </div>

      <BaseModal
        v-model:open="optionsOpen"
        name="score-keeper-settings"
        title="Score Keeper settings"
        submit-label="Save settings"
        @submit="saveOptions"
      >
        <fieldset class="game-settings">
          <legend>Winning condition</legend>
          <label class="winning-option">
            <input
              v-model="draftWinningCondition"
              type="radio"
              name="winning-condition"
              value="highest"
            />
            Highest points
          </label>
          <label class="winning-option">
            <input
              v-model="draftWinningCondition"
              type="radio"
              name="winning-condition"
              value="lowest"
            />
            Lowest points
          </label>
          <label class="winning-option">
            <input
              v-model="draftWinningCondition"
              type="radio"
              name="winning-condition"
              value="target"
            />
            First to a point total
          </label>
          <label v-if="draftWinningCondition === 'target'" class="point-target">
            Points to win
            <input
              v-model.number="draftPointTarget"
              type="number"
              placeholder="e.g. 200"
              min="1"
              :max="Number.MAX_SAFE_INTEGER"
              step="1"
              required
            />
          </label>
        </fieldset>
        <fieldset v-if="draftWinningCondition !== 'target'" class="game-settings round-settings">
          <legend>Number of rounds</legend>
          <input
            v-model.number="draftRoundLimit"
            type="number"
            aria-label="Number of rounds"
            aria-describedby="round-limit-hint"
            placeholder="Unlimited"
            :min="game.rounds.length"
            :max="Number.MAX_SAFE_INTEGER"
            step="1"
          />
          <p id="round-limit-hint" class="muted">
            Leave blank for unlimited rounds.
            <template v-if="game.rounds.length > 1">
              A limit must include all {{ game.rounds.length }} rounds already started.
            </template>
          </p>
        </fieldset>
      </BaseModal>

      <BaseModal
        :open="playerToRemove !== null"
        name="remove-player-dialog"
        :title="`Remove ${playerToRemove ?? 'player'}?`"
        aria-describedby="remove-player-description"
        submit-label="Remove player"
        @update:open="playerToRemove = null"
        @submit="removePlayer"
      >
        <p id="remove-player-description">
          Are you sure you want to remove {{ playerToRemove }} and all their scores?
        </p>
      </BaseModal>
    </template>

    <template v-else>
      <section class="winner" :class="{ celebrate }" aria-labelledby="result-heading">
        <div v-if="celebrate" class="confetti" aria-hidden="true">
          <i
            v-for="piece in 32"
            :key="piece"
            :style="{
              '--x': `${(piece * 23) % 100}%`,
              '--drift': `${((piece * 43) % 160) - 80}px`,
              '--delay': `${(piece % 8) * 60}ms`,
              '--spin': `${piece % 2 ? 480 : -480}deg`,
              '--color': confettiColors[piece % confettiColors.length],
            }"
          ></i>
        </div>
        <div class="winner-content">
          <span class="trophy" aria-hidden="true">🏆</span>
          <p class="result-label">Game over</p>
          <h2 id="result-heading" ref="resultHeading" tabindex="-1">
            {{ winners.length === 1 ? `${winnerNames} wins!` : `It’s a tie! ${winnerNames}` }}
          </h2>
          <p>{{ winningScore }} {{ winningScore === 1 ? 'point' : 'points' }}</p>
        </div>
      </section>

      <section class="panel" aria-labelledby="final-scores">
        <div class="round-bar">
          <h2 id="final-scores">Final scores</h2>
          <span class="muted">
            {{ game.rounds.length }} {{ game.rounds.length === 1 ? 'round' : 'rounds' }}
          </span>
        </div>
        <div class="results-grid">
          <div v-for="{ player, index, total } in rankedPlayers" :key="player" class="player-result">
            <div class="player-result-heading">
              <h3 class="initials">{{ player }}</h3>
              <p class="result-total">
                <span class="muted">Total</span>
                <strong class="total">{{ total }}</strong>
              </p>
            </div>
            <table class="scores results-table" :aria-label="`Round scores for ${player}`">
              <tbody>
                <tr v-for="(scores, round) in game.rounds" :key="round">
                  <th scope="row">Round {{ round + 1 }}</th>
                  <td>{{ scores[index] ?? '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <div class="game-actions">
        <button class="button primary-button" type="button" @click="newGameDialog?.showModal()">
          Start new game
        </button>
      </div>

      <dialog
        ref="newGameDialog"
        class="new-game-dialog"
        aria-labelledby="new-game-heading"
        aria-describedby="new-game-description"
      >
        <h2 id="new-game-heading">Start new game</h2>
        <p id="new-game-description">Both options start at Round 1 with fresh scores.</p>
        <div class="new-game-options">
          <button class="button primary-button" type="button" @click="startNewGame(true)">
            Same players
          </button>
          <button class="button" type="button" @click="startNewGame(false)">New players</button>
        </div>
        <button
          class="button cancel-button"
          type="button"
          autofocus
          @click="newGameDialog?.close()"
        >
          Cancel
        </button>
      </dialog>
    </template>
  </main>
</template>

<style scoped>
.scorekeeper {
  width: min(100%, 56rem);
  margin-inline: auto;
  padding: clamp(1rem, 4vw, 2rem) clamp(1rem, 4vw, 2rem) 3rem;
}

.round-bar,
.round-controls,
.round-nav,
.edit-button,
.player-name,
.player-controls,
.game-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.game-settings legend {
  margin-bottom: 0.375rem;
  font-weight: 750;
}

.winning-option {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  min-height: 2.75rem;
  cursor: pointer;
}

.winning-option input {
  width: 1.125rem;
  min-height: auto;
  height: 1.125rem;
  padding: 0;
  accent-color: var(--color-secondary);
}

.round-settings {
  margin-top: 1rem;
}

.point-target {
  display: grid;
  gap: 0.375rem;
  margin-top: 0.5rem;
}

.round-settings input,
.point-target input {
  width: 8rem;
}

.round-settings p {
  margin-top: 0.375rem;
  font-size: 0.875rem;
}

.round-controls {
  flex-wrap: wrap;
}

.edit-button {
  justify-content: center;
  min-width: 2.75rem;
  padding-inline: 0.75rem;
}

h2 {
  font-size: 1.25rem;
  font-weight: 750;
  line-height: 1.25;
}

.round-bar p,
.muted,
.empty-state {
  color: var(--color-text-muted);
}

.round-bar p {
  margin-top: 0.25rem;
}

.panel {
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 1.25rem;
  background: var(--color-surface-elevated);
}

.round-bar {
  justify-content: space-between;
  padding: 1.125rem clamp(0.875rem, 4vw, 1.5rem);
}

.round-bar p,
.button,
.scores thead,
.add-player label {
  font-size: 0.875rem;
}

.button,
input {
  min-height: 2.75rem;
  border: 1px solid var(--color-border);
  border-radius: 0.625rem;
}

.button {
  padding: 0.5rem 0.875rem;
  background: var(--color-surface);
  font-weight: 700;
  cursor: pointer;
}

.button:hover:not(:disabled) {
  border-color: var(--color-secondary);
  background: var(--color-primary-pressed);
}

.button:disabled {
  opacity: 0.5;
  cursor: default;
}

.primary-button {
  border-color: var(--color-secondary);
  background: var(--color-primary);
}

.primary-button:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.finish-button {
  color: #fde68a;
}

input {
  width: 100%;
  min-width: 0;
  padding: 0.5rem 0.625rem;
  background: var(--color-background);
}

input::placeholder {
  color: var(--color-text-muted);
}

#player-initials {
  text-transform: uppercase;
}

#player-initials::placeholder {
  text-transform: none;
}

:focus-visible {
  outline: 2px solid #c4b5fd;
  outline-offset: 2px;
}

.scores {
  width: 100%;
  border-collapse: collapse;
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.scores th,
.scores td {
  padding: 0.625rem clamp(0.625rem, 4vw, 1.5rem);
  border-block-start: 1px solid var(--color-border);
}

.scores th:first-child {
  text-align: left;
}

.scores thead th {
  background: var(--color-surface);
  color: var(--color-text-muted);
  font-weight: 600;
}

.initials {
  display: inline-grid;
  min-width: 2.75rem;
  min-height: 2.75rem;
  place-items: center;
  padding-inline: 0.5rem;
  border-radius: 0.625rem;
  background: var(--color-primary-pressed);
  color: #ede9fe;
  font-weight: 800;
}

.remove-player {
  display: grid;
  min-width: 2.75rem;
  flex-shrink: 0;
  place-items: center;
  padding-inline: 0.5rem;
  color: #fda4af;
}

.remove-player:hover:not(:disabled) {
  border-color: #fda4af;
  background: #481a31;
}

.score-input {
  width: min(100%, 4rem);
  text-align: right;
}

.score-input::placeholder {
  opacity: 0.7;
}

.total {
  color: #ddd6fe;
  font-size: 1.125rem;
  font-weight: 800;
  overflow-wrap: anywhere;
}

.empty-state {
  padding: 1.75rem 1rem;
  border-block-start: 1px solid var(--color-border);
  text-align: center;
}

.add-player {
  padding: 1rem clamp(0.875rem, 4vw, 1.5rem);
  border-block-start: 1px solid var(--color-border);
}

.add-player label {
  display: block;
  margin-bottom: 0.375rem;
  font-weight: 650;
}

.player-controls {
  max-width: 22rem;
}

.player-controls .button {
  flex-shrink: 0;
}

.player-error,
.storage-error {
  margin-top: 0.5rem;
  color: #fda4af;
}

.storage-error {
  margin-bottom: 1rem;
}

.game-actions {
  flex-wrap: wrap;
  justify-content: flex-end;
  margin-top: 1rem;
}

.game-alerts {
  display: grid;
  gap: 0.5rem;
}

.game-alerts:has(.game-alert) {
  margin-bottom: 1rem;
}

.game-alert {
  padding: 0.75rem 1rem;
  border: 1px solid #a16207;
  border-radius: 0.625rem;
  background: #352715;
  color: #fde68a;
}

.new-game-dialog {
  width: min(26rem, calc(100% - 2rem));
  margin: auto;
  padding: clamp(1rem, 5vw, 1.5rem);
  border: 1px solid var(--color-secondary);
  border-radius: 1rem;
  background: var(--color-surface-elevated);
  color: var(--color-text);
}

.new-game-dialog::backdrop {
  background: rgb(15 11 23 / 80%);
}

.new-game-dialog p {
  margin-top: 0.5rem;
  color: var(--color-text-muted);
}

.new-game-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1.25rem;
}

.new-game-options .button {
  flex: 1 1 auto;
}

.cancel-button {
  width: 100%;
  margin-top: 0.5rem;
  border-color: transparent;
  background: transparent;
  color: var(--color-text-muted);
}

.winner {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  margin-bottom: 1rem;
  padding: 2rem 1rem;
  border: 1px solid var(--color-secondary);
  border-radius: 1.25rem;
  background: radial-gradient(ellipse at top, #492782, var(--color-surface-elevated) 75%);
  text-align: center;
}

.winner-content {
  position: relative;
}

.trophy {
  display: inline-block;
  font-size: 3.25rem;
  line-height: 1.2;
}

.result-label {
  margin-top: 0.75rem;
  color: #fde68a;
  font-size: 0.875rem;
  font-weight: 750;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.winner h2 {
  margin: 0.25rem 0 0.5rem;
  font-size: clamp(1.85rem, 6vw, 3.5rem);
  overflow-wrap: anywhere;
}

.confetti {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.confetti i {
  position: absolute;
  top: 0;
  left: var(--x);
  width: 0.5rem;
  height: 0.85rem;
  border-radius: 0.125rem;
  background: var(--color);
  opacity: 0;
  animation: confetti-fall 1.7s ease-out var(--delay);
}

.celebrate .trophy {
  animation: trophy-pop 0.7s cubic-bezier(0.2, 0.8, 0.3, 1.35) both;
}

@keyframes confetti-fall {
  0% {
    opacity: 0;
    transform: translateY(-1rem);
  }
  12% {
    opacity: 1;
  }
  75% {
    opacity: 0.9;
  }
  100% {
    opacity: 0;
    transform: translate(var(--drift), 18rem) rotate(var(--spin));
  }
}

@keyframes trophy-pop {
  from {
    opacity: 0;
    transform: translateY(1rem) scale(0.55) rotate(-15deg);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1) rotate(0);
  }
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 17rem), 1fr));
  gap: 0.75rem;
  padding: 0 clamp(0.875rem, 4vw, 1.5rem) 1.125rem;
}

.player-result {
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 0.875rem;
  background: var(--color-surface);
}

.player-result-heading,
.result-total {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.player-result-heading {
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
}

.result-total {
  min-width: 0;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.results-table th,
.results-table td {
  padding: 0.5rem 1rem;
}

.results-table th {
  color: var(--color-text-muted);
  font-weight: 500;
}

@media (max-width: 32rem) {
  .round-bar {
    flex-wrap: wrap;
  }

  .game-actions > button {
    flex: 1 1 auto;
  }

  .score-input {
    padding-inline: 0.375rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .confetti {
    display: none;
  }

  .celebrate .trophy {
    animation: none;
  }
}
</style>
