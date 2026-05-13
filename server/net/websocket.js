import crypto from "node:crypto";
import { EventEmitter } from "node:events";

const WS_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

export function isWebSocketRequest(request) {
  return request.headers.upgrade?.toLowerCase() === "websocket";
}

export function acceptWebSocket(request, socket) {
  const key = request.headers["sec-websocket-key"];
  if (!key) {
    socket.destroy();
    return null;
  }

  // The handshake is small enough to handle with built-in Node.js modules.
  const accept = crypto.createHash("sha1").update(`${key}${WS_GUID}`).digest("base64");
  socket.write(
    [
      "HTTP/1.1 101 Switching Protocols",
      "Upgrade: websocket",
      "Connection: Upgrade",
      `Sec-WebSocket-Accept: ${accept}`,
      "",
      ""
    ].join("\r\n")
  );

  return new WebSocketConnection(socket);
}

export class WebSocketConnection extends EventEmitter {
  constructor(socket) {
    super();
    this.socket = socket;
    this.buffer = Buffer.alloc(0);
    this.alive = true;

    socket.on("data", (chunk) => this.handleData(chunk));
    socket.on("close", () => this.emit("close"));
    socket.on("error", (error) => this.emit("error", error));
  }

  sendJson(payload) {
    this.send(JSON.stringify(payload));
  }

  send(text) {
    if (this.socket.destroyed) {
      return;
    }

    const payload = Buffer.from(text);
    const header = createFrameHeader(payload.length, 0x1);
    this.socket.write(Buffer.concat([header, payload]));
  }

  ping() {
    if (this.socket.destroyed) {
      return;
    }

    this.socket.write(createFrameHeader(0, 0x9));
  }

  close() {
    if (!this.socket.destroyed) {
      this.socket.end(createFrameHeader(0, 0x8));
    }
  }

  handleData(chunk) {
    this.buffer = Buffer.concat([this.buffer, chunk]);

    // A TCP chunk can contain part of a frame or several frames, so buffered parsing is needed.
    while (this.buffer.length >= 2) {
      const frame = readFrame(this.buffer);
      if (!frame) {
        return;
      }

      this.buffer = this.buffer.subarray(frame.bytesRead);

      if (frame.opcode === 0x8) {
        this.close();
        this.emit("close");
        return;
      }

      if (frame.opcode === 0x9) {
        this.socket.write(Buffer.concat([createFrameHeader(frame.payload.length, 0xA), frame.payload]));
        continue;
      }

      if (frame.opcode === 0xA) {
        this.alive = true;
        continue;
      }

      if (frame.opcode === 0x1) {
        this.emit("message", frame.payload.toString("utf8"));
      }
    }
  }
}

function readFrame(buffer) {
  const first = buffer[0];
  const second = buffer[1];
  const opcode = first & 0x0f;
  const masked = (second & 0x80) !== 0;
  let length = second & 0x7f;
  let offset = 2;

  // Browser-to-server frames include a mask, as required by the WebSocket protocol.
  if (length === 126) {
    if (buffer.length < offset + 2) return null;
    length = buffer.readUInt16BE(offset);
    offset += 2;
  } else if (length === 127) {
    if (buffer.length < offset + 8) return null;
    const high = buffer.readUInt32BE(offset);
    const low = buffer.readUInt32BE(offset + 4);
    length = high * 2 ** 32 + low;
    offset += 8;
  }

  let mask;
  if (masked) {
    if (buffer.length < offset + 4) return null;
    mask = buffer.subarray(offset, offset + 4);
    offset += 4;
  }

  if (buffer.length < offset + length) {
    return null;
  }

  const payload = Buffer.from(buffer.subarray(offset, offset + length));
  if (masked) {
    for (let i = 0; i < payload.length; i += 1) {
      payload[i] ^= mask[i % 4];
    }
  }

  return {
    opcode,
    payload,
    bytesRead: offset + length
  };
}

function createFrameHeader(length, opcode) {
  // Server-to-browser frames are unmasked; the header only varies by payload length.
  if (length < 126) {
    return Buffer.from([0x80 | opcode, length]);
  }

  if (length < 65536) {
    const header = Buffer.alloc(4);
    header[0] = 0x80 | opcode;
    header[1] = 126;
    header.writeUInt16BE(length, 2);
    return header;
  }

  const header = Buffer.alloc(10);
  header[0] = 0x80 | opcode;
  header[1] = 127;
  header.writeUInt32BE(0, 2);
  header.writeUInt32BE(length, 6);
  return header;
}
