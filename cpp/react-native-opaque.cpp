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

	jsi::Value foobar(jsi::Runtime &rt, jsi::Value &arg)
	{
		auto params = arg.getObject(rt);
		auto foo = params.getProperty(rt, "foo").getString(rt);
		auto bar = params.getProperty(rt, "bar").getString(rt);
		struct TheFoobar input = {.foo = foo.utf8(rt), .bar = bar.utf8(rt)};
		auto output = get_the_foobar(input);
		auto obj = jsi::Object(rt);
		obj.setProperty(rt, "foo", jsi::String::createFromUtf8(rt, std::string(output.foo)));
		obj.setProperty(rt, "bar", jsi::String::createFromUtf8(rt, std::string(output.bar)));

		return obj;
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
		installFunc(rt, "opaque_foobar", foobar);
	}
}