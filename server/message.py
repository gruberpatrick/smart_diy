from dataclasses import dataclass


@dataclass
class Message:
    target: str
    action: str
    params: dict
