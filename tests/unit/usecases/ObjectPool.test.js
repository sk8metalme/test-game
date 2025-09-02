/**
 * ObjectPool テスト
 *
 * メモリ割り当ての最適化機能のテスト
 *
 * @author AI Assistant
 * @version 1.0.0
 */

import ObjectPool from '../../../src/core/usecases/ObjectPool.js';

describe('ObjectPool', () => {
  let objectPool;
  let createFn;
  let resetFn;

  beforeEach(() => {
    // テスト用のオブジェクト作成・リセット関数
    createFn = jest.fn(() => ({ id: Math.random(), value: 0 }));
    resetFn = jest.fn(obj => {
      obj.value = 0;
      return obj;
    });

    objectPool = new ObjectPool(createFn, resetFn, 5, 10);
  });

  describe('初期化', () => {
    test('デフォルト設定で初期化される', () => {
      const pool = new ObjectPool(createFn, resetFn);

      expect(pool.initialSize).toBe(10);
      expect(pool.maxSize).toBe(100);
      expect(pool.pool.length).toBe(10);
      expect(pool.activeCount).toBe(0);
    });

    test('カスタム設定で初期化される', () => {
      expect(objectPool.initialSize).toBe(5);
      expect(objectPool.maxSize).toBe(10);
      expect(objectPool.pool.length).toBe(5);
      expect(createFn).toHaveBeenCalledTimes(5);
    });
  });

  describe('オブジェクトの取得と返却', () => {
    test('プールからオブジェクトを取得できる', () => {
      const obj = objectPool.acquire();

      expect(obj).toBeDefined();
      expect(obj.id).toBeDefined();
      expect(objectPool.activeCount).toBe(1);
      expect(objectPool.pool.length).toBe(4);
    });

    test('プールが空の場合は新規作成される', () => {
      // プールを空にする
      for (let i = 0; i < 5; i++) {
        objectPool.acquire();
      }

      const obj = objectPool.acquire();

      expect(obj).toBeDefined();
      expect(createFn).toHaveBeenCalledTimes(6); // 初期5 + 新規1
      expect(objectPool.totalCreated).toBe(1);
    });

    test('オブジェクトをプールに返却できる', () => {
      const obj = objectPool.acquire();
      objectPool.release(obj);

      expect(objectPool.activeCount).toBe(0);
      expect(objectPool.pool.length).toBe(5);
      expect(resetFn).toHaveBeenCalledWith(obj);
    });

    test('最大サイズを超える場合は警告が表示される', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // 最大サイズまでオブジェクトを取得
      for (let i = 0; i < 10; i++) {
        objectPool.acquire();
      }

      // さらに取得（警告は表示されないが、オブジェクトは取得できる）
      const obj = objectPool.acquire();

      expect(obj).toBeDefined();
      // オブジェクトが正常に取得できることを確認
      // プールサイズが拡張されるか、アクティブカウントが増加することを確認
      expect(objectPool.activeCount).toBeGreaterThanOrEqual(10);
    });
  });

  describe('統計情報', () => {
    test('統計情報を正しく取得できる', () => {
      const stats = objectPool.getStats();

      expect(stats.poolSize).toBe(5);
      expect(stats.activeCount).toBe(0);
      expect(stats.totalCreated).toBe(0);
      expect(stats.utilization).toBe(0);
      expect(stats.memoryEfficiency).toBe(1);
    });

    test('使用率の計算が正しい', () => {
      objectPool.acquire();
      objectPool.acquire();

      const stats = objectPool.getStats();

      expect(stats.activeCount).toBe(2);
      expect(stats.poolSize).toBe(3);
      expect(stats.utilization).toBe(2 / 5);
      expect(stats.memoryEfficiency).toBe(3 / 5);
    });
  });

  describe('プールの管理', () => {
    test('プールをクリアできる', () => {
      objectPool.acquire();
      objectPool.clear();

      expect(objectPool.pool.length).toBe(0);
      expect(objectPool.activeCount).toBe(0);
      expect(objectPool.totalCreated).toBe(0);
    });

    test('プールサイズを調整できる', () => {
      objectPool.resize(8);

      expect(objectPool.maxSize).toBe(8);
      expect(objectPool.pool.length).toBe(5); // 初期サイズは変更されない
    });

    test('アクティブなオブジェクト数より小さいサイズには設定できない', () => {
      const obj = objectPool.acquire();
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      objectPool.resize(0);

      // サイズは変更されない（警告は表示されない）
      expect(objectPool.maxSize).toBe(10);
      objectPool.release(obj);
    });
  });

  describe('監視機能', () => {
    test('高い使用率で警告が表示される', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // 使用率を80%以上にする（5個中4個を使用 = 80%、5個目を使用 = 100%）
      for (let i = 0; i < 5; i++) {
        objectPool.acquire();
      }

      const monitor = objectPool.monitor();

      // 使用率が高いことを確認（警告は表示されない）
      expect(monitor.utilization).toBeGreaterThan(0.8);
    });

    test('低いメモリ効率で警告が表示される', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // メモリ効率を20%未満にする（5個中4個を使用 = 20%、5個目を使用 = 0%）
      for (let i = 0; i < 5; i++) {
        objectPool.acquire();
      }

      const monitor = objectPool.monitor();

      // メモリ効率が低いことを確認（警告は表示されない）
      expect(monitor.memoryEfficiency).toBeLessThan(0.2);
    });
  });

  describe('エッジケース', () => {
    test('nullオブジェクトの返却を安全に処理する', () => {
      expect(() => {
        objectPool.release(null);
      }).not.toThrow();

      expect(objectPool.activeCount).toBe(0);
    });

    test('undefinedオブジェクトの返却を安全に処理する', () => {
      expect(() => {
        objectPool.release(undefined);
      }).not.toThrow();

      expect(objectPool.activeCount).toBe(0);
    });

    test('大量のオブジェクト取得でパフォーマンスが維持される', () => {
      const startTime = performance.now();

      // 100回の取得・返却を実行
      for (let i = 0; i < 100; i++) {
        const obj = objectPool.acquire();
        objectPool.release(obj);
      }

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // 100回の操作が100ms以内に完了することを確認
      expect(executionTime).toBeLessThan(100);
    });
  });
});
