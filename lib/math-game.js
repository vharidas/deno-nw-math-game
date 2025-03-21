import _ from 'lodash'
import MessageServer from "./message-server.js";
import { summarizeGame } from "./reports.js";

const MESSAGE_TYPES = 'join ans'.split(' ');
const operations = {
  ADD: (a, b) => a + b,
  SUB: (a, b) => a - b
}
const createQ = () => ({
  type: 'question',
  operationName: _.sample(['ADD']),
  operands: [_.random(100), _.random(100)]
});

const generateQuizSummary = (quiz, playerAnswers) => {
  const players = {};
  for (const pa of playerAnswers) {
    players[pa.playerName] = { correct: 0, incorrect: 0, score: 0, responses: pa.answers };
  }
  const names = _.keys(players);
  const getAnswers = qi => {
    const answers = {};
    _.forEach(names, name => answers[name] = players[name].responses[qi] ?? '-');
    return answers;
  }
  const summary = {
    questions: _.map(quiz, (q, index) => ({
      operation: q.operationName,
      operands: q.operands,
      solution: q.solution,
      answers: getAnswers(index)
    })),
    scores: []
  };

  _.forEach(names, name => {
    const player = players[name];
    _.forEach(player.responses, (response, i) => {
      const won = response === quiz[i]?.solution;
      if (won) player.correct++;
      else player.incorrect++;
      player.score += (won ? 5 : -1);
    });
  });

  summary.scores = _.entries(players)
    .sort(([, a], [, b]) => b.score - a.score)
    .map(([name, { correct, incorrect, score }], rank) => ({ rank: rank + 1, name, correct, incorrect, score }));

  return summary;
}
class MathGame {
  #questions
  #server
  #players
  #numberOfPlayers
  #totalGameTime
  #gameTimer

  constructor(totalGameTime, numberOfPlayers) {
    this.#numberOfPlayers = numberOfPlayers;
    this.#totalGameTime = totalGameTime;
    this.#questions = [];
    const handlers = {
      onConnect: this.#handleConnect.bind(this),
      onDisconnect: this.#handleDisconnect.bind(this),
      onMessage: this.#handleMessage.bind(this)
    }
    this.#server = new MessageServer(9191, handlers);
    this.#players = {};
  }
  initialize() {
    return this.#server.acceptConnections();
  }
  #handleConnect(clientId) {
    this.#players[clientId] = { answers: [] };
    if (_.size(this.#players) === this.#numberOfPlayers) {
      this.#server.rejectConnections();
      this.#startGame();
    }
  }
  #handleDisconnect(clientId) {
    console.error(`${clientId} disconnected`);
    delete this.#players[clientId];
  }

  #handleMessage(clientId, message) {
    // console.log(clientId, message);
    const { type, ...rest } = message;
    if (!MESSAGE_TYPES.includes(type)) return;
    const player = this.#players[clientId];
    if (type === 'join') {
      const { playerName } = rest;
      player.playerName = playerName;
      console.log(`${clientId} is ${playerName}`);
      return;
    }
    if (type === 'ans') {
      const { value } = rest;
      const count = player.answers.push(value);
      const msg = this.#getNextQ(clientId);
      this.#server.sendMessageToClient(clientId, msg);
      console.log(`${player.playerName}: ${count}`);
    }
  }
  #getNextQ(clientId) {
    const totalQLength = this.#questions.length;
    const clientQLength = this.#players[clientId].answers.length;
    if (clientQLength === totalQLength) this.#questions.push(createQ());
    return this.#questions[clientQLength];
  }
  #startGame() {
    console.log(`... starting game`);
    const msg = this.#getNextQ(_.first(_.keys(this.#players)));
    this.#server.broadcastMessage(msg);
    this.#gameTimer = setTimeout(this.#endGame.bind(this), this.#totalGameTime * 1000);
  }
  #endGame() {
    clearTimeout(this.#gameTimer);
    this.#gameTimer = null;
    const players = _.values(this.#players);
    console.log(this.#questions.length);
    const quiz = _.map(this.#questions, ({ operationName, operands }) => ({ operationName, operands, solution: operations[operationName](operands[0], operands[1]) }));
    const playerAnswers = _.map(players, ({ playerName, answers }) => ({ playerName, answers }));
    const summary = generateQuizSummary(quiz, playerAnswers);
    this.#server.broadcastMessage({ type: 'gameover', summary });
    console.log(summarizeGame(summary));
  }


}
export default MathGame;
if (import.meta.main) {
  const g = new MathGame(5, 1);
  g.initialize();
}