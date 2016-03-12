var oExec = require("sync-exec");
var oOS = require("os");

module.exports = {

  sStatus: "nothing",
  sServer: "",
  aConnectedClients: [],
  lRTPPort: 5555,
  sMulticastIP: "224.1.1.1",
  sRemoteAddress: "",

  init: function(aParams){
    this.sMulticastIP = aParams[0];
    this.lRTPPort = aParams[1];
    this.getRemoteAddress();
  },

  evaluateCommand: function(sCommand, aParams){
    switch(sCommand){
      case "startStream":
        //this.endStream();
        return this.startStream(aParams[0]);
      case "connectStream":
        //this.endStream();
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
    oExec("gst-launch-1.0 pulsesrc ! audioconvert ! audioresample ! mulawenc ! rtppcmupay ! udpsink host=" + this.sRemoteAddress + " auto-multicast=true port=" + this.lRTPPort + " &");
  },

  connectStream: function(sRemoteAddress){
    this.sStatus = "client";
    this.sServer = sRemoteAddress;
    oExec("vlc rtp://" + sRemoteAddress + ":" + this.lRTPPort);
  },

  endStream: function(){
    this.sStatus = "nothing";
    oExec("killall gst-launch-1.0");
  },

  toggleClient: function(sClient){
    if(this.aConnectedClients.indexOf(sClient) >= 0)
      delete this.aConnectedClients[this.aConnectedClients.indexOf(sClient)];
    else {
      this.aConnectedClients.push(sClient);
    }
  },

  getRemoteAddress: function(){
    this.sRemoteAddress = global.sRemoteAddress;
  }

};
