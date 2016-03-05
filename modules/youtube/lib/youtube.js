/*
 * REQUIREMENTS:
 * -> youtube-dl package
 * -> vlc
 * DESCRIPTION:
 * -> Use YouTube API to find videos
 * -> Download video with youtube-dl
 * -> Analyze quality and playback type
 */

var oHTTPS = require("https");
var oExec = require("sync-exec");

module.exports = {

  sDevKey: "AIzaSyAX0ACnxFEjs7lEqJ4gtb4zDyrOpBRHnIY",
  sSearchURL: "https://www.googleapis.com/youtube/v3/search?part=id%2Csnippet&maxResults=50&key=",

  init: function(){
    oExec("vlc &");
    oExec("youtube-dl -U &");
  },

  evaluateCommand: function(sCommand, aParams, fCallback){
    switch(sCommand){
      case "search":
        return this.searchVideo(aParams, fCallback);
      case "playVideo":
        return this.playVideo(aParams);
      case "play":
        return this.playback();
      case "pause":
        return this.pause();
    }
  },

  searchVideo: function(aParams, fCallback){
    var oRes = oHTTPS.get(this.sSearchURL + this.sDevKey + "&q=" + aParams[0], function(oResult){
      oResult.setEncoding("utf-8");
      var sResult = "";
      oResult.on("data", function(sData){
        sResult += sData;
      });
      oResult.on("end", function(){
        fCallback(JSON.parse(sResult));
      });
    }.bind(this));
    return {};
  },

  playVideo: function(aParams){
    var lRes = 140;
    if(aParams[0] == 0){
      var aOut = oExec("youtube-dl -F  https://www.youtube.com/watch?v=" + aParams[2] + " | grep 'audio only'").stdout.split("\n");
      if(aParams[1] == 0)
        lRes = parseInt(aOut[aOut.length - 2].substr(0, 3));
      else
        lRes = parseInt(aOut[0].substr(0, 3));
    }else if(aParams[0] == 1){
      if(aParams[1] == 0){
        var aOut = oExec("youtube-dl -F  https://www.youtube.com/watch?v=" + aParams[2] + " | grep '720p'").stdout.split("\n");
        if(aOut.length > 1)
          lRes = parseInt(aOut[aOut.length - 2].substr(0, 3));
        else
          lRes = -1;
      }
      if(lRes == -1 || aParams[1] == 1){
        var aOut = oExec("youtube-dl -F  https://www.youtube.com/watch?v=" + aParams[2] + " | grep '360p'").stdout.split("\n");
        lRes = parseInt(aOut[0].substr(0, 3));
      }
    }
    if(isNaN(lRes))
      lRes = 140;
    oExec("youtube-dl -f " + lRes + " --output 'tmp/" + aParams[2] + "-" + aParams[0] + "-" + aParams[1] + ".tmp' --no-part https://www.youtube.com/watch?v=" + aParams[2] + " &");
    setTimeout(function(){
      oExec("vlc 'tmp/" + aParams[2] + "-" + aParams[0] + "-" + aParams[1] + ".tmp' &");
    }, 4000);
  },

  playback: function(){
    oExec("dbus-send --session --type=method_call --print-reply --dest=org.mpris.MediaPlayer2.vlc /org/mpris/MediaPlayer2 org.mpris.MediaPlayer2.Player.Play");
  },

  pause: function(){
    oExec("dbus-send --session --type=method_call --print-reply --dest=org.mpris.MediaPlayer2.vlc /org/mpris/MediaPlayer2 org.mpris.MediaPlayer2.Player.Pause");
  }

};
