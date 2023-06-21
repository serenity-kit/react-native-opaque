import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import './OpaqueTests';
import { TestResult, runTests } from './Test';

export const Tests: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[] | null>(null);

  const allTestsPassed =
    testResults && !testResults.some((testEntry) => !testEntry.success);

  useEffect(() => {
    runTests().then((results) => {
      if (results.some((t) => !t.success)) {
        console.error(results);
      }
      setTestResults(results);
    });
  }, []);

  return (
    <View style={{ flexDirection: 'column', gap: 8, padding: 16 }}>
      {allTestsPassed != null && (
        <Text style={{ fontSize: 20 }}>
          {allTestsPassed ? 'Tests passed' : 'Tests failed'}
        </Text>
      )}
      {testResults &&
        testResults.map((result) => {
          const title = result.descriptions
            .concat(result.test.description)
            .join(' / ');
          return (
            <View key={result.test.id} style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Text>{!result.success ? '❌' : '✅'}</Text>
                <Text style={{ fontSize: 16 }}>{title}</Text>
              </View>
              {!result.success && (
                <Text style={{ fontSize: 16, color: 'red' }}>
                  {'' + result.error}
                </Text>
              )}
              {!result.success &&
                typeof result.error === 'object' &&
                result.error &&
                'stack' in result.error && (
                  <View style={{ backgroundColor: '#ddd', padding: 16 }}>
                    <Text style={{ fontFamily: 'monospace' }}>
                      {result.error.stack}
                    </Text>
                  </View>
                )}
            </View>
          );
        })}
    </View>
  );
};
