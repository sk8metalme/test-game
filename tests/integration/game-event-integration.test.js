/**
 * game-event-integration.test.js - ゲームイベントとエフェクトの統合テスト
 *
 * テスト内容:
 * - GameLogicとEffectManagerの連携
 * - イベント発行とエフェクト実行の統合
 * - 実際のゲームイベントでのエフェクト動作
 */

import GameLogic from '../../src/core/usecases/GameLogic.js';
import { GameState } from '../../src/core/entities/GameState.js';
import Board from '../../src/core/entities/Board.js';
import EffectManager from '../../src/core/usecases/EffectManager.js';
import GameEventIntegrator from '../../src/core/usecases/GameEventIntegrator.js';

// モックの設定
jest.mock('../../src/core/usecases/EffectManager');

describe('ゲームイベントとエフェクトの統合テスト', () => {
  let gameLogic;
  let gameState;
  let board;
  let effectManager;
  let gameEventIntegrator;
  let mockCanvas;

  beforeEach(() => {
    // モックのリセット
    jest.clearAllMocks();

    // モックCanvasの作成
    mockCanvas = {
      getContext: jest.fn().mockReturnValue({
        fillRect: jest.fn(),
        clearRect: jest.fn(),
        fillText: jest.fn(),
        setTransform: jest.fn(),
        translate: jest.fn(),
        scale: jest.fn(),
        save: jest.fn(),
        restore: jest.fn(),
      }),
      width: 800,
      height: 600,
    };

    // モックEffectManagerの設定
    EffectManager.mockImplementation(() => ({
      playEffect: jest.fn(),
      getStats: jest.fn().mockReturnValue({
        totalEffectsPlayed: 0,
        activeEffectsCount: 0,
      }),
    }));

    // インスタンスの作成
    board = new Board();
    gameState = new GameState();
    gameLogic = new GameLogic(board, gameState);
    effectManager = new EffectManager(mockCanvas);
    gameEventIntegrator = new GameEventIntegrator(gameLogic, effectManager);
  });

  afterEach(() => {
    if (gameEventIntegrator) {
      gameEventIntegrator.disconnect();
    }
  });

  describe('統合初期化', () => {
    test('統合が正常に開始される', () => {
      const result = gameEventIntegrator.integrate();

      expect(result).toBe(true);
    });

    test('統合が正常に停止される', () => {
      gameEventIntegrator.integrate();
      const result = gameEventIntegrator.disconnect();

      expect(result).toBe(true);
    });
  });

  describe('ゲーム開始イベント', () => {
    test('ゲーム開始時にイベントが発行される', () => {
      gameEventIntegrator.integrate();

      const startResult = gameLogic.startGame();

      expect(startResult.success).toBe(true);
      expect(gameState.status).toBe('PLAYING');
    });
  });

  describe('ゲーム一時停止・再開イベント', () => {
    beforeEach(() => {
      gameLogic.startGame();
      gameEventIntegrator.integrate();
    });

    test('ゲーム一時停止時にイベントが発行される', () => {
      const pauseResult = gameLogic.pauseGame();

      expect(pauseResult.success).toBe(true);
      expect(gameState.status).toBe('PAUSED');
    });

    test('ゲーム再開時にイベントが発行される', () => {
      gameLogic.pauseGame();
      const resumeResult = gameLogic.resumeGame();

      expect(resumeResult.success).toBe(true);
      expect(gameState.status).toBe('PLAYING');
    });
  });

  describe('ライン削除イベント', () => {
    beforeEach(() => {
      gameLogic.startGame();
      gameEventIntegrator.integrate();
    });

    test('ライン削除時にイベントが発行される', () => {
      // ラインを埋める
      for (let x = 0; x < 10; x++) {
        board.setCell(19, x, 1);
      }

      const clearResult = gameLogic.checkAndClearLines();

      expect(clearResult.linesCleared).toBe(1);
      expect(clearResult.lineTypes).toContain('single');
    });

    test('複数ライン削除時にイベントが発行される', () => {
      // 2ラインを埋める
      for (let y = 18; y <= 19; y++) {
        for (let x = 0; x < 10; x++) {
          board.setCell(y, x, 1);
        }
      }

      const clearResult = gameLogic.checkAndClearLines();

      expect(clearResult.linesCleared).toBe(2);
      expect(clearResult.lineTypes).toContain('double');
    });
  });

  describe('レベルアップイベント', () => {
    beforeEach(() => {
      gameLogic.startGame();
      gameEventIntegrator.integrate();
    });

    test('レベルアップ時にイベントが発行される', () => {
      const initialLevel = gameState.level;

      // 10ライン削除でレベルアップ
      gameState.updateLines(10);

      expect(gameState.level).toBe(initialLevel + 1);
    });

    test('複数レベルアップ時にイベントが発行される', () => {
      const initialLevel = gameState.level;

      // 30ライン削除で3レベルアップ
      gameState.updateLines(30);

      expect(gameState.level).toBe(initialLevel + 3);
    });
  });

  describe('ゲームオーバーイベント', () => {
    beforeEach(() => {
      gameLogic.startGame();
      gameEventIntegrator.integrate();
    });

    test('ゲームオーバー時にイベントが発行される', () => {
      // スポーン位置を完全にブロック
      for (let x = 0; x < 10; x++) {
        board.setCell(0, x, 1);
        board.setCell(1, x, 1);
      }

      const spawnResult = gameLogic.spawnNextPiece();

      expect(spawnResult.success).toBe(false);
      expect(spawnResult.gameOver).toBe(true);
      expect(gameState.status).toBe('GAME_OVER');
    });
  });

  describe('エフェクト実行の統合', () => {
    beforeEach(() => {
      gameLogic.startGame();
      gameEventIntegrator.integrate();
    });

    test('ライン削除時にエフェクトが実行される', () => {
      // ラインを埋める
      for (let x = 0; x < 10; x++) {
        board.setCell(19, x, 1);
      }

      gameLogic.checkAndClearLines();

      expect(effectManager.playEffect).toHaveBeenCalledWith(
        'line-clear',
        expect.objectContaining({
          position: { x: 400, y: 300 },
          intensity: 0.5,
          customConfig: expect.objectContaining({
            lineCount: 1,
            lineTypes: ['single'],
          }),
        })
      );
    });

    test('レベルアップ時にエフェクトが実行される', () => {
      gameState.updateLines(10);

      expect(effectManager.playEffect).toHaveBeenCalledWith(
        'level-up',
        expect.objectContaining({
          position: { x: 400, y: 300 },
          intensity: 0.6,
          customConfig: expect.objectContaining({
            newLevel: 2,
            oldLevel: 1,
            reason: 'lines',
          }),
        })
      );
    });

    test('ゲームオーバー時にエフェクトが実行される', () => {
      // スポーン位置を完全にブロック
      for (let x = 0; x < 10; x++) {
        board.setCell(0, x, 1);
        board.setCell(1, x, 1);
      }

      gameLogic.spawnNextPiece();

      expect(effectManager.playEffect).toHaveBeenCalledWith(
        'game-over',
        expect.objectContaining({
          position: { x: 400, y: 300 },
          customConfig: expect.objectContaining({
            finalScore: 0,
            finalLevel: 1,
            finalLines: 0,
          }),
        })
      );
    });
  });

  describe('統計情報の収集', () => {
    beforeEach(() => {
      gameLogic.startGame();
      gameEventIntegrator.integrate();
    });

    test('イベント処理の統計が正しく収集される', () => {
      // ライン削除
      for (let x = 0; x < 10; x++) {
        board.setCell(19, x, 1);
      }
      gameLogic.checkAndClearLines();

      // レベルアップ
      gameState.updateLines(10);

      const stats = gameEventIntegrator.getStats();

      expect(stats.totalEventsProcessed).toBeGreaterThan(0);
      expect(stats.totalEffectsTriggered).toBeGreaterThan(0);
      expect(stats.eventsByType['lines.cleared']).toBeGreaterThan(0);
      expect(stats.eventsByType['level.up']).toBeGreaterThan(0);
      expect(stats.effectsByType['line-clear']).toBeGreaterThan(0);
      expect(stats.effectsByType['level-up']).toBeGreaterThan(0);
    });
  });

  describe('エフェクト設定の管理', () => {
    test('エフェクト設定が正しく更新される', () => {
      const newSettings = {
        lineClear: { intensity: 0.9, duration: 1500 },
        levelUp: { particleCount: 100 },
      };

      gameEventIntegrator.updateEffectSettings(newSettings);

      expect(gameEventIntegrator.config.effectSettings.lineClear.intensity).toBe(0.9);
      expect(gameEventIntegrator.config.effectSettings.lineClear.duration).toBe(1500);
      expect(gameEventIntegrator.config.effectSettings.levelUp.particleCount).toBe(100);
    });

    test('エフェクトの有効/無効が切り替えられる', () => {
      expect(gameEventIntegrator.config.enableEffects).toBe(true);

      gameEventIntegrator.setEffectsEnabled(false);
      expect(gameEventIntegrator.config.enableEffects).toBe(false);

      gameEventIntegrator.setEffectsEnabled(true);
      expect(gameEventIntegrator.config.enableEffects).toBe(true);
    });
  });

  describe('エラーハンドリング', () => {
    test('無効なGameLogicでエラーが発生する', () => {
      expect(() => {
        new GameEventIntegrator(null, effectManager);
      }).toThrow('GameEventIntegrator: GameLogicインスタンスが必要です');
    });

    test('無効なEffectManagerでエラーが発生する', () => {
      expect(() => {
        new GameEventIntegrator(gameLogic, null);
      }).toThrow('GameEventIntegrator: EffectManagerインスタンスが必要です');
    });
  });

  describe('実際のゲームシナリオ', () => {
    beforeEach(() => {
      gameLogic.startGame();
      gameEventIntegrator.integrate();
    });

    test('実際のゲームプレイでのイベント連携', () => {
      // 1. ライン削除
      for (let x = 0; x < 10; x++) {
        board.setCell(19, x, 1);
      }
      gameLogic.checkAndClearLines();

      // 2. レベルアップ
      gameState.updateLines(10);

      // 3. ゲームオーバー
      for (let x = 0; x < 10; x++) {
        board.setCell(0, x, 1);
        board.setCell(1, x, 1);
      }
      gameLogic.spawnNextPiece();

      // 統計情報を確認
      const stats = gameEventIntegrator.getStats();

      expect(stats.totalEventsProcessed).toBeGreaterThanOrEqual(3);
      expect(stats.totalEffectsTriggered).toBeGreaterThanOrEqual(3);
      expect(effectManager.playEffect).toHaveBeenCalledTimes(6);
    });
  });
});
