
EXECUTABLE = smart_diy_server
SOURCES    = $(wildcard *.cpp)
OBJECTS    = $(patsubst %,%,${SOURCES:.cpp=.o})
CXX        = g++
CXXFLAGS   = -Wall -I "./include/" -lcurl -lssl -lcrypto -lboost_system -std=c++11
LDFLAGS    =
LDLIBS     =
#-------------------------------------------------------------------------------

#make executable
all:
	@ clear
	@ echo "#######################################################################"
	@ echo " Building SmartDIY Server"
	@ echo "-----------------------------------------------------------------------"
	$(CXX) main.cpp $(CXXFLAGS) -o $(EXECUTABLE)
	@ echo "DONE!"

#make clean
clean:
	rm -f $(EXECUTABLE)

#make valgrind
valgrind:
	valgrind --tool=memcheck --leak-check=full ./$(EXECUTABLE)
