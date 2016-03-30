
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
	$(CXX) main.cpp $(CXXFLAGS) -o $(EXECUTABLE)

#make clean
clean:
	rm -f $(EXECUTABLE)

#make valgrind
valgrind:
	valgrind --tool=memcheck --leak-check=full ./$(EXECUTABLE)
