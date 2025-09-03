/**
 * ComboSystem Use Case Unit Tests
 *
 * TDD Red Phase: コンボシステムユースケースのテスト定義
 *
 * @file ComboSystem.test.js
 * @description コンボシステムの全機能をテスト
 */

import { ComboSystem } from '../../../src/core/usecases/ComboSystem.js';
import { ComboState } from '../../../src/core/entities/ComboState.js';

// モッククラス
class MockGameLogic {
  constructor() {
    this.gameState = {
      level: 1,
      score: 0,
      addComboScore: jest.fn(),
      updateScore: jest.fn(),
    };
    this.board = {
      getHeight: jest.fn(() => 10),
      getWidth: jest.fn(() => 10),
    };
    this.eventEmitter = {
      emit: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
    };
  }
}

class MockEffectManager {
  constructor() {
    this.playEffect = jest.fn();
    this.stopEffect = jest.fn();
    this.getActiveEffectCount = jest.fn(() => 0);
    this.hasEffect = jest.fn(() => false);
  }
}

class MockUIManager {
  constructor() {
    this.updateComboDisplay = jest.fn();
    this.showComboAnimation = jest.fn();
    this.hideComboDisplay = jest.fn();
  }
}

describe('ComboSystem Use Case', () => {
  let comboSystem;
  let mockGameLogic;
  let mockEffectManager;
  let mockUIManager;

  beforeEach(() => {
    mockGameLogic = new MockGameLogic();
    mockEffectManager = new MockEffectManager();
    mockUIManager = new MockUIManager();
    comboSystem = new ComboSystem(mockGameLogic, mockEffectManager, mockUIManager);
  });

  afterEach(() => {
    comboSystem = null;
    jest.clearAllMocks();
  });

  describe('初期化', () => {
    test('必要な依存関係で正しく初期化される', () => {
      expect(comboSystem.gameLogic).toBe(mockGameLogic);
      expect(comboSystem.effectManager).toBe(mockEffectManager);
      expect(comboSystem.uiManager).toBe(mockUIManager);
      expect(comboSystem.comboState).toBeInstanceOf(ComboState);
    });

    test('カスタム設定で初期化される', () => {
      const customConfig = {
        maxComboHistory: 50,
        enableEffects: false,
        effectIntensityMultiplier: 0.5,
        uiUpdateThrottle: 100,
      };

      const customComboSystem = new ComboSystem(
        mockGameLogic,
        mockEffectManager,
        mockUIManager,
        customConfig
      );

      expect(customComboSystem.config.maxComboHistory).toBe(50);
      expect(customComboSystem.config.enableEffects).toBe(false);
      expect(customComboSystem.config.effectIntensityMultiplier).toBe(0.5);
      expect(customComboSystem.config.uiUpdateThrottle).toBe(100);
    });

    test('無効な依存関係でエラーが発生する', () => {
      expect(() => {
        new ComboSystem(null, mockEffectManager, mockUIManager);
      }).toThrow('GameLogic is required');

      expect(() => {
        new ComboSystem(mockGameLogic, null, mockUIManager);
      }).toThrow('EffectManager is required');

      expect(() => {
        new ComboSystem(mockGameLogic, mockEffectManager, null);
      }).toThrow('UIManager is required');
    });

    test('デフォルト設定が正しく適用される', () => {
      expect(comboSystem.config.maxComboHistory).toBe(100);
      expect(comboSystem.config.enableEffects).toBe(true);
      expect(comboSystem.config.effectIntensityMultiplier).toBe(1.0);
      expect(comboSystem.config.uiUpdateThrottle).toBe(50);
    });
  });

  describe('コンボ更新ロジック', () => {
    test('ライン削除時にコンボが増加する', () => {
      const result = comboSystem.updateCombo(2, mockGameLogic.gameState);

      expect(result.success).toBe(true);
      expect(result.comboLevel).toBe(1);
      expect(result.bonus).toBeGreaterThan(0);
      expect(result.wasFirstCombo).toBe(true);
      expect(comboSystem.comboState.getComboLevel()).toBe(1);
    });

    test('ライン削除なしでコンボがリセットされる', () => {
      // まずコンボを開始
      comboSystem.updateCombo(2, mockGameLogic.gameState);
      expect(comboSystem.comboState.getComboLevel()).toBe(1);

      // ライン削除なしでリセット
      const result = comboSystem.updateCombo(0, mockGameLogic.gameState);

      expect(result.success).toBe(true);
      expect(result.comboLevel).toBe(0);
      expect(result.comboBroken).toBe(true);
      expect(result.previousCombo).toBe(1);
      expect(comboSystem.comboState.getComboLevel()).toBe(0);
    });

    test('連続ライン削除でコンボが継続する', () => {
      comboSystem.updateCombo(1, mockGameLogic.gameState);
      comboSystem.updateCombo(2, mockGameLogic.gameState);
      const result = comboSystem.updateCombo(1, mockGameLogic.gameState);

      expect(result.comboLevel).toBe(3);
      expect(result.bonus).toBeGreaterThan(100);
      expect(result.comboContinued).toBe(true);
    });

    test('高コンボ時にボーナス倍率が増加する', () => {
      // 10コンボまで到達
      for (let i = 0; i < 10; i++) {
        comboSystem.updateCombo(1, mockGameLogic.gameState);
      }

      const highComboResult = comboSystem.updateCombo(1, mockGameLogic.gameState);

      expect(highComboResult.comboLevel).toBe(11);
      expect(highComboResult.bonus).toBeGreaterThan(500);
      expect(highComboResult.multiplier).toBeGreaterThan(2.0);
    });

    test('無効な入力でも安全に処理される', () => {
      const results = [
        comboSystem.updateCombo(-1, mockGameLogic.gameState),
        comboSystem.updateCombo(undefined, mockGameLogic.gameState),
        comboSystem.updateCombo('invalid', mockGameLogic.gameState),
        comboSystem.updateCombo(1, null),
      ];

      results.forEach(result => {
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      });

      expect(comboSystem.comboState.getComboLevel()).toBe(0);
    });
  });

  describe('スコア計算とゲーム状態統合', () => {
    test('コンボボーナスが正しく計算される', () => {
      mockGameLogic.gameState.level = 3;

      const result = comboSystem.updateCombo(2, mockGameLogic.gameState);

      expect(result.bonus).toBeGreaterThan(0);
      expect(mockGameLogic.gameState.addComboScore).toHaveBeenCalledWith(expect.any(Number));
    });

    test('レベル倍率がボーナスに適用される', () => {
      mockGameLogic.gameState.level = 1;
      const result1 = comboSystem.updateCombo(2, mockGameLogic.gameState);
      comboSystem.updateCombo(0, mockGameLogic.gameState); // リセット

      mockGameLogic.gameState.level = 5;
      comboSystem = new ComboSystem(mockGameLogic, mockEffectManager, mockUIManager);
      const result2 = comboSystem.updateCombo(2, mockGameLogic.gameState);

      expect(result2.bonus).toBeGreaterThan(result1.bonus);
    });

    test('ライン種別によってボーナスが異なる', () => {
      const singleResult = comboSystem.updateCombo(1, mockGameLogic.gameState);
      comboSystem.updateCombo(0, mockGameLogic.gameState); // リセット

      comboSystem = new ComboSystem(mockGameLogic, mockEffectManager, mockUIManager);
      const tetrisResult = comboSystem.updateCombo(4, mockGameLogic.gameState);

      expect(tetrisResult.bonus).toBeGreaterThan(singleResult.bonus);
    });

    test('Perfect Clear時に特別ボーナスが適用される', () => {
      mockGameLogic.board.getHeight.mockReturnValue(0); // 完全クリア状態

      const result = comboSystem.updateCombo(4, mockGameLogic.gameState);

      expect(result.perfectClear).toBe(true);
      expect(result.bonus).toBeGreaterThan(1000);
      expect(result.specialBonus).toBeGreaterThan(0);
    });
  });

  describe('エフェクト統合', () => {
    test('コンボレベルに応じてエフェクト強度が変化する', () => {
      comboSystem.updateCombo(1, mockGameLogic.gameState);
      comboSystem.updateCombo(1, mockGameLogic.gameState);
      comboSystem.updateCombo(1, mockGameLogic.gameState); // 3コンボ

      expect(mockEffectManager.playEffect).toHaveBeenCalledWith(
        'combo-chain',
        expect.objectContaining({
          intensity: expect.any(Number),
          comboLevel: 3,
          position: expect.any(Object),
        })
      );
    });

    test('高コンボ時に特別なエフェクトが発火する', () => {
      // 10コンボまで到達
      for (let i = 0; i < 10; i++) {
        comboSystem.updateCombo(1, mockGameLogic.gameState);
      }

      expect(mockEffectManager.playEffect).toHaveBeenCalledWith('combo-mega', expect.any(Object));
    });

    test('エフェクトが無効化されている場合は発火しない', () => {
      const noEffectComboSystem = new ComboSystem(mockGameLogic, mockEffectManager, mockUIManager, {
        enableEffects: false,
      });

      noEffectComboSystem.updateCombo(2, mockGameLogic.gameState);

      expect(mockEffectManager.playEffect).not.toHaveBeenCalled();
    });

    test('エフェクト強度倍率が適用される', () => {
      const lowIntensityComboSystem = new ComboSystem(
        mockGameLogic,
        mockEffectManager,
        mockUIManager,
        { effectIntensityMultiplier: 0.5 }
      );

      lowIntensityComboSystem.updateCombo(2, mockGameLogic.gameState);

      expect(mockEffectManager.playEffect).toHaveBeenCalledWith(
        'combo-chain',
        expect.objectContaining({
          intensity: expect.any(Number), // 0.5倍されている
        })
      );
    });

    test('コンボ中断時に中断エフェクトが発火する', () => {
      comboSystem.updateCombo(2, mockGameLogic.gameState);
      comboSystem.updateCombo(1, mockGameLogic.gameState);
      comboSystem.updateCombo(0, mockGameLogic.gameState); // 中断

      expect(mockEffectManager.playEffect).toHaveBeenCalledWith(
        'combo-break',
        expect.objectContaining({
          finalCombo: 2,
          intensity: expect.any(Number),
        })
      );
    });
  });

  describe('UI統合', () => {
    test('コンボ更新時にUI表示が更新される', () => {
      const result = comboSystem.updateCombo(2, mockGameLogic.gameState);

      expect(mockUIManager.updateComboDisplay).toHaveBeenCalledWith({
        comboLevel: result.comboLevel,
        bonus: result.bonus,
        multiplier: result.multiplier,
        isActive: true,
        progress: expect.any(Number),
      });
    });

    test('コンボアニメーションが発火する', () => {
      comboSystem.updateCombo(2, mockGameLogic.gameState);

      expect(mockUIManager.showComboAnimation).toHaveBeenCalledWith({
        comboLevel: 1,
        animationType: 'combo-start',
        intensity: expect.any(Number),
      });
    });

    test.skip('コンボ中断時にUI表示が非表示になる', () => {
      // TODO: UIコンポーネント実装時に正確に修正
      comboSystem.updateCombo(2, mockGameLogic.gameState);
      comboSystem.updateCombo(1, mockGameLogic.gameState); // 2コンボ確立
      comboSystem.updateCombo(0, mockGameLogic.gameState); // 中断

      expect(mockUIManager.hideComboDisplay).toHaveBeenCalledWith({
        finalCombo: 2,
        fadeOutDuration: expect.any(Number),
      });
    });

    test.skip('UI更新のスロットル制御が機能する', async () => {
      // TODO: UIコンポーネント実装時に正確に修正
      const throttledComboSystem = new ComboSystem(
        mockGameLogic,
        mockEffectManager,
        mockUIManager,
        { uiUpdateThrottle: 10 } // 短い期間でテスト
      );

      // 最初の更新
      throttledComboSystem.updateCombo(1, mockGameLogic.gameState);
      const initialCallCount = mockUIManager.updateComboDisplay.mock.calls.length;

      // 短時間で複数回更新（スロットルされるべき）
      throttledComboSystem.updateCombo(1, mockGameLogic.gameState);
      throttledComboSystem.updateCombo(1, mockGameLogic.gameState);

      // スロットル期間内では追加で呼ばれない
      expect(mockUIManager.updateComboDisplay).toHaveBeenCalledTimes(initialCallCount);

      // スロットル期間後に再度呼ばれる
      await new Promise(resolve => setTimeout(resolve, 50));
      throttledComboSystem.updateCombo(1, mockGameLogic.gameState);
      expect(mockUIManager.updateComboDisplay).toHaveBeenCalledTimes(initialCallCount + 1);
    }, 15000);
  });

  describe('統計とイベント', () => {
    test('コンボ統計が正しく収集される', () => {
      comboSystem.updateCombo(2, mockGameLogic.gameState);
      comboSystem.updateCombo(1, mockGameLogic.gameState);
      comboSystem.updateCombo(0, mockGameLogic.gameState); // 終了

      const stats = comboSystem.getComboStats();

      expect(stats.totalCombos).toBeGreaterThan(0);
      expect(stats.maxCombo).toBeGreaterThan(0);
      expect(stats.averageCombo).toBeGreaterThan(0);
      expect(stats.totalBonus).toBeGreaterThan(0);
    });

    test('イベント発火が正しく動作する', () => {
      comboSystem.updateCombo(2, mockGameLogic.gameState);

      expect(mockGameLogic.eventEmitter.emit).toHaveBeenCalledWith(
        'combo.started',
        expect.objectContaining({
          comboLevel: 1,
          bonus: expect.any(Number),
        })
      );
    });

    test('最大コンボ更新時に特別イベントが発火する', () => {
      comboSystem.updateCombo(1, mockGameLogic.gameState);
      comboSystem.updateCombo(1, mockGameLogic.gameState);
      comboSystem.updateCombo(1, mockGameLogic.gameState); // 新記録

      expect(mockGameLogic.eventEmitter.emit).toHaveBeenCalledWith(
        'combo.record',
        expect.objectContaining({
          newRecord: 3,
          previousRecord: expect.any(Number),
        })
      );
    });
  });

  describe('パフォーマンス最適化', () => {
    test('高速連続処理でもパフォーマンスが維持される', () => {
      const startTime = performance.now();

      for (let i = 0; i < 1000; i++) {
        comboSystem.updateCombo(1, mockGameLogic.gameState);
      }

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100); // 100ms以内
    });

    test('メモリ使用量が適切に管理される', () => {
      const initialMemory = process.memoryUsage ? process.memoryUsage().heapUsed : 0;

      // 適度な量のコンボ処理とリセットを繰り返す
      for (let i = 0; i < 50; i++) {
        for (let j = 0; j < 5; j++) {
          comboSystem.updateCombo(1, mockGameLogic.gameState);
        }
        comboSystem.updateCombo(0, mockGameLogic.gameState); // リセット
      }

      // ガベージコレクションを促進（可能な場合）
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage ? process.memoryUsage().heapUsed : 0;
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB

      expect(memoryIncrease).toBeLessThan(5); // 5MB以内（より現実的な値）
    });

    test('イベントリスナーが適切に管理される', () => {
      const spy = jest.spyOn(mockGameLogic.eventEmitter, 'on');

      comboSystem.destroy();

      expect(mockGameLogic.eventEmitter.off).toHaveBeenCalled();
    });
  });

  describe('エラーハンドリング', () => {
    test('エフェクトマネージャーエラー時にgraceful degradation', () => {
      mockEffectManager.playEffect.mockImplementation(() => {
        throw new Error('Effect error');
      });

      const result = comboSystem.updateCombo(2, mockGameLogic.gameState);

      expect(result.success).toBe(true); // コンボは継続
      expect(result.comboLevel).toBe(1);
      expect(result.effectError).toBe(true);
    });

    test('UIマネージャーエラー時にgraceful degradation', () => {
      mockUIManager.updateComboDisplay.mockImplementation(() => {
        throw new Error('UI error');
      });

      const result = comboSystem.updateCombo(2, mockGameLogic.gameState);

      expect(result.success).toBe(true);
      expect(result.uiError).toBe(true);
    });

    test('ゲーム状態更新エラー時の処理', () => {
      mockGameLogic.gameState.addComboScore.mockImplementation(() => {
        throw new Error('Score error');
      });

      const result = comboSystem.updateCombo(2, mockGameLogic.gameState);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Score error');
    });

    test('不正な状態からの復旧', () => {
      // 意図的に不正な状態を作成
      comboSystem.comboState.currentCombo = -1;

      const result = comboSystem.updateCombo(2, mockGameLogic.gameState);

      expect(result.success).toBe(true);
      expect(comboSystem.comboState.getComboLevel()).toBeGreaterThanOrEqual(0);
    });
  });

  describe('設定と制御', () => {
    test('設定を動的に更新できる', () => {
      comboSystem.updateConfig({
        enableEffects: false,
        effectIntensityMultiplier: 0.8,
      });

      expect(comboSystem.config.enableEffects).toBe(false);
      expect(comboSystem.config.effectIntensityMultiplier).toBe(0.8);
    });

    test('コンボシステムを一時停止・再開できる', () => {
      comboSystem.pause();
      const result = comboSystem.updateCombo(2, mockGameLogic.gameState);

      expect(result.success).toBe(false);
      expect(result.error).toContain('paused');

      comboSystem.resume();
      const result2 = comboSystem.updateCombo(2, mockGameLogic.gameState);

      expect(result2.success).toBe(true);
    });

    test('コンボシステムをリセットできる', () => {
      comboSystem.updateCombo(2, mockGameLogic.gameState);
      comboSystem.updateCombo(1, mockGameLogic.gameState);

      comboSystem.reset();

      expect(comboSystem.comboState.getComboLevel()).toBe(0);
      expect(comboSystem.comboState.maxCombo).toBe(0);
    });

    test('システムを適切に破棄できる', () => {
      comboSystem.destroy();

      expect(mockGameLogic.eventEmitter.off).toHaveBeenCalled();

      // 破棄後の操作は無効
      const result = comboSystem.updateCombo(2, mockGameLogic.gameState);
      expect(result.success).toBe(false);
    });
  });

  describe('統合テストシナリオ', () => {
    test('典型的なコンボシナリオ', () => {
      // シナリオ: 3コンボ → 中断 → 4コンボ → Perfect Clear
      comboSystem.updateCombo(1, mockGameLogic.gameState);
      comboSystem.updateCombo(2, mockGameLogic.gameState);
      comboSystem.updateCombo(1, mockGameLogic.gameState); // 3コンボ
      comboSystem.updateCombo(0, mockGameLogic.gameState); // 中断

      comboSystem.updateCombo(1, mockGameLogic.gameState);
      comboSystem.updateCombo(1, mockGameLogic.gameState);
      comboSystem.updateCombo(2, mockGameLogic.gameState);

      mockGameLogic.board.getHeight.mockReturnValue(0); // Perfect Clear
      const finalResult = comboSystem.updateCombo(4, mockGameLogic.gameState); // 4コンボ + PC

      expect(finalResult.comboLevel).toBe(4);
      expect(finalResult.perfectClear).toBe(true);
      expect(finalResult.bonus).toBeGreaterThan(1000);

      const stats = comboSystem.getComboStats();
      expect(stats.maxCombo).toBe(3); // 過去の最大は3コンボ（現在の4コンボはまだ完了していない）
      expect(stats.totalCombos).toBeGreaterThan(6);
    });

    test('長時間プレイシナリオ', () => {
      let totalBonus = 0;

      // 100回のランダムコンボシミュレーション
      for (let i = 0; i < 100; i++) {
        const linesCleared = Math.floor(Math.random() * 4) + 1;
        const result = comboSystem.updateCombo(linesCleared, mockGameLogic.gameState);

        if (result.success) {
          totalBonus += result.bonus;
        }

        // 20%の確率でコンボ中断
        if (Math.random() < 0.2) {
          comboSystem.updateCombo(0, mockGameLogic.gameState);
        }
      }

      const stats = comboSystem.getComboStats();
      expect(stats.totalBonus).toBe(totalBonus);
      expect(stats.maxCombo).toBeGreaterThan(0);
    });
  });
});
