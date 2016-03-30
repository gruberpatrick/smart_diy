
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
      for(JSON::iterator it = groups.begin(); it != groups.end(); it++){
        if(it.value()["sGroupId"] != group_id)
          continue;
        std::cout << it.value()["sGroupId"] << std::endl;
        it.value()["aClients"].push_back(client);
      }
      std::cout << "Client added: " << groups.dump() << std::endl;
    };

    void removeClient(std::string group_id, std::string client_id){
      std::cout << "Client removed: " << groups.dump() << std::endl;
    };

  private:

    JSON groups;
    std::string groups_location = "settings/groups.json";

};

#endif
