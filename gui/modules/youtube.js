
function Module(){
  
  this.aMediaButtons = ["yt_a", "yt_v"];
  this.aQualityButtons = ["yt_hq", "yt_lq"];
  this.bLock = false;
  this.oModuleName = "";
  this.lMediaType = 0;
  this.lQualityType = 0;
  
  this.handleMessage = function(sData, lFlags){
    var oResponse = JSON.parse(sData.data);
    if(oResponse.sType != "response") return;
    if(oResponse.sCommand == "search" && oResponse.oResponse.oData != {}){
      var oResultBox = document.getElementById("result_box");
      oResultBox.innerHTML = "";
      for(var lIndex in oResponse.oResponse.oData.items){
        if(oResponse.oResponse.oData.items[lIndex].id.kind != "youtube#video") continue;
        oResultBox.innerHTML += "<div class=\"element\" onclick=\"oModule.playVideo('" + oResponse.oResponse.oData.items[lIndex].id.videoId + "', this)\">" + oResponse.oResponse.oData.items[lIndex].snippet.title + "</div>";
      }
    }
  };
  
  this.cleanup = function(){
    
  };

  this.resetMediaButtons = function(oActive){
    for(var lIndex in this.aMediaButtons){ document.getElementById(this.aMediaButtons[lIndex]).className = "button half"; }
    oActive.className += " active";
  };
  
  this.resetQualityButtons = function(oActive){
    for(var lIndex in this.aQualityButtons){ document.getElementById(this.aQualityButtons[lIndex]).className = "button half"; }
    oActive.className += " active";
  };
  
  this.playVideo = function(sId, oElement){
    oElement.className += " active";
    sendRequest("control", oData.sRoom, oData.sModuleName, "playVideo", [this.lMediaType, this.lQualityType, sId]);
  };
  
  this.init = function(){
    var oThat = this;
    document.getElementById("yt_a").onclick = function(){ oThat.lMediaType = 0; oThat.resetMediaButtons(this); };
    document.getElementById("yt_v").onclick = function(){ oThat.lMediaType = 1; oThat.resetMediaButtons(this); };
    document.getElementById("yt_hq").onclick = function(){ oThat.lQualityType = 0; oThat.resetQualityButtons(this); };
    document.getElementById("yt_lq").onclick = function(){ oThat.lQualityType = 1; oThat.resetQualityButtons(this); };
    document.getElementById("search_box").onkeyup = function(e){
      if(e.keyCode != 13) return;
      this.blur();
      sendRequest("control", oData.sRoom, oData.sModuleName, "search", [this.value]);
    };
  };
  
  this.init();
  
};

oModule = new Module();
