/**
 * ゲーム操作用E2Eテストヘルパー
 * ゲームプレイの自動化とテスト機能を提供
 */

import { BaseHelper } from './BaseHelper.js';

export class GameTestHelper extends BaseHelper {
  constructor(page) {
    super(page);
  }

  /**
   * ゲーム初期化完了を待機
   */
  async waitForGameReady(timeout = this.config.waitFor.gameInit) {
    console.log('🎮 ゲーム初期化待機中...');

    const success = await this.waitForFunction(
      () => window.debugInfo && window.debugInfo.initializationComplete,
      { timeout }
    );

    if (!success) {
      throw new Error('ゲーム初期化がタイムアウトしました');
    }

    console.log('✅ ゲーム初期化完了');
    return true;
  }

  /**
   * ゲーム開始
   */
  async startGame() {
    await this.waitForGameReady();

    // ゲーム開始ボタンがあれば押す（UI実装状況による）
    const startButton = await this.page.$('#start-button, .start-game, [data-testid="start-game"]');
    if (startButton) {
      await this.safeClick('#start-button, .start-game, [data-testid="start-game"]');
      console.log('🎮 ゲーム開始');
    }

    return true;
  }

  /**
   * ピース移動
   */
  async movePiece(direction, steps = 1) {
    const keyMap = {
      left: 'ArrowLeft',
      right: 'ArrowRight',
      down: 'ArrowDown',
    };

    const key = keyMap[direction];
    if (!key) {
      throw new Error(`無効な方向: ${direction}`);
    }

    for (let i = 0; i < steps; i++) {
      await this.page.keyboard.press(key);
      await this.sleep(50); // 操作間隔
    }

    console.log(`🕹️ ピース移動: ${direction} x${steps}`);
  }

  /**
   * ピース回転
   */
  async rotatePiece(direction = 'clockwise') {
    const key = direction === 'clockwise' ? 'ArrowUp' : 'KeyZ';
    await this.page.keyboard.press(key);
    await this.sleep(50);

    console.log(`🔄 ピース回転: ${direction}`);
  }

  /**
   * ハードドロップ
   */
  async hardDrop() {
    await this.page.keyboard.press('Space');
    await this.sleep(100); // ドロップ完了待ち

    console.log('⬇️ ハードドロップ');
  }

  /**
   * ライン削除のトリガー
   */
  async triggerLineClear(lines = 1) {
    console.log(`🎯 ${lines}ライン削除をトリガー`);

    // テスト用のゲーム状態設定
    await this.page.evaluate(lineCount => {
      if (window.tetrisGame && window.tetrisGame.gameLogic) {
        // テスト用のライン削除トリガー
        const gameLogic = window.tetrisGame.gameLogic;
        if (gameLogic.triggerTestLineClear) {
          gameLogic.triggerTestLineClear(lineCount);
        }
      }
    }, lines);

    return true;
  }

  /**
   * エフェクト完了待機
   */
  async waitForEffect(effectName, timeout = this.config.waitFor.effectComplete) {
    console.log(`✨ エフェクト完了待機: ${effectName}`);

    const success = await this.waitForFunction(
      name => {
        const manager = window.game?.effectManager || window.tetrisGame?.effectManager;
        if (!manager) return false;

        // エフェクトが開始され、完了したかチェック
        const activeEffects = manager.getActiveEffects?.() || [];
        const targetEffect = activeEffects.find(e => e.name === name || e.type === name);

        return targetEffect ? targetEffect.isComplete === true : true;
      },
      { timeout },
      effectName
    );

    if (success) {
      console.log(`✅ エフェクト完了: ${effectName}`);
    } else {
      console.warn(`⚠️ エフェクト待機タイムアウト: ${effectName}`);
    }

    return success;
  }

  /**
   * ゲーム状態の取得
   */
  async getGameState() {
    return await this.page.evaluate(() => {
      const game = window.tetrisGame || window.game;
      if (!game) return null;

      return {
        level: game.gameState?.level || 1,
        lines: game.gameState?.lines || 0,
        score: game.gameState?.score || 0,
        isPlaying: game.isPlaying || false,
        isPaused: game.isPaused || false,
      };
    });
  }

  /**
   * ボード状態の取得
   */
  async getBoardState() {
    return await this.page.evaluate(() => {
      const game = window.tetrisGame || window.game;
      if (!game || !game.board) return null;

      return {
        width: game.board.width || 10,
        height: game.board.height || 20,
        hasActivePiece: !!game.board.currentPiece,
        filledCells: game.board.getFilledCellCount?.() || 0,
      };
    });
  }

  /**
   * 長時間プレイのシミュレーション
   */
  async simulateExtendedPlay(durationSeconds = 60) {
    console.log(`🎮 ${durationSeconds}秒間のプレイシミュレーション開始`);

    const startTime = Date.now();
    const endTime = startTime + durationSeconds * 1000;
    let moveCount = 0;

    while (Date.now() < endTime) {
      // ランダムな操作を実行
      const actions = ['left', 'right', 'rotate', 'drop'];
      const action = actions[Math.floor(Math.random() * actions.length)];

      try {
        switch (action) {
          case 'left':
          case 'right':
            await this.movePiece(action, Math.floor(Math.random() * 3) + 1);
            break;
          case 'rotate':
            await this.rotatePiece();
            break;
          case 'drop':
            await this.hardDrop();
            break;
        }
        moveCount++;
      } catch (error) {
        console.warn(`⚠️ プレイシミュレーション中のエラー: ${error.message}`);
      }

      // 操作間隔
      await this.sleep(Math.random() * 200 + 100);
    }

    console.log(`✅ プレイシミュレーション完了: ${moveCount}回の操作`);
    return moveCount;
  }

  /**
   * テスト用のゲーム状態設定
   */
  async setupTestGameState(stateConfig) {
    return await this.page.evaluate(config => {
      const game = window.tetrisGame || window.game;
      if (!game) return false;

      try {
        // レベル設定
        if (config.level && game.gameState) {
          game.gameState.level = config.level;
        }

        // スコア設定
        if (config.score && game.gameState) {
          game.gameState.score = config.score;
        }

        // ライン数設定
        if (config.lines && game.gameState) {
          game.gameState.lines = config.lines;
        }

        return true;
      } catch (error) {
        console.error('ゲーム状態設定エラー:', error);
        return false;
      }
    }, stateConfig);
  }
}
