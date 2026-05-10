"use client";

import Peer, { DataConnection } from "peerjs";

export type MessageType =
  | "PLAYER_JOIN"
  | "PLAYER_LIST"
  | "GAME_START"
  | "COMBO_ASSIGN"
  | "PITCH_SUBMIT"
  | "ALL_PITCHES"
  | "JUDGING_START"
  | "JUDGING_RESULT"
  | "ROUND_ADVANCE"
  | "ERROR";

export interface PitchMessage {
  type: MessageType;
  payload: unknown;
  from?: string;
}

export interface PlayerInfo {
  address: string;
  peerId: string;
  name: string;
}

type MessageHandler = (msg: PitchMessage, from: string) => void;

const ROOM_PREFIX = "pitchwars-";

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export class NetworkService {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private messageHandlers: MessageHandler[] = [];
  private connectHandlers: (() => void)[] = [];
  private disconnectHandlers: ((peerId: string) => void)[] = [];
  private isHost = false;
  private roomCode = "";
  private _myPeerId = "";

  get myPeerId(): string {
    return this._myPeerId;
  }

  get isHosting(): boolean {
    return this.isHost;
  }

  get connectedPeers(): string[] {
    return Array.from(this.connections.keys());
  }

  get code(): string {
    return this.roomCode;
  }

  // ── Event handlers ──────────────────────────────────────────────────

  onMessage(handler: MessageHandler) {
    this.messageHandlers.push(handler);
  }

  onConnected(handler: () => void) {
    this.connectHandlers.push(handler);
  }

  onDisconnected(handler: (peerId: string) => void) {
    this.disconnectHandlers.push(handler);
  }

  private emit(msg: PitchMessage, from: string) {
    this.messageHandlers.forEach((h) => h(msg, from));
  }

  // ── Room management ─────────────────────────────────────────────────

  async createRoom(): Promise<string> {
    this.isHost = true;
    this.roomCode = generateRoomCode();
    const peerId = ROOM_PREFIX + this.roomCode;

    return new Promise((resolve, reject) => {
      this.peer = new Peer(peerId);

      this.peer.on("open", (id) => {
        this._myPeerId = id;
        console.log("[Network] Room created:", this.roomCode, "PeerId:", id);
        resolve(this.roomCode);
      });

      this.peer.on("connection", (conn) => {
        this.setupConnection(conn);
      });

      this.peer.on("error", (err) => {
        console.error("[Network] Peer error:", err);
        reject(err);
      });
    });
  }

  async joinRoom(code: string): Promise<void> {
    this.isHost = false;
    this.roomCode = code.toUpperCase();
    const hostPeerId = ROOM_PREFIX + this.roomCode;

    return new Promise((resolve, reject) => {
      this.peer = new Peer();

      this.peer.on("open", (id) => {
        this._myPeerId = id;
        console.log("[Network] My PeerId:", id, "joining room:", this.roomCode);

        const conn = this.peer!.connect(hostPeerId, { reliable: true });
        this.setupConnection(conn);

        conn.on("open", () => {
          console.log("[Network] Connected to host");
          resolve();
        });

        conn.on("error", (err) => {
          reject(err);
        });
      });

      this.peer.on("error", (err) => {
        console.error("[Network] Peer error:", err);
        reject(err);
      });

      // Timeout after 15s
      setTimeout(() => reject(new Error("Connection timeout")), 15000);
    });
  }

  private setupConnection(conn: DataConnection) {
    conn.on("open", () => {
      this.connections.set(conn.peer, conn);
      console.log("[Network] Peer connected:", conn.peer);
      this.connectHandlers.forEach((h) => h());
    });

    conn.on("data", (data) => {
      const msg = data as PitchMessage;
      this.emit(msg, conn.peer);
    });

    conn.on("close", () => {
      this.connections.delete(conn.peer);
      console.log("[Network] Peer disconnected:", conn.peer);
      this.disconnectHandlers.forEach((h) => h(conn.peer));
    });

    conn.on("error", (err) => {
      console.error("[Network] Connection error:", err);
    });
  }

  // ── Messaging ───────────────────────────────────────────────────────

  send(peerId: string, msg: PitchMessage) {
    const conn = this.connections.get(peerId);
    if (conn && conn.open) {
      conn.send(msg);
    }
  }

  broadcast(msg: PitchMessage) {
    this.connections.forEach((conn) => {
      if (conn.open) conn.send(msg);
    });
  }

  // ── Cleanup ─────────────────────────────────────────────────────────

  destroy() {
    this.connections.forEach((conn) => conn.close());
    this.connections.clear();
    this.peer?.destroy();
    this.peer = null;
  }
}