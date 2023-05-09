#include <array>
#include <cstddef>
#include <cstdint>
#include <new>
#include <string>
#include <type_traits>
#include <utility>

namespace rust {
inline namespace cxxbridge1 {
// #include "rust/cxx.h"

struct unsafe_bitcopy_t;

#ifndef CXXBRIDGE1_RUST_STRING
#define CXXBRIDGE1_RUST_STRING
class String final {
public:
  String() noexcept;
  String(const String &) noexcept;
  String(String &&) noexcept;
  ~String() noexcept;

  String(const std::string &);
  String(const char *);
  String(const char *, std::size_t);
  String(const char16_t *);
  String(const char16_t *, std::size_t);

  static String lossy(const std::string &) noexcept;
  static String lossy(const char *) noexcept;
  static String lossy(const char *, std::size_t) noexcept;
  static String lossy(const char16_t *) noexcept;
  static String lossy(const char16_t *, std::size_t) noexcept;

  String &operator=(const String &) &noexcept;
  String &operator=(String &&) &noexcept;

  explicit operator std::string() const;

  const char *data() const noexcept;
  std::size_t size() const noexcept;
  std::size_t length() const noexcept;
  bool empty() const noexcept;

  const char *c_str() noexcept;

  std::size_t capacity() const noexcept;
  void reserve(size_t new_cap) noexcept;

  using iterator = char *;
  iterator begin() noexcept;
  iterator end() noexcept;

  using const_iterator = const char *;
  const_iterator begin() const noexcept;
  const_iterator end() const noexcept;
  const_iterator cbegin() const noexcept;
  const_iterator cend() const noexcept;

  bool operator==(const String &) const noexcept;
  bool operator!=(const String &) const noexcept;
  bool operator<(const String &) const noexcept;
  bool operator<=(const String &) const noexcept;
  bool operator>(const String &) const noexcept;
  bool operator>=(const String &) const noexcept;

  void swap(String &) noexcept;

  String(unsafe_bitcopy_t, const String &) noexcept;

private:
  struct lossy_t;
  String(lossy_t, const char *, std::size_t) noexcept;
  String(lossy_t, const char16_t *, std::size_t) noexcept;
  friend void swap(String &lhs, String &rhs) noexcept { lhs.swap(rhs); }

  std::array<std::uintptr_t, 3> repr;
};
#endif // CXXBRIDGE1_RUST_STRING

namespace detail {
template <typename T, typename = void *>
struct operator_new {
  void *operator()(::std::size_t sz) { return ::operator new(sz); }
};

template <typename T>
struct operator_new<T, decltype(T::operator new(sizeof(T)))> {
  void *operator()(::std::size_t sz) { return T::operator new(sz); }
};
} // namespace detail

template <typename T>
union ManuallyDrop {
  T value;
  ManuallyDrop(T &&value) : value(::std::move(value)) {}
  ~ManuallyDrop() {}
};

template <typename T>
union MaybeUninit {
  T value;
  void *operator new(::std::size_t sz) { return detail::operator_new<T>{}(sz); }
  MaybeUninit() {}
  ~MaybeUninit() {}
};
} // namespace cxxbridge1
} // namespace rust

struct TheFoobar;
struct OpaqueClientRegistrationStartResult;

#ifndef CXXBRIDGE1_STRUCT_TheFoobar
#define CXXBRIDGE1_STRUCT_TheFoobar
struct TheFoobar final {
  ::rust::String foo;
  ::rust::String bar;

  using IsRelocatable = ::std::true_type;
};
#endif // CXXBRIDGE1_STRUCT_TheFoobar

#ifndef CXXBRIDGE1_STRUCT_OpaqueClientRegistrationStartResult
#define CXXBRIDGE1_STRUCT_OpaqueClientRegistrationStartResult
struct OpaqueClientRegistrationStartResult final {
  ::rust::String client_registration;
  ::rust::String registration_request;

  using IsRelocatable = ::std::true_type;
};
#endif // CXXBRIDGE1_STRUCT_OpaqueClientRegistrationStartResult

extern "C" {
void cxxbridge1$get_the_foobar(::TheFoobar *input, ::TheFoobar *return$) noexcept;

void cxxbridge1$opaque_client_registration_start(::rust::String *password, ::OpaqueClientRegistrationStartResult *return$) noexcept;
} // extern "C"

::TheFoobar get_the_foobar(::TheFoobar input) noexcept {
  ::rust::ManuallyDrop<::TheFoobar> input$(::std::move(input));
  ::rust::MaybeUninit<::TheFoobar> return$;
  cxxbridge1$get_the_foobar(&input$.value, &return$.value);
  return ::std::move(return$.value);
}

::OpaqueClientRegistrationStartResult opaque_client_registration_start(::rust::String password) noexcept {
  ::rust::MaybeUninit<::OpaqueClientRegistrationStartResult> return$;
  cxxbridge1$opaque_client_registration_start(&password, &return$.value);
  return ::std::move(return$.value);
}
