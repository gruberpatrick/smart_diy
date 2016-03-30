
#ifndef STDIO_P_H
#define STDIO_P_H

#include <iostream>
#include <string>

// -----------------------------------------------------------------------------
// Get STDIN from Command Line as Plain Text
// -----------------------------------------------------------------------------
// @return vector : the Input Lines
//
std::vector<std::string> getSTDINLong()
{
	std::vector<std::string> input;
	std::string piece;
	
	while(getline(std::cin, piece))
	{
		input.push_back(piece);
	}

	return input;
}

// -----------------------------------------------------------------------------
// Get Line from Command Line as Plain Text
// -----------------------------------------------------------------------------
// @return string : the Input as String
//
std::string getSTDINShort()
{
	std::string line;
	getline(std::cin, line);
	return line;
}

// -----------------------------------------------------------------------------
// Get Keystrokes from Command Line. Input not visible.
// -----------------------------------------------------------------------------
// @return string : the Input as String
//
std::string getSTDINHidden()
{
	// http://stackoverflow.com/questions/1413445/read-a-password-from-stdcin
	return std::string();
}

#endif
