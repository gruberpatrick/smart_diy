function Module(){

  this.handleMessage = function(sData, lFlags){
    var oResponse = JSON.parse(sData.data);
    console.log(oResponse);
    if(oResponse.sType != "response" && oResponse.sType != "status") return;
    if(oResponse.sCommand == "getStatus" && oResponse.oResponse.oData != {}){
      if(oResponse.oResponse.oData.sStatus == "server")
        document.getElementById("status").innerHTML = "You are streaming...";
      else if(oResponse.oResponse.oData.sStatus == "client")
        document.getElementById("status").innerHTML = "You are connected to '" + oResponse.oResponse.oData.sServer + "'.";
      else if(oResponse.oResponse.oData.sStatus == "nothing")
        document.getElementById("status").innerHTML = "No stream.";
    }else if(oResponse.sCommand == "getClients" && oResponse.oResponse.oData != {}){
      document.getElementById("result_box").innerHTML = "";
      for(var lIndex in oResponse.oResponse.oData){
        document.getElementById("result_box").innerHTML += "<div class=\"element\" onclick=\"Module.connectStream();\">" + oResponse.oResponse.oData[lIndex].sName + "</div>";
      }
    }
  };

  this.cleanup = function (){

  };

  this.init = function(){
    document.getElementById("start_stream_server").onclick = function(){
      sendRequest("control", oData.sRoom, oData.sModuleName, "startStream", []);
      setTimeout(this.getStatus.bind(this), 1000);
    }.bind(this);
    document.getElementById("start_stream_client").onclick = function(){
      document.getElementById("status").innerHTML = "From where?";
      sendRequest("status", oData.sRoom, oData.sModuleName, "getClients", []);
    }.bind(this);
    document.getElementById("end_stream").onclick = function(){
      sendRequest("control", oData.sRoom, oData.sModuleName, "endStream", []);
      setTimeout(this.getStatus.bind(this), 1000);
    }.bind(this);
    this.getStatus();
  };

  this.getStatus = function(){
    sendRequest("control", oData.sRoom, oData.sModuleName, "getStatus", []);
  };

  this.connectStream = function(sServer){
    sendRequest("control", oData.sRoom, oData.sModuleName, "connectStream", [sServer]);
    this.getStatus();
  };

  this.init();

};

oModule = new Module();
