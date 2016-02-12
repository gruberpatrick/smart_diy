function Module(){
  
  this.reloadInterval = null;
  
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
      sendRequest("control", oData.sRoom, oData.sModuleName, "searchSongs", [document.getElementById("search_box").value]);
    };
  };
  
  this.init();
  
};

oModule = new Module();
