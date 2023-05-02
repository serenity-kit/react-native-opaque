#include <jsi/jsilib.h>
#include <jsi/jsi.h>
#include "react-native-opaque.h"
#include <sstream>

using namespace facebook;

extern "C" double get_rust_answer();

// We get the runtime from the obj-c code and we create our native functions here
void installOpaque(jsi::Runtime &jsiRuntime)
{
	// printf("installOpaque called");
	auto jsi_multiply = jsi::Function::createFromHostFunction(
		jsiRuntime,
		jsi::PropNameID::forAscii(jsiRuntime, "jsi_multiply"),
		0,
		[](jsi::Runtime &runtime, const jsi::Value &thisValue, const jsi::Value *arguments, size_t count) -> jsi::Value
		{
			double res = get_rust_answer();
			return jsi::Value(res);
		});

	jsiRuntime.global().setProperty(jsiRuntime, "jsi_multiply", std::move(jsi_multiply));
}

void cleanUpOpaque()
{
}