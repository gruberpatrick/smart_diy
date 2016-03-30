
#ifndef SMARTSERVER_HPP
#define SMARTSERVER_HPP

#include <iostream>
#include <set>

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
      server.set_message_handler(websocketpp::lib::bind(&SmartServer::onMessage, this, websocketpp::lib::placeholders::_1, websocketpp::lib::placeholders::_2));
    };

    ~SmartServer(){
      delete groups;
      delete settings;
    };

    void onOpen(websocketpp::connection_hdl client){
      std::cout << "[SERVER] New connection." << std::endl;
    };

    void onClose(websocketpp::connection_hdl client){
      // TODO: remove all traces of client
      std::cout << "[SERVER] Connection closed." << std::endl;
    };

    void onMessage(websocketpp::connection_hdl client, Server::message_ptr message){
      //TODO: insert client into client_list and goups
      std::cout << "[SERVER] Message: " << message << std::endl;
      JSON protocol = JSON::parse(message->get_payload());

      if(protocol["sConnectionHash"] != settings->getSettings()["sConnectionHash"])
        returnInitializationError(client, protocol);

      if(protocol["sType"] == "init"){

      }else if(protocol["sType"] == "status"){

      }else if(protocol["sType"] == "command"){

      }

      //groups->clientAdd("", protocol);
      //client_list[""] = client;
    };

    void returnInitializationError(websocketpp::connection_hdl client, JSON protocol){
      //protocol["oResponse"] = "error";
      //server.send(client, protocol);
    };

    void startServer(int port){
      server.listen(port);
      server.start_accept();
      server.run();
    };

  private:

    Server server;
    std::set<std::string, std::owner_less<websocketpp::connection_hdl>> client_list;
    Groups* groups;
    Settings* settings;

};

#endif
