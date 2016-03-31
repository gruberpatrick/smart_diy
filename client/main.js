
var oWS = require("ws");
var oSettings = require("./settings/settings.json");

function SmartClient(){

  // ATTRIBUTES
  this.oWS = null;

  // CONSTRUCTOR
  this.initialize = function(){
    this.oWS = new oWS("ws://" + oSettings["sHostAddress"] + ":" + oSettings["lPort"]);
    this.setEvents();
  };

  // FUNCTION
  // set events for websocket
  this.setEvents = function(){
    // open connection
    this.oWS.on("open", function(){
      this.sendInitializationMessage();
    }.bind(this));
    // message received
    this.oWS.on("message", function(sData, lFlags){
      var oMessage = JSON.parse(sData);
      console.log("[CLIENT] Message received: ");
      console.log(oMessage);
    }.bind(this));
    // connection closed
    this.oWS.on("close", function(){

    }.bind(this));
    // error event
    this.oWS.on("error", function(e){

    }.bind(this));
  };

  this.sendInitializationMessage = function(){
    var oMessage = {
      "sType": "init",
      "sConnectionHash": oSettings["sConnectionHash"],
      "sGroupId": oSettings["sGroupId"],
      "sClientId": oSettings["sClientId"],
      "sClientName": oSettings["sClientName"],
      "aModules": oSettings["aModules"]
    };
    this.oWS.send(JSON.stringify(oMessage));
  };

  // INITIALIZATION
  // fake constructor
  this.initialize();

};

SmartClient();
