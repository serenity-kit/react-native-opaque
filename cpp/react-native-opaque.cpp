#include <jsi/jsilib.h>
#include <jsi/jsi.h>
#include "react-native-opaque.h"
#include <sstream>
#include "./opaque-rust.h"

using namespace facebook;

namespace NativeOpaque
{
	using OpaqueFunc1 = std::function<jsi::Value(jsi::Runtime &, jsi::Value &)>;

	::rust::Vec<::rust::String> getOptional(jsi::Runtime &rt, jsi::Object &obj, const char *propName)
	{
		auto result = ::rust::Vec<::rust::String>();
		auto prop = obj.getProperty(rt, propName);
		if (prop.isString())
		{
			result.push_back(std::string(prop.getString(rt).utf8(rt)));
		}
		return result;
	}

	std::string kindToString(const jsi::Value &v, jsi::Runtime &rt)
	{
		if (v.isUndefined())
		{
			return "undefined";
		}
		else if (v.isNull())
		{
			return "null";
		}
		else if (v.isBool())
		{
			return v.getBool() ? "true" : "false";
		}
		else if (v.isNumber())
		{
			return "a number";
		}
		else if (v.isString())
		{
			return "a string";
		}
		else if (v.isSymbol())
		{
			return "a symbol";
		}
		else if (v.isBigInt())
		{
			return "a bigint";
		}
		else
		{
			assert(v.isObject() && "Expecting object.");
			return v.getObject(rt).isFunction(rt) ? "a function"
												  : "an object";
		}
	}

	jsi::String getProp(jsi::Runtime &rt, jsi::Object &obj, const char *propName)
	{
		if (!obj.hasProperty(rt, propName))
		{
			throw jsi::JSError(rt, "missing required property \"" + std::string(propName) + "\" in input params");
		}
		auto prop = obj.getProperty(rt, propName);
		if (!prop.isString())
		{
			throw jsi::JSError(rt, "property \"" + std::string(propName) + "\" has invalid type, expected string but got " + kindToString(prop, rt));
		}
		return prop.getString(rt);
	}

	jsi::Value clientRegistrationStart(jsi::Runtime &rt, jsi::Value &input)
	{
		auto password = input.asString(rt);
		auto clientStartResult = opaque_client_registration_start(password.utf8(rt));
		auto result = jsi::Object(rt);
		result.setProperty(rt, "clientRegistration", std::string(clientStartResult.client_registration));
		result.setProperty(rt, "registrationRequest", std::string(clientStartResult.registration_request));
		return result;
	}

	::rust::Vec<::rust::String> getIdentifier(jsi::Runtime &rt, jsi::Object &obj, const char *name)
	{
		auto result = ::rust::Vec<::rust::String>();
		if (!obj.hasProperty(rt, "identifiers"))
			return result;
		auto identsProp = obj.getProperty(rt, "identifiers");
		if (!identsProp.isObject())
		{
			throw jsi::JSError(rt, "\"identifiers\" must be an object");
		}
		auto identsObj = identsProp.asObject(rt);
		if (identsObj.hasProperty(rt, name))
		{
			auto prop = identsObj.getProperty(rt, name);
			if (!prop.isString())
			{
				throw jsi::JSError(rt, "identifier \"" + std::string(name) + "\" must be a string");
			}
			result.push_back(std::string(prop.asString(rt).utf8(rt)));
		}
		return result;
	}

	jsi::Value clientRegistrationFinish(jsi::Runtime &rt, jsi::Value &input)
	{
		auto obj = input.asObject(rt);

		struct OpaqueClientRegistrationFinishParams params = {
			.password = getProp(rt, obj, "password").utf8(rt),
			.registration_response = getProp(rt, obj, "registrationResponse").utf8(rt),
			.client_registration = getProp(rt, obj, "clientRegistration").utf8(rt),
			.client_identifier = getIdentifier(rt, obj, "client"),
			.server_identifier = getIdentifier(rt, obj, "server"),
		};

		auto finish = opaque_client_registration_finish(params);
		auto result = jsi::Object(rt);
		result.setProperty(rt, "exportKey", std::string(finish.export_key));
		result.setProperty(rt, "registrationUpload", std::string(finish.registration_upload));
		result.setProperty(rt, "serverStaticPublicKey", std::string(finish.server_static_public_key));
		return result;
	}

	jsi::Value clientLoginStart(jsi::Runtime &rt, jsi::Value &input)
	{
		auto result = opaque_client_login_start(std::string(input.asString(rt).utf8(rt)));
		auto obj = jsi::Object(rt);
		obj.setProperty(rt, "clientLogin", std::string(result.client_login));
		obj.setProperty(rt, "credentialRequest", std::string(result.credential_request));
		return obj;
	}

	jsi::Value clientLoginFinish(jsi::Runtime &rt, jsi::Value &input)
	{
		auto obj = input.asObject(rt);
		struct OpaqueClientLoginFinishParams params = {
			.client_login = getProp(rt, obj, "clientLogin").utf8(rt),
			.credential_response = getProp(rt, obj, "credentialResponse").utf8(rt),
			.password = getProp(rt, obj, "password").utf8(rt),
			.client_identifier = getIdentifier(rt, obj, "client"),
			.server_identifier = getIdentifier(rt, obj, "server"),
		};
		auto result = opaque_client_login_finish(params);
		if (result == nullptr)
		{
			return jsi::Value::null();
		}
		auto ret = jsi::Object(rt);
		ret.setProperty(rt, "credentialFinalization", std::string(result->credential_finalization));
		ret.setProperty(rt, "sessionKey", std::string(result->session_key));
		ret.setProperty(rt, "exportKey", std::string(result->export_key));
		ret.setProperty(rt, "serverStaticPublicKey", std::string(result->server_static_public_key));
		return ret;
	}

	jsi::Value serverSetup(jsi::Runtime &rt, const jsi::Value *args)
	{
		auto setup = opaque_server_setup();
		return jsi::String::createFromUtf8(rt, std::string(setup));
	}

	jsi::Value serverRegistrationStart(jsi::Runtime &rt, jsi::Value &input)
	{
		auto obj = input.asObject(rt);
		struct OpaqueServerRegistrationStartParams params = {
			.server_setup = getProp(rt, obj, "serverSetup").utf8(rt),
			.credential_identifier = getProp(rt, obj, "credentialIdentifier").utf8(rt),
			.registration_request = getProp(rt, obj, "registrationRequest").utf8(rt),
		};
		auto result = opaque_server_registration_start(params);
		return jsi::String::createFromUtf8(rt, std::string(result));
	}

	jsi::Value serverRegistrationFinish(jsi::Runtime &rt, jsi::Value &input)
	{
		auto result = opaque_server_registration_finish(input.asString(rt).utf8(rt));
		return jsi::String::createFromUtf8(rt, std::string(result));
	}

	jsi::Value serverLoginStart(jsi::Runtime &rt, jsi::Value &input)
	{
		auto obj = input.asObject(rt);
		struct OpaqueServerLoginStartParams params
		{
			.server_setup = getProp(rt, obj, "serverSetup").utf8(rt),
			.password_file = getOptional(rt, obj, "passwordFile"),
			.credential_request = getProp(rt, obj, "credentialRequest").utf8(rt),
			.credential_identifier = getProp(rt, obj, "credentialIdentifier").utf8(rt),
			.client_identifier = getIdentifier(rt, obj, "client"),
			.server_identifier = getIdentifier(rt, obj, "server"),
		};

		auto result = opaque_server_login_start(params);

		auto ret = jsi::Object(rt);
		ret.setProperty(rt, "serverLogin", std::string(result.server_login));
		ret.setProperty(rt, "credentialResponse", std::string(result.credential_response));
		return ret;
	}

	jsi::Value serverLoginFinish(jsi::Runtime &rt, jsi::Value &input)
	{
		auto obj = input.asObject(rt);
		struct OpaqueServerLoginFinishParams params = {
			.server_login = getProp(rt, obj, "serverLogin").utf8(rt),
			.credential_finalization = getProp(rt, obj, "credentialFinalization").utf8(rt),
		};
		auto result = opaque_server_login_finish(params);
		return jsi::String::createFromUtf8(rt, std::string(result));
	}

	using OpaqueFuncN = std::function<jsi::Value(jsi::Runtime &, const jsi::Value *args)>;

	void installFunc(jsi::Runtime &rt, const std::string name, unsigned int paramCount, OpaqueFuncN func)
	{
		auto propName = jsi::PropNameID::forAscii(rt, name);
		auto jsiFunc = jsi::Function::createFromHostFunction(
			rt,
			propName,
			paramCount,
			[func, paramCount](jsi::Runtime &rt, const jsi::Value &self, const jsi::Value *args, size_t count) -> jsi::Value
			{
				if (count != paramCount)
				{
					throw std::runtime_error("invalid number of arguments");
				}
				return func(rt, args);
			});

		rt.global().setProperty(rt, propName, std::move(jsiFunc));
	}

	void installFunc1(jsi::Runtime &rt, const std::string name, OpaqueFunc1 func)
	{
		installFunc(
			rt,
			name,
			1,
			[func](jsi::Runtime &rt, const jsi::Value *args) -> jsi::Value
			{
				auto input = jsi::Value(rt, args[0]);
				return func(rt, input);
			});
	}

	void installOpaque(jsi::Runtime &rt)
	{
		installFunc1(rt, "opaque_clientRegistrationStart", clientRegistrationStart);
		installFunc1(rt, "opaque_clientRegistrationFinish", clientRegistrationFinish);
		installFunc1(rt, "opaque_clientLoginStart", clientLoginStart);
		installFunc1(rt, "opaque_clientLoginFinish", clientLoginFinish);

		installFunc(rt, "opaque_serverSetup", 0, serverSetup);
		installFunc1(rt, "opaque_serverRegistrationStart", serverRegistrationStart);
		installFunc1(rt, "opaque_serverRegistrationFinish", serverRegistrationFinish);
		installFunc1(rt, "opaque_serverLoginStart", serverLoginStart);
		installFunc1(rt, "opaque_serverLoginFinish", serverLoginFinish);
	}
}
