import _ from 'lodash';
class LinerReader {
  #reader
  #onLine
  constructor(stream, { onLine }) {
    this.#reader = stream.getReader();
    this.#onLine = onLine;
  }
  async start() {
    const decoder = new TextDecoder();
    const inform = this.#onLine.bind(this);
    try{
      while(true){
        const { value, done } = await this.#reader.read();
        if (done) break; // Stop if stream is closed
        const text = decoder.decode(value);
        const lines = text.trim().split("\n");
        lines.forEach(inform);
      }
    }catch(e){}
    
  }
  async stop(){
    await this.#reader.cancel();
  }
}
export default LinerReader;
const main = ()=>{
  const reader = new LinerReader(Deno.stdin.readable, {onLine:(line)=> {
    console.log(line);
    if(line==='exit') reader.stop();
  }});
  reader.start();
}
import.meta.main && main(Deno.args);