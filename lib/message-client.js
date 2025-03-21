
class MessageClient {
  #host
  #port
  #connection
  #onMessage
  #onDisconnect

  constructor(host = "127.0.0.1", port = 8080, { onMessage, onDisconnect } = {}) {
    this.#host = host;
    this.#port = port;
    this.#connection = null;
    this.#onMessage = onMessage || (() => { });
    this.#onDisconnect = onDisconnect || (() => { });
  }

  async connect() {
    try {
      this.#connection = await Deno.connect({ hostname: this.#host, port: this.#port });
      // console.log("Connected to server");
      this.#listenForMessages();
      return true;
    } catch (err) {
      // console.error("Failed to connect to server:", err.message);
      return false;
    }
  }

  async #listenForMessages() {
    const decoder = new TextDecoder();
    try {
      for await (const data of this.#connection.readable) {
        const message = decoder.decode(data);
        try {
          const json = JSON.parse(message);
          // console.log("Received from server:", json);
          this.#onMessage(json);
        } catch (err) {
          // console.error("Invalid JSON from server:", message);
        }
      }
    } catch (err) {
      // console.error("Connection error:", err.message);
      if (this.#connection) {
        this.#onDisconnect();
        this.#connection = null;
      }
    }
  }

  async sendMessage(message) {
    if (this.#connection) {
      try {
        const encoder = new TextEncoder();
        await this.#connection.write(encoder.encode(JSON.stringify(message) + "\n"));
        // console.log("Sent to server:", message);
      } catch (err) {
        // console.error("Failed to send message:", err.message);
      }
    } else {
      // console.warn("Not connected to server.");
    }
  }

  disconnect() {
    if (this.#connection) {
      console.log("Disconnecting ...");
      this.#connection.close();
      this.#connection = null;
    }
  }
}
export default MessageClient;

if (import.meta.main) {
  const client = new MessageClient('localhost', 9191);
  const res = await client.connect();
  console.log(res);
  await client.sendMessage({ title: 'hello' });
  setTimeout(async () => {
    await client.disconnect();
  }, 1000);

}

