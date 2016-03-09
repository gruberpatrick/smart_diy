module.exports = {

  sPublicKey: "",
  aClients: [],
  aClientKeys: [],

  init: function(sPublicKey, aClients, aClientKeys){
    // detect keypad input with js event
    // => if right: open gate by tiggering gate open command
    // check for gate open command
    // => if received: open gate and log client
    this.sPublicKey = sPublicKey;
    this.aClients = aClients;
    this.aClientKeys = aClientKeys;
  },

  evaluateCommand: function(sCommand, aParams){
    switch(sCommand){
      case "openGate":
        return this.openGate(aParams[0]);
    }
  },

  openGate: function(sClient){

  }

};
