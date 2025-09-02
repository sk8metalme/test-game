/**
 * @file GameState.test.js
 * @description GameState エンティティの単体テスト
 *
 * テストカテゴリ:
 * - 基本初期化と状態管理
 * - スコア計算システム
 * - レベル進行システム
 * - ゲーム状態遷移
 * - 統計情報管理
 * - エラーハンドリング
 * - パフォーマンス
 */

import { GameState } from '../../../src/core/entities/GameState.js';

describe('GameState Entity', () => {
  describe('基本初期化と状態管理', () => {
    test('デフォルト値で正しく初期化される', () => {
      const gameState = new GameState();

      expect(gameState.status).toBe('MENU');
      expect(gameState.score).toBe(0);
      expect(gameState.level).toBe(1);
      expect(gameState.lines).toBe(0);
      expect(gameState.gameTime).toBe(0);
      expect(gameState.statistics.totalGames).toBe(0);
      expect(gameState.statistics.totalScore).toBe(0);
      expect(gameState.statistics.totalLines).toBe(0);
      expect(gameState.statistics.totalTime).toBe(0);
    });

    test('カスタム初期値で初期化できる', () => {
      const customSettings = {
        level: 5,
        score: 1000,
        lines: 25,
      };

      const gameState = new GameState(customSettings);

      expect(gameState.level).toBe(5);
      expect(gameState.score).toBe(1000);
      expect(gameState.lines).toBe(25);
      expect(gameState.status).toBe('MENU');
    });

    test('無効な初期値は無視される', () => {
      const invalidSettings = {
        level: -1,
        score: 'invalid',
        lines: null,
      };

      const gameState = new GameState(invalidSettings);

      expect(gameState.level).toBe(1);
      expect(gameState.score).toBe(0);
      expect(gameState.lines).toBe(0);
    });

    test('ゲーム状態のリセットが正常に動作する', () => {
      const gameState = new GameState();
      gameState.updateScore(1000);
      gameState.setLevel(5);
      gameState.updateLines(20);
      gameState.updateGameTime(300);

      gameState.reset();

      expect(gameState.score).toBe(0);
      expect(gameState.level).toBe(1);
      expect(gameState.lines).toBe(0);
      expect(gameState.gameTime).toBe(0);
      expect(gameState.status).toBe('MENU');
    });
  });

  describe('ゲーム状態遷移', () => {
    let gameState;

    beforeEach(() => {
      gameState = new GameState();
    });

    test('有効な状態遷移が正常に動作する', () => {
      // MENU -> PLAYING
      expect(gameState.setStatus('PLAYING')).toBe(true);
      expect(gameState.status).toBe('PLAYING');

      // PLAYING -> PAUSED
      expect(gameState.setStatus('PAUSED')).toBe(true);
      expect(gameState.status).toBe('PAUSED');

      // PAUSED -> PLAYING
      expect(gameState.setStatus('PLAYING')).toBe(true);
      expect(gameState.status).toBe('PLAYING');

      // PLAYING -> GAME_OVER
      expect(gameState.setStatus('GAME_OVER')).toBe(true);
      expect(gameState.status).toBe('GAME_OVER');

      // GAME_OVER -> MENU
      expect(gameState.setStatus('MENU')).toBe(true);
      expect(gameState.status).toBe('MENU');
    });

    test('無効な状態遷移が拒否される', () => {
      // MENU -> PAUSED (無効)
      expect(gameState.setStatus('PAUSED')).toBe(false);
      expect(gameState.status).toBe('MENU');

      gameState.setStatus('PLAYING');
      // PLAYING -> MENU (無効: GAME_OVERを経由する必要がある)
      expect(gameState.setStatus('MENU')).toBe(false);
      expect(gameState.status).toBe('PLAYING');
    });

    test('無効な状態値が拒否される', () => {
      expect(gameState.setStatus('INVALID')).toBe(false);
      expect(gameState.setStatus(null)).toBe(false);
      expect(gameState.setStatus(undefined)).toBe(false);
      expect(gameState.setStatus('')).toBe(false);
      expect(gameState.status).toBe('MENU');
    });

    test('状態変更時にイベントが発行される', () => {
      const listener = jest.fn();
      gameState.addEventListener('statusChange', listener);

      gameState.setStatus('PLAYING');

      expect(listener).toHaveBeenCalledWith({
        type: 'statusChange',
        oldStatus: 'MENU',
        newStatus: 'PLAYING',
      });
    });
  });

  describe('スコア計算システム', () => {
    let gameState;

    beforeEach(() => {
      gameState = new GameState();
      gameState.setStatus('PLAYING');
    });

    test('基本スコア追加が正常に動作する', () => {
      gameState.updateScore(100);
      expect(gameState.score).toBe(100);

      gameState.updateScore(50);
      expect(gameState.score).toBe(150);
    });

    test('ライン削除スコアの計算が正確', () => {
      // シングル: レベル1で40点
      gameState.addLineScore(1);
      expect(gameState.score).toBe(40);

      gameState.reset();
      gameState.setStatus('PLAYING');

      // ダブル: レベル1で100点
      gameState.addLineScore(2);
      expect(gameState.score).toBe(100);

      gameState.reset();
      gameState.setStatus('PLAYING');

      // トリプル: レベル1で300点
      gameState.addLineScore(3);
      expect(gameState.score).toBe(300);

      gameState.reset();
      gameState.setStatus('PLAYING');

      // テトリス: レベル1で1200点
      gameState.addLineScore(4);
      expect(gameState.score).toBe(1200);
    });

    test('レベルに応じたスコア倍率が適用される', () => {
      gameState.setLevel(5);

      // シングル: レベル5で200点 (40 * 5)
      gameState.addLineScore(1);
      expect(gameState.score).toBe(200);
    });

    test('ソフトドロップスコアが正常に動作する', () => {
      gameState.addSoftDropScore(10);
      expect(gameState.score).toBe(10); // 1点 x 10行

      gameState.addSoftDropScore(5);
      expect(gameState.score).toBe(15);
    });

    test('ハードドロップスコアが正常に動作する', () => {
      gameState.addHardDropScore(20);
      expect(gameState.score).toBe(40); // 2点 x 20行

      gameState.addHardDropScore(10);
      expect(gameState.score).toBe(60);
    });

    test('コンボスコアが正常に動作する', () => {
      // 最初のライン削除（コンボなし）
      gameState.addLineScore(1);
      expect(gameState.score).toBe(40);

      // 連続ライン削除（コンボ追加）
      gameState.addComboScore(2);
      const expectedCombo = 50 * gameState.level * 2; // 50 * 1 * 2 = 100
      expect(gameState.score).toBe(40 + expectedCombo);
    });

    test('Tスピンスコアが正常に動作する', () => {
      // Tスピンシングル
      gameState.addTSpinScore(1, true);
      expect(gameState.score).toBe(800); // 800 * level 1

      gameState.reset();
      gameState.setStatus('PLAYING');

      // Tスピンダブル
      gameState.addTSpinScore(2, true);
      expect(gameState.score).toBe(1200); // 1200 * level 1

      gameState.reset();
      gameState.setStatus('PLAYING');

      // Tスピントリプル
      gameState.addTSpinScore(3, true);
      expect(gameState.score).toBe(1600); // 1600 * level 1
    });

    test('パーフェクトクリアボーナスが適用される', () => {
      gameState.addLineScore(4); // テトリス: 1200点

      gameState.addPerfectClearBonus(4);
      const bonus = 1000 * gameState.level; // 1000 * 1 = 1000
      expect(gameState.score).toBe(1200 + bonus);
    });

    test('負の値や無効な値が拒否される', () => {
      const initialScore = gameState.score;

      gameState.updateScore(-100);
      expect(gameState.score).toBe(initialScore);

      gameState.updateScore('invalid');
      expect(gameState.score).toBe(initialScore);

      gameState.updateScore(null);
      expect(gameState.score).toBe(initialScore);
    });
  });

  describe('レベル進行システム', () => {
    let gameState;

    beforeEach(() => {
      gameState = new GameState();
      gameState.setStatus('PLAYING');
    });

    test('ライン数に基づくレベルアップが正常に動作する', () => {
      // 10ライン削除でレベル2
      gameState.updateLines(10);
      expect(gameState.level).toBe(2);

      // 20ライン削除でレベル3
      gameState.updateLines(10);
      expect(gameState.level).toBe(3);

      // 100ライン削除でレベル11
      gameState.updateLines(80);
      expect(gameState.level).toBe(11);
    });

    test('最大レベル制限が適用される', () => {
      gameState.updateLines(1000); // 大量のライン削除
      expect(gameState.level).toBeLessThanOrEqual(99); // 最大レベル99
    });

    test('カスタムレベル設定が可能', () => {
      expect(gameState.setLevel(10)).toBe(true);
      expect(gameState.level).toBe(10);

      expect(gameState.setLevel(99)).toBe(true);
      expect(gameState.level).toBe(99);
    });

    test('無効なレベル設定が拒否される', () => {
      expect(gameState.setLevel(0)).toBe(false);
      expect(gameState.setLevel(100)).toBe(false);
      expect(gameState.setLevel(-1)).toBe(false);
      expect(gameState.setLevel('invalid')).toBe(false);
      expect(gameState.level).toBe(1);
    });

    test('レベルアップ時にイベントが発行される', () => {
      const listener = jest.fn();
      gameState.addEventListener('level.up', listener);

      gameState.updateLines(10);

      expect(listener).toHaveBeenCalledWith({
        type: 'level.up',
        oldLevel: 1,
        newLevel: 2,
        totalLines: 10,
      });
    });

    test('落下速度がレベルに応じて計算される', () => {
      expect(gameState.getDropInterval()).toBeCloseTo(800, 0); // レベル1: 約800ms

      gameState.setLevel(5);
      expect(gameState.getDropInterval()).toBeLessThan(1000);

      const level5Interval = gameState.getDropInterval();
      gameState.setLevel(10);
      expect(gameState.getDropInterval()).toBeLessThan(level5Interval);

      gameState.setLevel(20);
      expect(gameState.getDropInterval()).toBeGreaterThan(0); // 最小値制限
    });
  });

  describe('統計情報管理', () => {
    let gameState;

    beforeEach(() => {
      gameState = new GameState();
    });

    test('統計情報が正しく更新される', () => {
      gameState.updateStatistics({
        gamesPlayed: 1,
        score: 1000,
        lines: 15,
        gameTime: 300,
      });

      expect(gameState.statistics.totalGames).toBe(1);
      expect(gameState.statistics.totalScore).toBe(1000);
      expect(gameState.statistics.totalLines).toBe(15);
      expect(gameState.statistics.totalTime).toBe(300);
    });

    test('最高スコアが更新される', () => {
      gameState.updateStatistics({ score: 1000 });
      expect(gameState.statistics.highScore).toBe(1000);

      gameState.updateStatistics({ score: 500 });
      expect(gameState.statistics.highScore).toBe(1000); // 更新されない

      gameState.updateStatistics({ score: 1500 });
      expect(gameState.statistics.highScore).toBe(1500); // 更新される
    });

    test('平均値統計が正しく計算される', () => {
      gameState.updateStatistics({
        gamesPlayed: 1,
        score: 1000,
        lines: 20,
        gameTime: 300,
      });

      gameState.updateStatistics({
        gamesPlayed: 1,
        score: 2000,
        lines: 30,
        gameTime: 400,
      });

      expect(gameState.getAverageScore()).toBe(1500); // (1000 + 2000) / 2
      expect(gameState.getAverageLines()).toBe(25); // (20 + 30) / 2
      expect(gameState.getAverageTime()).toBe(350); // (300 + 400) / 2
    });

    test('ピース統計が正しく管理される', () => {
      gameState.incrementPieceUsage('I');
      gameState.incrementPieceUsage('O');
      gameState.incrementPieceUsage('I');

      expect(gameState.statistics.pieceUsage.I).toBe(2);
      expect(gameState.statistics.pieceUsage.O).toBe(1);
      expect(gameState.statistics.pieceUsage.T).toBe(0);
    });

    test('特殊アクション統計が記録される', () => {
      gameState.incrementActionCount('tSpin');
      gameState.incrementActionCount('perfectClear');
      gameState.incrementActionCount('tSpin');

      expect(gameState.statistics.actionCounts.tSpin).toBe(2);
      expect(gameState.statistics.actionCounts.perfectClear).toBe(1);
    });
  });

  describe('時間管理', () => {
    let gameState;

    beforeEach(() => {
      gameState = new GameState();
      gameState.setStatus('PLAYING');
    });

    test('ゲーム時間が正しく更新される', () => {
      gameState.updateGameTime(100);
      expect(gameState.gameTime).toBe(100);

      gameState.updateGameTime(50);
      expect(gameState.gameTime).toBe(150);
    });

    test('時間の自動計測が可能', () => {
      gameState.startTimer();

      // タイマーが開始されていることを確認
      expect(gameState.isTimerRunning()).toBe(true);

      // 少し待ってから停止
      setTimeout(() => {
        gameState.stopTimer();
        expect(gameState.gameTime).toBeGreaterThan(0);
        expect(gameState.isTimerRunning()).toBe(false);
      }, 100);
    });

    test('ポーズ中は時間が進まない', () => {
      gameState.startTimer();
      gameState.setStatus('PAUSED');

      const timeAtPause = gameState.gameTime;

      setTimeout(() => {
        expect(gameState.gameTime).toBe(timeAtPause);
      }, 50);

      gameState.setStatus('PLAYING');
      // 再開後は時間が進む
    });

    test('フォーマットされた時間文字列を取得できる', () => {
      gameState.updateGameTime(65000); // 1分5秒
      expect(gameState.getFormattedTime()).toBe('1:05');

      gameState.reset();
      gameState.updateGameTime(3661000); // 1時間1分1秒
      expect(gameState.getFormattedTime()).toBe('1:01:01');
    });
  });

  describe('イベントシステム', () => {
    let gameState;

    beforeEach(() => {
      gameState = new GameState();
    });

    test('イベントリスナーの追加と削除が正常に動作する', () => {
      const listener = jest.fn();

      gameState.addEventListener('test', listener);
      gameState.emit('test', { data: 'value' });

      expect(listener).toHaveBeenCalledWith({ data: 'value' });

      gameState.removeEventListener('test', listener);
      gameState.emit('test', { data: 'value2' });

      expect(listener).toHaveBeenCalledTimes(1); // 削除後は呼ばれない
    });

    test('複数のリスナーが正常に動作する', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      gameState.addEventListener('test', listener1);
      gameState.addEventListener('test', listener2);

      gameState.emit('test', { data: 'value' });

      expect(listener1).toHaveBeenCalledWith({ data: 'value' });
      expect(listener2).toHaveBeenCalledWith({ data: 'value' });
    });

    test('存在しないイベントは無視される', () => {
      expect(() => {
        gameState.emit('nonexistent', {});
      }).not.toThrow();
    });
  });

  describe('状態永続化', () => {
    let gameState;

    beforeEach(() => {
      gameState = new GameState();
    });

    test('ゲーム状態をシリアライズできる', () => {
      gameState.updateScore(1000);
      gameState.setLevel(5);
      gameState.updateLines(45);
      gameState.setStatus('PLAYING');

      const serialized = gameState.serialize();

      expect(serialized).toEqual({
        status: 'PLAYING',
        score: 1000,
        level: 5,
        lines: 45,
        gameTime: 0,
        statistics: gameState.statistics,
      });
    });

    test('シリアライズされた状態から復元できる', () => {
      const savedState = {
        status: 'PAUSED',
        score: 2000,
        level: 8,
        lines: 75,
        gameTime: 500,
        statistics: {
          totalGames: 10,
          totalScore: 15000,
          highScore: 3000,
        },
      };

      const result = gameState.deserialize(savedState);

      expect(result).toBe(true);
      expect(gameState.status).toBe('PAUSED');
      expect(gameState.score).toBe(2000);
      expect(gameState.level).toBe(8);
      expect(gameState.lines).toBe(75);
      expect(gameState.gameTime).toBe(500);
    });

    test('無効な復元データは拒否される', () => {
      const invalidData = {
        status: 'INVALID',
        score: -1000,
        level: 150,
      };

      const result = gameState.deserialize(invalidData);

      expect(result).toBe(true); // 修正されながらも復元は成功
      expect(gameState.status).toBe('MENU'); // 無効な値はデフォルト値に修正
      expect(gameState.score).toBe(0); // 負の値はデフォルト値に修正
      expect(gameState.level).toBe(1); // 範囲外の値はデフォルト値に修正
    });
  });

  describe('エラーハンドリング', () => {
    let gameState;

    beforeEach(() => {
      gameState = new GameState();
    });

    test('破損した状態データの復旧', () => {
      // 故意に状態を破損
      gameState.score = 'invalid';
      gameState.level = null;

      const recovered = gameState.validateAndRecover();

      expect(recovered).toBe(true);
      expect(gameState.score).toBe(0);
      expect(gameState.level).toBe(1);
    });

    test('無効な操作が安全に処理される', () => {
      expect(() => {
        gameState.updateScore(undefined);
        gameState.setLevel(null);
        gameState.updateLines('invalid');
      }).not.toThrow();

      // 値は変更されない
      expect(gameState.score).toBe(0);
      expect(gameState.level).toBe(1);
      expect(gameState.lines).toBe(0);
    });

    test('メモリリークの防止', () => {
      // 大量のイベントリスナー追加
      for (let i = 0; i < 1000; i++) {
        gameState.addEventListener(`test${i}`, () => {});
      }

      // クリーンアップ
      gameState.cleanup();

      // リスナーがクリアされていることを確認
      expect(Object.keys(gameState.eventListeners).length).toBe(0);
    });
  });

  describe('パフォーマンス', () => {
    let gameState;

    beforeEach(() => {
      gameState = new GameState();
    });

    test('大量のスコア更新が効率的に処理される', () => {
      const startTime = performance.now();

      for (let i = 0; i < 10000; i++) {
        gameState.updateScore(1);
      }

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100); // 100ms以下
    });

    test('統計計算が効率的に実行される', () => {
      // 大量のデータを設定
      for (let i = 0; i < 1000; i++) {
        gameState.updateStatistics({
          gamesPlayed: 1,
          score: Math.floor(Math.random() * 10000),
          lines: Math.floor(Math.random() * 100),
          gameTime: Math.floor(Math.random() * 1000),
        });
      }

      const startTime = performance.now();

      const avgScore = gameState.getAverageScore();
      const avgLines = gameState.getAverageLines();
      const avgTime = gameState.getAverageTime();

      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(50); // 50ms以下
      expect(typeof avgScore).toBe('number');
      expect(typeof avgLines).toBe('number');
      expect(typeof avgTime).toBe('number');
    });

    test('メモリ使用量が適切に管理される', () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // 大量の操作を実行
      for (let i = 0; i < 10000; i++) {
        gameState.updateScore(i);
        gameState.updateLines(1);
        gameState.incrementPieceUsage('I');
        gameState.emit('test', { data: i });
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // メモリ増加が5MB以下
      expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024);
    });
  });
});
