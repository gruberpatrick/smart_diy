var oExec = require("sync-exec");

module.exports = {

  sStatus: "nothing",
  sServer: "",
  aConnectedClients: [],

  init: function(aParams){

  },

  evaluateCommand: function(sCommand, aParams){
    switch(sCommand){
      case "startStream":
        this.endStream();
        return this.startStream();
      case "connectStream":
        this.endStream();
        return this.connectStream(aParams[0]);
      case "endStream":
        return this.endStream();
      case "getStatus":
        return {"sStatus": this.sStatus, "sServer": this.sServer, "aConnectedClients": this.aConnectedClients};
      case "toggleClient":
        return this.toggleClient(aParams[0]);
    };
  },

  startStream: function(){
    this.sStatus = "server";
    // start server command
  },

  connectStream: function(sRemoteAddress){
    this.sStatus = "client";
    this.sServer = sRemoteAddress;
    // connect to streaming server
  },

  endStream: function(){
    this.sStatus = "nothing";
    // kill server
  },

  toggleClient: function(sClient){
    if(this.aConnectedClients.indexOf(sClient) >= 0)
      delete this.aConnectedClients[this.aConnectedClients.indexOf(sClient)];
    else {
      this.aConnectedClients.push(sClient);
    }
  }

};
