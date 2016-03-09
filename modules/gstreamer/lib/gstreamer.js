var oExec = require("sync-exec");

module.exports = {

  sStatus: "nothing",
  sServer: "",

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
        return {"sStatus": this.sStatus, "sServer": this.sServer};
    };
  },

  startStream: function(){
    this.sStatus = "server";
  },

  connectStream: function(sServer){
    this.sStatus = "client";
    this.sServer = sServer;
  },

  endStream: function(){
    this.sStatus = "nothing";
  }

};
