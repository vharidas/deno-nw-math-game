const doNothing = ()=>{};
class MessageServer {
  #port
  #clients
  #serverListener
  #clientIdCounter
  #onMessage
  #onConnect
  #onDisconnect
  constructor(port = 8080, { onMessage, onConnect, onDisconnect } = {}) {
    this.#port = port;
    this.#clients = new Map();
    this.#serverListener = null;
    this.#clientIdCounter = 0;
    this.#onMessage = onMessage || doNothing;
    this.#onConnect = onConnect || doNothing;
    this.#onDisconnect = onDisconnect || doNothing;
  }

  async acceptConnections() {
    try{
    this.#serverListener = Deno.listen({ port: this.#port });
    }catch(e){
      return false;
    }
    console.log(`Server listening on port ${this.#port}`);

    for await (const conn of this.#serverListener) {
      const clientId = `c-${++this.#clientIdCounter}`;
      this.#clients.set(clientId, conn);
      this.#onConnect(clientId);
      this.#handleClient(conn, clientId);
    }
    return true;
  }

  async #handleClient(conn, clientId) {
    console.log(`Client ${clientId} connected`);
    const decoder = new TextDecoder();    
    try {
      for await (const data of conn.readable) {
        const json = decoder.decode(data);
        try {
          const msg = JSON.parse(json);
          // console.log(`Received from ${clientId}:`, msg);
          this.#onMessage(clientId, msg);
        } catch (err) {
          console.error(err);
          // console.error(`Invalid JSON from ${clientId}:`, text);
        }
      }
    } catch (err) {
      console.error(`Error with client ${clientId}:`, err.message);
    }
  }

  sendMessageToClient(clientId, message) {
    const conn = this.#clients.get(clientId);
    if (conn) {
      try {
        const encoder = new TextEncoder();
        conn.write(encoder.encode(JSON.stringify(message) + "\n"));
        //console.log(`Sent to ${clientId}:`, message);
      } catch (err) {
        console.error(`Failed to send message to ${clientId}:`, err.message);
      }
    } else {
      console.warn(`Client ${clientId} not found.`);
    }
  }

  broadcastMessage(message) {
    for (const [clientId, conn] of this.#clients.entries()) {
      try {
        const encoder = new TextEncoder();
        conn.write(encoder.encode(JSON.stringify(message) + "\n"));
        //console.log(`Broadcasted to ${clientId}:`, message);
      } catch (err) {
        console.error(`Failed to broadcast message to ${clientId}:`, err.message);
      }
    }
  }

  disconnectClient(clientId) {
    const conn = this.#clients.get(clientId);
    if (conn) {
      console.log(`Disconnecting client ${clientId}`);
      this.#clients.delete(clientId);
      try{conn.close();}catch(e){}      
    } else {
      console.warn(`Client ${clientId} not found.`);
    }
  }

  rejectConnections() {
    if (this.#serverListener) {
      console.log("pausing server...");
      this.#serverListener.close();
      this.#serverListener = null;      
    } else {
      console.warn("Server is no longer accepting connections");
    }
  }
  closeConnections(){
    for (const clientId of this.#clients.keys()) {
      this.disconnectClient(clientId);
    }
    console.log("All clients disconnected.");
  }
}

export default MessageServer;
if(import.meta.main){
  const server = new MessageServer(9191, {
    onMessage: (clientId, message) => console.log(`Callback: Received from ${clientId}:`, message),
    onConnect: (clientId) => console.log(`Callback: Client ${clientId} connected`),
    onDisconnect: (clientId) => console.log(`Callback: Client ${clientId} disconnected`),
  });
  server.acceptConnections();
}