import asyncio
import json
import logging
import websockets

from os import makedirs
from os.path import exists, expanduser
from uuid import uuid4

from extension_manager import ExtensionManager
from message import Message

SETTING_PATH = expanduser("~/.smartdiy")

log = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


class Server:

    _clients = {}

    def __init__(self):
        if not exists(SETTING_PATH):
            self.initialize()
        self._extension_manager = ExtensionManager(SETTING_PATH)
        self.register_extensions()
        asyncio.run(self._serve())

    def initialize(self):
        makedirs(SETTING_PATH, exist_ok=True)
        # generate the local authentication;
        with open(f"{SETTING_PATH}/.auth", "w") as fh:
            fh.write(str(uuid4()))
        # generate the extension file;
        with open(f"{SETTING_PATH}/.extensions", "w") as fh:
            fh.write(json.dumps([]))

    def register_extensions(self):
        for target, extension in self._extension_manager._extensions.items():
            print(target, extension)
            self.add_client(
                target,
                extension_handler=extension.get("extension_handler"),
                extension=extension.get("extension"),
                available_actions=extension.get("availableActions"),
            )

    async def _serve(self):
        """
        Serve the websocket endpoint.
        """
        async with websockets.serve(self.handle_message, "localhost", 8765):
            await asyncio.Future()

    def check_authentication(self, auth):
        """
        Make sure that the given authentication is correct.
        """
        with open(f"{SETTING_PATH}/.auth", "r") as fh:
            if fh.read().strip() == auth.strip():
                return True
        return False

    def add_client(self, target, ws=None, extension_handler=None, extension=None, available_actions=None):
        self._clients[target] = {
            "ws": ws,
            "extension_handler": extension_handler,
            "extension": extension,
            "availableActions": available_actions,
        }
        log.info(f"Client added {self._clients[target]}")

    async def register_client(self, message, ws):
        """
        Register a new client.
        """
        if "target" not in message.params:
            return await self.send_error("Client's target not set.", ws=ws)
        # TODO: determine what to do here, clients might have to reconnect;
        # elif message.params["target"] in self._clients:
        #     return await self._send_error(f"Target '{message.params['target']}' already in use.", ws=ws)
        # target = unique ID for client;
        # extension = the type of extension it is running;
        # avaliableActions = actions the client can perform;
        self.add_client(
            message.params["target"],
            ws=ws,
            extension=message.params.get("extension"),
            available_actions=message.params.get("availableActions"),
        )
        await self.send(
            ws,
            {
                "success": True,
                "connectedClients": [
                    {"target": target, "extension": client["extension"], "availableActions": client["availableActions"]}
                    for target, client in self._clients.items()
                ],
            },
        )

    async def send(self, ws, message):
        await ws.send(json.dumps(message))

    async def send_error(self, error_message, target="", ws=None):
        em = {"error": True, "message": error_message}
        if ws is not None:
            await self.send(ws, em)
        elif target != "":
            await self.send_message_to_target(target, em)

    async def send_message_to_target(self, target, message):
        tt = self._clients.get(target, {}).get("ws")
        if tt is not None:
            await self.send(tt, message)

    async def handle_message(self, ws):
        """
        Handle a new incoming message and decide what to do with it.
        """
        async for message in ws:
            m = Message(**json.loads(message))
            log.info(f"Incoming message: {m}")
            if m.target == "server":
                await self.process_message(m, ws)
            elif m.target == "broadcast":
                await self.broadcast_message(m)
            else:
                await self.forward_message(m)

    async def process_message(self, message, ws):
        """
        Process a message that was meant for the server.
        """
        if message.action == "register":
            if self.check_authentication(message.params.get("auth")):
                await self.register_client(message, ws)
            else:
                await self.send_error("Incorrect authentication.", ws=ws)

    async def broadcast_message(self, message):
        pass

    async def forward_message(self, message):
        client = self._clients[message.target]
        ws = client.get("ws")
        extension_handler = client.get("extension_handler")
        if ws is not None:
            pass
        elif extension_handler is not None:
            extension_handler.run(message.action, params=message.params)
