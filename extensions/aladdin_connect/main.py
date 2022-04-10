import json
import requests

from base64 import b64encode

REQUEST_URI = "https://genie.exosite.com/api/portals/v1/"
RPC_URI = "https://genie.m2.exosite.com/onep:v1/rpc/process"
STATUS_COMMANDS = ["door_status", "name", "link_status"]
DOOR_STATUS = {
    1: "OPEN", 2: "OPENING", 3: "TIMEOUT OPENING",
    4: "CLOSED", 5: "CLOSING", 6: "TIMEOUT CLOSING",
    7: "NOT CONFIGURED", 0: "UNKNOWN",
}
LINK_STATUS = {
    1: "NOT CONFIGURED", 2: "PAIRED", 3: "CONNECTED",
    0: "UNKNOWN",
}
ACTION_TO_STATUS = {
    "CLOSED": 0,
    "OPEN": 1,
}

class Extension:

    _available_actions = ["open", "close"]
    _local_targets = {}

    def __init__(self, extension_data, em=None):
        self._extension_data = extension_data
        self.setup()

    def setup(self):
        # create the store;
        if self._extension_data.get("store") is None:
            self._extension_data["store"] = {}
        if "token" not in self._extension_data.get("store", {}):
            self._extension_data["store"]["token"] = self.login()
        self._user_id = self.get_user_info()
        self._portals = self.get_portals()

    def login(self):
        params = self._extension_data.get('params', {})
        req = requests.get(
            f"{REQUEST_URI}users/_this/token",
            headers={
                "Authorization": f"Basic " + b64encode(
                    f"{params.get('email')}:{params.get('password')}".encode()
                ).decode(),
            }
        )
        return req.json()
    
    def get_request_header(self):
        return {
            "AppVersion": "3.0.0",
            "BundleName": "com.geniecompany.AladdinConnect",
            "User-Agent": "Aladdin Connect iOS v3.0.0",
            "BuildVersion": "131",
            "Authorization": f"Token: {self._extension_data['store']['token']}"
        }
    
    def get_rpc_header(self):
        return {
            "AppVersion": "3.0.0",
            "BundleName": "com.geniecompany.AladdinConnect",
            "User-Agent": "Aladdin Connect iOS v3.0.0",
            "BuildVersion": "131",
            "Authorization": f"Token: {self._extension_data['store']['token']}",
            "Content-Type": "application/json",
        }
    
    def get_rpc_body(self, portal_id, device_id):
        body = {
            "auth": {
                "cik": portal_id,
                "client_id": device_id,
            },
            "calls": []
        }
        running_id = 1
        for dps_id in range(1, 4):
            for status_command in STATUS_COMMANDS:
                body["calls"].append(
                    {
                        "arguments": [{"alias": f"dps{dps_id}.{status_command}"}, {}],
                        "id": running_id,
                        "procedure": "read",
                    }
                )
                running_id += 1
        return json.dumps(body)
    
    def get_user_info(self):
        req = requests.get(
            f"{REQUEST_URI}users/_this",
            headers=self.get_request_header(),
        )
        return req.json().get("id")
    
    def get_portals(self):
        res = {}
        req = requests.get(
            f"{REQUEST_URI}users/{self._user_id}/portals",
            headers=self.get_request_header(),
        )
        for portal in req.json():
            key, value = self.get_portal_details(portal.get("PortalID"))
            res[key] = value
        return res

    def get_portal_details(self, portal_id):
        res = {}
        req = requests.get(
            f"{REQUEST_URI}portals/{portal_id}",
            headers=self.get_request_header(),
        )
        details = req.json()
        for device_id in details.get("devices", []):
            req = requests.post(
                RPC_URI,
                headers=self.get_rpc_header(),
                data=self.get_rpc_body(
                    details.get("info", {}).get("key"),
                    device_id
                ),
            )
            device_details = req.json()
            doors = []
            for idx in range(3):
                dd = device_details[idx*3 : (idx+1)*3]
                if len(dd[0].get("result", [])) == 0:
                    continue
                doors.append({
                    "name": dd[1].get("result")[0][1],
                    "status": DOOR_STATUS[dd[0].get("result")[0][1]],
                    "link_status": LINK_STATUS[dd[2].get("result")[0][1]],
                })
            res[device_id] = doors
        return details.get("info", {}).get("key"), res

    def get_targets(self):
        res = []
        for portal_key, portals in self._portals.items():
            for device_id, devices in portals.items():
                for door in devices:
                    target = (
                        f"aladdin_connect-->{self._extension_data.get('params', {}).get('email')}-->{door.get('name')}"
                        .lower()
                        .replace(" ", "_")
                    )
                    self._local_targets[target] = {
                        "portal_key": portal_key,
                        "device_id": device_id,
                        "status": door.get("status"),
                        "name": door.get("name"),
                    }
                    res.append(target)
        return res

    def run(self, action, params=None):
        # TODO: https://documenter.getpostman.com/view/5856894/RzZAjHxV#ad753f36-50f7-4321-b0e2-bf08b5fe5b10
        # - Set Door State
        raise NotImplemented()
