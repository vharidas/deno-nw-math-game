import _ from 'lodash'
import { summarizeGame } from "./reports.js"
import MessageClient from "./message-client.js"
import LinerReader from "./line-reader.js"

class MathGamePlayer {
  #playerName
  #client
  #reader
  #lastQuestion
  constructor(host, playerName) {
    this.#playerName = playerName;
    const handlers = {
      onDisconnect: this.#handleDisconnect.bind(this),
      onMessage: this.#handleMessage.bind(this)
    }
    this.#client = new MessageClient(host, 9191, handlers);
    this.#reader = new LinerReader(Deno.stdin.readable, { onLine: this.#handlePlayerInput.bind(this) });

  }
  async join() {
    console.log(`\tHello ${this.#playerName}`);
    const connected = await this.#client.connect();
    if (!connected) return false;
    this.#reader.start();
    this.#client.sendMessage({ type: 'join', playerName: this.#playerName });
    return true;
  }
  #handlePlayerInput(line) {
    if (this.#lastQuestion) {
      const value = Number(line);
      if (_.isNaN(value)) {
        console.error(`invalid answer type`);
        return;
      }
      this.#lastQuestion = null;
      this.#client.sendMessage({ type: 'ans', value });
    }
  }
  #handleMessage(message) {
    const { type, ...rest } = message;
    if (type === 'question') {
      const { operationName, operands } = rest;
      console.log(`\t${operationName} ${operands.join(' , ')}`);
      this.#lastQuestion = rest;
      return;
    }
    if (type === 'gameover') {
      const { summary } = rest;
      
      console.log('game over');
      console.log(summarizeGame(summary));
      this.#client.disconnect();
      this.#stopReader();
    }

  }
  #handleDisconnect() {
    console.error(`disconnected from server`);
    this.#stopReader();
  }
  #stopReader(){
    this.#reader.stop(); 
    console.error(`Press any key to end`);
  }
}
export default MathGamePlayer;
const main = ()=> {
  const p = new MathGamePlayer('localhost','Ramu');
  p.join();
}
import.meta.main && main(Deno.args);