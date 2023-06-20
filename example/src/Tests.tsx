import React from 'react';
import { Text, View } from 'react-native';

type ExpectResult =
  | {
      type: 'toBe';
      error: boolean;
      actualValue: unknown;
      comparisonValue: unknown;
    }
  | {
      type: 'toBeUndefined';
      error: boolean;
      actualValue: unknown;
    };

type TestEntry = {
  id: string;
  description: string;
  failed: boolean;
  expectResults: ExpectResult[];
};

let tests: TestEntry[] = [];
let nextTestId = 1;
async function test(description: string, callback: () => void) {
  const id = nextTestId++;
  const testEntry: TestEntry = {
    id: '_' + id,
    description,
    failed: true,
    expectResults: [],
  };
  tests.push(testEntry);
  try {
    callback();
    if (testEntry.expectResults.length === 0) {
      testEntry.failed = true;
    } else {
      testEntry.failed = testEntry.expectResults.some((result) => result.error);
    }
  } catch (error) {
    testEntry.failed = true;
  }
}

function expect(actualValue: unknown) {
  const testEntry = tests[tests.length - 1];
  if (!testEntry) {
    throw new Error('No test entry found');
  }

  return {
    toBe(comparisonValue: unknown) {
      if (actualValue !== comparisonValue) {
        testEntry.expectResults.push({
          type: 'toBe',
          error: true,
          actualValue,
          comparisonValue,
        });
      } else {
        testEntry.expectResults.push({
          type: 'toBe',
          error: false,
          actualValue,
          comparisonValue,
        });
      }
    },
    toBeUndefined() {
      if (actualValue === undefined) {
        testEntry.expectResults.push({
          type: 'toBeUndefined',
          error: false,
          actualValue,
        });
      } else {
        testEntry.expectResults.push({
          type: 'toBeUndefined',
          error: true,
          actualValue,
        });
      }
    },
  };
}

export const Tests: React.FC = () => {
  tests = [];

  test('1 === 1', async () => {
    expect(1).toBe(1);
    // expect(1).toBe(2);
  });

  test('something to be undefined', async () => {
    expect(undefined).toBeUndefined();
  });

  const allTestsPassed = tests.every((testEntry) => !testEntry.failed);

  return (
    <View>
      <Text>{allTestsPassed ? 'Tests passed' : 'Tests failed'}</Text>
      {tests.map((result) => {
        return (
          <View key={result.id}>
            <Text>
              {result.description}: {result.failed ? '❌' : '✅'}
            </Text>
          </View>
        );
      })}
    </View>
  );
};
