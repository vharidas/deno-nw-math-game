import MathGame from "./lib/math-game.js";
const main = ([totalTime="10", totalPlayers="1"])=>{
  const g = new MathGame(+totalTime, +totalPlayers);
  if(! g.initialize()) console.error(`Could not start game`);
}
main(Deno.args);