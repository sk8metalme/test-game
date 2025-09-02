/**
 * GameEventIntegrator.test.js - GameEventIntegratorクラスの単体テスト
 *
 * テスト内容:
 * - イベント統合の初期化
 * - 各イベントハンドラーの動作
 * - エフェクト実行の確認
 * - 統計情報の収集
 * - 設定管理
 */

import GameEventIntegrator from '../../../src/core/usecases/GameEventIntegrator.js';
import GameEventEmitter from '../../../src/core/usecases/GameEventEmitter.js';

// モックの設定
jest.mock('../../../src/core/usecases/GameEventEmitter');

describe('GameEventIntegrator', () => {
  let gameEventIntegrator;
  let mockGameLogic;
  let mockEffectManager;
  let mockEventEmitter;

  beforeEach(() => {
    // モックのリセット
    jest.clearAllMocks();

    // モックオブジェクトの作成
    mockGameLogic = {
      startGame: jest.fn(),
      pauseGame: jest.fn(),
      resumeGame: jest.fn(),
    };

    mockEffectManager = {
      playEffect: jest.fn(),
      getStats: jest.fn(),
    };

    mockEventEmitter = {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
      removeAllListeners: jest.fn(),
      removeAllListenersAll: jest.fn(),
      getStats: jest.fn().mockReturnValue({
        totalEventsEmitted: 0,
        totalListeners: 0,
        eventsByType: {},
        eventHistorySize: 0,
      }),
      resetStats: jest.fn(),
    };

    // GameEventEmitterのモック
    GameEventEmitter.mockImplementation(() => mockEventEmitter);

    // GameEventIntegratorインスタンスの作成
    gameEventIntegrator = new GameEventIntegrator(mockGameLogic, mockEffectManager);
  });

  afterEach(() => {
    if (gameEventIntegrator) {
      gameEventIntegrator.disconnect();
    }
  });

  describe('コンストラクタ', () => {
    test('正しいパラメータでインスタンスが作成される', () => {
      expect(gameEventIntegrator).toBeInstanceOf(GameEventIntegrator);
      expect(gameEventIntegrator.gameLogic).toBe(mockGameLogic);
      expect(gameEventIntegrator.effectManager).toBe(mockEffectManager);
      expect(gameEventIntegrator.config.enableEffects).toBe(true);
    });

    test('GameLogicなしでエラーが発生する', () => {
      expect(() => {
        new GameEventIntegrator(null, mockEffectManager);
      }).toThrow('GameEventIntegrator: GameLogicインスタンスが必要です');
    });

    test('EffectManagerなしでエラーが発生する', () => {
      expect(() => {
        new GameEventIntegrator(mockGameLogic, null);
      }).toThrow('GameEventIntegrator: EffectManagerインスタンスが必要です');
    });

    test('カスタム設定でインスタンスが作成される', () => {
      const customConfig = {
        enableEffects: false,
        effectSettings: {
          lineClear: { intensity: 0.8 },
          tSpin: { duration: 2000 },
        },
      };

      const customIntegrator = new GameEventIntegrator(
        mockGameLogic,
        mockEffectManager,
        customConfig
      );

      expect(customIntegrator.config.enableEffects).toBe(false);
      expect(customIntegrator.config.effectSettings.lineClear.intensity).toBe(0.8);
      expect(customIntegrator.config.effectSettings.tSpin.duration).toBe(2000);
    });
  });

  describe('統合機能', () => {
    test('統合が正常に開始される', () => {
      const result = gameEventIntegrator.integrate();

      expect(result).toBe(true);
      expect(mockEventEmitter.on).toHaveBeenCalled();
    });

    test('統合が正常に停止される', () => {
      gameEventIntegrator.integrate();
      const result = gameEventIntegrator.disconnect();

      expect(result).toBe(true);
      expect(mockEventEmitter.removeAllListenersAll).toHaveBeenCalled();
    });

    test('イベントハンドラーが正しく登録される', () => {
      gameEventIntegrator.integrate();

      // 各イベントタイプのハンドラーが登録されていることを確認
      const eventTypes = [
        'lines.cleared',
        't-spin.achieved',
        'perfect-clear.achieved',
        'level.up',
        'game.ended',
      ];

      eventTypes.forEach(eventType => {
        expect(mockEventEmitter.on).toHaveBeenCalledWith(eventType, expect.any(Function));
      });
    });
  });

  describe('ライン削除イベント処理', () => {
    beforeEach(() => {
      gameEventIntegrator.integrate();
    });

    test('ライン削除エフェクトが実行される', () => {
      const eventData = {
        data: {
          count: 2,
          type: 'double',
          score: 300,
        },
      };

      gameEventIntegrator.handleLineClear(eventData);

      expect(mockEffectManager.playEffect).toHaveBeenCalledWith(
        'line-clear',
        expect.objectContaining({
          position: { x: 400, y: 300 },
          intensity: 0.7, // 0.5 + (2-1) * 0.2
          customConfig: expect.objectContaining({
            lineCount: 2,
            lineTypes: ['double'],
            score: 300,
          }),
        })
      );
    });

    test('ライン削除数0の場合はエフェクトが実行されない', () => {
      const eventData = {
        data: {
          count: 0,
          type: 'single',
          score: 0,
        },
      };

      gameEventIntegrator.handleLineClear(eventData);

      expect(mockEffectManager.playEffect).not.toHaveBeenCalled();
    });

    test('エフェクトが無効化されている場合は実行されない', () => {
      gameEventIntegrator.setEffectsEnabled(false);

      const eventData = {
        data: {
          count: 2,
          type: 'double',
          score: 300,
        },
      };

      gameEventIntegrator.handleLineClear(eventData);

      expect(mockEffectManager.playEffect).not.toHaveBeenCalled();
    });
  });

  describe('T-Spinイベント処理', () => {
    beforeEach(() => {
      gameEventIntegrator.integrate();
    });

    test('T-Spinエフェクトが実行される', () => {
      const eventData = {
        data: {
          type: 't-spin-triple',
          score: 1600,
          position: { x: 4, y: 18 },
        },
      };

      gameEventIntegrator.handleTSpin(eventData);

      expect(mockEffectManager.playEffect).toHaveBeenCalledWith(
        't-spin',
        expect.objectContaining({
          position: { x: 4, y: 18 },
          intensity: 1.0, // t-spin-tripleの強度
          customConfig: expect.objectContaining({
            tSpinType: 't-spin-triple',
            score: 1600,
          }),
        })
      );
    });

    test('位置が指定されていない場合はデフォルト位置が使用される', () => {
      const eventData = {
        data: {
          type: 't-spin-single',
          score: 800,
        },
      };

      gameEventIntegrator.handleTSpin(eventData);

      expect(mockEffectManager.playEffect).toHaveBeenCalledWith(
        't-spin',
        expect.objectContaining({
          position: { x: 400, y: 300 }, // デフォルト位置
          intensity: 0.7, // t-spin-singleの強度
        })
      );
    });
  });

  describe('Perfect Clearイベント処理', () => {
    beforeEach(() => {
      gameEventIntegrator.integrate();
    });

    test('Perfect Clearエフェクトが実行される', () => {
      const eventData = {
        data: {
          type: 'perfect-clear-tetris',
          score: 2000,
          linesCleared: 4,
        },
      };

      gameEventIntegrator.handlePerfectClear(eventData);

      expect(mockEffectManager.playEffect).toHaveBeenCalledWith(
        'perfect-clear',
        expect.objectContaining({
          position: { x: 400, y: 300 },
          intensity: 1.0, // Perfect Clearは常に最大強度
          customConfig: expect.objectContaining({
            perfectClearType: 'perfect-clear-tetris',
            score: 2000,
            linesCleared: 4,
          }),
        })
      );
    });
  });

  describe('レベルアップイベント処理', () => {
    beforeEach(() => {
      gameEventIntegrator.integrate();
    });

    test('レベルアップエフェクトが実行される', () => {
      const eventData = {
        data: {
          newLevel: 5,
          oldLevel: 4,
          reason: 'lines',
        },
      };

      gameEventIntegrator.handleLevelUp(eventData);

      expect(mockEffectManager.playEffect).toHaveBeenCalledWith(
        'level-up',
        expect.objectContaining({
          position: { x: 400, y: 300 },
          intensity: 0.6, // 0.5 + (5-4) * 0.1
          customConfig: expect.objectContaining({
            newLevel: 5,
            oldLevel: 4,
            reason: 'lines',
          }),
        })
      );
    });
  });

  describe('ゲームオーバーイベント処理', () => {
    beforeEach(() => {
      gameEventIntegrator.integrate();
    });

    test('ゲームオーバーエフェクトが実行される', () => {
      const eventData = {
        data: {
          score: 15000,
          level: 8,
          lines: 45,
          time: 120000,
          statistics: {
            totalGames: 5,
            highScore: 15000,
          },
        },
      };

      gameEventIntegrator.handleGameOver(eventData);

      expect(mockEffectManager.playEffect).toHaveBeenCalledWith(
        'game-over',
        expect.objectContaining({
          position: { x: 400, y: 300 },
          intensity: 0.7, // (1.0 + 0.4) / 2 = 0.7
          customConfig: expect.objectContaining({
            finalScore: 15000,
            finalLevel: 8,
            finalLines: 45,
            gameTime: 120000,
            statistics: {
              totalGames: 5,
              highScore: 15000,
            },
          }),
        })
      );
    });
  });

  describe('統計情報', () => {
    beforeEach(() => {
      gameEventIntegrator.integrate();
    });

    test('統計情報が正しく収集される', () => {
      // イベントを処理
      gameEventIntegrator.handleLineClear({
        data: { linesCleared: 2, lineTypes: ['double'], score: 300 },
      });

      gameEventIntegrator.handleTSpin({
        data: { type: 't-spin-single', score: 800 },
      });

      const stats = gameEventIntegrator.getStats();

      expect(stats.totalEventsProcessed).toBe(2);
      expect(stats.totalEffectsTriggered).toBe(2);
      expect(stats.eventsByType['lines.cleared']).toBe(1);
      expect(stats.eventsByType['t-spin.achieved']).toBe(1);
      expect(stats.effectsByType['line-clear']).toBe(1);
      expect(stats.effectsByType['t-spin']).toBe(1);
    });

    test('統計情報がリセットされる', () => {
      gameEventIntegrator.handleLineClear({
        data: { linesCleared: 1, lineTypes: ['single'], score: 100 },
      });

      gameEventIntegrator.resetStats();

      const stats = gameEventIntegrator.getStats();

      expect(stats.totalEventsProcessed).toBe(0);
      expect(stats.totalEffectsTriggered).toBe(0);
      expect(Object.keys(stats.eventsByType)).toHaveLength(0);
      expect(Object.keys(stats.effectsByType)).toHaveLength(0);
    });
  });

  describe('設定管理', () => {
    test('エフェクトの有効/無効が切り替えられる', () => {
      expect(gameEventIntegrator.config.enableEffects).toBe(true);

      gameEventIntegrator.setEffectsEnabled(false);
      expect(gameEventIntegrator.config.enableEffects).toBe(false);

      gameEventIntegrator.setEffectsEnabled(true);
      expect(gameEventIntegrator.config.enableEffects).toBe(true);
    });

    test('エフェクト設定が更新される', () => {
      const newSettings = {
        lineClear: { intensity: 0.9, duration: 1500 },
        tSpin: { particleCount: 100 },
      };

      gameEventIntegrator.updateEffectSettings(newSettings);

      expect(gameEventIntegrator.config.effectSettings.lineClear.intensity).toBe(0.9);
      expect(gameEventIntegrator.config.effectSettings.lineClear.duration).toBe(1500);
      expect(gameEventIntegrator.config.effectSettings.tSpin.particleCount).toBe(100);
    });
  });

  describe('強度計算', () => {
    test('ライン削除強度が正しく計算される', () => {
      expect(gameEventIntegrator._calculateLineClearIntensity(1)).toBe(0.5);
      expect(gameEventIntegrator._calculateLineClearIntensity(2)).toBe(0.7);
      expect(gameEventIntegrator._calculateLineClearIntensity(3)).toBe(0.9);
      expect(gameEventIntegrator._calculateLineClearIntensity(4)).toBe(1.0);
    });

    test('T-Spin強度が正しく計算される', () => {
      expect(gameEventIntegrator._calculateTSpinIntensity('t-spin-mini')).toBe(0.6);
      expect(gameEventIntegrator._calculateTSpinIntensity('t-spin-single')).toBe(0.7);
      expect(gameEventIntegrator._calculateTSpinIntensity('t-spin-double')).toBe(0.8);
      expect(gameEventIntegrator._calculateTSpinIntensity('t-spin-triple')).toBe(1.0);
      expect(gameEventIntegrator._calculateTSpinIntensity('unknown')).toBe(0.7);
    });

    test('レベルアップ強度が正しく計算される', () => {
      expect(gameEventIntegrator._calculateLevelUpIntensity(2, 1)).toBe(0.6);
      expect(gameEventIntegrator._calculateLevelUpIntensity(5, 1)).toBe(0.9);
      expect(gameEventIntegrator._calculateLevelUpIntensity(10, 1)).toBe(1.0);
    });

    test('ゲームオーバー強度が正しく計算される', () => {
      expect(gameEventIntegrator._calculateGameOverIntensity(5000, 5)).toBe(0.375);
      expect(gameEventIntegrator._calculateGameOverIntensity(15000, 15)).toBe(0.875);
      expect(gameEventIntegrator._calculateGameOverIntensity(20000, 20)).toBe(1.0);
    });
  });

  describe('エラーハンドリング', () => {
    test('統合時のエラーが適切に処理される', () => {
      // モックでエラーを発生させる
      mockEventEmitter.on.mockImplementation(() => {
        throw new Error('Test error');
      });

      const result = gameEventIntegrator.integrate();

      expect(result).toBe(false);
    });

    test('切断時のエラーが適切に処理される', () => {
      // モックでエラーを発生させる
      mockEventEmitter.removeAllListenersAll.mockImplementation(() => {
        throw new Error('Test error');
      });

      const result = gameEventIntegrator.disconnect();

      expect(result).toBe(false);
    });
  });

  describe('統合テスト', () => {
    test('全イベントが正しく処理される', () => {
      gameEventIntegrator.integrate();

      // 各イベントを処理
      const events = [
        {
          type: 'lines.cleared',
          data: { linesCleared: 2, lineTypes: ['double'], score: 300 },
          expectedEffect: 'line-clear',
        },
        {
          type: 't-spin.achieved',
          data: { type: 't-spin-triple', score: 1600 },
          expectedEffect: 't-spin',
        },
        {
          type: 'perfect-clear.achieved',
          data: { type: 'perfect-clear-tetris', score: 2000, linesCleared: 4 },
          expectedEffect: 'perfect-clear',
        },
        {
          type: 'level.up',
          data: { newLevel: 5, oldLevel: 4, reason: 'lines' },
          expectedEffect: 'level-up',
        },
        {
          type: 'game.ended',
          data: { score: 15000, level: 8, lines: 45, time: 120000 },
          expectedEffect: 'game-over',
        },
      ];

      events.forEach(event => {
        const eventData = { data: event.data };

        switch (event.type) {
          case 'lines.cleared':
            gameEventIntegrator.handleLineClear(eventData);
            break;
          case 't-spin.achieved':
            gameEventIntegrator.handleTSpin(eventData);
            break;
          case 'perfect-clear.achieved':
            gameEventIntegrator.handlePerfectClear(eventData);
            break;
          case 'level.up':
            gameEventIntegrator.handleLevelUp(eventData);
            break;
          case 'game.ended':
            gameEventIntegrator.handleGameOver(eventData);
            break;
        }
      });

      // 全てのエフェクトが実行されたことを確認
      expect(mockEffectManager.playEffect).toHaveBeenCalledTimes(5);

      const stats = gameEventIntegrator.getStats();
      expect(stats.totalEventsProcessed).toBe(5);
      expect(stats.totalEffectsTriggered).toBe(5);
    });
  });
});
