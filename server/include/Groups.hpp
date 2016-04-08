
#ifndef GROUPS_HPP
#define GROUPS_HPP

#include <string>
#include <iostream>

#include "json/json.hpp"
#include "handy-lib/file_p.hpp"

using JSON = nlohmann::json;

class Groups{

  public:

    Groups(){
      readGroups();
    };

    ~Groups(){

    };

    void readGroups(){
      groups = JSON::parse(fileGetContents(groups_location));
    };

    void addClient(std::string group_id, JSON client){
      std::string client_id = client["sClientId"];
      client.erase("sClientId");
      groups[group_id]["oClients"][client_id] = client; // push client to group
      //std::cout << "Client added: " << groups.dump() << std::endl;
    };

    void removeClient(std::string group_id, std::string client_id){
      if(clientIdExistsInGroup(group_id, client_id) != 1) // check if parameters are valid
        return;
      groups[group_id]["oClients"].erase(client_id);
      //std::cout << "Client removed: " << groups.dump() << std::endl;
    };

    bool groupExists(std::string group_id){
      if(groups.find(group_id) != groups.end()) // group exists
        return true;
      return false; // group doesn't exist
    };

    int clientIdExistsInGroup(std::string group_id, std::string client_id){
      if(!groupExists(group_id)) // check if parameters are valid
        return -1; // group doesn't exist
      if(groups[group_id]["oClients"].find(client_id) != groups[group_id]["oClients"].end())
        return 1;//  client found
      return 0; // client not found
    }

    JSON getGroups(){
      return groups;
    };

  private:

    JSON groups;
    std::string groups_location = "settings/groups.json";

};

#endif
