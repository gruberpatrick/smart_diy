// libraries
var oOS = require("os");
var oNetwork = require("./lib/HandyJS/lib/network-p");
var oPath = require("fs");
// settings
var oSetup = require("./set/setup.json");
var oModules = {};
var sHostname = oOS.hostname();

oNetwork.oSocket.connectWebSocket(oSetup.sServerHost, oSetup.lServerPort, function(){
  console.log("[" + sHostname + "] Connection established.");
  // set identification to server
  oNetwork.oSocket.serverSend({sType:"init",sName:sHostname});
}, function(oLastConnection, lFlags){
  var oData = JSON.parse(oLastConnection.sLastMessage);
  if(typeof oData.sType == "undefined" || typeof oData.sTarget == "undefined" || oData.sTarget != sHostname) return;
  console.log("[" + sHostname + "] Traffic:");
  console.log(oData);
  if(oData.sType == "init"){
    for(var lIndex in oData.oResponse.oData){
      if(!oPath.existsSync("./modules/" + oData.oResponse.oData[lIndex].sGUI + "/lib/" + oData.oResponse.oData[lIndex].sPath)){
        console.log("[" + sHostname + "] Package not available: " + lIndex);
        continue;
      }
      oModules[lIndex] = require("./modules/" + oData.oResponse.oData[lIndex].sGUI + "/lib/" + oData.oResponse.oData[lIndex].sPath);
      oModules[lIndex].init(oData.oResponse.oData[lIndex].aParams);
    }
  }else if(oData.sType == "control"){
    if(typeof oModules[oData.sMedia] == "undefined") return;
    var sFrom = oData.sFrom;
    oData.sFrom = oData.sTarget;
    oData.sTarget = sFrom;
    oData.sType = "response";
    oData["oResponse"] = {"oData": oModules[oData.sMedia].evaluateCommand(oData.sCommand, oData.aParams, function(oResponse){
      if(typeof data == "string") oResponse = JSON.parse(oResponse);
      oData["oResponse"] = {"oData": oResponse};
      oNetwork.oSocket.serverSend(oData);
    }.bind(this))};
    if(oData["oResponse"] != {})
      oNetwork.oSocket.serverSend(oData);
  }
  return;
}.bind(this), function(oErr){
  console.log("[" + sHostname + "] Error:");
  console.log(oErr);
});
