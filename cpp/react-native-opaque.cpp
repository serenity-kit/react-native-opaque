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

	jsi::Value startClientRegistration(jsi::Runtime &rt, jsi::Value &input)
	{
		auto obj = input.asObject(rt);
		struct OpaqueStartClientRegistrationParams params = {
			.password = getProp(rt, obj, "password").utf8(rt),
		};
		auto clientStartResult = opaque_start_client_registration(params);
		auto result = jsi::Object(rt);
		result.setProperty(rt, "clientRegistrationState", std::string(clientStartResult.client_registration_state));
		result.setProperty(rt, "registrationRequest", std::string(clientStartResult.registration_request));
		return result;
	}

	::rust::Vec<::rust::String> getIdentifier(jsi::Runtime &rt, jsi::Object &obj, const char *name)
	{
		auto result = ::rust::Vec<::rust::String>();
		if (!obj.hasProperty(rt, "identifiers"))
			return result;
		auto identsProp = obj.getProperty(rt, "identifiers");
		if (identsProp.isUndefined() || identsProp.isNull())
		{
			return result;
		}
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

	jsi::Value finishClientRegistration(jsi::Runtime &rt, jsi::Value &input)
	{
		auto obj = input.asObject(rt);

		struct OpaqueFinishClientRegistrationParams params = {
			.password = getProp(rt, obj, "password").utf8(rt),
			.registration_response = getProp(rt, obj, "registrationResponse").utf8(rt),
			.client_registration_state = getProp(rt, obj, "clientRegistrationState").utf8(rt),
			.client_identifier = getIdentifier(rt, obj, "client"),
			.server_identifier = getIdentifier(rt, obj, "server"),
		};

		auto finish = opaque_finish_client_registration(params);
		auto result = jsi::Object(rt);
		result.setProperty(rt, "exportKey", std::string(finish.export_key));
		result.setProperty(rt, "registrationRecord", std::string(finish.registration_record));
		result.setProperty(rt, "serverStaticPublicKey", std::string(finish.server_static_public_key));
		return result;
	}

	jsi::Value startClientLogin(jsi::Runtime &rt, jsi::Value &input)
	{
		auto jsParams = input.asObject(rt);
		struct OpaqueStartClientLoginParams params = {
			.password = getProp(rt, jsParams, "password").utf8(rt),
		};
		auto result = opaque_start_client_login(params);
		auto jsResult = jsi::Object(rt);
		jsResult.setProperty(rt, "clientLoginState", std::string(result.client_login_state));
		jsResult.setProperty(rt, "startLoginRequest", std::string(result.start_login_request));
		return jsResult;
	}

	jsi::Value finishClientLogin(jsi::Runtime &rt, jsi::Value &input)
	{
		auto obj = input.asObject(rt);
		struct OpaqueFinishClientLoginParams params = {
			.client_login_state = getProp(rt, obj, "clientLoginState").utf8(rt),
			.login_response = getProp(rt, obj, "loginResponse").utf8(rt),
			.password = getProp(rt, obj, "password").utf8(rt),
			.client_identifier = getIdentifier(rt, obj, "client"),
			.server_identifier = getIdentifier(rt, obj, "server"),
		};
		auto result = opaque_finish_client_login(params);
		if (result == nullptr)
		{
			return jsi::Value::undefined();
		}
		auto ret = jsi::Object(rt);
		ret.setProperty(rt, "finishLoginRequest", std::string(result->finish_login_request));
		ret.setProperty(rt, "sessionKey", std::string(result->session_key));
		ret.setProperty(rt, "exportKey", std::string(result->export_key));
		ret.setProperty(rt, "serverStaticPublicKey", std::string(result->server_static_public_key));
		return ret;
	}

	jsi::Value createServerSetup(jsi::Runtime &rt, const jsi::Value *args)
	{
		auto setup = opaque_create_server_setup();
		return jsi::String::createFromUtf8(rt, std::string(setup));
	}

	jsi::Value createServerRegistrationResponse(jsi::Runtime &rt, jsi::Value &input)
	{
		auto obj = input.asObject(rt);
		struct OpaqueCreateServerRegistrationResponseParams params = {
			.server_setup = getProp(rt, obj, "serverSetup").utf8(rt),
			.user_identifier = getProp(rt, obj, "userIdentifier").utf8(rt),
			.registration_request = getProp(rt, obj, "registrationRequest").utf8(rt),
		};
		auto result = opaque_create_server_registration_response(params);
		auto ret = jsi::Object(rt);
		ret.setProperty(rt, "registrationResponse", std::string(result.registration_response));
		return ret;
	}

	jsi::Value startServerLogin(jsi::Runtime &rt, jsi::Value &input)
	{
		auto obj = input.asObject(rt);
		struct OpaqueStartServerLoginParams params
		{
			.server_setup = getProp(rt, obj, "serverSetup").utf8(rt),
			.registration_record = getOptional(rt, obj, "registrationRecord"),
			.start_login_request = getProp(rt, obj, "startLoginRequest").utf8(rt),
			.user_identifier = getProp(rt, obj, "userIdentifier").utf8(rt),
			.client_identifier = getIdentifier(rt, obj, "client"),
			.server_identifier = getIdentifier(rt, obj, "server"),
		};

		auto result = opaque_start_server_login(params);

		auto ret = jsi::Object(rt);
		ret.setProperty(rt, "serverLoginState", std::string(result.server_login_state));
		ret.setProperty(rt, "loginResponse", std::string(result.login_response));
		return ret;
	}

	jsi::Value finishServerLogin(jsi::Runtime &rt, jsi::Value &input)
	{
		auto obj = input.asObject(rt);
		struct OpaqueFinishServerLoginParams params = {
			.server_login_state = getProp(rt, obj, "serverLoginState").utf8(rt),
			.finish_login_request = getProp(rt, obj, "finishLoginRequest").utf8(rt),
		};
		auto result = opaque_finish_server_login(params);
		auto ret = jsi::Object(rt);
		ret.setProperty(rt, "sessionKey", std::string(result.session_key));
		return ret;
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
		installFunc1(rt, "opaque_startClientRegistration", startClientRegistration);
		installFunc1(rt, "opaque_finishClientRegistration", finishClientRegistration);
		installFunc1(rt, "opaque_startClientLogin", startClientLogin);
		installFunc1(rt, "opaque_finishClientLogin", finishClientLogin);

		installFunc(rt, "opaque_createServerSetup", 0, createServerSetup);
		installFunc1(rt, "opaque_createServerRegistrationResponse", createServerRegistrationResponse);
		installFunc1(rt, "opaque_startServerLogin", startServerLogin);
		installFunc1(rt, "opaque_finishServerLogin", finishServerLogin);
	}
}
