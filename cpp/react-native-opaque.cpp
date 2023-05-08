#include <jsi/jsilib.h>
#include <jsi/jsi.h>
#include "react-native-opaque.h"
#include <sstream>
#include "./rust.h"

using namespace facebook;

// extern "C" double get_rust_answer();

// We get the runtime from the obj-c code and we create our native functions here
void installOpaque(jsi::Runtime &rt)
{
	// printf("installOpaque called");
	auto jsi_multiply = jsi::Function::createFromHostFunction(
		rt,
		jsi::PropNameID::forAscii(rt, "jsi_multiply"),
		0,
		[](jsi::Runtime &rt, const jsi::Value &self, const jsi::Value *args, size_t count) -> jsi::Value
		{
			// double res = get_rust_answer();
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

	rt.global().setProperty(rt, "jsi_multiply", std::move(jsi_multiply));
}

void cleanUpOpaque()
{
}