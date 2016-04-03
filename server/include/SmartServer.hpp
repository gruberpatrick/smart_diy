
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
        return; // TODO: Check if error is ment for another node (sTo); Server is not messing with errors;

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
      // set the appropriate response
      if(protocol["sCommand"] == "get-groups" && protocol["aParams"].size() == 0)
        protocol["oResponse"] = groups_object;
      else if(protocol["sCommand"] == "get-clients" && protocol["aParams"].size() == 1 &&
          groups_object.find(protocol["aParams"][0]) != groups_object.end())
        // TODO:
        //protocol["oResponse"] = groups_object[protocol["aParams"][0]];
        std::cout << "GROUP-ID: " << protocol["aParams"][0] << std::endl;
      /*else if(protocol["sCommand"] == "get-modules" && protocol["aParams"].size() == 2 &&
          groups_object.find(protocol["aParams"][0]) != groups_object.end() &&
          groups_object[protocol["aParams"][0]]["oClients"].find(protocol["aParams"][1]) !=  groups_object[protocol["aParams"][0]]["oClients"].end())
        protocol["oResponse"] = groups_object[protocol["aParams"][0]]["oClients"][protocol["aParams"][1]]["oModules"];*/
      // send response
      sendMessage(client, protocol);
    };


    void evaluateCommand(websocketpp::connection_hdl client, JSON protocol){
      // TODO
    };

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
