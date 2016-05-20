
#ifndef SMARTSERVER_HPP
#define SMARTSERVER_HPP

#include <iostream>
#include <map>

#include "websocketpp/config/asio_no_tls.hpp"
#include "websocketpp/server.hpp"
#include "json/json.hpp"
#include "Settings.hpp"
#include "Groups.hpp"

using JSON = nlohmann::json;
typedef websocketpp::server<websocketpp::config::asio> Server;

class SmartServer{

  public:

    // =========================================================================
    // CONSTRUCTOR
    // -------------------------------------------------------------------------
    //
    SmartServer(Settings* settings_object, Groups* groups_object){
      groups = groups_object;
      settings = settings_object;
      server.init_asio();
      server.set_open_handler(websocketpp::lib::bind(&SmartServer::onOpen, this,websocketpp::lib::placeholders::_1));
      server.set_close_handler(websocketpp::lib::bind(&SmartServer::onClose, this, websocketpp::lib::placeholders::_1));
      server.set_message_handler(websocketpp::lib::bind(&SmartServer::onMessage, this, websocketpp::lib::placeholders::_1,
          websocketpp::lib::placeholders::_2));
      server.clear_access_channels(websocketpp::log::alevel::all);
    };

    // =========================================================================
    // DESTRUCTOR
    // -------------------------------------------------------------------------
    //
    ~SmartServer(){
      delete groups;
      delete settings;
    };

    // =========================================================================
    // On open event from the WebSocket.
    // -------------------------------------------------------------------------
    // @param connection_hdl client : The string to be checked.
    //
    void onOpen(websocketpp::connection_hdl client){
      //std::cout << "[SERVER] Unknown client connected." << std::endl;
    };

    // =========================================================================
    // On close event from the WebSocket.
    // -------------------------------------------------------------------------
    // @param connection_hdl client : The string to be checked.
    //
    void onClose(websocketpp::connection_hdl client){
      groups->removeClient(client_list[client].first, client_list[client].second); // remove client from group
      client_list.erase(client); // delete client object
    };

    // =========================================================================
    // On message event from the WebSocket.
    // -------------------------------------------------------------------------
    // @param connection_hdl client : The string to be checked.
    // @param message_ptr message   : The received message.
    //
    void onMessage(websocketpp::connection_hdl client, Server::message_ptr message){
      JSON protocol = JSON::parse(message->get_payload());
      // check basic connection information (sType && sConnectionHash)
      if(protocol.find("sType") == protocol.end())
        return returnErrorMessage(client, protocol, "Invalid message. Check documentation.", 1);
      else if(protocol.find("sConnectionHash") == protocol.end() ||
          protocol["sConnectionHash"] != settings->getSettings()["sConnectionHash"])
        return returnErrorMessage(client, protocol, "Invalid connection hash. Check documentation.", 2);
      // check if initialized
      bool initialized = false;
      if(getClientStrings(client).second != "")
        initialized = true;
      // deal with types of messages
      if(protocol["sType"] == "init" && !initialized)
        return evaluateInitialization(client, protocol);
      else if(protocol["sType"] == "status" && initialized)
        return evaluateStatus(client, protocol);
      else if(protocol["sType"] == "command" && initialized)
        return evaluateCommand(client, protocol);
      else if(protocol["sType"] == "command-response" && initialized)
        return evaluateCommandResponse(client, protocol);
      else if(protocol["sType"] == "error" && initialized)
        return evaluateErrorMessage(client, protocol);
      // invalid message found, reply with error
      return returnErrorMessage(client, protocol, "There was a problem with your command. Check documentation.", 3);
    };

    // =========================================================================
    // Send a message to a given client.
    // -------------------------------------------------------------------------
    // @param connection_hdl client : The string to be checked.
    // @param JSON protocol         : The protocol received.
    //
    void sendMessage(websocketpp::connection_hdl client, JSON message){
      std::string tmp_message = message.dump();
      server.send(client, tmp_message, websocketpp::frame::opcode::text);
    }

    // =========================================================================
    // Return an error message containing a message and code.
    // -------------------------------------------------------------------------
    // @param connection_hdl client : The string to be checked.
    // @param JSON protocol         : The protocol received.
    // @param string message        : The message to enclose.
    // @param int error_code        : Attached error code.
    //
    void returnErrorMessage(websocketpp::connection_hdl client, JSON protocol, std::string message, int error_code){
      std::string old_message_type = protocol["sType"];
      protocol["sType"] = "error";
      protocol["oResponse"] = { {"sMessage", message}, {"sSender", "server"}, {"lErrorCode", error_code}, {"sSentType", old_message_type}};
      sendMessage(client, protocol);
    };

    // =========================================================================
    // Check if the format of the received module message is correct.
    // -------------------------------------------------------------------------
    // @param JSON modules : The modules object from the initialization message.
    //
    bool evaluateModulesFormat(JSON modules){
      for(JSON::iterator it = modules.begin(); it != modules.end(); it++){
        if(it.value().find("sModuleName") == it.value().end())
          return false;
      }
      return true;
    };

    // =========================================================================
    // Evaluate the initialization message and send a response.
    // -------------------------------------------------------------------------
    // @param connection_hdl client : The string to be checked.
    // @param JSON protocol         : The protocol received.
    //
    void evaluateInitialization(websocketpp::connection_hdl client, JSON protocol){
      // evaluate the message
      if(protocol.find("sGroupId") == protocol.end() || protocol.find("sClientId") == protocol.end() ||
          protocol.find("sClientName") == protocol.end() || protocol.find("oModules") == protocol.end())
        return returnErrorMessage(client, protocol, "Initialization incomplete. Check documentation.", 0);
      else if(!groups->groupExists(protocol["sGroupId"]))
        return returnErrorMessage(client, protocol, "Invalid Group ID.", 0);
      else if(!evaluateModulesFormat(protocol["oModules"]))
        return returnErrorMessage(client, protocol, "Module format incorrect. Check documentation.", 0);
      else if(groups->clientIdExistsInGroup(protocol["sGroupId"], protocol["sClientId"]) != 0)
        return returnErrorMessage(client, protocol, "Client with this ID already registered.", 0);
      else if(!validIdFormat(protocol["sGroupId"])) // check if ID valid
        return returnErrorMessage(client, protocol, "Group ID contains invalid characters.", 0);
      else if(!validIdFormat(protocol["sClientId"])) // check if ID valid
        return returnErrorMessage(client, protocol, "Client ID contains invalid characters.", 0);
      // add client
      std::string client_id = protocol["sClientId"];
      std::string group_id = protocol["sGroupId"];
      JSON client_object;
      client_object["sClientId"] = protocol["sClientId"];
      client_object["sClientName"] = protocol["sClientName"];
      client_object["oModules"] = protocol["oModules"];
      groups->addClient(group_id, client_object);
      client_list[client] = std::make_pair(group_id, client_id);
      // report message
      std::pair<std::string, std::string> client_string = getClientStrings(client);
      log("[MESSAGE][INIT][FROM:" + client_string.first + "," + client_string.second + "] => " + protocol.dump());
      // prepare message and send
      protocol["sType"] = "init-response";
      protocol["oResponse"] = "init";
      sendMessage(client, protocol);
    };

    // =========================================================================
    // Evaluate the status message and send a response.
    // -------------------------------------------------------------------------
    // @param connection_hdl client : The string to be checked.
    // @param JSON protocol         : The protocol received.
    //
    void evaluateStatus(websocketpp::connection_hdl client, JSON protocol){
      // evaluate the message
      if(protocol.find("sCommand") == protocol.end() || protocol.find("aParams") == protocol.end())
        return returnErrorMessage(client, protocol, "Status request incomplete. Check documentation.", 0);
      // change the message type
      protocol["sType"] = "status-response";
      JSON groups_object = groups->getGroups();
      // convert necessary data
      std::string group_id = "";
      std::string client_id = "";
      if(protocol["aParams"].size() == 1)
        group_id = protocol["aParams"][0];
      else if(protocol["aParams"].size() == 2){
        group_id = protocol["aParams"][0];
        client_id = protocol["aParams"][1];
      }
      // report message
      std::pair<std::string, std::string> client_string = getClientStrings(client);
      log("[MESSAGE][STATUS][FROM:" + client_string.first + "," + client_string.second + "] => " + protocol.dump());
      // set the appropriate response
      if(protocol["sCommand"] == "get-groups" && protocol["aParams"].size() == 0)
        protocol["oResponse"] = groups_object;
      else if(protocol["sCommand"] == "get-clients" && groups_object.find(group_id) != groups_object.end()){
        protocol["oResponse"] = groups_object[group_id];
      }else if(protocol["sCommand"] == "get-modules" && groups_object.find(group_id) != groups_object.end() &&
          groups_object[group_id]["oClients"].find(client_id) !=  groups_object[group_id]["oClients"].end()){
        protocol["oResponse"] = groups_object[group_id]["oClients"][client_id]["oModules"];
      }
      // send response
      sendMessage(client, protocol);
    };

    // =========================================================================
    // Evaluate the error message and see of it needs to be transferred to a
    // client.
    // -------------------------------------------------------------------------
    // @param connection_hdl client : The string to be checked.
    // @param JSON protocol         : The protocol received.
    //
    void evaluateErrorMessage(websocketpp::connection_hdl client, JSON protocol){
      // TODO: test
      // error message is ment for server or not valid format -> doesn't care
      if(protocol.find("oReturn") == protocol.end() || protocol["oReturn"].find("sGroupId") == protocol["oReturn"].end() ||
          protocol["oReturn"].find("sClientId") == protocol["oReturn"].end())
        return;
      // get the client object from the map
      std::pair<bool, websocketpp::connection_hdl> tmp_client = getClientObject(protocol["oReturn"]["sGroupId"], protocol["oReturn"]["sClientId"]);
      if(!tmp_client.first)
        return;
      // report message
      std::pair<std::string, std::string> client_string = getClientStrings(client);
      log("[MESSAGE][ERROR][FROM:" + client_string.first + "," + client_string.second + "] => " + protocol.dump());
      // send error message to correct recipient
      sendMessage(tmp_client.second, protocol);
    };

    // =========================================================================
    // Get client object based on group and client id.
    // -------------------------------------------------------------------------
    // @param string group_id  : String containing the group id.
    // @param string client_id : String containing the client id.
    //
    std::pair<bool, websocketpp::connection_hdl> getClientObject(std::string group_id, std::string client_id){
      for(std::map<websocketpp::connection_hdl, std::pair<std::string, std::string>, std::owner_less<websocketpp::connection_hdl> >::iterator it = client_list.begin();
          it != client_list.end(); it++)
      {
        if(it->second.first == group_id && it->second.second == client_id)
          return std::make_pair(true, it->first);
      }
      return std::make_pair(false, websocketpp::connection_hdl());
    }

    // =========================================================================
    // Get client strings based on client object.
    // -------------------------------------------------------------------------
    // @param connection_hdl client : The client to be found.
    //
    std::pair<std::string, std::string> getClientStrings(websocketpp::connection_hdl client){
      std::map<websocketpp::connection_hdl, std::pair<std::string, std::string>, std::owner_less<websocketpp::connection_hdl> >::iterator it = client_list.find(client);
      // check if client found
      if(it == client_list.end())
        return std::make_pair("", "");
      // return correct client
      return it->second;
    }

    // =========================================================================
    // Evaluate the received command for correctness and send to client.
    // -------------------------------------------------------------------------
    // @param connection_hdl client : WebSocket client object.
    // @param JSON protocol         : The JSON object of the received message.
    //
    void evaluateCommand(websocketpp::connection_hdl client, JSON protocol){
      // TODO: test
      // check if protocol valid
      if(protocol.find("sClientId") == protocol.end() || protocol.find("sGroupId") == protocol.end() || protocol.find("sModuleId") == protocol.end() ||
          protocol.find("sCommand") == protocol.end() || protocol.find("aParams") == protocol.end())
        return returnErrorMessage(client, protocol, "Command message incomplete. Check documentation.", 0);
      // find client for return and change if not given by message
      std::pair<std::string, std::string> client_string = getClientStrings(client);
      log("[MESSAGE][COMMAND][FROM:" + client_string.first + "," + client_string.second + "] => " + protocol.dump());
      if(protocol.find("oReturn") == protocol.end())
        protocol["oReturn"] = {{"sGroupId", client_string.first}, {"sClientId", client_string.second}};
      else{
        if(protocol["oReturn"].find("sGroupId") == protocol["oReturn"].end() || protocol["oReturn"].find("sClientId") == protocol["oReturn"].end())
          return returnErrorMessage(client, protocol, "The 'oReturn' data is incomplete.", 0);
        else if(!getClientObject(protocol["oReturn"]["sGroupId"], protocol["oReturn"]["sClientId"]).first)
          return returnErrorMessage(client, protocol, "The 'oReturn' data is invalid.", 0);
      }
      // find intended client and send
      std::pair<bool, websocketpp::connection_hdl> tmp_client = getClientObject(protocol["sGroupId"], protocol["sClientId"]);
      if(tmp_client.first)
        return sendMessage(tmp_client.second, protocol);
      return returnErrorMessage(client, protocol, "There was a problem with your message. Try again.", 11);
    };

    // =========================================================================
    // Evaluate the received command response for correctness and send to
    // correct client.
    // -------------------------------------------------------------------------
    // @param connection_hdl client : WebSocket client object.
    // @param JSON protocol         : The JSON object of the received message.
    //
    void evaluateCommandResponse(websocketpp::connection_hdl client, JSON protocol){
      // TODO: test
      // check if message valid
      if(protocol.find("sClientId") == protocol.end() || protocol.find("sGroupId") == protocol.end() || protocol.find("sModuleId") == protocol.end() ||
          protocol.find("sCommand") == protocol.end() || protocol.find("aParams") == protocol.end() || protocol.find("oResponse") == protocol.end() ||
          protocol.find("oReturn") == protocol.end() || protocol["oReturn"].find("sGroupId") == protocol["oReturn"].end() ||
          protocol["oReturn"].find("sClientId") == protocol["oReturn"].end())
        return returnErrorMessage(client, protocol, "Command response message incomplete. Check documentation.", 0);
      // check if oReturn data valid
      std::pair<bool, websocketpp::connection_hdl> tmp_client = getClientObject(protocol["oReturn"]["sGroupId"], protocol["oReturn"]["sClientId"]);
      if(!tmp_client.first)
        return returnErrorMessage(client, protocol, "The 'oReturn' data is invalid.", 0);
      // send data to client
      sendMessage(tmp_client.second, protocol);
    };

    // =========================================================================
    // Check if string contains correct characters (A-Z,a-z,0-9,-)
    // -------------------------------------------------------------------------
    // @param string id : The string to be checked.
    //
    bool validIdFormat(std::string id){
      // check if id length is decent
      if(id.length() < 3)
        return false;
      // check char values of string
      for(unsigned int it = 0; it < id.length(); it++){
        char c = id.at(it);
        if(!((c >= 48 && c <= 57) || (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || c == 45))
          return false;
      }
      return true;
    };

    // =========================================================================
    // Centralized logging function.
    // -------------------------------------------------------------------------
    // @param string message : The message to be printed.
    //
    void log(std::string message){
      std::cout << "[SERVER]" << message << std::endl;
    };

    // =========================================================================
    // Startup server.
    // -------------------------------------------------------------------------
    // @param int port : The port on which the server operates.
    //
    void startServer(int port){
      server.listen(port);
      server.start_accept();
      server.run();
    };

  private:

    Server server;
    std::map<websocketpp::connection_hdl, std::pair<std::string, std::string>, std::owner_less<websocketpp::connection_hdl> > client_list;
    Groups* groups;
    Settings* settings;

};

#endif
