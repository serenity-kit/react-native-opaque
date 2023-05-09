#include <jsi/jsilib.h>
#include <jsi/jsi.h>
#include "react-native-opaque.h"
#include <sstream>
#include "./opaque-rust.h"

using namespace facebook;

void installOpaque(jsi::Runtime &rt)
{
	auto foobar = jsi::Function::createFromHostFunction(
		rt,
		jsi::PropNameID::forAscii(rt, "opaque_foobar"),
		0,
		[](jsi::Runtime &rt, const jsi::Value &self, const jsi::Value *args, size_t count) -> jsi::Value
		{
			if (count != 1)
			{
				throw std::runtime_error("expected 1 arg");
			}
			auto params = args[0].getObject(rt);
			auto foo = params.getProperty(rt, "foo").getString(rt);
			auto bar = params.getProperty(rt, "bar").getString(rt);
			struct TheFoobar input = {.foo = foo.utf8(rt), .bar = bar.utf8(rt)};
			auto output = get_the_foobar(input);
			auto obj = jsi::Object(rt);
			obj.setProperty(rt, "foo", jsi::String::createFromUtf8(rt, std::string(output.foo)));
			obj.setProperty(rt, "bar", jsi::String::createFromUtf8(rt, std::string(output.bar)));

			return obj;
		});

	rt.global().setProperty(rt, "opaque_foobar", std::move(foobar));

	auto clientRegistrationStart = jsi::Function::createFromHostFunction(
		rt,
		jsi::PropNameID::forAscii(rt, "opaque_clientRegistrationStart"),
		0,
		[](jsi::Runtime &rt, const jsi::Value &self, const jsi::Value *args, size_t count) -> jsi::Value
		{
			if (count != 1)
			{
				throw std::runtime_error("expected 1 arg");
			}

			auto password = args[0].getString(rt);
			auto clientStartResult = opaque_client_registration_start(password.utf8(rt));
			auto result = jsi::Object(rt);
			result.setProperty(rt, "clientRegistration", std::string(clientStartResult.client_registration));
			result.setProperty(rt, "registrationRequest", std::string(clientStartResult.registration_request));
			return result;
		});

	rt.global().setProperty(rt, "opaque_clientRegistrationStart", std::move(clientRegistrationStart));
}
