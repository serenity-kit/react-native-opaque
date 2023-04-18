#include <jsi/jsilib.h>
#include <jsi/jsi.h>
#include "react-native-opaque.h"
// sstream contains functions to manipulate strings in C++
#include <sstream>

// The namespace allows for syntactic sugar around the JSI objects. ex. call: jsi::Function instead of facebook::jsi::Function
using namespace facebook;

// We get the runtime from the obj-c code and we create our native functions here
void installOpaque(jsi::Runtime &jsiRuntime)
{
	auto jsi_multiply = jsi::Function::createFromHostFunction(
			jsiRuntime,
			jsi::PropNameID::forAscii(jsiRuntime, "jsi_multiply"),
			1,
			[](jsi::Runtime &runtime, const jsi::Value &thisValue, const jsi::Value *arguments, size_t count) -> jsi::Value
			{
				double res = 42;
				return jsi::Value(res);
			});

	jsiRuntime.global().setProperty(jsiRuntime, "jsi_multiply", std::move(jsi_multiply));
}

void cleanUpOpaque()
{
}