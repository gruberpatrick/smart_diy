
var oWS = require("ws");
var oSettings = require("./settings/settings.json");

function SmartClient(){

  // ATTRIBUTES
  this.oWS = null;
  this.initialized = false;

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
        this.returnErrorMessage(oMessage, "Invalid Message. Check documentation.");
      else if(oMessage["sConnectionHash"] != oSettings["sConnectionHash"] &&
          oMessage["sType"] != "error") // don't respond to invalid error message to prevent ping pong
        this.returnErrorMessage(oMessage, "Invalid connection hash. Check documentation.");
      //evaluate message
      if(oMessage["sType"] == "init-response")
        return this.evaluateInitializationResponse(oMessage);
      else if(oMessage["sType"] == "error")
        return this.evaluateErrorMessage(oMessage);
      else if(oMessage["sType"] == "status-reponse")
        return this.evaluateStatusResponse(oMessage);
      // command not found report error
      this.returnErrorMessage(oMessage, "Command not found. Check documentation.");
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
    this.sendMessage({"sType":"status","sConnectionHash":oSettings["sConnectionHash"],"sCommand":"get-clients","aParams":["living-room"]});
    this.initialized = true;
  };

  // FUNCTION
  // Set client wide values from server
  this.evaluateStatusResponse = function(oMessage){
    // make data available for modules
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
  };

  // FUNCTION
  // Print logging to console
  this.log = function(sMessage){
    console.log("[CLIENT] " + sMessage);
  },

  // INITIALIZATION
  // fake constructor
  this.initialize();

};

SmartClient();
