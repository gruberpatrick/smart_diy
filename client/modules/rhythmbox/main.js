var oCP = require("child_process");

module.exports = {

  // FUNCTION
  // MODULE initialization
  initialize: function(){
    // TODO: initialize
    oCP.exec("rhythmbox-client --no-start &");
  },

  // FUNCITON
  // MODULE destruction
  kill: function(){
    // TODO: cleanup
    oCP.exec("rhythmbox-client --quit");
  },

  // FUNCTION
  // MODULE command handler
  handleCommand: function(sCommand, aParams){
    // TODO: handle command
    switch(sCommand){
      case "play":
        return this.play();
      case "pause":
        return this.pause();
    }
  },

  // ===========================================================================

  play: function(){
    oCP.exec("rhythmbox-client --play");
  },

  pause: function(){
    oCP.exec("rhythmbox-client --pause");
  }

};
