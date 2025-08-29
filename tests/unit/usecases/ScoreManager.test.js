/**
 * ScoreManager.test.js - スコア計算とレベル管理システムのユニットテスト
 * 
 * @tdd-development-expert との協力実装
 * TDDアプローチ: RED -> GREEN -> REFACTOR
 */

import ScoreManager from '../../../src/core/usecases/ScoreManager.js';
import { GameState } from '../../../src/core/entities/GameState.js';

describe('ScoreManager', () => {
  let scoreManager;
  let gameState;

  beforeEach(() => {
    gameState = new GameState();
    scoreManager = new ScoreManager(gameState);
  });

  describe('初期化', () => {
    test('ScoreManagerが正しく初期化される', () => {
      expect(scoreManager).toBeDefined();
      expect(scoreManager.gameState).toBe(gameState);
    });

    test('スコア倍率テーブルが設定されている', () => {
      const multipliers = scoreManager.getScoreMultipliers();
      expect(multipliers).toBeDefined();
      expect(multipliers.single).toBeDefined();
      expect(multipliers.double).toBeDefined();
      expect(multipliers.triple).toBeDefined();
      expect(multipliers.tetris).toBeDefined();
    });
  });

  describe('ライン削除スコア計算', () => {
    test('シングルライン削除のスコア計算', () => {
      const result = scoreManager.calculateLineScore(1);
      
      expect(result.baseScore).toBe(100);
      expect(result.levelMultiplier).toBe(1);
      expect(result.totalScore).toBe(100);
      expect(result.lineType).toBe('single');
    });

    test('ダブルライン削除のスコア計算', () => {
      const result = scoreManager.calculateLineScore(2);
      
      expect(result.baseScore).toBe(300);
      expect(result.levelMultiplier).toBe(1);
      expect(result.totalScore).toBe(300);
      expect(result.lineType).toBe('double');
    });

    test('トリプルライン削除のスコア計算', () => {
      const result = scoreManager.calculateLineScore(3);
      
      expect(result.baseScore).toBe(500);
      expect(result.levelMultiplier).toBe(1);
      expect(result.totalScore).toBe(500);
      expect(result.lineType).toBe('triple');
    });

    test('テトリス（4ライン）削除のスコア計算', () => {
      const result = scoreManager.calculateLineScore(4);
      
      expect(result.baseScore).toBe(800);
      expect(result.levelMultiplier).toBe(1);
      expect(result.totalScore).toBe(800);
      expect(result.lineType).toBe('tetris');
    });

    test('レベル倍率が適用される', () => {
      gameState.setLevel(5);
      const result = scoreManager.calculateLineScore(1);
      
      expect(result.baseScore).toBe(100);
      expect(result.levelMultiplier).toBe(5);
      expect(result.totalScore).toBe(500);
    });

    test('0ライン削除の場合は0スコア', () => {
      const result = scoreManager.calculateLineScore(0);
      
      expect(result.baseScore).toBe(0);
      expect(result.totalScore).toBe(0);
      expect(result.lineType).toBe('none');
    });

    test('無効なライン数（負の値）の処理', () => {
      const result = scoreManager.calculateLineScore(-1);
      
      expect(result.baseScore).toBe(0);
      expect(result.totalScore).toBe(0);
      expect(result.lineType).toBe('none');
    });

    test('無効なライン数（5以上）の処理', () => {
      const result = scoreManager.calculateLineScore(5);
      
      expect(result.baseScore).toBe(0);
      expect(result.totalScore).toBe(0);
      expect(result.lineType).toBe('none');
    });
  });

  describe('ドロップスコア計算', () => {
    test('ソフトドロップスコア計算', () => {
      const result = scoreManager.calculateSoftDropScore(5);
      
      expect(result.baseScore).toBe(5); // 1セル = 1ポイント
      expect(result.totalScore).toBe(5);
      expect(result.dropType).toBe('soft');
    });

    test('ハードドロップスコア計算', () => {
      const result = scoreManager.calculateHardDropScore(10);
      
      expect(result.baseScore).toBe(20); // 1セル = 2ポイント
      expect(result.totalScore).toBe(20);
      expect(result.dropType).toBe('hard');
    });

    test('ソフトドロップ0距離の処理', () => {
      const result = scoreManager.calculateSoftDropScore(0);
      
      expect(result.baseScore).toBe(0);
      expect(result.totalScore).toBe(0);
    });

    test('ハードドロップ0距離の処理', () => {
      const result = scoreManager.calculateHardDropScore(0);
      
      expect(result.baseScore).toBe(0);
      expect(result.totalScore).toBe(0);
    });

    test('負の距離の処理', () => {
      const softResult = scoreManager.calculateSoftDropScore(-1);
      const hardResult = scoreManager.calculateHardDropScore(-1);
      
      expect(softResult.baseScore).toBe(0);
      expect(hardResult.baseScore).toBe(0);
    });
  });

  describe('コンボスコア計算', () => {
    test('コンボ0の場合はボーナスなし', () => {
      const result = scoreManager.calculateComboScore(0);
      
      expect(result.comboLevel).toBe(0);
      expect(result.bonusScore).toBe(0);
    });

    test('コンボ1の場合はボーナスあり', () => {
      const result = scoreManager.calculateComboScore(1);
      
      expect(result.comboLevel).toBe(1);
      expect(result.bonusScore).toBeGreaterThan(0);
    });

    test('コンボレベルに応じてボーナス増加', () => {
      const combo1 = scoreManager.calculateComboScore(1);
      const combo5 = scoreManager.calculateComboScore(5);
      const combo10 = scoreManager.calculateComboScore(10);
      
      expect(combo5.bonusScore).toBeGreaterThan(combo1.bonusScore);
      expect(combo10.bonusScore).toBeGreaterThan(combo5.bonusScore);
    });

    test('レベル倍率がコンボにも適用される', () => {
      gameState.setLevel(3);
      const result = scoreManager.calculateComboScore(5);
      
      expect(result.levelMultiplier).toBe(3);
      expect(result.totalScore).toBe(result.bonusScore * 3);
    });
  });

  describe('T-Spinスコア計算', () => {
    test('T-Spin Mini（1ライン）のスコア', () => {
      const result = scoreManager.calculateTSpinScore(1, true);
      
      expect(result.tSpinType).toBe('mini');
      expect(result.linesCleared).toBe(1);
      expect(result.baseScore).toBeGreaterThan(0);
    });

    test('T-Spin Single（1ライン）のスコア', () => {
      const result = scoreManager.calculateTSpinScore(1, false);
      
      expect(result.tSpinType).toBe('single');
      expect(result.linesCleared).toBe(1);
      expect(result.baseScore).toBeGreaterThan(0);
    });

    test('T-Spin Double（2ライン）のスコア', () => {
      const result = scoreManager.calculateTSpinScore(2, false);
      
      expect(result.tSpinType).toBe('double');
      expect(result.linesCleared).toBe(2);
      expect(result.baseScore).toBeGreaterThan(0);
    });

    test('T-Spin Triple（3ライン）のスコア', () => {
      const result = scoreManager.calculateTSpinScore(3, false);
      
      expect(result.tSpinType).toBe('triple');
      expect(result.linesCleared).toBe(3);
      expect(result.baseScore).toBeGreaterThan(0);
    });

    test('T-SpinはTetrisより高得点', () => {
      const tetrisScore = scoreManager.calculateLineScore(4);
      const tSpinTripleScore = scoreManager.calculateTSpinScore(3, false);
      
      expect(tSpinTripleScore.baseScore).toBeGreaterThan(tetrisScore.baseScore);
    });

    test('T-Spin 0ラインの場合は0スコア', () => {
      const result = scoreManager.calculateTSpinScore(0, false);
      
      expect(result.baseScore).toBe(0);
      expect(result.totalScore).toBe(0);
    });
  });

  describe('パーフェクトクリアボーナス', () => {
    test('パーフェクトクリアボーナス計算', () => {
      const result = scoreManager.calculatePerfectClearBonus(4);
      
      expect(result.bonusType).toBe('perfect_clear');
      expect(result.linesCleared).toBe(4);
      expect(result.bonusScore).toBeGreaterThan(0);
    });

    test('シングルパーフェクトクリア', () => {
      const result = scoreManager.calculatePerfectClearBonus(1);
      
      expect(result.bonusScore).toBeGreaterThan(0);
      expect(result.multiplier).toBeDefined();
    });

    test('テトリスパーフェクトクリア', () => {
      const single = scoreManager.calculatePerfectClearBonus(1);
      const tetris = scoreManager.calculatePerfectClearBonus(4);
      
      expect(tetris.bonusScore).toBeGreaterThan(single.bonusScore);
    });
  });

  describe('レベル進行システム', () => {
    test('初期レベルは1', () => {
      expect(scoreManager.getCurrentLevel()).toBe(1);
    });

    test('10ライン削除でレベルアップ', () => {
      const result = scoreManager.checkLevelUp(10);
      
      expect(result.levelUp).toBe(true);
      expect(result.newLevel).toBe(2);
      expect(result.linesForNext).toBe(10); // 次のレベルまで10ライン
    });

    test('レベルアップ後の進行管理', () => {
      gameState.updateLines(15); // 15ライン削除済み
      const result = scoreManager.checkLevelUp(15);
      
      expect(result.levelUp).toBe(true);
      expect(result.newLevel).toBe(2);
    });

    test('レベル倍率の変化', () => {
      const level1Multiplier = scoreManager.getLevelMultiplier(1);
      const level10Multiplier = scoreManager.getLevelMultiplier(10);
      
      expect(level1Multiplier).toBe(1);
      expect(level10Multiplier).toBe(10);
    });

    test('最大レベル制限', () => {
      const maxLevel = scoreManager.getMaxLevel();
      const result = scoreManager.checkLevelUp(9999);
      
      expect(result.newLevel).toBeLessThanOrEqual(maxLevel);
    });

    test('落下速度の計算', () => {
      const level1Speed = scoreManager.calculateDropSpeed(1);
      const level10Speed = scoreManager.calculateDropSpeed(10);
      
      expect(level1Speed).toBeGreaterThan(level10Speed); // レベルが高いほど速い（間隔短い）
      expect(level1Speed).toBeGreaterThan(0);
      expect(level10Speed).toBeGreaterThan(0);
    });
  });

  describe('総合スコア計算', () => {
    test('複数要素を含む総合スコア計算', () => {
      const scoreData = {
        lineScore: { totalScore: 100 },
        softDropScore: { totalScore: 5 },
        hardDropScore: { totalScore: 20 },
        comboScore: { totalScore: 50 },
        tSpinScore: { totalScore: 300 },
        perfectClearBonus: { bonusScore: 500 }
      };
      
      const result = scoreManager.calculateTotalScore(scoreData);
      
      expect(result.totalScore).toBe(975);
      expect(result.breakdown).toBeDefined();
      expect(result.breakdown.lines).toBe(100);
      expect(result.breakdown.softDrop).toBe(5);
      expect(result.breakdown.hardDrop).toBe(20);
      expect(result.breakdown.combo).toBe(50);
      expect(result.breakdown.tSpin).toBe(300);
      expect(result.breakdown.perfectClear).toBe(500);
    });

    test('部分的なスコアデータの処理', () => {
      const scoreData = {
        lineScore: { totalScore: 100 },
        hardDropScore: { totalScore: 20 }
      };
      
      const result = scoreManager.calculateTotalScore(scoreData);
      
      expect(result.totalScore).toBe(120);
      expect(result.breakdown.lines).toBe(100);
      expect(result.breakdown.hardDrop).toBe(20);
      expect(result.breakdown.softDrop).toBe(0);
    });
  });

  describe('統計情報管理', () => {
    test('スコア履歴の記録', () => {
      scoreManager.recordScore('line', 100, { type: 'single' });
      scoreManager.recordScore('hard_drop', 20, { distance: 10 });
      
      const history = scoreManager.getScoreHistory();
      
      expect(history).toHaveLength(2);
      expect(history[0].type).toBe('line');
      expect(history[0].score).toBe(100);
      expect(history[1].type).toBe('hard_drop');
      expect(history[1].score).toBe(20);
    });

    test('レベル進行履歴の記録', () => {
      scoreManager.recordLevelUp(1, 2, 10);
      scoreManager.recordLevelUp(2, 3, 20);
      
      const history = scoreManager.getLevelHistory();
      
      expect(history).toHaveLength(2);
      expect(history[0]).toEqual({
        fromLevel: 1,
        toLevel: 2,
        totalLines: 10,
        timestamp: expect.any(Number)
      });
    });

    test('効率性指標の計算', () => {
      // いくつかのスコアを記録
      scoreManager.recordScore('line', 800, { type: 'tetris' });
      scoreManager.recordScore('line', 100, { type: 'single' });
      
      const efficiency = scoreManager.calculateEfficiency();
      
      expect(efficiency.averageScorePerLine).toBeGreaterThan(0);
      expect(efficiency.tetrisRatio).toBeDefined();
      expect(efficiency.scorePerMinute).toBeDefined();
    });
  });

  describe('エラーハンドリング', () => {
    test('null値の安全な処理', () => {
      const result = scoreManager.calculateLineScore(null);
      
      expect(result.baseScore).toBe(0);
      expect(result.totalScore).toBe(0);
    });

    test('undefined値の安全な処理', () => {
      const result = scoreManager.calculateSoftDropScore(undefined);
      
      expect(result.baseScore).toBe(0);
      expect(result.totalScore).toBe(0);
    });

    test('文字列値の安全な処理', () => {
      const result = scoreManager.calculateLineScore('invalid');
      
      expect(result.baseScore).toBe(0);
      expect(result.totalScore).toBe(0);
    });

    test('極端に大きな値の処理', () => {
      const result = scoreManager.calculateHardDropScore(Number.MAX_SAFE_INTEGER);
      
      expect(result.baseScore).toBeGreaterThan(0);
      expect(result.totalScore).toBeGreaterThan(0);
      expect(Number.isFinite(result.totalScore)).toBe(true);
    });
  });

  describe('パフォーマンス', () => {
    test('大量のスコア計算が効率的に実行される', () => {
      const startTime = performance.now();
      
      // 1000回のスコア計算
      for (let i = 0; i < 1000; i++) {
        scoreManager.calculateLineScore(Math.floor(Math.random() * 4) + 1);
        scoreManager.calculateSoftDropScore(Math.floor(Math.random() * 10));
        scoreManager.calculateHardDropScore(Math.floor(Math.random() * 20));
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(100); // 100ms以内
    });

    test('レベル計算のパフォーマンス', () => {
      const startTime = performance.now();
      
      // 1000回のレベル計算
      for (let i = 0; i < 1000; i++) {
        scoreManager.checkLevelUp(i);
        scoreManager.calculateDropSpeed(Math.floor(i / 10) + 1);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(50); // 50ms以内
    });
  });
});
