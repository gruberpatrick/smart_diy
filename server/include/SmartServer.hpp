
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
      // TODO: change structure of client storage
      //  + http://www.zaphoyd.com/websocketpp/manual/common-patterns/storing-connection-specificsession-information

      std::cout << "[SERVER] Connection closed." << std::endl;
    };

    void onMessage(websocketpp::connection_hdl client, Server::message_ptr message){
      std::cout << "[SERVER] Message: " << message->get_payload() << std::endl;
      JSON protocol = JSON::parse(message->get_payload());

      if(protocol.find("sType") == protocol.end())
        return returnErrorMessage(client, protocol, "Invalid message. Check documentation.");
      else if(protocol.find("sConnectionHash") == protocol.end() ||
          protocol["sConnectionHash"] != settings->getSettings()["sConnectionHash"])
        return returnErrorMessage(client, protocol, "Invalid connection hash. Check documentation.");

      if(protocol["sType"] == "init"){
        return evaluateInitialization(client, protocol);
      }else if(protocol["sType"] == "status"){
        // TODO: create status messages
      }else if(protocol["sType"] == "command"){
        // TODO: create command messages
      }

      return returnErrorMessage(client, protocol, "Command currently not supported. Check documentation.");
    };

    void sendMessage(websocketpp::connection_hdl client, JSON message){
      std::string tmp_message = message.dump();
      server.send(client, tmp_message, websocketpp::frame::opcode::text);
    }

    void returnErrorMessage(websocketpp::connection_hdl client, JSON protocol, std::string message){
      protocol["sType"] = "error";
      protocol["oResponse"] = { {"sMessage", message}, {"sSender", "server"}};
      sendMessage(client, protocol);
    };

    bool evaluateModulesFormat(JSON modules){
      for(JSON::iterator it = modules.begin(); it != modules.end(); it++){
        if(it.value().find("sModuleId") == it.value().end() || it.value().find("sModuleName") == it.value().end())
          return false;
      }
      return true;
    };

    void evaluateInitialization(websocketpp::connection_hdl client, JSON protocol){
      // evaluate the message
      if(protocol.find("sGroupId") == protocol.end() || protocol.find("sClientId") == protocol.end() ||
          protocol.find("sClientName") == protocol.end() || protocol.find("aModules") == protocol.end())
        return returnErrorMessage(client, protocol, "Initialization incomplete. Check documentation.");
      else if(!groups->groupExists(protocol["sGroupId"]))
        return returnErrorMessage(client, protocol, "Invalid Group ID.");
      else if(!evaluateModulesFormat(protocol["aModules"]))
        return returnErrorMessage(client, protocol, "Module format incorrect. Check documentation.");
      else if(groups->clientIdExistsInGroup(protocol["sGroupId"], protocol["sClientId"]) != 0)
        return returnErrorMessage(client, protocol, "Client with this ID already registered.");
      // add client
      std::string client_id = protocol["sClientId"];
      std::string group_id = protocol["sGroupId"];
      JSON client_object;
      client_object["sClientId"] = protocol["sClientId"];
      client_object["sClientName"] = protocol["sClientName"];
      client_object["aModules"] = protocol["aModules"];
      groups->addClient(group_id, client_object);
      client_list[std::make_pair(group_id, client_id)] = client;
      // prepare message and send
      protocol["sType"] = "init-response";
      protocol["oResponse"] = "init";
      sendMessage(client, protocol);
    };

    void startServer(int port){
      server.listen(port);
      server.start_accept();
      server.run();
    };

  private:

    Server server;
    std::map<std::pair<std::string, std::string>, websocketpp::connection_hdl> client_list;
    Groups* groups;
    Settings* settings;

};

#endif
