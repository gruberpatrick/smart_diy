import json
import logging
import pip

import importlib.util

log = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


class ExtensionManager:

    _extensions = {}

    def __init__(self, settings_path):
        self._settings_path = settings_path
        self.load_extensions()

    def load_extensions(self):
        with open(f"{self._settings_path}/.extensions", "r") as fh:
            self._raw_extensions = json.loads(fh.read())
        for extension in self._raw_extensions:
            log.info(f"Loading extension: {extension}")
            ext_name = extension.get("extension", "")
            try:
                # self.install_requirements(f"../extensions/{ext_name}/requirements.txt")
                ext = self.import_extension(ext_name, extension)
                self._extensions[ext.get_target()] = {
                    "extension": ext_name,
                    "extension_handler": ext,
                    "settings": extension,
                    "availableActions": ext._available_actions,
                }
            except FileNotFoundError as e:
                log.exception(e)
        log.info(f"Extensions loaded: {self._extensions}")
        self.save_extensions()

    def import_extension(self, ext_name, extension):
        spec = importlib.util.spec_from_file_location(f"module.{ext_name}", f"../extensions/{ext_name}/main.py")
        ext = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(ext)
        ext = ext.Extension(
            extension,
            em=self,
            install_path=f"../extensions/{ext_name}/requirements.txt",
        )
        return ext

    def install_requirements(self, requirements_path):
        with open(requirements_path, "r") as fh:
            for req in fh:
                pip.main(["install", req.strip()])

    def save_extensions(self):
        with open(f"{self._settings_path}/.extensions", "w") as fh:
            fh.write(json.dumps([
                extension.get("settings")
                for _, extension in self._extensions.items()
            ], indent=2))
