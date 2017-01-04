// @flow
/* global requestAnimationFrame */
const kbd = require('@dasilvacontin/keyboard')

const canvas = document.createElement('canvas')
canvas.style.margin = '0 auto'
canvas.style.display = 'block'
document.body.appendChild(canvas)

const ctx = canvas.getContext('2d')
if (!ctx) throw new Error('wut') // flow pls

const MAP_EDGE = 10
const CELL_EDGE = Math.min(
  Math.floor(window.innerWidth / MAP_EDGE),
  Math.floor(window.innerHeight / MAP_EDGE)
)
canvas.width = canvas.height = MAP_EDGE * CELL_EDGE

const map = new Array(MAP_EDGE + 1)
for (let i = 0; i < MAP_EDGE + 1; ++i) {
  const row = new Array(MAP_EDGE)
  row.fill(0)
  map[i] = row
}

function randomEmptyInRange (bi, bj, width, height) {
  let i = -1
  let j = -1

  while (i < bi || map[i][j] !== 0) {
    i = bi + Math.floor(Math.random() * width)
    j = bj + Math.floor(Math.random() * height)
  }

  return [i, j]
}

const PLAYER_COUNT = 3
const players = []
function init () {
  for (let k = 1; k <= PLAYER_COUNT; ++k) {
    const [i, j] = randomEmptyInRange(1, 1, MAP_EDGE - 2, MAP_EDGE - 2)
    map[i][j] = k
    players.push({ i, j })
  }
}
init()

const controls = [
  {
    up: 'w',
    down: 's',
    left: 'a',
    right: 'd'
  },
  {
    up: kbd.UP_ARROW,
    down: kbd.DOWN_ARROW,
    left: kbd.LEFT_ARROW,
    right: kbd.RIGHT_ARROW
  },
  {
    up: 'i',
    down: 'k',
    left: 'j',
    right: 'l'
  }
]

const dirInc = {
  up: [ -1, 0 ],
  down: [ 1, 0 ],
  left: [ 0, -1 ],
  right: [ 0, 1 ]
}

function isCellEmpty (i, j) {
  return (
    i >= 0 &&
    j >= 0 &&
    i < MAP_EDGE &&
    j < MAP_EDGE &&
    map[i][j] === 0
  )
}

const dirs = ['up', 'down', 'left', 'right']
function logic () {
  // move players
  players.forEach((player, k) => {
    const { i, j } = player
    if (map[i][j] !== k + 1) return // dead

    const playerControls = controls[k]
    dirs.some((dir) => {
      const [_i, _j] = dirInc[dir]
      if (
        kbd.isKeyDown(playerControls[dir]) &&
        isCellEmpty(i + _i, j + _j)
      ) {
        map[i][j] = 0
        map[i + _i][j + _j] = k + 1
        player.i += _i
        player.j += _j
        return true
      }
    })
  })

  // move rocks
  for (let i = MAP_EDGE - 1; i >= 0; i--) {
    for (let j = MAP_EDGE - 1; j >= 0; j--) {
      const cell = map[i][j]
      if (cell >= 0) continue

      // rock
      map[i][j] = 0
      if (cell === -1) map[i + 1][j] = cell // down
      else if (cell === -2) map[i][j + 1] = cell // right
    }
  }

  // spawn rocks
  const SPAWN_CHANCE = 0.04
  for (let i = 0; i < MAP_EDGE; ++i) {
    map[i][0] = Math.random() < SPAWN_CHANCE ? -2 : 0
  }
  for (let j = 0; j < MAP_EDGE; ++j) {
    map[0][j] = Math.random() < SPAWN_CHANCE ? -1 : 0
  }
}

const fillForCell = {
  '-1': '#805b32',
  '-2': '#555555',
  '0': '#cccccc',
  '1': '#ff0000',
  '2': '#00ff00',
  '3': '#0000ff'
}

function render () {
  for (let i = 0; i < MAP_EDGE; ++i) {
    const row = map[i]
    for (let j = 0; j < MAP_EDGE; ++j) {
      const cell = row[j]
      const color = fillForCell[cell]

      // TODO: circle?
      ctx.globalAlpha = cell !== 0 ? 1 : 0.9
      ctx.fillStyle = color
      ctx.fillRect(j * CELL_EDGE, i * CELL_EDGE, CELL_EDGE, CELL_EDGE)
    }
  }
}

const MSPF = 200
let lastTurn = new Date() - MSPF
function gameloop () {
  requestAnimationFrame(gameloop)

  const now = new Date()
  if (now - lastTurn > MSPF) {
    lastTurn = now
    logic()
    render()
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, MAP_EDGE * CELL_EDGE, 5)
  } else {
    ctx.fillStyle = 'blue'
    ctx.fillRect(0, 0, (MAP_EDGE * CELL_EDGE) * ((now - lastTurn) / MSPF), 5)
  }
}
requestAnimationFrame(gameloop)
