
#include "include/SmartServer.hpp"
#include "include/Settings.hpp"
#include "include/Groups.hpp"

int main(int argc, char** argv){

  Settings settings;
  Groups groups;

  SmartServer ss(&settings, &groups);
  ss.startServer(4444);

  return 0;

}
