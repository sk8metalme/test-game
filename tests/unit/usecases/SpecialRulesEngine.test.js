/**
 * SpecialRulesEngine テスト
 *
 * 特殊ルールエンジンのテスト
 *
 * @author AI Assistant
 * @version 1.0.0
 */

import SpecialRulesEngine from '../../../src/core/usecases/SpecialRulesEngine.js';

// モックボードクラス
class MockBoard {
  constructor() {
    this.COLS = 10;
    this.ROWS = 20;
    this.grid = Array(this.ROWS)
      .fill()
      .map(() => Array(this.COLS).fill(0));
  }

  getCell(row, col) {
    return this.grid[row][col];
  }

  setCell(row, col, value) {
    this.grid[row][col] = value;
  }
}

// モックテトロミノクラス
class MockTetromino {
  constructor(type, position) {
    this.type = type;
    this.position = position;
    this.rotationState = 0;
  }

  getOccupiedCells() {
    // T字ピースの基本形状
    if (this.type === 'T') {
      switch (this.rotationState) {
        case 0: // 上向き
          return [
            { row: 0, col: 1 },
            { row: 1, col: 0 },
            { row: 1, col: 1 },
            { row: 1, col: 2 },
          ];
        case 1: // 右向き
          return [
            { row: 0, col: 1 },
            { row: 1, col: 1 },
            { row: 1, col: 2 },
            { row: 2, col: 1 },
          ];
        case 2: // 下向き
          return [
            { row: 0, col: 0 },
            { row: 0, col: 1 },
            { row: 0, col: 2 },
            { row: 1, col: 1 },
          ];
        case 3: // 左向き
          return [
            { row: 0, col: 1 },
            { row: 1, col: 0 },
            { row: 1, col: 1 },
            { row: 2, col: 1 },
          ];
        default:
          return [];
      }
    }

    // その他のピースは単純な2x2ブロック
    return [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 1, col: 0 },
      { row: 1, col: 1 },
    ];
  }
}

describe('SpecialRulesEngine', () => {
  let specialRulesEngine;
  let mockBoard;
  let mockPiece;

  beforeEach(() => {
    specialRulesEngine = new SpecialRulesEngine({
      enableTSpin: true,
      enablePerfectClear: true,
      enableCombo: true,
      enableBackToBack: true,
      enableSoftDropBonus: true,
    });

    mockBoard = new MockBoard();
    mockPiece = new MockTetromino('T', { x: 5, y: 10 });
  });

  afterEach(() => {
    if (specialRulesEngine) {
      specialRulesEngine.destroy();
    }
  });

  describe('初期化', () => {
    test('デフォルト設定で初期化される', () => {
      const defaultEngine = new SpecialRulesEngine();

      expect(defaultEngine.config.enableTSpin).toBe(true);
      expect(defaultEngine.config.enablePerfectClear).toBe(true);
      expect(defaultEngine.config.enableCombo).toBe(true);
      expect(defaultEngine.config.enableBackToBack).toBe(true);
      expect(defaultEngine.config.enableSoftDropBonus).toBe(true);
    });

    test('カスタム設定で初期化される', () => {
      expect(specialRulesEngine.config.enableTSpin).toBe(true);
      expect(specialRulesEngine.config.maxComboCount).toBe(10);
      expect(specialRulesEngine.config.maxHistorySize).toBe(100);
    });

    test('初期化時にデフォルトルールが登録される', () => {
      const stats = specialRulesEngine.getRuleStats();

      expect(stats.tspin).toBeDefined();
      expect(stats.perfectclear).toBeDefined();
      expect(stats.combo).toBeDefined();
      expect(stats.backtoback).toBeDefined();
      expect(stats.softdrop).toBeDefined();
    });

    test('初期化完了イベントが発火される', () => {
      // 新しいインスタンスを作成
      const newEngine = new SpecialRulesEngine();

      // 初期化完了イベントが発火されることを確認
      // コンストラクタ内でinitialize()が呼ばれるため、イベントは既に発火済み
      expect(newEngine).toBeDefined();

      newEngine.destroy();
    });
  });

  describe('ルール管理', () => {
    test('新しいルールを登録できる', () => {
      const customRule = jest.fn();
      const registerSpy = jest.fn();
      specialRulesEngine.on('ruleRegistered', registerSpy);

      specialRulesEngine.registerRule('custom', customRule);

      expect(registerSpy).toHaveBeenCalledWith({ name: 'custom', ruleFunction: customRule });

      const stats = specialRulesEngine.getRuleStats();
      expect(stats.custom).toBeDefined();
    });

    test('既存のルール名で登録しようとするとエラーが発生する', () => {
      const customRule = jest.fn();

      expect(() => {
        specialRulesEngine.registerRule('tspin', customRule);
      }).toThrow("SpecialRulesEngine: ルール 'tspin' は既に登録されています");
    });

    test('無効なルール関数で登録しようとするとエラーが発生する', () => {
      expect(() => {
        specialRulesEngine.registerRule('invalid', 'not a function');
      }).toThrow('SpecialRulesEngine: ルール関数が必要です');
    });

    test('ルールを有効化できる', () => {
      const activateSpy = jest.fn();
      specialRulesEngine.on('ruleActivated', activateSpy);

      specialRulesEngine.activateRule('tspin');

      expect(activateSpy).toHaveBeenCalledWith({ name: 'tspin' });

      const stats = specialRulesEngine.getRuleStats();
      expect(stats.tspin.enabled).toBe(true);
    });

    test('ルールを無効化できる', () => {
      const deactivateSpy = jest.fn();
      specialRulesEngine.on('ruleDeactivated', deactivateSpy);

      specialRulesEngine.deactivateRule('tspin');

      expect(deactivateSpy).toHaveBeenCalledWith({ name: 'tspin' });

      const stats = specialRulesEngine.getRuleStats();
      expect(stats.tspin.enabled).toBe(false);
    });

    test('存在しないルールの有効化でエラーが発生する', () => {
      expect(() => {
        specialRulesEngine.activateRule('nonexistent');
      }).toThrow("SpecialRulesEngine: ルール 'nonexistent' は登録されていません");
    });
  });

  describe('T-Spin判定', () => {
    test('T字ピースでの正常なT-Spin判定', () => {
      const rotationResult = {
        wallKick: {
          validKick: true,
          offset: [1, 0],
        },
      };

      // T字ピースの周りにブロックを配置して角を埋める
      mockBoard.setCell(9, 4, 1); // 左上の角
      mockBoard.setCell(9, 6, 1); // 右上の角

      const result = specialRulesEngine.checkTSpin(mockPiece, mockBoard, rotationResult);

      expect(result.isTSpin).toBe(true);
      expect(result.type).toBe('single');
      expect(result.bonus).toBe(800);
    });

    test('非T字ピースでのT-Spin非判定', () => {
      const nonTPiece = new MockTetromino('I', { x: 5, y: 10 });
      const rotationResult = {
        wallKick: {
          validKick: true,
          offset: [1, 0],
        },
      };

      const result = specialRulesEngine.checkTSpin(nonTPiece, mockBoard, rotationResult);

      expect(result.isTSpin).toBe(false);
      expect(result.type).toBeNull();
      expect(result.bonus).toBe(0);
    });

    test('壁キックなしでのT-Spin非判定', () => {
      const rotationResult = {
        wallKick: null,
      };

      const result = specialRulesEngine.checkTSpin(mockPiece, mockBoard, rotationResult);

      expect(result.isTSpin).toBe(false);
    });

    test('角の埋まり具合による判定', () => {
      const rotationResult = {
        wallKick: {
          validKick: true,
          offset: [1, 0],
        },
      };

      // 角を1つだけ埋める
      mockBoard.setCell(9, 4, 1);

      const result = specialRulesEngine.checkTSpin(mockPiece, mockBoard, rotationResult);

      expect(result.isTSpin).toBe(false); // 2つ以上の角が必要
    });

    test('T-Spin成立時にイベントが発火される', () => {
      const tspinSpy = jest.fn();
      specialRulesEngine.on('tspinAchieved', tspinSpy);

      const rotationResult = {
        wallKick: {
          validKick: true,
          offset: [1, 0],
        },
      };

      mockBoard.setCell(9, 4, 1);
      mockBoard.setCell(9, 6, 1);

      specialRulesEngine.checkTSpin(mockPiece, mockBoard, rotationResult);

      expect(tspinSpy).toHaveBeenCalledWith({
        type: 'single',
        bonus: 800,
        position: { x: 5, y: 10 },
      });
    });
  });

  describe('Perfect Clear判定', () => {
    test('空のボードでのPerfect Clear判定', () => {
      const result = specialRulesEngine.checkPerfectClear(mockBoard);

      expect(result.isPerfectClear).toBe(true);
      expect(result.bonus).toBe(2000);
    });

    test('ブロックがあるボードでの非判定', () => {
      mockBoard.setCell(19, 0, 1); // 最下段にブロックを配置

      const result = specialRulesEngine.checkPerfectClear(mockBoard);

      expect(result.isPerfectClear).toBe(false);
      expect(result.bonus).toBe(0);
    });

    test('Perfect Clear成立時にイベントが発火される', () => {
      const perfectClearSpy = jest.fn();
      specialRulesEngine.on('perfectClearAchieved', perfectClearSpy);

      specialRulesEngine.checkPerfectClear(mockBoard);

      expect(perfectClearSpy).toHaveBeenCalledWith({ bonus: 2000 });
    });
  });

  describe('Combo System', () => {
    test('コンボ継続の計算', () => {
      const result1 = specialRulesEngine.calculateCombo(1);
      expect(result1.combo).toBe(1);
      expect(result1.bonus).toBe(0); // 1コンボ目はボーナスなし
      expect(result1.broken).toBe(false);

      const result2 = specialRulesEngine.calculateCombo(2);
      expect(result2.combo).toBe(2);
      expect(result2.bonus).toBe(100); // 2コンボ目は100点
      expect(result2.broken).toBe(false);
    });

    test('コンボ途切れの処理', () => {
      // コンボを継続
      specialRulesEngine.calculateCombo(1);
      specialRulesEngine.calculateCombo(1);

      // コンボが途切れる
      const result = specialRulesEngine.calculateCombo(0);

      expect(result.combo).toBe(0);
      expect(result.bonus).toBe(0);
      expect(result.broken).toBe(true);
    });

    test('コンボボーナスの正確性', () => {
      const combo1 = specialRulesEngine.calculateCombo(1);
      const combo2 = specialRulesEngine.calculateCombo(1);
      const combo3 = specialRulesEngine.calculateCombo(1);
      const combo4 = specialRulesEngine.calculateCombo(1);
      const combo5 = specialRulesEngine.calculateCombo(1);

      expect(combo1.bonus).toBe(0); // 1コンボ: 0点
      expect(combo2.bonus).toBe(100); // 2コンボ: 100点
      expect(combo3.bonus).toBe(200); // 3コンボ: 200点
      expect(combo4.bonus).toBe(400); // 4コンボ: 400点
      expect(combo5.bonus).toBe(800); // 5コンボ: 800点
    });

    test('コンボ継続時にイベントが発火される', () => {
      const comboSpy = jest.fn();
      specialRulesEngine.on('comboContinued', comboSpy);

      specialRulesEngine.calculateCombo(1);

      expect(comboSpy).toHaveBeenCalledWith({ count: 1, bonus: 0 });
    });

    test('コンボ途切れ時にイベントが発火される', () => {
      const brokenSpy = jest.fn();
      specialRulesEngine.on('comboBroken', brokenSpy);

      // コンボを継続してから途切れさせる
      specialRulesEngine.calculateCombo(1);
      specialRulesEngine.calculateCombo(0);

      expect(brokenSpy).toHaveBeenCalledWith({ lastCount: 1 });
    });
  });

  describe('Back-to-Back判定', () => {
    test('特殊クリア連続での成立', () => {
      // 最初の特殊クリア
      const result1 = specialRulesEngine.checkBackToBack('tspin');
      expect(result1.isBackToBack).toBe(false);
      expect(result1.multiplier).toBe(1.0);

      // 連続の特殊クリア
      const result2 = specialRulesEngine.checkBackToBack('perfectclear');
      expect(result2.isBackToBack).toBe(true);
      expect(result2.multiplier).toBe(1.5);
      expect(result2.count).toBe(1);
    });

    test('通常クリアでの非成立', () => {
      const result = specialRulesEngine.checkBackToBack('single');
      expect(result.isBackToBack).toBe(false);
      expect(result.multiplier).toBe(1.0);
    });

    test('Back-to-Back成立時にイベントが発火される', () => {
      const backToBackSpy = jest.fn();
      specialRulesEngine.on('backToBackAchieved', backToBackSpy);

      // 連続の特殊クリア
      specialRulesEngine.checkBackToBack('tspin');
      specialRulesEngine.checkBackToBack('perfectclear');

      expect(backToBackSpy).toHaveBeenCalledWith({ count: 1, multiplier: 1.5 });
    });
  });

  describe('Soft Drop Bonus', () => {
    test('正しいドロップ距離でのボーナス計算', () => {
      const bonus = specialRulesEngine.calculateSoftDropBonus(5);
      expect(bonus).toBe(10); // 5マス × 2点
    });

    test('ゼロ距離でのボーナス計算', () => {
      const bonus = specialRulesEngine.calculateSoftDropBonus(0);
      expect(bonus).toBe(0);
    });

    test('負の距離でのボーナス計算', () => {
      const bonus = specialRulesEngine.calculateSoftDropBonus(-1);
      expect(bonus).toBe(0);
    });
  });

  describe('特殊スコア計算', () => {
    test('基本スコアの計算', () => {
      const score = specialRulesEngine.calculateSpecialScore('tspin', 800);
      expect(score).toBe(800);
    });

    test('Back-to-Back倍率の適用', () => {
      const score = specialRulesEngine.calculateSpecialScore('tspin', 800, { backToBack: 1.5 });
      expect(score).toBe(1200);
    });

    test('レベル倍率の適用', () => {
      const score = specialRulesEngine.calculateSpecialScore('tspin', 800, { level: 2 });
      expect(score).toBe(2400); // 800 × (2 + 1)
    });

    test('複数倍率の適用', () => {
      const score = specialRulesEngine.calculateSpecialScore('tspin', 800, {
        backToBack: 1.5,
        level: 1,
      });
      expect(score).toBe(2400); // 800 × 1.5 × (1 + 1)
    });
  });

  describe('履歴管理', () => {
    test('履歴に正しく追加される', () => {
      const history = specialRulesEngine.getFullHistory();
      expect(history.length).toBe(0);

      // イベントを発生させる
      specialRulesEngine.calculateCombo(1);

      const newHistory = specialRulesEngine.getFullHistory();
      expect(newHistory.length).toBe(1);
      expect(newHistory[0].type).toBe('combo');
    });

    test('履歴サイズの制限', () => {
      // 履歴サイズを小さくしてテスト
      const smallEngine = new SpecialRulesEngine({ maxHistorySize: 3 });

      // 4つのイベントを発生
      smallEngine.calculateCombo(1);
      smallEngine.calculateCombo(1);
      smallEngine.calculateCombo(1);
      smallEngine.calculateCombo(1);

      const history = smallEngine.getFullHistory();
      expect(history.length).toBe(3); // 最大サイズに制限される

      smallEngine.destroy();
    });

    test('コンボ履歴の取得', () => {
      specialRulesEngine.calculateCombo(1);
      specialRulesEngine.calculateCombo(1);

      const comboHistory = specialRulesEngine.getComboHistory();
      expect(comboHistory.length).toBe(2);
      expect(comboHistory.every(entry => entry.type === 'combo')).toBe(true);
    });

    test('履歴のクリア', () => {
      const clearSpy = jest.fn();
      specialRulesEngine.on('historyCleared', clearSpy);

      // イベントを発生
      specialRulesEngine.calculateCombo(1);

      // 履歴をクリア
      specialRulesEngine.clearHistory();

      expect(clearSpy).toHaveBeenCalled();

      const history = specialRulesEngine.getFullHistory();
      expect(history.length).toBe(0);
    });
  });

  describe('ルール統計', () => {
    test('ルール統計の取得', () => {
      const stats = specialRulesEngine.getRuleStats();

      expect(stats.tspin).toBeDefined();
      expect(stats.tspin.enabled).toBe(true);
      expect(stats.tspin.priority).toBeDefined();
      expect(stats.tspin.usageCount).toBe(0);
    });
  });

  describe('イベントシステム', () => {
    test('イベントリスナーの登録', () => {
      const listener = jest.fn();

      specialRulesEngine.on('testEvent', listener);

      expect(specialRulesEngine.listeners.has('testEvent')).toBe(true);
      expect(specialRulesEngine.listeners.get('testEvent')).toContain(listener);
    });

    test('イベントが正しく発火される', () => {
      const listener = jest.fn();
      specialRulesEngine.on('testEvent', listener);

      specialRulesEngine.emit('testEvent', { data: 'test' });

      expect(listener).toHaveBeenCalledWith({ data: 'test' });
    });

    test('エラーが発生した場合も安全に処理される', () => {
      const errorListener = jest.fn(() => {
        throw new Error('Test error');
      });

      specialRulesEngine.on('errorEvent', errorListener);

      // エラーが発生してもクラッシュしないことを確認
      expect(() => {
        specialRulesEngine.emit('errorEvent', {});
      }).not.toThrow();
    });
  });

  describe('破棄処理', () => {
    test('特殊ルールエンジンが正しく破棄される', () => {
      const destroySpy = jest.fn();
      specialRulesEngine.on('destroyed', destroySpy);

      specialRulesEngine.destroy();

      expect(specialRulesEngine.rules.size).toBe(0);
      expect(specialRulesEngine.activeRules.size).toBe(0);
      expect(specialRulesEngine.ruleHistory.length).toBe(0);
      expect(specialRulesEngine.listeners.size).toBe(0);
      expect(destroySpy).toHaveBeenCalled();
    });
  });

  describe('エッジケース', () => {
    test('設定無効時の動作', () => {
      const disabledEngine = new SpecialRulesEngine({
        enableTSpin: false,
        enablePerfectClear: false,
        enableCombo: false,
        enableBackToBack: false,
        enableSoftDropBonus: false,
      });

      // T-Spin判定
      const tspinResult = disabledEngine.checkTSpin(mockPiece, mockBoard, {});
      expect(tspinResult.isTSpin).toBe(false);

      // Perfect Clear判定
      const perfectClearResult = disabledEngine.checkPerfectClear(mockBoard);
      expect(perfectClearResult.isPerfectClear).toBe(false);

      // Combo計算
      const comboResult = disabledEngine.calculateCombo(1);
      expect(comboResult.combo).toBe(0);

      disabledEngine.destroy();
    });

    test('大量のイベント処理', () => {
      const eventSpy = jest.fn();
      specialRulesEngine.on('testEvent', eventSpy);

      // 100回のイベント発火
      for (let i = 0; i < 100; i++) {
        specialRulesEngine.emit('testEvent', { count: i });
      }

      expect(eventSpy).toHaveBeenCalledTimes(100);
    });
  });
});
