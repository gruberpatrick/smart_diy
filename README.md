# SMART DIY

## Description

** Project still in early development.** Basic implementations working but will be extended in future versions.

This project aims to provide a simple platform to create smart home systems based on NodeJS and the WebSocket standard.
Remotes can easily be integrated, as long as they comply with the defined protocol.

## The protocol

The used protocol in the first version is rather simple. A client node has to log in on the server, providing his own name:

```
{
  "sType": "init",
  "sName": "[CLIENT-NAME]" // the client name as defined in the "set/media-clients.json" file
}
```

The server provides a list of the modules as client needs to load.
A remote provides the needed data for the server. At the moment there is no authentication needed. This will change in future versions of the project.

```
{
  "sType": "control",
  "sTarget": "...",          // target for command as defined in "set/media-clients.json" file
  ["sFrom": "...",]          // from added by server to deliver response
  "sMedia": "oRhythmbox",    // see "set/media-modules.json" for available modules
  "sCommand": "play"         // command depending on module -> modules define a detailed list of these commands
  "aParams": [...]           // params required by command -> modules define a detailed list of these params
}
```

The server returns a response if data needs to be returned. This may depend on the command.

```
{
  "sType": "response",
  "sTarget": "...",          // target for response -> this is now the remote
  "sFrom": "...",            // target for command as defined in "set/media-clients.json" file
  "sMedia": "oRhythmbox",    // see "set/media-modules.json" for available modules
  "sCommand": "play"         // command depending on module -> modules define a detailed list of these commands
  "aParams": [...]           // params required by command -> modules define a detailed list of these params
  "oResponse": {             // response values -> as defined by the module
    "oData": [...]
  }
}
```

## Future Implementations

- add password protection for shared system
- prevent interference of multiple media players (when one starts playing suspend all others)
- let server return answer containing logged in clients
