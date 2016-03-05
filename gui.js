// libraries
var oExpress = require("express");
// settings
var oSetup = require("./set/setup.json");
var oMediaClients = require("./set/media-clients.json");
var oMediaModules = require("./set/media-modules.json");
var oEJS = require("ejs");
var oApp = oExpress();

oApp.engine(".html", oEJS.__express);
oApp.set("views", __dirname + oSetup.sGUIDirectory);
oApp.set("view engine", "html");
oApp.use(oExpress.static("."));

console.log("[GUI] Server started.");

oApp.get("*", function(oRequest, oResponse){

  oResponse.render("main", {"oSetup":oSetup,"oMediaClients":oMediaClients,"oMediaModules":oMediaModules});

});
oApp.listen(8080);
