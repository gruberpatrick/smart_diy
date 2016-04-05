
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

/**
 * TODO:
 * - create remote registration (assign remote ID)
 * - create command handler -> add sTo (remote ID)
 * - create command-response handler and send back to request
 */

class SmartServer{

  public:

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

    ~SmartServer(){
      delete groups;
      delete settings;
    };

    void onOpen(websocketpp::connection_hdl client){
      std::cout << "[SERVER] Unknown client connected." << std::endl;
    };

    void onClose(websocketpp::connection_hdl client){
      groups->removeClient(client_list[client].first, client_list[client].second); // remove client from group
      client_list.erase(client); // delete client object
    };

    void onMessage(websocketpp::connection_hdl client, Server::message_ptr message){
      std::cout << "[SERVER] Message: " << message->get_payload() << std::endl;
      JSON protocol = JSON::parse(message->get_payload());
      // check basic connection information (sType && sConnectionHash)
      if(protocol.find("sType") == protocol.end())
        return returnErrorMessage(client, protocol, "Invalid message. Check documentation.", 1);
      else if(protocol.find("sConnectionHash") == protocol.end() ||
          protocol["sConnectionHash"] != settings->getSettings()["sConnectionHash"])
        return returnErrorMessage(client, protocol, "Invalid connection hash. Check documentation.", 2);
      // deal with types of messages
      if(protocol["sType"] == "init")
        return evaluateInitialization(client, protocol);
      else if(protocol["sType"] == "status")
        return evaluateStatus(client, protocol);
      else if(protocol["sType"] == "command")
        return evaluateCommand(client, protocol);
      else if(protocol["sType"] == "error")
        return evaluateErrorMessage(client, protocol);
      // invalid message found, reply with error
      return returnErrorMessage(client, protocol, "Command currently not supported. Check documentation.", 3);
    };

    void sendMessage(websocketpp::connection_hdl client, JSON message){
      std::string tmp_message = message.dump();
      server.send(client, tmp_message, websocketpp::frame::opcode::text);
    }

    void returnErrorMessage(websocketpp::connection_hdl client, JSON protocol, std::string message, int error_code){
      std::string old_message_type = protocol["sType"];
      protocol["sType"] = "error";
      protocol["oResponse"] = { {"sMessage", message}, {"sSender", "server"}, {"lErrorCode", error_code}, {"sSentType", old_message_type}};
      sendMessage(client, protocol);
    };

    bool evaluateModulesFormat(JSON modules){
      for(JSON::iterator it = modules.begin(); it != modules.end(); it++){
        if(it.value().find("sModuleName") == it.value().end())
          return false;
      }
      return true;
    };

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
      // prepare message and send
      protocol["sType"] = "init-response";
      protocol["oResponse"] = "init";
      sendMessage(client, protocol);
    };

    void evaluateStatus(websocketpp::connection_hdl client, JSON protocol){
      // evaluate the message
      if(protocol.find("sCommand") == protocol.end() || protocol.find("aParams") == protocol.end())
        return returnErrorMessage(client, protocol, "Status request invalid. Check documentation.", 0);
      // change the message type
      protocol["sType"] = "status-reponse";
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

    void evaluateErrorMessage(websocketpp::connection_hdl client, JSON protocol){
      if(protocol.find("oReturn") == protocol.end()) // error message is ment for server -> doesn't care
        return;
      // TODO: Send error message to client or remote;
    };

    // =========================================================================
    // Evaluate the received command for correctness and send to client.
    // -------------------------------------------------------------------------
    // @param conneciton_hdl client : WebSocket client object.
    // @param JSON protocol         : The JSON object of the received message.
    //
    void evaluateCommand(websocketpp::connection_hdl client, JSON protocol){
      // TODO: Add oReturn variable; Send to client;
    };

    // =========================================================================
    // Check if string contains correct characters (A-Z,a-z,0-9,-)
    // -------------------------------------------------------------------------
    // @param string id : The string to be checked.
    //
    bool validIdFormat(std::string id){
      for(unsigned int it = 0; it < id.length(); it++){
        char c = id.at(it);
        if(!((c >= 48 && c <= 57) || (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || c == 45))
          return false;
      }
      return true;
    }

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
