class WebsocketHandler {

    constructor(changeState, getState) {
        this.connect();
        this.changeState = changeState;
        this.getState = getState;
    }

    connect() {
        this.socket = new WebSocket('ws://localhost:8765');
        this.socket.addEventListener('open', function (event) {
            this.socket.send(JSON.stringify({
                target: "server",
                action: "register",
                params: {
                    auth: "dda97796-01b9-48e2-acd5-4448b9bde1ac",
                    target: "webclient",
                    extension: "mobileApp",
                    availableActions: [
                        "notification",
                    ],
                },
            }));
        }.bind(this));
        this.socket.addEventListener('message', function (event) {
            console.log('Message from server ', event.data);
            this.parseMessage(JSON.parse(event.data));
        }.bind(this));
    }

    parseMessage(message) {
        if (message.action === "register") {
            this.changeState({
                connectedClients: message.connectedClients,
            })
        }
    }

    sendAction(target, action, params) {
        this.socket.send(JSON.stringify({
            target: target, action: action, params: params
        }));
    }

}

export default WebsocketHandler;
