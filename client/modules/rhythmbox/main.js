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
  handleCommand: function(oMessage){
    // TODO: handle command
    switch(oMessage["sCommand"]){
      case "play":
        return this.play();
      case "pause":
        return this.pause();
      case "previous":
        return this.previous();
      case "next":
        return this.next();
      case "current-song":
        return this.currentSong(oMessage);
      case "play-uri":
        return this.playUri(oMessage["aParams"]);
      case "play-songs":
        return this.playSongs(oMessage["aParams"]);
      case "search-songs":
        return this.searchSongs(oMessage["aParams"]);
      case "clear-queue":
        return this.clearQueue();
      case "increment-volume":
        return this.incrementVolume();
      case "decrement-volume":
        return this.decrementVolume();
      case "current-volume":
        return this.currentVolume(oMessage);
      case "get-playlists":
        return this.getPlaylists();
      case "play-playlist":
        return this.playPlaylist(oMessage["aParams"]);
      case "reload-db":
        return this.reloadDB();
    }
  },

  // ===========================================================================

  play: function(){
    oCP.exec("rhythmbox-client --play");
  },

  pause: function(){
    oCP.exec("rhythmbox-client --pause");
  },

  previous: function(){
    oCP.exec("rhythmbox-client --previous");
  },

  next: function(){
    oCP.exec("rhythmbox-client --next");
  },

  currentSong: function(oMessage){
    oCP.exec("rhythmbox-client --print-playing-format '%ta - %tt'", function(oErr, sStdout, sError){
      if(oErr == null) global.sendCommandResponse(oMessage, sStdout);
    }.bind(this));
  },

  playUri: function(aParams){

  },

  playSongs: function(aParams){

  },

  searchSongs: function(aParams){

  },

  clearQueue: function(){

  },

  incrementVolume: function(){
    oCP.exec("rhythmbox-client --volume-up");
  },

  decrementVolume: function(){
    oCP.exec("rhythmbox-client --volume-down");
  },

  currentVolume: function(oMessage){
    oCP.exec("rhythmbox-client --print-volume", function(oErr, sStdout, sError){
      if(oErr == null) global.sendCommandResponse(oMessage, parseInt(parseFloat(sStdout.substr(19, sStdout.length - 1)) * 100) + "%");
    }.bind(this));
  },

  getPlaylists: function(){

  },

  playPlaylist: function(aParams){

  },

  reloadDB: function(){

  }

};
