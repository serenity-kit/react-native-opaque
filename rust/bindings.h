#include <cstdarg>
#include <cstdint>
#include <cstdlib>
#include <ostream>
#include <new>

struct Foobar {
  const char *foo;
  const char *bar;
};

extern "C" {

double get_rust_answer();

Foobar *get_foobar(Foobar input);

} // extern "C"
