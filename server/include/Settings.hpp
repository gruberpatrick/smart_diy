
#ifndef SETTINGS_HPP
#define SETTINGS_HPP

#include <string>

#include "json/json.hpp"
#include "handy-lib/file_p.hpp"

using JSON = nlohmann::json;

class Settings{

  public:

    Settings(){
      readSettings();
    };

    ~Settings(){

    };

    void readSettings(){
      settings = JSON::parse(fileGetContents(settings_location));
    };

    JSON getSettings(){
      return settings;
    };

    void changeSetting(std::string key, std::string value){
      settings[key] = value;
    };

    void changeSetting(std::string key, int value){
      settings[key] = value;
    };

    void changeSetting(std::string key, bool value){
      settings[key] = value;
    };

  private:

    JSON settings;
    std::string settings_location = "settings/settings.json";

};

#endif
