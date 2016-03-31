
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
      groups[group_id]["aClients"].push_back(client); // push client to group
      std::cout << "Client added: " << groups.dump() << std::endl;
    };

    void removeClient(std::string group_id, std::string client_id){
      if(!groupExists(group_id)) // check if parameters are valid
        return;
      for(unsigned int it = 0; it < groups[group_id]["aClients"].size(); it++){
        if(groups[group_id]["aClients"][it]["sClientId"] == client_id){ // found client
          groups[group_id]["aClients"].erase(it); // now delete
          break;
        }
      }
      std::cout << "Client removed: " << groups.dump() << std::endl;
    };

    bool groupExists(std::string group_id){
      if(groups.find(group_id) != groups.end()) // group exists
        return true;
      return false; // group doesn't exist
    };

    int clientIdExistsInGroup(std::string group_id, std::string client_id){
      if(!groupExists(group_id)) // check if parameters are valid
        return -1;
      for(JSON::iterator it = groups[group_id]["aClients"].begin(); it != groups[group_id]["aClients"].end(); it++){
        if(it.value()["sClientId"] == client_id)
          return 1; // client with id already in given group
      }
      return 0; // client not found
    }

  private:

    JSON groups;
    std::string groups_location = "settings/groups.json";

};

#endif
