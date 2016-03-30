
#ifndef STRING_P_H
#define STRING_P_H

// -----------------------------------------------------------------------------
// Returns the length of a CHAR POINTER
// -----------------------------------------------------------------------------
// @param string    : the length of the \0 terminated string
// @return int      : the length of the string
//
int getLengthOfCharPointer(char* string)
{

	if(string == '\0')
		return 0;
	int res = 0;
	while(string[res] != '\0')
	{
		res++;
	}
	return res;
}

// -----------------------------------------------------------------------------
// Returns a Vector of Strings as a String
// -----------------------------------------------------------------------------
// @param lines    : the content lines
// @return string  : the complete text as a string
//
std::string convertVectorToString(std::vector<std::string> lines)
{
	std::string result = "";
	for(unsigned int i = 0; i < lines.size(); i++)
	{
		result += lines[i] + "\n";
	}
	return result;
}

// -----------------------------------------------------------------------------
// Returns a Vector of Strings from a String and delimiter -> check PHP explode
// Documentation for further Information
// -----------------------------------------------------------------------------
// @param content    : the content as string
// @param delimiter  : the character where content gets exploded
// @return vector    : exploded string
//
std::vector<std::string> split(std::string content, char delimiter)
{
	std::vector<std::string> result;
	size_t search = content.find(delimiter);

	while(search != std::string::npos)
	{
		result.push_back(content.substr(0, search));
		content = content.substr(search + 1);
		search = content.find(delimiter);
	}

	return result;
}

// -----------------------------------------------------------------------------
// Returns a Vector of Strings from a String and delimiter -> check PHP explode
// Documentation for further Information
// -----------------------------------------------------------------------------
// @param content    : the content as string
// @param string     : the string where content gets exploded
// @return vector    : exploded string
//
std::vector<std::string> split(std::string content, std::string delimiter)
{
	std::vector<std::string> result;
	size_t search = content.find(delimiter);

	while(search != std::string::npos)
	{
		result.push_back(content.substr(0, search));
		content = content.substr(search + 1);
		search = content.find(delimiter);
	}

	return result;
}

// -----------------------------------------------------------------------------
// Returns a String from a glued Vector
// -----------------------------------------------------------------------------
// @param pieces   : the content pieces
// @param glue     : character used for combining pieces
// @return string  : the complete text as a string
//
std::string glue(std::vector<std::string> pieces, char glue)
{
	std::string result = "";
	for(unsigned int i = 0; i < pieces.size(); i++)
	{
		if(i > 0)
			result += glue;
		result += pieces[i];
	}
	return result;
}

// -----------------------------------------------------------------------------
// Returns a String from a glued Vector
// -----------------------------------------------------------------------------
// @param pieces   : the content pieces
// @param glue     : string used for combining pieces
// @return string  : the complete text as a string
//
std::string glue(std::vector<std::string> pieces, std::string glue)
{
	std::string result = "";
	for(unsigned int i = 0; i < pieces.size(); i++)
	{
		if(i > 0)
			result += glue;
		result += pieces[i];
	}
	return result;
}

#endif
