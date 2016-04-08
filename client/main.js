
var oWS = require("ws");
var oSettings = require("./settings/settings.json");

function SmartClient(){

  // ATTRIBUTES
  this.oWS = null;
  this.initialized = false;
  this.aOnStatusFuncitons = [];
  this.oModules = {};

  // CONSTRUCTOR
  this.initialize = function(){
    this.oWS = new oWS("ws://" + oSettings["sHostAddress"] + ":" + oSettings["lPort"]);
    this.setEvents();
  };

  // FUNCTION
  // Set events for websocket
  this.setEvents = function(){
    // open connection
    this.oWS.on("open", function(){
      this.sendInitializationMessage();
    }.bind(this));
    // message received
    this.oWS.on("message", function(sData, lFlags){
      //parse message
      var oMessage = JSON.parse(sData);
      console.log("[CLIENT] Message received: ");
      console.log(oMessage);
      //evaluate basic parameters
      if(typeof oMessage["sType"] == "undefined" || typeof oMessage["sConnectionHash"] == "undefined")
        this.returnErrorMessage(oMessage, "Invalid message. Check documentation.", 1);
      else if(oMessage["sConnectionHash"] != oSettings["sConnectionHash"] &&
          oMessage["sType"] != "error") // don't respond to invalid error message to prevent ping pong
        this.returnErrorMessage(oMessage, "Invalid connection hash. Check documentation.", 2);
      //evaluate message
      if(oMessage["sType"] == "init-response")
        return this.evaluateInitializationResponse(oMessage);
      else if(oMessage["sType"] == "error")
        return this.evaluateErrorMessage(oMessage);
      else if(oMessage["sType"] == "status-reponse")
        return this.evaluateStatusResponse(oMessage);
      else if(oMessage["sType"] == "command")
        return this.evaluateCommand(oMessage);
      else if(oMessage["sType"] == "command-response")
        return this.evaluateCommandResponse(oMessage);
      // command not found report error
      this.returnErrorMessage(oMessage, "Command not found. Check documentation.", 3);
    }.bind(this));
    // connection closed
    this.oWS.on("close", function(){
      // TODO: handle close event
    }.bind(this));
    // error event
    this.oWS.on("error", function(e){
      // TODO: handle error event
    }.bind(this));
  };

  // FUNCTION
  // Send message to server
  this.sendMessage = function(oMessage){
    this.oWS.send(JSON.stringify(oMessage));
  };

  // FUNCTION
  // Initialize connection to server
  this.sendInitializationMessage = function(){
    var oMessage = {
      "sType": "init",
      "sConnectionHash": oSettings["sConnectionHash"],
      "sGroupId": oSettings["sGroupId"],
      "sClientId": oSettings["sClientId"],
      "sClientName": oSettings["sClientName"],
      "oModules": oSettings["oModules"]
    };
    this.sendMessage(oMessage);
  };

  // FUNCTION
  // Return an error message to sender
  this.returnErrorMessage = function(oMessage, sErrorMessage, lErrorCode){
    if(typeof lErrorCode == "undefined")
      lErrorCode = 0;
    sOldMessageType = oMessage["sType"];
    oMessage["sType"] = "error";
    oMessage["oResponse"] = {
      "sMessage": sErrorMessage,
      "sSender": "client",
      "lErrorCode": lErrorCode,
      "sSentType": sOldMessageType
    };
    this.sendMessage(oMessage);
  };

  // FUNCTION
  // Evaluate an initialization response
  this.evaluateInitializationResponse = function(oMessage){
    // evaluate message
    if(typeof oMessage["sGroupId"] == "undefined" || typeof oMessage["sClientId"] == "undefined" ||
        typeof oMessage["sClientName"] == "undefined" || typeof oMessage["oModules"] == "undefined" ||
        oMessage["sGroupId"] != oSettings["sGroupId"] || oMessage["sClientId"] != oSettings["sClientId"] ||
        oMessage["sClientName"] != oSettings["sClientName"] || typeof oMessage["oResponse"] == "undefined" ||
        oMessage["oResponse"] != "init")
      return;
    // set initialized flag
    this.initialized = true;
    this.loadModules();
  };

  // FUNCTION
  // Set client wide values from server
  this.evaluateStatusResponse = function(oMessage){
    for(var i = 0; i < this.aOnStatusFuncitons.length; i++)
      if(typeof this.aOnStatusFuncitons[i] != "undefined") this.aOnStatusFuncitons[i](oMessage);
  };

  // FUNCTION
  // Evaluate an error message -> don't response to an error message
  this.evaluateErrorMessage = function(oMessage){
    // check if error message even valid
    if(typeof oMessage["oResponse"] == "undefined" || typeof oMessage["oResponse"]["sMessage"] == "undefined" ||
        typeof oMessage["oResponse"]["sSender"] == "undefined" || typeof oMessage["oResponse"]["lErrorCode"] == "undefined" ||
        typeof oMessage["oResponse"]["sSentType"] == "undefined")
      return;
    // check error code and decide next step -> CURRENTLY NOTHING
    return;
  };

  // FUNCTION
  // Evaluate a command message
  this.evaluateCommand = function(oMessage){
    // check if format correct
    if(typeof oMessage["sClientId"] == "undefined" || typeof oMessage["sGroupId"] == "undefined" || typeof oMessage["sModuleId"] == "undefined" ||
        typeof oMessage["sCommand"] == "undefined" || typeof oMessage["oReturn"] == "undefined" || typeof oMessage["aParams"] == "undefined")
      return returnErrorMessage(oMessage, "Initialization incomplete. Check documentation.");
    else if(typeof this.oModules[oMessage["sModuleId"]] == "undefined") // check if the module exists
      return returnErrorMessage(oMessage, "Invalid Module Id.");
    // send command to module
    if(oMessage["sCommand"] == "help"){
      oMessage["oResponse"] = require(oSettings["oModules"][oMessage["sModuleId"]]["sPath"] + "/install.json");
      this.sendMessage(oMessage);
    }else{
      this.oModules[oMessage["sModuleId"]].handleCommand(oMessage["sCommand"], oMessage["aParams"]);
    }
  };

  // FUNCTION
  // Evaluate a command response message
  this.evaluateCommandResponse = function(oMessage){
    // TODO
  };

  // ===========================================================================

  // FUNCTION
  // Print logging to console
  this.log = function(sMessage){
    console.log("[CLIENT] " + sMessage);
  };

  // FUNCTION
  // add a new status message handler
  this.bindOnStatus = function(fCallback){
    this.aOnStatusFuncitons.push(fCallback);
    return this.aOnStatusFuncitons.length - 1;
  };

  // FUNCTION
  // delete status message handler function
  this.unbindOnStatus = function(index){
    delete this.aOnStatusFuncitons[index];
  };

  // FUNCTION
  // send status message
  this.sendStatusMessage = function(sGroupId, sClientId){
    if(typeof sGroupId == "undefined" && typeof sClientId == "undefined")
      this.sendMessage({"sType":"status","sConnectionHash":oSettings["sConnectionHash"],"sCommand":"get-groups","aParams":[]});
    else if(typeof sGroupId != "undefined" && typeof sClientId == "undefined")
      this.sendMessage({"sType":"status","sConnectionHash":oSettings["sConnectionHash"],"sCommand":"get-clients","aParams":[sGroupId]});
    else
      this.sendMessage({"sType":"status","sConnectionHash":oSettings["sConnectionHash"],"sCommand":"get-modules","aParams":[sGroupId, sClientId]});
  };

  // FUNCITON
  // load modules as defined in settings
  this.loadModules = function(){
    for(var i in oSettings["oModules"]){
      this.log("Loading '" + oSettings["oModules"][i]["sModuleName"] + "' ...");
      this.oModules[i] = require(oSettings["oModules"][i]["sPath"] + "/main.js");
      this.oModules[i].initialize(oSettings["oModules"][i]["aParams"]);
    }
  };

  // INITIALIZATION
  // fake constructor
  this.initialize();

};

SmartClient();
