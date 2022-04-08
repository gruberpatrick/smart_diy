import logging

from pywebostv.connection import WebOSClient
from pywebostv.controls import InputControl, ApplicationControl

log = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


class Extension:

    _available_actions = [
        "up", "down", "left", "right", "enter", "home", "back"
    ]
    _input_actions = {
        "up": "up",
        "down": "down",
        "left": "left",
        "right": "right",
        "enter": "ok",
        "home": "home",
        "back": "back",
    }
    _app_actions = {}

    def __init__(self, extension_data, em=None, install_path=None):
        self._em = em
        self._extension_data = extension_data
        if self._extension_data.get("params", {}).get("host") is None:
            raise ValueError("Extension 'lgwebos' requires a 'host' parameter.")
        self.setup(install_path)

    def setup(self, install_path):
        # create the store;
        if self._extension_data.get("store") is None:
            self._em.install_requirements(install_path)
            self._extension_data["store"] = {}
        # make sure we have a client key set up;
        self._client = WebOSClient(self._extension_data["params"]["host"])
        self._client.connect()
        for status in self._client.register(self._extension_data["store"]):
            if status == WebOSClient.PROMPTED:
                log.info("Please accept the connect on the TV!")
            elif status == WebOSClient.REGISTERED:
                log.info("Registration successful!")
        self.setup_app_control()
        self._input = InputControl(self._client)
        self._input.connect_input()

    def setup_app_control(self):
        self._app = ApplicationControl(self._client)
        for app in self._app.list_apps():
            app_title = app['title'].lower()
            self._available_actions.append(f"app:{app_title}")
            self._app_actions[f"app:{app_title}"] = app

    def get_target(self):
        extension_name = self._extension_data["extension"]
        host = self._extension_data["params"]["host"]
        return (
            f"{extension_name}@{host}"
        )

    def run(self, action, params=None):
        # get the correct action form the InputControl class;
        try:
            if action in self._input_actions:
                act = getattr(self._input, self._input_actions[action])
            elif action in self._app_actions:
                act = self._app.launch
                params = [self._app_actions[action]]
        except ValueError:
            return
        # run it with the given parameters;
        if isinstance(params, list):
            act(*params)
        elif isinstance(params, dict):
            act(**params)
        else:
            act()
