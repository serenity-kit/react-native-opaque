type TestCallback = () => void | Promise<void>;

type Test = {
  id: string;
  description: string;
  execute: TestCallback;
};

class TestFailure extends Error {}

export type TestResult =
  | { success: true; test: Test }
  | { success: false; test: Test; error: unknown };

class TestRunner {
  private constructor(private tests: Test[] = [], private nextId: number = 1) {}
  static empty() {
    return new TestRunner();
  }
  registerTest(props: Omit<Test, 'id'>) {
    const id = '_' + this.nextId++;
    this.tests.push({ ...props, id });
  }
  async runAll() {
    const results: TestResult[] = [];
    for (let t of this.tests) {
      try {
        await t.execute();
        results.push({ success: true, test: t });
      } catch (err) {
        results.push({ success: false, test: t, error: err });
      }
    }
    return results;
  }
}

const globalRegistry = TestRunner.empty();

export function test(description: string, callback: TestCallback) {
  globalRegistry.registerTest({ description, execute: callback });
}

class Expect {
  constructor(readonly actual: unknown, private inverse: boolean = false) {}
  get not() {
    this.inverse = !this.inverse;
    return this;
  }
  private check(f: () => boolean) {
    const result = f();
    return (result && !this.inverse) || (!result && this.inverse);
  }
  private fail(regular: string, inverse: string) {
    if (this.inverse) {
      throw new TestFailure(inverse);
    } else {
      throw new TestFailure(regular);
    }
  }
  toBe(expected: unknown) {
    if (this.check(() => this.actual !== expected)) {
      this.fail(
        `actual "${this.actual}" is not strictly equal to expected "${expected}"`,
        `actual "${this.actual}" is strictly equal to expected "${expected}"`
      );
    }
  }
  toEqual(expected: unknown) {
    if (this.check(() => this.actual !== expected)) {
      this.fail(
        `actual "${this.actual}" is not strictly equal to expected "${expected}"`,
        `actual "${this.actual}" is strictly equal to expected "${expected}"`
      );
    }
  }
  toBeUndefined() {
    if (this.check(() => this.actual !== undefined)) {
      this.fail(
        `expected undefined but got "${this.actual}"`,
        'expected a value but got undefined'
      );
    }
  }
}

export function expect(actual: unknown) {
  return new Expect(actual);
}

export function runTests() {
  return globalRegistry.runAll();
}
