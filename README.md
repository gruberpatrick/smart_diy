# SMART DIY

## Description

**Project still in early development.** Basic implementations working but will be extended in future versions.

- This project aims to provide a simple platform to create smart home systems based on NodeJS and the WebSocket standard.
- The server acts as host to facilitate communication between the clients and remotes. Clients and remotes do not communicate with each other directly, they have to go through the server.
- Client nodes will enable modules and hence add remote functionality to the system.
- Remotes can be integrated easily, as long as they comply with the defined protocol. The out-of-the-box remotes are started with the "gui.js" script. This will open an express application that will handle calls of http://YOURIP:8080/ or http://localhost:8080/.

## The protocol

This is version 0.1 of the protocol and will be extended as complexity of the system increases.
A client node has to log in on the server, providing his own name:

```
{
  "sType": "init",
  "sName": "[CLIENT-NAME]" // the client name as defined in the "set/media-clients.json" file
}
```

**[CLIENT-NAME]** = Replace this with the name as defined in "set/media-clients.json"

The server provides a list of the modules as client needs to load.
A remote provides the needed data for the server. At the moment there is no authentication needed. This will change in future versions of the project.

```
{
  "sType": "control",
  "sTarget": "...",          // target for command as defined in "set/media-clients.json" file
  ["sFrom": "...",]          // from added by server to deliver response
  "sMedia": "oRhythmbox",    // see "set/media-modules.json" for available modules
  "sCommand": "play"         // command depending on module -> modules define a detailed list of these commands
  "aParams": {...}           // params required by command -> modules define a detailed list of these params
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
  "aParams": {...}           // params required by command -> modules define a detailed list of these params
  "oResponse": {             // response values -> as defined by the module
    "oData": {...}
  }
}
```

## Server Status Protocol

There are a variety of commands that come with the status protocol. It is used to get data from the server.
The structure is as follows:

```
{
  "sType": "status",                   // define the type as status to get server data
  ["sTarget": "...",]                  // dependent on the command
  "sCommand": "[COMMAND-TYPE]",
  "aParams": {...}
}
```

**[COMMAND-TYPE]** = Replace this with the desired command.

Valid commands are:
- **getClients**: Returns the currently connected clients.
- **getModules**: The Modules used for the specified client (sTarget).

## Future Implementations aka. TODO's

- add password protection for shared system
- ensure that communication was transmitted through server
- add package manager for modules
- prevent interference of multiple media players (when one starts playing suspend all others)
- let server return answer containing logged in clients <-- In the works right now. Documentation will follow soon.

## Screenshots

- http://www.gruberpatrick.com/p/smart_diy/node-selection.png
- http://www.gruberpatrick.com/p/smart_diy/module-selection.png
- http://www.gruberpatrick.com/p/smart_diy/control.png
