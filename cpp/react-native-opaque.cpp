#include <jsi/jsilib.h>
#include <jsi/jsi.h>
#include "react-native-opaque.h"
#include <sstream>
#include "./opaque-rust.h"

using namespace facebook;

namespace Opaque
{
	using OpaqueFunc = std::function<jsi::Value(jsi::Runtime &, jsi::Value &)>;

	jsi::Value clientRegistrationStart(jsi::Runtime &rt, jsi::Value &input)
	{
		auto password = input.getString(rt);
		auto clientStartResult = opaque_client_registration_start(password.utf8(rt));
		auto result = jsi::Object(rt);
		result.setProperty(rt, "clientRegistration", std::string(clientStartResult.client_registration));
		result.setProperty(rt, "registrationRequest", std::string(clientStartResult.registration_request));
		return result;
	}

	jsi::Value clientRegistrationFinish(jsi::Runtime &rt, jsi::Value &input)
	{
		auto obj = input.getObject(rt);

		struct OpaqueClientRegistrationFinishParams params = {
			.password = obj.getProperty(rt, "password").asString(rt).utf8(rt),
			.registration_response = obj.getProperty(rt, "registrationResponse").asString(rt).utf8(rt),
			.client_registration = obj.getProperty(rt, "clientRegistration").asString(rt).utf8(rt),
			.client_identifier = obj.getProperty(rt, "clientIdentifier").asString(rt).utf8(rt),
		};

		auto finish = opaque_client_registration_finish(params);
		auto result = jsi::Object(rt);
		result.setProperty(rt, "exportKey", std::string(finish.export_key));
		result.setProperty(rt, "registrationUpload", std::string(finish.registration_upload));
		result.setProperty(rt, "serverStaticPublicKey", std::string(finish.server_static_public_key));
		return result;
	}

	void installFunc(jsi::Runtime &rt, const std::string name, OpaqueFunc func)
	{
		auto propName = jsi::PropNameID::forAscii(rt, name);
		auto jsiFunc = jsi::Function::createFromHostFunction(
			rt,
			propName,
			1,
			[func](jsi::Runtime &rt, const jsi::Value &self, const jsi::Value *args, size_t count) -> jsi::Value
			{
				if (count != 1)
				{
					throw std::runtime_error("expected 1 arg");
				}
				auto input = jsi::Value(rt, args[0]);
				return func(rt, input);
			});

		rt.global().setProperty(rt, propName, std::move(jsiFunc));
	}

	void installOpaque(jsi::Runtime &rt)
	{
		installFunc(rt, "opaque_clientRegistrationStart", clientRegistrationStart);
		installFunc(rt, "opaque_clientRegistrationFinish", clientRegistrationFinish);
	}
}
