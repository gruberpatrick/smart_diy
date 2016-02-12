// libraries
var oNetwork = require("./lib/HandyJS/lib/network-p");
// settings
var oSetup = require("./set/setup.json");
var oMediaClients = require("./set/media-clients.json");
var oMediaModules = require("./set/media-modules.json");

/*
 * The request protocol:
 *
 * {
 *   "sType": "init",
 *   "sName": "..."
 * }
 * {
 *   "sType": "control",
 *   "sTarget": "...",          // target for command as defined in set/media-clients.json
 *   ["sFrom": "...",]          // from added by server to deliver response
 *   "sMedia": "oRhythmbox",    // see set/media-modules.json for available modules
 *   "sCommand": "play"         // command depending on module
 *   "aParams": [...]           // params required by command
 * }
 *
 * The answer protocol:
 *
 * {
 *   "sType": "response",
 *   "sTarget": "...",          // target for command as defined in set/media-clients.json -> SWITCHED
 *   "sFrom": "...",            // from added by server to deliver response                -> WITH THIS ONE
 *   "sMedia": "oRhythmbox",    // see set/media-modules.json for available modules
 *   "sCommand": "play"         // command depending on module
 *   "aParams": [...]           // params required by command
 *   "oResponse": {             // response values
 *     "oData": [...]
 *   }
 * }
 *
 */
function dataSwitch(oData, sKey){
  oData["sFrom"] = sKey;
  oNetwork.oSocket.clientSend(oMediaClients[oData.sTarget]["sKey"], oData);
  return {};
}

oNetwork.oSocket.initializeWebSocket(oSetup.lServerPort, function(oWS){
  console.log("[SYSTEM] New client connected.");
}.bind(this), function(sKey, oClient){
  // operation
  var oData = JSON.parse(oClient.sLastMessage);
  if(typeof oData.sType == "undefined") return;
  var oResponse = {};
  console.log("[SYSTEM] Traffic:");
  console.log(oData);
  if(oData.sType == "init"){
    if(typeof oData.sName == "undefined" || typeof oMediaClients[oData.sName] == "undefined") return;     
    oMediaClients[oData.sName]["bConnected"] = true;
    oMediaClients[oData.sName]["sKey"] = sKey;
    var aResponseTemp = {};
    for(var lIndex in oMediaClients[oData.sName]["aModules"]){
      aResponseTemp[oMediaClients[oData.sName]["aModules"][lIndex]] = oMediaModules[oMediaClients[oData.sName]["aModules"][lIndex]];
    }
    oData["oResponse"] = {"oData": aResponseTemp};
    oData["sTarget"] = oData["sName"];
  }else if(oData.sType == "control"){
    oData["oResponse"] = {"oData": dataSwitch(oData, sKey)};
  }else if(oData.sType == "response"){
    sKey = oData.sTarget;
  }
  oNetwork.oSocket.clientSend(sKey, oData);
}.bind(this), function(oErr){
  console.log("[SYSTEM] Error:");
  console.log(oErr);
}.bind(this));