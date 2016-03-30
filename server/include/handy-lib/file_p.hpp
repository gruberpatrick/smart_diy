
#ifndef FILE_P_H
#define FILE_P_H

#include <string>
#include <fstream>
#include <vector>
#include <map>
#include <algorithm>
#include <curl/curl.h>
#include <openssl/ssl.h>
#include <sys/stat.h>

#include "string_p.hpp"

// LIBRARY VARIABLES

short int REQUEST_ERROR = 0;
CURL* CURL_HANDLE = NULL;
std::string REQUEST_HEADER = "";

// -----------------------------------------------------------------------------
// Gets local File
// -----------------------------------------------------------------------------
// @param location : the location of the file
// @return string  : the whole content as a string
//
std::vector<std::string> localRequest(std::string location)
{
	std::string line;
	std::vector<std::string> result;
	REQUEST_ERROR = 0;

	try
	{
		std::ifstream stream(location.c_str());
		while(getline(stream, line))
		{
			result.push_back(line);
		}
	}
	catch(int e)
	{
		REQUEST_ERROR = 1;
		return std::vector<std::string>();
	}

	return result;
}

// -----------------------------------------------------------------------------
// CALLBACK FUNCTION for CURL Request
// -----------------------------------------------------------------------------
//
size_t httpHandler(void* ptr, size_t size, size_t nmemb, FILE* stream)
{
	((std::string*)stream)->append((char*)ptr, size * nmemb);
	return nmemb * size;
}

// -----------------------------------------------------------------------------
// CALLBACK FUNCTION for SSL Request
// -----------------------------------------------------------------------------
//
static CURLcode sslHandler(CURL* curl, void* sslctx, void* parm)
{
	X509_STORE* store;
  X509* cert = NULL;
  BIO* bio;
  std::string mypem = convertVectorToString(localRequest("./cert/standard.pem"));

  std::vector<char> param_char(mypem.begin(), mypem.end());
  param_char.push_back(0);

  bio = BIO_new_mem_buf(&param_char[0], -1);

  PEM_read_bio_X509(bio, &cert, 0, NULL);
  if (cert == NULL)
    REQUEST_ERROR = 1;

  store = SSL_CTX_get_cert_store((SSL_CTX*)sslctx);

  if (X509_STORE_add_cert(store, cert) == 0)
    REQUEST_ERROR = 1;

  X509_free(cert);
  BIO_free(bio);

  return CURLE_OK;
}

// -----------------------------------------------------------------------------
// Gets HTTP File - overloads included
// -----------------------------------------------------------------------------
// @param location          : the location of the file
// @param useHTTPS          : flag for HTTPS usage
// @param postParams        : the post parameters as a map
// @return vector<string>   : the whole content by lines
//
std::vector<std::string> remoteRequest(std::string location, short int useHTTPS, char* postParams)
{
	REQUEST_ERROR = 0;
	std::string buffer = "";
	REQUEST_HEADER = "";

	if(CURL_HANDLE == NULL)
		CURL_HANDLE = curl_easy_init();

	CURLcode response = curl_global_init(CURL_GLOBAL_ALL);

	curl_easy_setopt(CURL_HANDLE, CURLOPT_WRITEDATA, &buffer);
	curl_easy_setopt(CURL_HANDLE, CURLOPT_HEADERDATA, &REQUEST_HEADER);
	curl_easy_setopt(CURL_HANDLE, CURLOPT_WRITEFUNCTION, *httpHandler);
	curl_easy_setopt(CURL_HANDLE, CURLOPT_URL, location.c_str());

	if(getLengthOfCharPointer(postParams) > 0)
	{
		curl_easy_setopt(CURL_HANDLE, CURLOPT_POSTFIELDS, postParams);
		curl_easy_setopt(CURL_HANDLE, CURLOPT_POSTFIELDSIZE, getLengthOfCharPointer(postParams));
		curl_easy_setopt(CURL_HANDLE, CURLOPT_POST, 1);
	}

	if(useHTTPS)
	{
		curl_easy_setopt(CURL_HANDLE, CURLOPT_SSLCERTTYPE, "PEM");
		curl_easy_setopt(CURL_HANDLE, CURLOPT_SSL_VERIFYPEER, 1L);
		curl_easy_setopt(CURL_HANDLE, CURLOPT_SSL_CTX_FUNCTION, *sslHandler);
	}

	response = curl_easy_perform(CURL_HANDLE);

	curl_easy_cleanup(CURL_HANDLE);
	curl_global_cleanup();
	CURL_HANDLE = NULL;

	if(response != CURLE_OK)
	{
		REQUEST_ERROR = 1;
		return std::vector<std::string>();
	}

	return split(buffer, '\n');
}

// -----------------------------------------------------------------------------
// GET local or HTTP(S) File -> controller to decide next function call
// Return content as one String
// -----------------------------------------------------------------------------
// @param location : the location of the file
// @return string  : the whole content as a string
//
std::string fileGetContents(std::string location)
{
	struct stat buffer;

	if(location.find("http://") != std::string::npos)
		return convertVectorToString(remoteRequest(location, 0, '\0'));
	else if(location.find("https://") != std::string::npos)
		return convertVectorToString(remoteRequest(location, 1, '\0'));
	else if(stat(location.c_str(), &buffer) == 0)
		return convertVectorToString(localRequest(location));

	return "";
}

// -----------------------------------------------------------------------------
// GET local or HTTP(S) File -> controller to decide next function call
// Return content by Lines
// -----------------------------------------------------------------------------
// @param location : the location of the file
// @return string  : the whole content as a string
//
std::vector<std::string> fileGetLines(std::string location)
{
	struct stat buffer;

	if(location.find("http://") != std::string::npos)
		return remoteRequest(location, 0, '\0');
	else if(location.find("https://") != std::string::npos)
		return remoteRequest(location, 1, '\0');
	else if(stat(location.c_str(), &buffer) == 0)
		return localRequest(location);

	return std::vector<std::string>();
}

// -----------------------------------------------------------------------------
// POST HTTP(S) File -> controller to decide next function call
// Return content as one String
// -----------------------------------------------------------------------------
// @param location : the location of the file
// @param params   : map of parameters
// @return string  : the whole content as a string
//
std::string filePostContents(std::string location, char* params)
{
	if(location.find("http://") != std::string::npos)
		return convertVectorToString(remoteRequest(location, 0, params));
	else if(location.find("https://") != std::string::npos)
		return convertVectorToString(remoteRequest(location, 1, params));

	return "";
}

// -----------------------------------------------------------------------------
// POST HTTP(S) File -> controller to decide next function call
// Return content by Lines
// -----------------------------------------------------------------------------
// @param location : the location of the file
// @param params   : map of parameters
// @return string  : the whole content as a string
//
std::vector<std::string> filePostLines(std::string location, char* params)
{
	if(location.find("http://") != std::string::npos)
		return remoteRequest(location, 0, params);
	else if(location.find("https://") != std::string::npos)
		return remoteRequest(location, 1, params);

	return std::vector<std::string>();
}

// -----------------------------------------------------------------------------
// Writes Data to a local file
// -----------------------------------------------------------------------------
// @param location : the location of the file
// @param content  : the data to be written
// @return string  : true if successful, false if error
//
bool filePutContents(std::string location, std::string content)
{
	std::ofstream stream(location.c_str());
	stream.write(content.c_str(), content.size());

	if(std::ofstream::eofbit == 0 && std::ofstream::failbit == 0 && std::ofstream::badbit == 0)
		return true;
	return false;
}

std::vector<std::string> getHeaderElements(std::string element, bool to_lower)
{
	std::vector<std::string> res;

	std::string tmp_header = REQUEST_HEADER;
	if(to_lower)
		std::transform(tmp_header.begin(), tmp_header.end(), tmp_header.begin(), ::tolower);

	size_t pos = tmp_header.find(element, 0) + element.length();
	while(pos != std::string::npos)
	{
		size_t end = REQUEST_HEADER.find('\n', pos);
		res.push_back(REQUEST_HEADER.substr(pos, end - pos));
		pos = tmp_header.find(element, end + 1);
		if(pos != std::string::npos)
			pos += element.length();
	}
	return res;
}

std::string getCookie(std::string cookie)
{
	std::vector<std::string> cookies = getHeaderElements("set-cookie: ", true);
	for(unsigned int i = 0; i < cookies.size(); i++)
	{
		size_t pos = cookies[i].find(cookie + "=") + cookie.length() + 1;
		if(pos != std::string::npos)
		{
			size_t end = cookies[i].find("; ", pos);
			return cookies[i].substr(pos, end - pos);
		}
	}

	return "";
}

#endif
