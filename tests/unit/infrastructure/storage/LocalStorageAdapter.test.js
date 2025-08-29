/**
 * LocalStorageAdapter.test.js - ローカルストレージ管理システムのユニットテスト
 *
 * @tdd-development-expert との協力実装
 * TDDアプローチ: RED -> GREEN -> REFACTOR
 */

import LocalStorageAdapter from '../../../../src/infrastructure/storage/LocalStorageAdapter.js';
import { DOMTestHelper } from '../../../utils/test-helpers.js';

describe('LocalStorageAdapter', () => {
  let localStorageAdapter;
  let mockLocalStorage;

  beforeEach(() => {
    // ローカルストレージモック設定
    DOMTestHelper.setupLocalStorageMock();
    mockLocalStorage = global.localStorage;

    localStorageAdapter = new LocalStorageAdapter();
  });

  afterEach(() => {
    if (localStorageAdapter) {
      localStorageAdapter.destroy();
    }
    // モッククリーンアップ
    mockLocalStorage.clear();
  });

  describe('初期化', () => {
    test('LocalStorageAdapterが正しく初期化される', () => {
      expect(localStorageAdapter).toBeDefined();
      expect(localStorageAdapter).toBeInstanceOf(LocalStorageAdapter);
    });

    test('デフォルト設定が正しく読み込まれる', () => {
      const config = localStorageAdapter.getConfig();
      expect(config).toBeDefined();
      expect(config.version).toBe('1.0.0');
    });
  });

  describe('高スコア管理', () => {
    test('高スコアが正しく保存される', () => {
      const highScore = {
        score: 15000,
        level: 5,
        lines: 25,
        timestamp: Date.now(),
        player: 'Player1',
      };

      localStorageAdapter.saveHighScore(highScore);

      const savedScore = localStorageAdapter.getHighScore();
      expect(savedScore).toEqual(highScore);
    });

    test('複数の高スコアが管理される', () => {
      const scores = [
        { score: 20000, level: 8, lines: 30, timestamp: Date.now(), player: 'Player1' },
        { score: 15000, level: 5, lines: 25, timestamp: Date.now(), player: 'Player2' },
        { score: 10000, level: 3, lines: 20, timestamp: Date.now(), player: 'Player3' },
      ];

      scores.forEach(score => {
        localStorageAdapter.saveHighScore(score);
      });

      const topScores = localStorageAdapter.getTopScores(3);
      expect(topScores).toHaveLength(3);
      expect(topScores[0].score).toBe(20000); // 最高スコアが最初
    });

    test('高スコアがスコア順でソートされる', () => {
      const scores = [
        { score: 5000, level: 2, lines: 15, timestamp: Date.now(), player: 'Player3' },
        { score: 15000, level: 5, lines: 25, timestamp: Date.now(), player: 'Player2' },
        { score: 25000, level: 10, lines: 40, timestamp: Date.now(), player: 'Player1' },
      ];

      scores.forEach(score => {
        localStorageAdapter.saveHighScore(score);
      });

      const topScores = localStorageAdapter.getTopScores(5);
      expect(topScores[0].score).toBe(25000);
      expect(topScores[1].score).toBe(15000);
      expect(topScores[2].score).toBe(5000);
    });

    test('最大保存数を制限する', () => {
      const maxScores = 10;

      // 11個のスコアを保存
      for (let i = 0; i < 11; i++) {
        localStorageAdapter.saveHighScore({
          score: 1000 + i,
          level: 1,
          lines: 10 + i,
          timestamp: Date.now(),
          player: `Player${i}`,
        });
      }

      const topScores = localStorageAdapter.getTopScores(20);
      expect(topScores).toHaveLength(maxScores);
      expect(topScores[0].score).toBe(1010); // 最高スコアが残る
    });
  });

  describe('設定管理', () => {
    test('ゲーム設定が正しく保存される', () => {
      const gameConfig = {
        difficulty: 'normal',
        soundEnabled: true,
        musicVolume: 0.8,
        sfxVolume: 0.6,
        keyBindings: {
          moveLeft: 'ArrowLeft',
          moveRight: 'ArrowRight',
          moveDown: 'ArrowDown',
          rotate: 'ArrowUp',
          hardDrop: 'Space',
        },
      };

      localStorageAdapter.saveGameConfig(gameConfig);

      const savedConfig = localStorageAdapter.getGameConfig();
      expect(savedConfig).toEqual(gameConfig);
    });

    test('設定の部分更新が可能', () => {
      // 初期設定保存
      const initialConfig = {
        difficulty: 'easy',
        soundEnabled: true,
        musicVolume: 0.5,
      };
      localStorageAdapter.saveGameConfig(initialConfig);

      // 部分更新
      localStorageAdapter.updateGameConfig({ difficulty: 'hard' });

      const updatedConfig = localStorageAdapter.getGameConfig();
      expect(updatedConfig.difficulty).toBe('hard');
      expect(updatedConfig.soundEnabled).toBe(true); // 保持される
      expect(updatedConfig.musicVolume).toBe(0.5); // 保持される
    });

    test('デフォルト設定が適用される', () => {
      const config = localStorageAdapter.getGameConfig();

      expect(config.difficulty).toBe('normal');
      expect(config.soundEnabled).toBe(true);
      expect(config.musicVolume).toBe(0.7);
      expect(config.sfxVolume).toBe(0.8);
    });
  });

  describe('データ検証', () => {
    test('無効なスコアデータが拒否される', () => {
      const invalidScores = [
        { score: -1000, level: 5, lines: 25, timestamp: Date.now(), player: 'Player1' },
        { score: 15000, level: -2, lines: 25, timestamp: Date.now(), player: 'Player1' },
        { score: 15000, level: 5, lines: -5, timestamp: Date.now(), player: 'Player1' },
        { score: 15000, level: 5, lines: 25, timestamp: 'invalid-date', player: 'Player1' },
        { score: 15000, level: 5, lines: 25, timestamp: Date.now(), player: '' },
      ];

      invalidScores.forEach(invalidScore => {
        expect(() => {
          localStorageAdapter.saveHighScore(invalidScore);
        }).toThrow('Invalid score data');
      });
    });

    test('無効な設定データが拒否される', () => {
      const invalidConfigs = [
        { difficulty: 'invalid-difficulty' },
        { musicVolume: 1.5 }, // 0-1の範囲外
        { sfxVolume: -0.1 }, // 0-1の範囲外
        { keyBindings: 'not-an-object' },
      ];

      invalidConfigs.forEach(invalidConfig => {
        expect(() => {
          localStorageAdapter.saveGameConfig(invalidConfig);
        }).toThrow('Invalid config data');
      });
    });

    test('破損データの自動修復', () => {
      // 破損データを直接localStorageに設定
      mockLocalStorage.setItem('tetris-high-scores', 'invalid-json');

      // 新しいインスタンスで修復を試行
      const newAdapter = new LocalStorageAdapter();

      // デフォルト値が返される
      const scores = newAdapter.getTopScores(5);
      expect(scores).toEqual([]);

      newAdapter.destroy();
    });
  });

  describe('エラーハンドリング', () => {
    test('localStorageが利用できない場合の処理', () => {
      // localStorageを無効化
      const originalLocalStorage = global.localStorage;
      global.localStorage = null;

      expect(() => {
        new LocalStorageAdapter();
      }).not.toThrow();

      // 復元
      global.localStorage = originalLocalStorage;
    });

    test('ストレージ容量不足時の処理', () => {
      // 容量不足をシミュレート
      const originalSetItem = mockLocalStorage.setItem;
      mockLocalStorage.setItem = jest.fn(() => {
        throw new Error('QuotaExceededError');
      });

      expect(() => {
        localStorageAdapter.saveHighScore({
          score: 15000,
          level: 5,
          lines: 25,
          timestamp: Date.now(),
          player: 'Player1',
        });
      }).not.toThrow();

      // 復元
      mockLocalStorage.setItem = originalSetItem;
    });

    test('データ読み込みエラーの処理', () => {
      // 読み込みエラーをシミュレート
      const originalGetItem = mockLocalStorage.getItem;
      mockLocalStorage.getItem = jest.fn(() => {
        throw new Error('SecurityError');
      });

      const config = localStorageAdapter.getGameConfig();
      expect(config).toBeDefined(); // デフォルト値が返される

      // 復元
      mockLocalStorage.getItem = originalGetItem;
    });
  });

  describe('データ管理', () => {
    test('全データのクリア', () => {
      // テストデータを保存
      localStorageAdapter.saveHighScore({
        score: 15000,
        level: 5,
        lines: 25,
        timestamp: Date.now(),
        player: 'Player1',
      });

      localStorageAdapter.saveGameConfig({
        difficulty: 'hard',
        soundEnabled: false,
      });

      // データクリア
      localStorageAdapter.clearAllData();

      const scores = localStorageAdapter.getTopScores(5);
      const config = localStorageAdapter.getGameConfig();

      expect(scores).toEqual([]);
      expect(config.difficulty).toBe('normal'); // デフォルト値
    });

    test('特定データの削除', () => {
      // 複数のスコアを保存
      const scores = [
        { score: 20000, level: 8, lines: 30, timestamp: Date.now(), player: 'Player1' },
        { score: 15000, level: 5, lines: 25, timestamp: Date.now(), player: 'Player2' },
      ];

      scores.forEach(score => {
        localStorageAdapter.saveHighScore(score);
      });

      // 特定のスコアを削除
      localStorageAdapter.removeHighScore(15000);

      const remainingScores = localStorageAdapter.getTopScores(5);
      expect(remainingScores).toHaveLength(1);
      expect(remainingScores[0].score).toBe(20000);
    });

    test('データエクスポート・インポート', () => {
      // テストデータを保存
      const testData = {
        highScores: [
          { score: 15000, level: 5, lines: 25, timestamp: Date.now(), player: 'Player1' },
        ],
        gameConfig: {
          difficulty: 'hard',
          soundEnabled: false,
        },
      };

      localStorageAdapter.saveHighScore(testData.highScores[0]);
      localStorageAdapter.saveGameConfig(testData.gameConfig);

      // エクスポート
      const exportedData = localStorageAdapter.exportData();
      expect(exportedData).toHaveProperty('highScores');
      expect(exportedData).toHaveProperty('gameConfig');
      expect(exportedData).toHaveProperty('exportDate');

      // データクリア
      localStorageAdapter.clearAllData();

      // インポート
      localStorageAdapter.importData(exportedData);

      const importedScores = localStorageAdapter.getTopScores(5);
      const importedConfig = localStorageAdapter.getGameConfig();

      expect(importedScores).toHaveLength(1);
      expect(importedConfig.difficulty).toBe('hard');
    });
  });

  describe('パフォーマンス', () => {
    test('大量データの効率的処理', () => {
      const startTime = performance.now();

      // 1000個のスコアを保存
      for (let i = 0; i < 1000; i++) {
        localStorageAdapter.saveHighScore({
          score: 1000 + i,
          level: Math.floor(i / 100) + 1,
          lines: 10 + i,
          timestamp: Date.now() + i,
          player: `Player${i % 10}`,
        });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000); // 1秒以内
    });

    test('データ読み込みの効率性', () => {
      // 大量データを準備
      for (let i = 0; i < 500; i++) {
        localStorageAdapter.saveHighScore({
          score: 1000 + i,
          level: Math.floor(i / 100) + 1,
          lines: 10 + i,
          timestamp: Date.now() + i,
          player: `Player${i % 10}`,
        });
      }

      const startTime = performance.now();

      // 複数回の読み込み
      for (let i = 0; i < 100; i++) {
        localStorageAdapter.getTopScores(10);
        localStorageAdapter.getGameConfig();
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(500); // 500ms以内
    });
  });

  describe('リソース管理', () => {
    test('destroyでリソースが適切に解放される', () => {
      localStorageAdapter.destroy();

      // 破棄後の操作でエラーが発生しない
      expect(() => {
        localStorageAdapter.getGameConfig();
      }).not.toThrow();
    });

    test('重複destroyが安全に処理される', () => {
      localStorageAdapter.destroy();

      expect(() => {
        localStorageAdapter.destroy();
      }).not.toThrow();
    });
  });
});
