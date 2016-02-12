var oExec = require("sync-exec");
var oXML = require("xml2js");
var oFS = require("fs");

module.exports = {

  aDB: [],
  sHomeDir: "",

  init: function(aParams){
    this.sHomeDir = aParams[0];
    this.reloadDB();
  },

  evaluateCommand: function(sCommand, aParams){
    switch(sCommand){
      case "play":
        return this.play();
      case "pause":
        return this.pause();
      case "next":
        return this.next();
      case "previous":
        return this.previous();
      case "currentSong":
        return this.currentSong();
      case "playUri":
        return this.playUri(aParams);
      case "playSongs":
        return this.playSongs(aParams);
      case "searchSongs":
        return this.searchSongs(aParams);
      case "clearQueue":
        return this.clearQueue();
      case "increaseVolume":
        return this.increaseVolume();
      case "decreaseVolume":
        return this.decreaseVolume();
      case "currentVolume":
        return this.currentVolume();
    }
  },

  reloadDB: function(){
    this.aDB = [];
    var sData = oFS.readFileSync(this.sHomeDir + "/.local/share/rhythmbox/rhythmdb.xml", "utf-8");
    oXML.parseString(sData, function(oErr, oData){
      if(oErr != null){ console.log(oErr); return; }
      for(var lIndex in oData.rhythmdb.entry){
        if(oData.rhythmdb.entry[lIndex]["$"].type != "song") continue;
        this.aDB[this.aDB.length] = oData.rhythmdb.entry[lIndex];
      }
    }.bind(this));
  },

  play: function(){
    oExec("rhythmbox-client --play");
  },

  pause: function(){
    oExec("rhythmbox-client --pause");
  },

  next: function(){
    oExec("rhythmbox-client --next");
  },

  previous: function(){
    oExec("rhythmbox-client --previous");
  },

  enqueue: function(sPath){
    oExec("rhythmbox-client --enqueue '" + sPath + "' &");
  },

  currentSong: function(){
    var sArtist = oExec("rhythmbox-client --print-playing-format '%ta'").stdout;
    var sTitle = oExec("rhythmbox-client --print-playing-format '%tt'").stdout;
    return {"sArtist": sArtist.substr(0, sArtist.length - 1), "sTitle": sTitle.substr(0, sTitle.length - 1)};
  },
  
  playUri: function(aParams){
    oExec("rhythmbox-client --play-uri '" + aParams[0] + "'");
  },
  
  clearQueue: function(){
    oExec("rhythmbox-client --clear-queue");
  },
  
  increaseVolume: function(){
    oExec("rhythmbox-client --volume-up");
  },
  
  decreaseVolume: function(){
    oExec("rhythmbox-client --volume-down");
  },
  
  currentVolume: function(){
    var sVolume = oExec("rhythmbox-client --print-volume").stdout;
    return {lVolume: parseFloat(sVolume.substr(19, sVolume.length - 1))};
  },

  searchSongs: function(aKeys){
    var aResults = [];
    for(var lIndex in aKeys){ aKeys[lIndex] = aKeys[lIndex].toLowerCase(); }
    for(var lIndex in this.aDB){
      for(var lKey in aKeys){
        var bAdd = false;
        if(this.aDB[lIndex].title[0].toLowerCase().indexOf(aKeys[lKey]) >= 0) bAdd = true;
        else if(this.aDB[lIndex].artist[0].toLowerCase().indexOf(aKeys[lKey]) >= 0) bAdd = true;
        else if(this.aDB[lIndex].album[0].toLowerCase().indexOf(aKeys[lKey]) >= 0) bAdd = true;
        if(bAdd)
          aResults[aResults.length] = this.aDB[lIndex];
      }
    }
    return aResults;
  },

  searchGenre: function(sGenre){
    var aResults = [];
    sGenre = sGenre.toLowerCase();
    for(var lIndex in this.aDB){
      if(this.aDB[lIndex].genre[0].toLowerCase().indexOf(sGenre) >= 0) aResults[aResults.length] = this.aDB[lIndex];
    }
  },

  playSongs: function(aSongs){
    this.clearQueue();
    console.log(aSongs);
    for(var lIndex in aSongs){
      this.enqueue(aSongs[lIndex]);
    }
    this.next();
  }

};