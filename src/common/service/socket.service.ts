import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';

@Injectable()
export class SocketService {
    private readonly connectedClients = new Map<number, Set<string>>();
    private readonly socketMap = new Map<string, Socket>();

    registerClient(userId: number, client: Socket) {
        const set = this.connectedClients.get(userId) ?? new Set<string>();
        set.add(client.id);
        this.connectedClients.set(userId, set);
        this.socketMap.set(client.id, client);
    }

    removeClient(userId: number, socketId?: string) {
        const set = this.connectedClients.get(userId);
        if (!set) return;

        if (socketId) {
            set.delete(socketId);
            this.socketMap.delete(socketId);

            if (set.size === 0) {
                this.connectedClients.delete(userId);
            } else {
                this.connectedClients.set(userId, set);
            }
            return;
        }

        // socketId가 없으면 해당 사용자의 모든 소켓을 제거
        for (const id of set) {
            this.socketMap.delete(id);
        }
        this.connectedClients.delete(userId);
    }

    removeSocket(socketId: string) {
        const client = this.socketMap.get(socketId);
        if (!client) return;

        for (const [userId, set] of this.connectedClients.entries()) {
            if (set.has(socketId)) {
                set.delete(socketId);
                if (set.size === 0) this.connectedClients.delete(userId);
                else this.connectedClients.set(userId, set);
                break;
            }
        }

        this.socketMap.delete(socketId);
    }

    getSocketsByUser(userId: number): Socket[] {
        const ids = this.connectedClients.get(userId) ?? new Set<string>();
        const sockets: Socket[] = [];
        for (const id of ids) {
            const s = this.socketMap.get(id);
            if (s) sockets.push(s);
        }
        return sockets;
    }
}