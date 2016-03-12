function Module(){

  this.handleMessage = function(sData, lFlags){
    var oResponse = JSON.parse(sData.data);
    if(oResponse.sType != "response" && oResponse.sType != "status") return;
    if(oResponse.sCommand == "getStatus" && oResponse.oResponse.oData != {}){
      if(oResponse.oResponse.oData.sStatus == "server"){
        document.getElementById("status").innerHTML = "Where to?";
        document.getElementById("result_box").className = "";
        document.getElementById("start_stream_server").className = "button active";
        document.getElementById("start_stream_server").innerHTML = "Stream ON";
        sendRequest("status", oData.sRoom, oData.sModuleName, "getClients", []);
      }else if(oResponse.oResponse.oData.sStatus == "client"){
        document.getElementById("status").innerHTML = "Streaming from somewhere else.";
        document.getElementById("result_box").className = "hidden";
        document.getElementById("start_stream_server").className = "button active";
        document.getElementById("start_stream_server").innerHTML = "Stream ON";
      }else if(oResponse.oResponse.oData.sStatus == "nothing"){
        document.getElementById("status").innerHTML = "No stream.";
        document.getElementById("result_box").className = "hidden";
        document.getElementById("start_stream_server").className = "button";
        document.getElementById("start_stream_server").innerHTML = "Stream OFF";
      }
    }else if(oResponse.sCommand == "getClients" && oResponse.oResponse.oData != {}){
      document.getElementById("result_box").innerHTML = "";
      var sRemoteAddress = "224.1.1.1";
      for(var lIndex in oResponse.oResponse.oData){
        if(lIndex == oData.sRoom)
          sRemoteAddress = oResponse.oResponse.oData[lIndex].sRemoteAddress;
      }
      for(var lIndex in oResponse.oResponse.oData){
        if(oResponse.oResponse.oData[lIndex].aModules.indexOf("oGstreamer") < 0)
          continue;
        document.getElementById("result_box").innerHTML += "<div class=\"element\" id=\"toggle-" + lIndex + "\" onclick=\"oModule.connectStream('" + lIndex + "', '" + sRemoteAddress + "');\">" + oResponse.oResponse.oData[lIndex].sName + "</div>";
      }
    }
  };

  this.cleanup = function (){

  };

  this.init = function(){
    document.getElementById("start_stream_server").onclick = function(){
      if(document.getElementById("start_stream_server").innerHTML == "Stream OFF"){
        sendRequest("control", oData.sRoom, oData.sModuleName, "startStream", []);
        setTimeout(this.getStatus.bind(this), 1000);
      }else{
        sendRequest("control", oData.sRoom, oData.sModuleName, "endStream", []);
        setTimeout(this.getStatus.bind(this), 1000);
      }
    }.bind(this);
    this.getStatus();
  };

  this.getStatus = function(){
    sendRequest("control", oData.sRoom, oData.sModuleName, "getStatus", []);
  };

  this.connectStream = function(sClient, sRemoteAddress){
    if(document.getElementById("toggle-" + sClient).className == "element"){
      sendRequest("control", sClient, oData.sModuleName, "connectStream", [sRemoteAddress]);
      document.getElementById("toggle-" + sClient).className = "element active";
    }else{
      sendRequest("control", sClient, oData.sModuleName, "endStream", []);
      document.getElementById("toggle-" + sClient).className = "element";
    }
    sendRequest("control", oData.sRoom, oData.sModuleName, "toggleClient", [sClient]);
    this.getStatus();
  };

  this.init();

};

oModule = new Module();
