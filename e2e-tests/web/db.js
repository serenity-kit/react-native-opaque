class Database {
  constructor(users, logins) {
    this.users = users;
    this.logins = logins;
  }

  static empty() {
    return new Database({}, {});
  }

  getUser(name) {
    return this.users[name];
  }
  hasUser(name) {
    return this.users[name] != null;
  }
  getLogin(name) {
    return this.hasLogin(name) ? this.logins[name]?.value ?? null : null;
  }
  hasLogin(name) {
    const login = this.logins[name];
    if (login == null) return false;
    const now = new Date().getTime();
    const elapsed = now - login.timestamp;
    return elapsed < 2000;
  }
  setUser(name, value) {
    this.users[name] = value;
  }
  setLogin(name, value) {
    this.logins[name] = { value, timestamp: new Date().getTime() };
  }
  removeLogin(name) {
    delete this.logins[name];
  }
}

module.exports = Database;
