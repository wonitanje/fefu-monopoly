const express = require('express')
const cors = require('cors')
const { disconnect } = require('process')

const cors_options = {
  origin: ['http://localhost:8080', 'https://sweetforge.herokuapp.com', 'http://192.168.1.127:8080'],
  optionsSuccessStatus: 200
}

const app = express()
app.use(cors(cors_options))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
// app.use('/', express.static(path.join('dist')))

const http = require('http').Server(app)
const io = require("socket.io")(http, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})
// const server = http.createServer(app)
// const io = new Server(server)

let round = 0
let players = []
let disconnectedPlayers = []
const playerModel = {
  name: '',
  cash: 500,
  enterprise: [],
  position: 0,
  skip: 0,
}

// function movePlayer(from, to, param, value) {
//   const idx = from.map((player) => player[param] == value).indexOf(true)
//   if (idx == -1)
//     return false
//   to.push(from.splice(idx, 1))
//   return true
// }

io.on('connection', (socket) => {
  console.log('user connected')
  let username, idx

  socket.on('auth', (name) => {
    console.log('auth', name)
    let unique = true
    players.forEach((player) => {
      if (player.name == name) {
        unique = false
      }
    })

    if (!unique) {
      return socket.emit('auth', 'error')
    }

    const ind = disconnectedPlayers.map((player) => player.name == username).indexOf(true)
    console.log('ind', ind)
    if (ind != -1) {
      idx = players.push(disconnectedPlayers.splice(ind, 1)) - 1
    } else {
      const user = Object.assign({}, playerModel, { name })
      idx = players.push(user) - 1
    }

    username = name
    socket.emit('auth', 'success')
    io.emit('players', players)
  })

  socket.on('throw', () => {
    const value1 = Math.round(Math.random() * 5) + 1
    const value2 = Math.round(Math.random() * 5) + 1
    players[idx].position +=  value1 + value2
    io.emit('throw', [value1, value2])
    io.emit('players', players)
  })

  socket.on('disconnect', () => {
    if (username) {
      const idx = players.map((player) => player.name == username).indexOf(true)
      if (idx != -1) {
        disconnectedPlayers.push(players.splice(idx, 1))
      }
      io.emit('players', players)
    }
  })
})

app.get(/./, (req, res) => {
  res.sendFile(__dirname + '/index.html')
})

http.listen(3000, () => {
  console.log('listening on *:3000')
})