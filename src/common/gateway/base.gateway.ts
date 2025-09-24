import { Socket } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { SocketService } from 'src/common/service/socket.service';

/**
 * WebSocket 게이트웨이들을 위한 공통 베이스 클래스
 * 클라이언트 연결/해제 처리를 담당합니다.
 */
export abstract class BaseGateway {

    constructor(
        protected readonly authService: AuthService,
        protected readonly socketService: SocketService,
    ) { }

    /**
     * 클라이언트 연결 해제 처리
     * @param client Socket 클라이언트
     */
    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);

        const user = client.data.user;
        if (user) {
            // 해당 소켓만 제거
            this.socketService.removeSocket(client.id);
        }
    }

    /**
     * 클라이언트 연결 처리
     * @param client Socket 클라이언트
     */
    async handleConnection(client: Socket) {
        console.log(`Client connected: ${client.id}`);

        try {
            const rawToken = client.handshake.auth.token;
            if (!rawToken) {
                client.disconnect();
                return;
            }

            const payload = await this.authService.parseBearerToken(rawToken, false);

            if (payload) {
                client.data.user = payload;

                // 기본 소켓 등록
                this.socketService.registerClient(payload.sub, client);

            } else {
                client.disconnect();
                return;
            }
        } catch (e) {
            console.log(e);
            client.disconnect();
        }
    }

}