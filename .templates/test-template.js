/**
 * {{ClassName}}.test.js - {{ClassDescription}}のユニットテスト
 * 
 * @{{TestAgent}} との協力実装
 * TDDアプローチ: RED -> GREEN -> REFACTOR
 */

import {{ClassName}} from '{{ImportPath}}';
import { TimerTestHelper, MockEventHelper, PerformanceTestHelper, AssertionHelper } from '{{TestHelpersPath}}';

describe('{{ClassName}}', () => {
  let {{instanceName}};
  let mockOptions;

  beforeEach(() => {
    TimerTestHelper.setup();
    
    mockOptions = {
      // モックオプション設定
    };
    
    {{instanceName}} = new {{ClassName}}(mockOptions);
  });

  afterEach(() => {
    if ({{instanceName}}) {
      {{instanceName}}.destroy();
    }
    TimerTestHelper.teardown();
  });

  describe('初期化', () => {
    test('{{ClassName}}が正しく初期化される', () => {
      expect({{instanceName}}).toBeDefined();
      expect({{instanceName}}).toBeInstanceOf({{ClassName}});
    });

    test('デフォルトオプションで初期化される', () => {
      const defaultInstance = new {{ClassName}}();
      expect(defaultInstance).toBeDefined();
      defaultInstance.destroy();
    });

    test('無効なオプションでエラーが発生する', () => {
      expect(() => {
        new {{ClassName}}(null);
      }).toThrow('Options must be an object');
    });
  });

  describe('基本機能', () => {
    test('{{publicMethod1}}が正常に動作する', () => {
      const testParam = '{{testValue}}';
      const result = {{instanceName}}.{{publicMethod1}}(testParam);
      
      expect(result).toBeDefined();
      // 具体的なアサーション
    });

    test('無効な入力でエラーが発生する', () => {
      expect(() => {
        {{instanceName}}.{{publicMethod1}}(null);
      }).toThrow('Invalid input parameter');
    });

    test('{{publicMethod1}}の戻り値が正しい', () => {
      const testParam = '{{testValue}}';
      const result = {{instanceName}}.{{publicMethod1}}(testParam);
      
      expect(result).toEqual(expect.objectContaining({
        // 期待される戻り値の構造
      }));
    });
  });

  describe('状態管理', () => {
    test('状態が適切に更新される', () => {
      const initialState = {{instanceName}}.getState?.() || {};
      
      {{instanceName}}.{{publicMethod1}}('{{testValue}}');
      
      const updatedState = {{instanceName}}.getState?.() || {};
      expect(updatedState).not.toEqual(initialState);
    });

    test('状態リセットが正常に動作する', () => {
      {{instanceName}}.{{publicMethod1}}('{{testValue}}');
      {{instanceName}}.reset?.();
      
      const state = {{instanceName}}.getState?.() || {};
      expect(state).toEqual(expect.objectContaining({
        // リセット後の期待状態
      }));
    });
  });

  describe('エラーハンドリング', () => {
    test('null入力が安全に処理される', () => {
      expect(() => {
        {{instanceName}}.{{publicMethod1}}(null);
      }).toThrow();
    });

    test('undefined入力が安全に処理される', () => {
      expect(() => {
        {{instanceName}}.{{publicMethod1}}(undefined);
      }).toThrow();
    });

    test('エラー発生時のログ出力', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // エラーを発生させる条件
      try {
        {{instanceName}}.{{publicMethod1}}(null);
      } catch (error) {
        // エラーは期待されるので無視
      }
      
      // 開発環境でのみログ出力されることを確認
      if (process.env.NODE_ENV === 'development') {
        expect(consoleSpy).toHaveBeenCalled();
      }
      
      consoleSpy.mockRestore();
    });
  });

  describe('パフォーマンス', () => {
    test('{{publicMethod1}}が効率的に実行される', () => {
      const testParam = '{{testValue}}';
      
      AssertionHelper.expectExecutionTimeLessThan(
        () => {{instanceName}}.{{publicMethod1}}(testParam),
        10 // 10ms以内
      );
    });

    test('大量処理が効率的に実行される', () => {
      const benchmark = PerformanceTestHelper.benchmarkFunction(
        (param) => {{instanceName}}.{{publicMethod1}}(param),
        100, // 100回実行
        '{{testValue}}'
      );
      
      expect(benchmark.averageTime).toBeLessThan(5); // 平均5ms以内
      expect(benchmark.timesPerSecond).toBeGreaterThan(100); // 100回/秒以上
    });

    test('メモリリークが発生しない', () => {
      const initialMemory = PerformanceTestHelper.measureMemoryUsage();
      
      // 大量の操作実行
      for (let i = 0; i < 1000; i++) {
        {{instanceName}}.{{publicMethod1}}(`test-${i}`);
      }
      
      // ガベージコレクション実行（Nodeの場合）
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = PerformanceTestHelper.measureMemoryUsage();
      
      if (initialMemory && finalMemory) {
        const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
        expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024); // 10MB以内
      }
    });
  });

  describe('イベント処理', () => {
    test('イベントリスナーが正しく登録される', () => {
      // イベントリスナー関連のテスト
      expect({{instanceName}}.eventListeners?.size || 0).toBeGreaterThan(0);
    });

    test('イベントが正しく処理される', () => {
      const mockEvent = MockEventHelper.createKeyboardEvent('keydown', 'Enter');
      
      // イベント処理テスト
      expect(() => {
        {{instanceName}}.handleEvent?.(mockEvent);
      }).not.toThrow();
    });
  });

  describe('リソース管理', () => {
    test('destroyでリソースが適切に解放される', () => {
      {{instanceName}}.destroy();
      
      // リソース解放の確認
      expect({{instanceName}}.state).toBeNull();
    });

    test('重複destroyが安全に処理される', () => {
      {{instanceName}}.destroy();
      
      expect(() => {
        {{instanceName}}.destroy();
      }).not.toThrow();
    });
  });

  describe('統合テスト', () => {
    test('複数の操作が連続して正常に動作する', () => {
      const operations = [
        () => {{instanceName}}.{{publicMethod1}}('test1'),
        () => {{instanceName}}.{{publicMethod1}}('test2'),
        () => {{instanceName}}.{{publicMethod1}}('test3')
      ];
      
      expect(() => {
        operations.forEach(op => op());
      }).not.toThrow();
    });

    test('大量の連続操作が安定して動作する', () => {
      expect(() => {
        for (let i = 0; i < 1000; i++) {
          {{instanceName}}.{{publicMethod1}}(`test-${i}`);
        }
      }).not.toThrow();
    });
  });

  describe('境界値テスト', () => {
    test('空文字列の処理', () => {
      expect(() => {
        {{instanceName}}.{{publicMethod1}}('');
      }).not.toThrow();
    });

    test('非常に長い文字列の処理', () => {
      const longString = 'a'.repeat(10000);
      
      expect(() => {
        {{instanceName}}.{{publicMethod1}}(longString);
      }).not.toThrow();
    });

    test('特殊文字の処理', () => {
      const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      
      expect(() => {
        {{instanceName}}.{{publicMethod1}}(specialChars);
      }).not.toThrow();
    });
  });
});
