import MathGamePlayer from './lib/math-game-player.js';
const main = async([serverAddr="localhost", playerName="anonymous"])=>{
  const p = new MathGamePlayer(serverAddr, playerName);
  if(!await p.join()) console.error(`could not connect to ${serverAddr}`);
}
main(Deno.args);