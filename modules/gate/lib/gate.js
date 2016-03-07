module.exports = {

  aClients: [],

  init: function(aClients){
    // detect keypad input with js event
    // => if right: open gate by tiggering gate open command
    // check for gate open command
    // => if received: open gate and log client
    this.aClients = aClients;
  },

  evaluateCommand: function(sCommand, aParams){
    switch(sCommand){
      case "openGate":
        this.openGate(aParams[0]);
    }
  },

  openGate: function(sClient){
    
  }

};
