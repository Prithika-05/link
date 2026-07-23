import {io} from 'socket.io-client'
import {environment} from '../config/environment.js'
import {REALTIME_EVENTS} from '../constants/realtimeEvents.js'

class SocketService {
    socket = null

    connect(token) {
        if (this.socket?.connected) return this.socket

        if (!this.socket) {
            this.socket = io(environment.socketUrl, {
                auth: {token},
                transports: ['websocket'],
                autoConnect: false,
                reconnection: true,
                reconnectionAttempts: 8,
                reconnectionDelay: 750,
            })
        } else {
            this.socket.auth = {token}
        }

        if (!this.socket.connected) {
            this.socket.connect()
        }

        return this.socket
    }

    disconnect() {
        this.socket?.disconnect()
        this.socket = null
    }

    isConnected() {
        return Boolean(this.socket?.connected)
    }

    on(event, handler) {
        this.socket?.on(event, handler)
    }

    off(event, handler) {
        this.socket?.off(event, handler)
    }

    async sendMessage(payload) {
        if (!this.socket?.connected) {
            throw new Error('Realtime connection is unavailable.')
        }

        return new Promise((resolve, reject) => {
            this.socket.timeout(8000).emit(
                REALTIME_EVENTS.messageSend,
                payload,
                (timeoutError, response) => {
                    if (timeoutError) {
                        reject(new Error('The realtime message request timed out.'))
                        return
                    }

                    if (!response?.success) {
                        reject(new Error(response?.message || 'Message delivery failed.'))
                        return
                    }

                    resolve(response)
                },
            )
        })
    }
}

export const socketService = new SocketService()
