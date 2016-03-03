function Module(){

  this.reloadInterval = null;
  this.aSettingsButtons = [
    "<div onclick=\"oModule.clearQueue();\" class=\"button\">Clear Queue</div>",
    "<div onclick=\"oModule.reloadDB();\" class=\"button\">Reload DB</div>"
  ];

  this.handleMessage = function(sData, lFlags){
    var oResponse = JSON.parse(sData.data);
    if(oResponse.sType != "response") return;
    if(oResponse.sCommand == "currentSong" && oResponse.oResponse.oData != {})
      document.getElementById("song_display").innerHTML = oResponse.oResponse.oData.sArtist + " - " + oResponse.oResponse.oData.sTitle;
    else if(oResponse.sCommand == "currentVolume" && oResponse.oResponse.oData != {})
      document.getElementById("volume_stat").innerHTML = Math.round(oResponse.oResponse.oData.lVolume * 100) + "%";
    else if(oResponse.sCommand == "searchSongs" && oResponse.oResponse.oData != {}){
      document.getElementById("result_box").innerHTML = "";
      if(oResponse.oResponse.oData.length == 0){ document.getElementById("result_box").innerHTML = "<div class=\"element\">No songs found.</div>"; return; }
      document.getElementById("result_box").innerHTML += "<div><div class=\"button half\" onclick=\"oModule.playAll();\">Play all</div><div class=\"button half\" onclick=\"oModule.clearAll();\">Clear</div></div>";
      for(var lIndex in oResponse.oResponse.oData) document.getElementById("result_box").innerHTML += "<div class=\"element\" rel-location=\"" + oResponse.oResponse.oData[lIndex].location + "\" onclick=\"oModule.playSong('" + oResponse.oResponse.oData[lIndex].location + "')\">" + oResponse.oResponse.oData[lIndex].artist + " - " + oResponse.oResponse.oData[lIndex].title + "</div>";
      document.getElementById("result_box").innerHTML += "<div class=\"clear\"></div>";
    }else if(oResponse.sCommand == "getPlaylists" && oResponse.oResponse.oData != {}){
      document.getElementById("result_box").innerHTML = "";
      for(var lIndex in oResponse.oResponse.oData) document.getElementById("result_box").innerHTML += "<div class=\"element\" onclick=\"oModule.playPlaylist('" + oResponse.oResponse.oData[lIndex] + "')\">" + oResponse.oResponse.oData[lIndex] + "</div>";
      document.getElementById("result_box").innerHTML += "<div class=\"clear\"></div>";
    }
  };

  this.cleanup = function(){
    if(this.reloadInterval != null)
      clearInterval(this.reloadInterval);
  };

  this.requestCurrentSong = function(){
    sendRequest("control", oData.sRoom, oData.sModuleName,"currentSong");
  }
  this.requestCurrentVolume = function(){
    sendRequest("control", oData.sRoom, oData.sModuleName,"currentVolume");
  }
  this.playSong = function(sUri){
    sendRequest("control", oData.sRoom, oData.sModuleName,"playUri", [sUri]);
    this.requestCurrentSong();
  }
  this.playPlaylist = function(sName){
    sendRequest("control", oData.sRoom, oData.sModuleName, "playPlaylist", [sName]);
    this.requestCurrentSong();
  }
  this.playAll = function(){
    var aElements = document.getElementsByClassName("element");
    var aSongs = [];
    for(var lIndex in aElements){
      if(typeof aElements[lIndex] != "object") continue;
      aSongs[aSongs.length] = aElements[lIndex].getAttribute("rel-location");
    }
    sendRequest("control", oData.sRoom, oData.sModuleName, "playSongs", aSongs);
    this.requestCurrentSong();
  }
  this.clearAll = function(){
    document.getElementById("result_box").innerHTML = "";
  }
  this.clearQueue = function(){
    sendRequest("control", oData.sRoom, oData.sModuleName, "clearQueue", []);
  };
  this.reloadDB = function(){
    sendRequest("control", oData.sRoom, oData.sModuleName, "reloadDB", []);
  };

  this.init = function(){
    this.requestCurrentSong();
    this.requestCurrentVolume();
    this.reloadInterval = setInterval(function(){
      this.requestCurrentSong();
      this.requestCurrentVolume();
    }.bind(this), 10000);
    document.getElementById("play").onclick = function(){
      sendRequest("control", oData.sRoom, oData.sModuleName, "play");
    };
    document.getElementById("pause").onclick = function(){
      sendRequest("control", oData.sRoom, oData.sModuleName, "pause");
    };
    document.getElementById("next").onclick = function(){
      sendRequest("control", oData.sRoom, oData.sModuleName, "next");
      this.requestCurrentSong();
    }.bind(this);
    document.getElementById("prev").onclick = function(){
      sendRequest("control", oData.sRoom, oData.sModuleName, "previous");
      this.requestCurrentSong();
    }.bind(this);
    document.getElementById("volume_dec").onclick = function(){
      sendRequest("control", oData.sRoom, oData.sModuleName, "decreaseVolume");
      this.requestCurrentVolume();
    }.bind(this);
    document.getElementById("volume_inc").onclick = function(){
      sendRequest("control", oData.sRoom, oData.sModuleName, "increaseVolume");
      this.requestCurrentVolume();
    }.bind(this);
    document.getElementById("search_box").onkeyup = function(e){
      if(e.keyCode != 13) return;
      this.blur();
      if(document.getElementById("search_box").value.length >= 3)
        sendRequest("control", oData.sRoom, oData.sModuleName, "searchSongs", [document.getElementById("search_box").value]);
    };
    document.getElementById("tab_song").onclick = function(){
      this.clearAll();
      document.getElementById("show_song").style["display"] = "block";
      document.getElementById("tab_song").className += " active";
      document.getElementById("tab_playlists").className = "button third";
      document.getElementById("tab_settings").className = "button third";
      if(document.getElementById("search_box").value.length >= 3)
        sendRequest("control", oData.sRoom, oData.sModuleName, "searchSongs", [document.getElementById("search_box").value]);
    }.bind(this);
    document.getElementById("tab_playlists").onclick = function(){
      this.clearAll();
      document.getElementById("show_song").style["display"] = "none";
      document.getElementById("tab_song").className = "button third";
      document.getElementById("tab_settings").className = "button third";
      document.getElementById("tab_playlists").className += " active";
      sendRequest("control", oData.sRoom, oData.sModuleName, "getPlaylists");
    }.bind(this);
    document.getElementById("tab_settings").onclick = function(){
      document.getElementById("show_song").style["display"] = "none";
      document.getElementById("tab_song").className = "button third";
      document.getElementById("tab_playlists").className = "button third";
      document.getElementById("tab_settings").className += " active";
      document.getElementById("result_box").innerHTML = "";
      for(var lIndex in this.aSettingsButtons){
        document.getElementById("result_box").innerHTML += this.aSettingsButtons[lIndex];
      }
    }.bind(this);
  };

  this.init();

};

oModule = new Module();
