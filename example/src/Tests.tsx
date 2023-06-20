import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { TestResult, expect, runTests, test } from './lib';

test('1 === 1', async () => {
  expect(1).toBe(1);
  // expect(1).toBe(2);
});

test('something to be undefined', async () => {
  expect(undefined).toBeUndefined();
});

export const Tests: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[] | null>(null);

  const allTestsPassed =
    testResults && !testResults.some((testEntry) => !testEntry.success);

  useEffect(() => {
    runTests().then((results) => {
      setTestResults(results);
    });
  }, []);

  return (
    <View>
      {allTestsPassed != null && (
        <Text>{allTestsPassed ? 'Tests passed' : 'Tests failed'}</Text>
      )}
      {testResults &&
        testResults.map((result) => {
          return (
            <View key={result.test.id}>
              <Text>
                {result.test.description}: {!result.success ? '❌' : '✅'}
              </Text>
            </View>
          );
        })}
    </View>
  );
};
