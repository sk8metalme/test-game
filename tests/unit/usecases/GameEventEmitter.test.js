/**
 * GameEventEmitter.test.js - GameEventEmitterクラスの単体テスト
 *
 * テスト内容:
 * - イベントリスナーの登録・削除
 * - イベントの配信
 * - イベント履歴の管理
 * - 統計情報の収集
 * - エラーハンドリング
 */

import GameEventEmitter from '../../../src/core/usecases/GameEventEmitter.js';

describe('GameEventEmitter', () => {
  let eventEmitter;

  beforeEach(() => {
    eventEmitter = new GameEventEmitter();
  });

  afterEach(() => {
    eventEmitter.removeAllListenersAll();
  });

  describe('コンストラクタ', () => {
    test('デフォルト設定でインスタンスが作成される', () => {
      expect(eventEmitter).toBeInstanceOf(GameEventEmitter);
      expect(eventEmitter.config.enableHistory).toBe(true);
      expect(eventEmitter.config.maxHistorySize).toBe(100);
      expect(eventEmitter.config.enableValidation).toBe(true);
    });

    test('カスタム設定でインスタンスが作成される', () => {
      const customEmitter = new GameEventEmitter({
        enableHistory: false,
        maxHistorySize: 50,
        enableValidation: false,
      });

      expect(customEmitter.config.enableHistory).toBe(false);
      expect(customEmitter.config.maxHistorySize).toBe(50);
      expect(customEmitter.config.enableValidation).toBe(false);
    });

    test('有効なイベントタイプが定義されている', () => {
      expect(eventEmitter.validEventTypes).toContain('game.started');
      expect(eventEmitter.validEventTypes).toContain('lines.cleared');
      expect(eventEmitter.validEventTypes).toContain('t-spin.achieved');
      expect(eventEmitter.validEventTypes).toContain('perfect-clear.achieved');
    });
  });

  describe('イベントリスナーの登録', () => {
    test('イベントリスナーが正しく登録される', () => {
      const callback = jest.fn();
      const unsubscribe = eventEmitter.on('game.started', callback);

      expect(eventEmitter.listenerCount('game.started')).toBe(1);
      expect(eventEmitter.totalListenerCount()).toBe(1);
      expect(typeof unsubscribe).toBe('function');
    });

    test('複数のイベントリスナーが登録される', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      eventEmitter.on('game.started', callback1);
      eventEmitter.on('game.started', callback2);

      expect(eventEmitter.listenerCount('game.started')).toBe(2);
      expect(eventEmitter.totalListenerCount()).toBe(2);
    });

    test('無効なイベントタイプで警告が表示される', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const callback = jest.fn();

      eventEmitter.on('invalid.event', callback);

      expect(consoleSpy).toHaveBeenCalledWith(
        "GameEventEmitter: 無効なイベントタイプ 'invalid.event'"
      );
      consoleSpy.mockRestore();
    });

    test('関数以外のコールバックでエラーが発生する', () => {
      expect(() => {
        eventEmitter.on('game.started', 'not a function');
      }).toThrow('GameEventEmitter: コールバックは関数である必要があります');
    });

    test('onceで一度だけのリスナーが登録される', () => {
      const callback = jest.fn();
      eventEmitter.once('game.started', callback);

      expect(eventEmitter.listenerCount('game.started')).toBe(1);
    });

    test('優先度付きリスナーが正しくソートされる', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const callback3 = jest.fn();

      eventEmitter.on('game.started', callback1, { priority: 1 });
      eventEmitter.on('game.started', callback2, { priority: 3 });
      eventEmitter.on('game.started', callback3, { priority: 2 });

      const listeners = eventEmitter.listeners.get('game.started');
      expect(listeners[0].priority).toBe(3);
      expect(listeners[1].priority).toBe(2);
      expect(listeners[2].priority).toBe(1);
    });
  });

  describe('イベントリスナーの削除', () => {
    test('特定のイベントリスナーが削除される', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      eventEmitter.on('game.started', callback1);
      eventEmitter.on('game.started', callback2);

      const result = eventEmitter.off('game.started', callback1);

      expect(result).toBe(true);
      expect(eventEmitter.listenerCount('game.started')).toBe(1);
      expect(eventEmitter.totalListenerCount()).toBe(1);
    });

    test('存在しないイベントのリスナー削除が失敗する', () => {
      const callback = jest.fn();
      const result = eventEmitter.off('nonexistent.event', callback);

      expect(result).toBe(false);
    });

    test('特定のイベントの全リスナーが削除される', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      eventEmitter.on('game.started', callback1);
      eventEmitter.on('game.started', callback2);
      eventEmitter.on('game.ended', callback1);

      const removed = eventEmitter.removeAllListeners('game.started');

      expect(removed).toBe(2);
      expect(eventEmitter.listenerCount('game.started')).toBe(0);
      expect(eventEmitter.listenerCount('game.ended')).toBe(1);
    });

    test('全イベントリスナーが削除される', () => {
      const callback = jest.fn();

      eventEmitter.on('game.started', callback);
      eventEmitter.on('game.ended', callback);

      const removed = eventEmitter.removeAllListenersAll();

      expect(removed).toBe(2);
      expect(eventEmitter.totalListenerCount()).toBe(0);
    });

    test('登録解除関数が正しく動作する', () => {
      const callback = jest.fn();
      const unsubscribe = eventEmitter.on('game.started', callback);

      expect(eventEmitter.listenerCount('game.started')).toBe(1);

      unsubscribe();

      expect(eventEmitter.listenerCount('game.started')).toBe(0);
    });
  });

  describe('イベントの配信', () => {
    test('イベントが正しく配信される', () => {
      const callback = jest.fn();
      eventEmitter.on('game.started', callback);

      const result = eventEmitter.emit('game.started', { level: 1 });

      expect(result).toBe(true);
      expect(callback).toHaveBeenCalledWith({
        name: 'game.started',
        data: { level: 1 },
        timestamp: expect.any(Number),
      });
    });

    test('リスナーがない場合に配信が失敗する', () => {
      const result = eventEmitter.emit('game.started');

      expect(result).toBe(false);
    });

    test('複数のリスナーが正しく実行される', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      eventEmitter.on('game.started', callback1);
      eventEmitter.on('game.started', callback2);

      eventEmitter.emit('game.started', { level: 1 });

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    test('onceリスナーが一度だけ実行される', () => {
      const callback = jest.fn();
      eventEmitter.once('game.started', callback);

      eventEmitter.emit('game.started');
      eventEmitter.emit('game.started');

      expect(callback).toHaveBeenCalledTimes(1);
      expect(eventEmitter.listenerCount('game.started')).toBe(0);
    });

    test('リスナーでエラーが発生しても他のリスナーが実行される', () => {
      const errorCallback = jest.fn().mockImplementation(() => {
        throw new Error('Test error');
      });
      const normalCallback = jest.fn();

      eventEmitter.on('game.started', errorCallback);
      eventEmitter.on('game.started', normalCallback);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      eventEmitter.emit('game.started');

      expect(consoleSpy).toHaveBeenCalledWith(
        'GameEventEmitter: イベントリスナーでエラーが発生しました: Test error'
      );
      expect(normalCallback).toHaveBeenCalledTimes(1);

      consoleSpy.mockRestore();
    });

    test('優先度順にリスナーが実行される', () => {
      const executionOrder = [];
      const callback1 = jest.fn(() => executionOrder.push(1));
      const callback2 = jest.fn(() => executionOrder.push(2));
      const callback3 = jest.fn(() => executionOrder.push(3));

      eventEmitter.on('game.started', callback1, { priority: 1 });
      eventEmitter.on('game.started', callback2, { priority: 3 });
      eventEmitter.on('game.started', callback3, { priority: 2 });

      eventEmitter.emit('game.started');

      expect(executionOrder).toEqual([2, 3, 1]);
    });
  });

  describe('イベント履歴', () => {
    test('イベント履歴が正しく記録される', () => {
      eventEmitter.emit('game.started', { level: 1 });
      eventEmitter.emit('game.ended', { score: 1000 });

      const history = eventEmitter.getEventHistory();

      expect(history).toHaveLength(2);
      expect(history[0].name).toBe('game.started');
      expect(history[0].data).toEqual({ level: 1 });
      expect(history[1].name).toBe('game.ended');
      expect(history[1].data).toEqual({ score: 1000 });
    });

    test('履歴が最大サイズを超えた場合に古いイベントが削除される', () => {
      const customEmitter = new GameEventEmitter({ maxHistorySize: 3 });

      customEmitter.emit('game.started');
      customEmitter.emit('game.ended');
      customEmitter.emit('lines.cleared');
      customEmitter.emit('level.up');

      const history = customEmitter.getEventHistory();

      expect(history).toHaveLength(3);
      expect(history[0].name).toBe('game.ended');
      expect(history[1].name).toBe('lines.cleared');
      expect(history[2].name).toBe('level.up');
    });

    test('履歴が無効化されている場合に記録されない', () => {
      const customEmitter = new GameEventEmitter({ enableHistory: false });

      customEmitter.emit('game.started');

      const history = customEmitter.getEventHistory();

      expect(history).toHaveLength(0);
    });

    test('特定のイベント名でフィルタされた履歴が取得される', () => {
      eventEmitter.emit('game.started');
      eventEmitter.emit('lines.cleared');
      eventEmitter.emit('game.started');

      const history = eventEmitter.getEventHistory({ eventName: 'game.started' });

      expect(history).toHaveLength(2);
      expect(history[0].name).toBe('game.started');
      expect(history[1].name).toBe('game.started');
    });

    test('時刻でフィルタされた履歴が取得される', () => {
      const startTime = Date.now();
      eventEmitter.emit('game.started');

      // 少し待機
      setTimeout(() => {
        eventEmitter.emit('game.ended');
      }, 10);

      setTimeout(() => {
        const history = eventEmitter.getEventHistory({ since: startTime + 5 });
        expect(history.length).toBeGreaterThanOrEqual(1);
      }, 20);
    });

    test('件数制限付きの履歴が取得される', () => {
      eventEmitter.emit('game.started');
      eventEmitter.emit('game.ended');
      eventEmitter.emit('lines.cleared');

      const history = eventEmitter.getEventHistory({ limit: 2 });

      expect(history).toHaveLength(2);
      expect(history[0].name).toBe('game.ended');
      expect(history[1].name).toBe('lines.cleared');
    });
  });

  describe('統計情報', () => {
    test('統計情報が正しく収集される', () => {
      const callback = jest.fn();

      eventEmitter.on('game.started', callback);
      eventEmitter.on('lines.cleared', callback);

      eventEmitter.emit('game.started');
      eventEmitter.emit('game.started');
      eventEmitter.emit('lines.cleared');

      const stats = eventEmitter.getStats();

      expect(stats.totalEventsEmitted).toBe(3);
      expect(stats.totalListeners).toBe(2);
      expect(stats.eventsByType['game.started']).toBe(2);
      expect(stats.eventsByType['lines.cleared']).toBe(1);
      expect(stats.eventHistorySize).toBe(3);
    });

    test('統計情報がリセットされる', () => {
      const callback = jest.fn();

      eventEmitter.on('game.started', callback);
      eventEmitter.emit('game.started');

      eventEmitter.resetStats();

      const stats = eventEmitter.getStats();

      expect(stats.totalEventsEmitted).toBe(0);
      expect(stats.totalListeners).toBe(0);
      expect(Object.keys(stats.eventsByType)).toHaveLength(0);
    });

    test('イベント履歴がクリアされる', () => {
      eventEmitter.emit('game.started');
      eventEmitter.emit('game.ended');

      expect(eventEmitter.getEventHistory()).toHaveLength(2);

      eventEmitter.clearEventHistory();

      expect(eventEmitter.getEventHistory()).toHaveLength(0);
    });
  });

  describe('ゲームイベントの統合テスト', () => {
    test('ライン削除イベントが正しく配信される', () => {
      const callback = jest.fn();
      eventEmitter.on('lines.cleared', callback);

      eventEmitter.emit('lines.cleared', {
        lines: [15, 16],
        count: 2,
        type: 'double',
        score: 300,
        tspin: false,
      });

      expect(callback).toHaveBeenCalledWith({
        name: 'lines.cleared',
        data: {
          lines: [15, 16],
          count: 2,
          type: 'double',
          score: 300,
          tspin: false,
        },
        timestamp: expect.any(Number),
      });
    });

    test('T-Spinイベントが正しく配信される', () => {
      const callback = jest.fn();
      eventEmitter.on('t-spin.achieved', callback);

      eventEmitter.emit('t-spin.achieved', {
        type: 't-spin-triple',
        score: 1600,
        position: { x: 4, y: 18 },
      });

      expect(callback).toHaveBeenCalledWith({
        name: 't-spin.achieved',
        data: {
          type: 't-spin-triple',
          score: 1600,
          position: { x: 4, y: 18 },
        },
        timestamp: expect.any(Number),
      });
    });

    test('Perfect Clearイベントが正しく配信される', () => {
      const callback = jest.fn();
      eventEmitter.on('perfect-clear.achieved', callback);

      eventEmitter.emit('perfect-clear.achieved', {
        type: 'perfect-clear-tetris',
        score: 2000,
        linesCleared: 4,
      });

      expect(callback).toHaveBeenCalledWith({
        name: 'perfect-clear.achieved',
        data: {
          type: 'perfect-clear-tetris',
          score: 2000,
          linesCleared: 4,
        },
        timestamp: expect.any(Number),
      });
    });

    test('レベルアップイベントが正しく配信される', () => {
      const callback = jest.fn();
      eventEmitter.on('level.up', callback);

      eventEmitter.emit('level.up', {
        newLevel: 5,
        oldLevel: 4,
        reason: 'lines',
      });

      expect(callback).toHaveBeenCalledWith({
        name: 'level.up',
        data: {
          newLevel: 5,
          oldLevel: 4,
          reason: 'lines',
        },
        timestamp: expect.any(Number),
      });
    });

    test('ゲームオーバーイベントが正しく配信される', () => {
      const callback = jest.fn();
      eventEmitter.on('game.ended', callback);

      eventEmitter.emit('game.ended', {
        score: 15000,
        level: 8,
        lines: 45,
        time: 120000,
        statistics: {
          totalGames: 5,
          highScore: 15000,
        },
      });

      expect(callback).toHaveBeenCalledWith({
        name: 'game.ended',
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
        timestamp: expect.any(Number),
      });
    });
  });
});
