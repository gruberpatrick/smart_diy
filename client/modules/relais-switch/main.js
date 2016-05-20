var oCP = require("child_process");

module.exports = {

  aValues: null, // first is STANDARD value, second is SWITCH;
  aValuesNames: null,
  lTimeout: null,
  sCommand: null,
  lState: 0,

  // FUNCTION
  // MODULE initialization
  initialize: function(aParams){
    // TODO: initialize
    this.aValues = aParams[0];
    this.aValuesNames = aParams[1];
    this.lTimeout = aParams[2];
    this.sCommand = aParams[3];

    this.reset();
  },

  // FUNCITON
  // MODULE destruction
  kill: function(){
    // TODO: cleanup
  },

  // FUNCTION
  // MODULE command handler
  handleCommand: function(oMessage){
    // TODO: handle command
    switch(oMessage["sCommand"]){
      case "switch":
        return this.switch(oMessage["aParams"]);
      case "reset":
        return this.reset(oMessage["aParams"]);
      case "current-status":
        return this.getStatus(oMessage);
      case "current-status-name":
        return this.getStatusName(oMessage);
      case "current-timeout":
        return this.getTimeout(oMessage);
    }
  },

  // ===========================================================================

  switch: function(aParams){
    // check if timeout to reset is available; otherwise value needs to be set manually
    this.lState = this.aValues[1];
    if(this.sCommand != "")
      oCP.exec(this.sCommand.replace("%%s", this.lState));
    if(typeof aParams != "undefined" && typeof aParams[0] == "number" && aParams[0] == 1)
      setTimeout(function(){ this.reset(); }.bind(this), this.lTimeout);
  },

  reset: function(aParams){
    // check if timeout to reset is available; otherwise value needs to be set manually
    this.lState = this.aValues[0];
    if(this.sCommand != "")
      oCP.exec(this.sCommand.replace("%%s", this.lState));
    if(typeof aParams != "undefined" && typeof aParams[0] == "number" && aParams[0] == 1)
      setTimeout(function(){ this.switch(); }.bind(this), this.lTimeout);
  },

  getStatus: function(oMessage){
    global.sendCommandResponse(oMessage, this.lStatus);
  },

  getStatusName: function(oMessage){
    global.sendCommandResponse(oMessage, this.aValuesNames[this.aValues.indexOf(this.lState)]);
  },

  getTimeout: function(oMessage){
    global.sendCommandResponse(oMessage, this.lTimeout);
  }

};
