/**
 * main.js - テトリスゲームメインアプリケーション
 *
 * オニオンアーキテクチャ: Presentation Layer
 *
 * 責任:
 * - アプリケーション初期化
 * - ゲームループ管理
 * - UI統合
 * - イベントハンドリング
 * - パーティクルシステム統合
 * - パフォーマンス最適化統合
 *
 * @tdd-development-expert との協力実装
 */

import GameUI from './ui/GameUI.js';
import GameLogic from '../core/usecases/GameLogic.js';
import { GameState } from '../core/entities/GameState.js';
import Board from '../core/entities/Board.js';
import KeyboardHandler from '../infrastructure/input/KeyboardHandler.js';
import CanvasRenderer from '../infrastructure/rendering/CanvasRenderer.js';
import OptimizedRenderer from '../infrastructure/rendering/OptimizedRenderer.js';
import GameEventEmitter from '../core/usecases/GameEventEmitter.js';
import ParticleSystem from '../core/usecases/ParticleSystem.js';
import PerformanceOptimizationManager from '../core/usecases/PerformanceOptimizationManager.js';
import PerformanceMonitor from '../core/usecases/PerformanceMonitor.js';
import EffectManager from '../core/usecases/EffectManager.js';
import GameEventIntegrator from '../core/usecases/GameEventIntegrator.js';

export default class TetrisGame {
  /**
   * コンストラクタ
   * @param {HTMLElement} container - ゲームコンテナ要素
   */
  constructor(container) {
    if (!container) {
      throw new Error('Invalid container element');
    }

    this.container = container;
    this.isRunning = false;
    this.gameLoopId = null;
    this.lastFrameTime = 0;
    this.targetFPS = 60;
    this.frameInterval = 1000 / this.targetFPS;

    this._initializeComponents();
    this._setupEventHandlers();
    this._initializeGame();
  }

  // === パブリックメソッド ===

  /**
   * ゲームを開始
   */
  start() {
    try {
      if (this.isRunning) {
        console.warn('Game is already running');
        return;
      }

      this.isRunning = true;
      this.lastFrameTime = performance.now();
      this._startGameLoop();

      // パフォーマンスモニタリング開始
      this.performanceMonitor.startMonitoring();

      console.log('Tetris game started');
    } catch (error) {
      this._handleError('start', error);
    }
  }

  /**
   * ゲームを停止
   */
  stop() {
    try {
      if (!this.isRunning) {
        console.warn('Game is not running');
        return;
      }

      this.isRunning = false;
      if (this.gameLoopId) {
        cancelAnimationFrame(this.gameLoopId);
        this.gameLoopId = null;
      }

      // パフォーマンスモニタリング停止
      this.performanceMonitor.stopMonitoring();

      console.log('Tetris game stopped');
    } catch (error) {
      this._handleError('stop', error);
    }
  }

  /**
   * ゲームを一時停止
   */
  pause() {
    try {
      if (!this.isRunning) {
        return;
      }

      this.gameLogic.pauseGame();
      this.gameUI.setGameState('paused');
      console.log('Game paused');
    } catch (error) {
      this._handleError('pause', error);
    }
  }

  /**
   * ゲームを再開
   */
  resume() {
    try {
      if (!this.isRunning) {
        return;
      }

      this.gameLogic.resumeGame();
      this.gameUI.setGameState('normal');
      console.log('Game resumed');
    } catch (error) {
      this._handleError('resume', error);
    }
  }

  /**
   * ゲームをリセット
   */
  reset() {
    try {
      this.stop();
      this._initializeGame();
      console.log('Game reset');
    } catch (error) {
      this._handleError('reset', error);
    }
  }

  /**
   * ゲーム状態を取得
   * @returns {Object} ゲーム状態
   */
  getGameState() {
    return this.gameState;
  }

  /**
   * ゲーム情報を取得
   * @returns {Object} ゲーム情報
   */
  getGameInfo() {
    return {
      score: this.gameState.score,
      level: this.gameState.level,
      lines: this.gameState.linesCleared,
      nextPiece: (this.gameLogic.getNextPieces && this.gameLogic.getNextPieces()[0]?.type) || 'I',
      currentPiece: this.gameLogic.getCurrentPiece()?.type || 'I',
    };
  }

  /**
   * パフォーマンス情報を取得
   * @returns {Object} パフォーマンス情報
   */
  getPerformanceInfo() {
    // PerformanceMonitorにはgetMetricsが無いので、metricsを直接返す
    return this.performanceMonitor?.metrics || {};
  }

  /**
   * 設定を更新
   * @param {Object} settings - 設定オブジェクト
   */
  updateSettings(settings) {
    try {
      if (settings.difficulty) {
        this.gameLogic.setDifficulty(settings.difficulty);
      }
      if (settings.soundEnabled !== undefined) {
        this.gameState.soundEnabled = settings.soundEnabled;
      }
      if (settings.musicVolume !== undefined) {
        this.gameState.musicVolume = settings.musicVolume;
      }
      if (settings.sfxVolume !== undefined) {
        this.gameState.sfxVolume = settings.sfxVolume;
      }

      console.log('Settings updated:', settings);
    } catch (error) {
      this._handleError('updateSettings', error);
    }
  }

  /**
   * リソース解放
   */
  destroy() {
    try {
      this.stop();
      this._removeEventHandlers();

      if (this.gameUI) {
        this.gameUI.destroy();
      }

      if (this.keyboardHandler) {
        this.keyboardHandler.destroy();
      }

      if (this.renderer) {
        this.renderer.destroy();
      }

      if (this.particleSystem) {
        this.particleSystem.destroy();
      }

      if (this.performanceOptimizer) {
        this.performanceOptimizer.destroy();
      }

      // 【新規】エフェクトシステムの破棄
      if (this.gameEventIntegrator) {
        this.gameEventIntegrator.disconnect();
      }

      if (this.effectManager) {
        this.effectManager.destroy && this.effectManager.destroy();
      }

      console.log('Tetris game destroyed');
    } catch (error) {
      this._handleError('destroy', error);
    }
  }

  // === プライベートメソッド ===

  /**
   * コンポーネントを初期化
   * @private
   */
  _initializeComponents() {
    // ゲーム状態とボード
    this.gameState = new GameState();
    this.board = new Board(10, 20);

    // 【修正】イベントシステムを最初に初期化
    this.eventEmitter = new GameEventEmitter();

    // ゲームロジック（引数順: board, gameState, eventEmitter）
    this.gameLogic = new GameLogic(this.board, this.gameState, this.eventEmitter);

    // UI
    this.gameUI = new GameUI(this.container);

    // 入力ハンドラー（ゲームアクションに紐付け）
    this.keyboardHandler = new KeyboardHandler({
      onMoveLeft: () => this.gameLogic.movePieceLeft(),
      onMoveRight: () => this.gameLogic.movePieceRight(),
      onMoveDown: () => this.gameLogic.movePieceDown(),
      onRotateClockwise: () => this.gameLogic.rotatePieceClockwise(),
      onRotateCounterClockwise: () => this.gameLogic.rotatePieceCounterClockwise(),
      onHardDrop: () => this.gameLogic.hardDrop(),
      onHold: () => this.gameLogic.holdPiece(),
      onPause: () => this.pause(),
      onReset: () => this.reset(),
    });

    // レンダラー（キャンバス生成後に初期化）
    this.canvasRenderer = null;
    this.renderer = null;

    // パーティクルシステム
    this.particleSystem = new ParticleSystem();

    // エフェクトシステム（キャンバス生成後に初期化）
    this.effectManager = null;
    this.gameEventIntegrator = null;

    // パフォーマンス最適化
    this.performanceOptimizer = new PerformanceOptimizationManager();
    this.performanceMonitor = new PerformanceMonitor();

    console.log('Components initialized');
  }

  /**
   * イベントハンドラーを設定
   * @private
   */
  _setupEventHandlers() {
    // UIイベント
    console.log('Setting up event handlers...');
    this.gameUI.onMenuSelect(item => this._handleMenuSelect(item));
    console.log('Menu select callback set');
    this.gameUI.onSettingChange((key, value) => this._handleSettingChange(key, value));
    this.gameUI.onKeyPress(key => this._handleKeyPress(key));
    this.gameUI.onClick(action => this._handleClick(action));

    // キーボードイベントは KeyboardHandler が直接DOMにバインドするため不要

    // ゲームイベント
    this.eventEmitter.on('lineClear', data => this._handleLineClear(data));
    this.eventEmitter.on('tSpin', data => this._handleTSpin(data));
    this.eventEmitter.on('perfectClear', data => this._handlePerfectClear(data));
    this.eventEmitter.on('levelUp', data => this._handleLevelUp(data));
    this.eventEmitter.on('gameOver', data => this._handleGameOver(data));

    // パーティクルイベント: デモ版では完了イベント購読を省略

    console.log('Event handlers setup completed');
  }

  /**
   * ゲームを初期化
   * @private
   */
  _initializeGame() {
    // ゲーム状態リセット
    this.gameState.reset();
    this.board.clear();

    // ゲームロジック初期化（初回ピース準備などはコンストラクタで済むため明示初期化は不要）

    // 【修正】キャンバスIDを統一（#main-canvas）
    let canvas = this.container.querySelector('#main-canvas');
    if (!canvas) {
      // 旧IDのキャンバスがあれば削除
      const oldCanvas = this.container.querySelector('#game-canvas');
      if (oldCanvas) {
        oldCanvas.remove();
      }

      // 新しいキャンバスを作成
      canvas = document.createElement('canvas');
      canvas.id = 'main-canvas';
      this.container.appendChild(canvas);
    }

    if (canvas) {
      // CanvasRenderer/OptimizedRenderer をキャンバスで初期化
      this.canvasRenderer = new CanvasRenderer(canvas);
      this.renderer = new OptimizedRenderer(canvas, { enableDoubleBuffering: true });

      // パーティクルシステムにもキャンバスを設定
      this.particleSystem.setCanvas(canvas);

      // 【新規】EffectManagerとGameEventIntegratorを統合
      try {
        this.effectManager = new EffectManager(canvas);
        this.gameEventIntegrator = new GameEventIntegrator(this.gameLogic, this.effectManager);
        this.gameEventIntegrator.integrate();

        console.log('Effect system integrated successfully');
      } catch (error) {
        console.error('Effect system integration failed:', error);
        // エフェクトシステム統合失敗時も継続可能
      }
    }

    // パフォーマンス最適化は自動開始済みのため明示初期化は不要

    // UI初期化
    this.gameUI.showMenu();

    console.log('Game initialized');
  }

  /**
   * ゲームループを開始
   * @private
   */
  _startGameLoop() {
    const gameLoop = currentTime => {
      if (!this.isRunning) {
        return;
      }

      const deltaTime = currentTime - this.lastFrameTime;

      if (deltaTime >= this.frameInterval) {
        if (this.performanceMonitor && typeof this.performanceMonitor.beginFrame === 'function') {
          this.performanceMonitor.beginFrame();
        }
        this._update(deltaTime);
        this._render();
        this.lastFrameTime = currentTime;
      }

      this.gameLoopId = requestAnimationFrame(gameLoop);
    };

    this.gameLoopId = requestAnimationFrame(gameLoop);
  }

  /**
   * ゲーム更新
   * @private
   * @param {number} deltaTime - フレーム間隔時間
   */
  _update(deltaTime) {
    try {
      // パフォーマンス最適化更新（PerformanceOptimizationManagerは明示update不要）
      if (this.performanceOptimizer && typeof this.performanceOptimizer.update === 'function') {
        this.performanceOptimizer.update(deltaTime);
      }

      // ゲームロジック更新
      if (this.gameState.status === 'PLAYING') {
        this.gameLogic.update(deltaTime);
      }

      // パーティクルシステム更新
      this.particleSystem.update(deltaTime);

      // パフォーマンスモニタリング
      if (this.performanceMonitor && typeof this.performanceMonitor.endFrame === 'function') {
        this.performanceMonitor.endFrame();
      }
    } catch (error) {
      this._handleError('_update', error);
    }
  }

  /**
   * ゲーム描画
   * @private
   */
  _render() {
    try {
      // ゲーム画面の場合のみ描画
      if (this.gameUI.getCurrentScreen() === 'game') {
        // 左カラム（.game-board）内の専用キャンバスにのみ描画する
        const boardContainer = this.container.querySelector('.game-board');
        const sidebar = this.container.querySelector('.game-sidebar');

        // サイドバー内のキャンバスは常に削除（誤描画防止）
        if (sidebar) {
          sidebar.querySelectorAll('canvas').forEach(el => el.remove());
        }

        // 【修正】統一されたキャンバス（#main-canvas）を取得
        let canvas = this.container.querySelector('#main-canvas');
        if (!canvas && boardContainer) {
          canvas = document.createElement('canvas');
          canvas.id = 'main-canvas';
          boardContainer.appendChild(canvas);
        }
        if (canvas) {
          // 旧IDのキャンバスは削除（互換性のため）
          this.container.querySelectorAll('#game-canvas').forEach(el => el.remove());
          canvas.style.display = 'block';
          canvas.style.margin = '0 auto';
          canvas.style.maxWidth = '100%';

          const ctx = canvas.getContext('2d');
          const cellSize = 24;
          const offsetX = 30;
          const offsetY = 30;

          // キャンバスサイズをボードに合わせて調整（左のメイン盤面に固定）
          const desiredWidth = offsetX * 2 + 10 * cellSize;
          const desiredHeight = offsetY * 2 + 20 * cellSize;
          if (canvas.width !== desiredWidth || canvas.height !== desiredHeight) {
            canvas.width = desiredWidth;
            canvas.height = desiredHeight;
          }

          // 背景
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // グリッド
          ctx.strokeStyle = '#222';
          ctx.lineWidth = 1;
          for (let x = 0; x <= 10; x++) {
            ctx.beginPath();
            ctx.moveTo(offsetX + x * cellSize, offsetY);
            ctx.lineTo(offsetX + x * cellSize, offsetY + 20 * cellSize);
            ctx.stroke();
          }
          for (let y = 0; y <= 20; y++) {
            ctx.beginPath();
            ctx.moveTo(offsetX, offsetY + y * cellSize);
            ctx.lineTo(offsetX + 10 * cellSize, offsetY + y * cellSize);
            ctx.stroke();
          }

          // 盤面セル
          const grid = this.board.getState();
          for (let y = 0; y < grid.length; y++) {
            for (let x = 0; x < grid[y].length; x++) {
              if (grid[y][x] > 0) {
                ctx.fillStyle = '#3aa655';
                ctx.fillRect(offsetX + x * cellSize, offsetY + y * cellSize, cellSize, cellSize);
                ctx.strokeStyle = '#0f0';
                ctx.strokeRect(offsetX + x * cellSize, offsetY + y * cellSize, cellSize, cellSize);
              }
            }
          }

          // 現在のピース
          const piece = this.gameLogic.getCurrentPiece();
          if (piece) {
            // 色決定
            const colors = {
              I: '#00f0f0',
              O: '#f0f000',
              T: '#a000f0',
              S: '#f00000',
              Z: '#00f000',
              J: '#f0a000',
              L: '#0000f0',
            };
            ctx.fillStyle = colors[piece.type] || '#999999';
            ctx.strokeStyle = '#0f0';
            ctx.lineWidth = 2;
            const occ = piece.getOccupiedCells();
            for (const cell of occ) {
              const x = piece.position.x + cell.col;
              const y = piece.position.y + cell.row;
              ctx.fillRect(offsetX + x * cellSize, offsetY + y * cellSize, cellSize, cellSize);
              ctx.strokeRect(offsetX + x * cellSize, offsetY + y * cellSize, cellSize, cellSize);
            }
          }

          // パーティクル（任意）
          if (this.particleSystem && typeof this.particleSystem.render === 'function') {
            this.particleSystem.render(canvas);
          }
        }
      }
    } catch (error) {
      this._handleError('_render', error);
    }
  }

  /**
   * メニュー選択ハンドラー
   * @private
   * @param {string} item - 選択されたメニュー項目
   */
  _handleMenuSelect(item) {
    try {
      console.log('Menu selected:', item);
      switch (item.toLowerCase()) {
        case 'start game':
          this.gameUI.showGame();
          this.start();
          this.gameLogic.startGame();
          break;
        case 'settings':
          this.gameUI.showSettings({
            difficulty: this.gameState.difficulty,
            soundEnabled: this.gameState.soundEnabled,
            musicVolume: this.gameState.musicVolume,
            sfxVolume: this.gameState.sfxVolume,
          });
          break;
        case 'high scores':
          this.gameUI.showHighScores(this.gameState.highScores);
          break;
        case 'exit':
          this.stop();
          break;
        default:
          console.warn('Unknown menu item:', item);
      }
    } catch (error) {
      this._handleError('_handleMenuSelect', error);
    }
  }

  /**
   * 設定変更ハンドラー
   * @private
   * @param {string} key - 設定キー
   * @param {*} value - 設定値
   */
  _handleSettingChange(key, value) {
    try {
      this.updateSettings({ [key]: value });
    } catch (error) {
      this._handleError('_handleSettingChange', error);
    }
  }

  /**
   * キー入力ハンドラー
   * @private
   * @param {string} key - キー
   */
  _handleKeyPress(key) {
    try {
      if (this.gameState.status !== 'PLAYING') {
        return;
      }

      switch (key.toLowerCase()) {
        case 'arrowleft':
        case 'a':
          this.gameLogic.movePieceLeft();
          break;
        case 'arrowright':
        case 'd':
          this.gameLogic.movePieceRight();
          break;
        case 'arrowdown':
        case 's':
          this.gameLogic.movePieceDown();
          break;
        case 'arrowup':
        case 'w':
          this.gameLogic.rotatePieceClockwise();
          break;
        case ' ':
        case 'space':
          this.gameLogic.hardDrop();
          break;
        case 'p':
          this.pause();
          break;
        case 'r':
          this.resume();
          break;
        default:
          // その他のキーは無視
          break;
      }
    } catch (error) {
      this._handleError('_handleKeyPress', error);
    }
  }

  /**
   * クリックハンドラー
   * @private
   * @param {string} action - アクション
   */
  _handleClick(action) {
    try {
      switch (action) {
        case 'back':
          this.gameUI.goBack();
          break;
        default:
          console.log('Click action:', action);
      }
    } catch (error) {
      this._handleError('_handleClick', error);
    }
  }

  /**
   * ラインクリアハンドラー
   * @private
   * @param {Object} data - イベントデータ
   */
  _handleLineClear(data) {
    try {
      // パーティクルエフェクト生成
      this.particleSystem.createEffect('lineClear', {
        lines: data.lines,
        position: { x: 5, y: data.y },
        intensity: data.lines,
      });

      // UI更新
      this.gameUI.updateGameInfo(this.getGameInfo());

      console.log('Line clear:', data);
    } catch (error) {
      this._handleError('_handleLineClear', error);
    }
  }

  /**
   * T-Spinハンドラー
   * @private
   * @param {Object} data - イベントデータ
   */
  _handleTSpin(data) {
    try {
      // パーティクルエフェクト生成
      this.particleSystem.createEffect('tSpin', {
        position: data.position,
        intensity: data.type === 'T-Spin Triple' ? 3 : 1,
      });

      console.log('T-Spin:', data);
    } catch (error) {
      this._handleError('_handleTSpin', error);
    }
  }

  /**
   * Perfect Clearハンドラー
   * @private
   * @param {Object} data - イベントデータ
   */
  _handlePerfectClear(data) {
    try {
      // パーティクルエフェクト生成
      this.particleSystem.createEffect('perfectClear', {
        position: { x: 5, y: 10 },
        intensity: 5,
      });

      console.log('Perfect Clear:', data);
    } catch (error) {
      this._handleError('_handlePerfectClear', error);
    }
  }

  /**
   * レベルアップハンドラー
   * @private
   * @param {Object} data - イベントデータ
   */
  _handleLevelUp(data) {
    try {
      // パーティクルエフェクト生成
      this.particleSystem.createEffect('levelUp', {
        position: { x: 5, y: 5 },
        intensity: data.level,
      });

      // UI更新
      this.gameUI.updateGameInfo(this.getGameInfo());

      console.log('Level up:', data);
    } catch (error) {
      this._handleError('_handleLevelUp', error);
    }
  }

  /**
   * ゲームオーバーハンドラー
   * @private
   * @param {Object} data - イベントデータ
   */
  _handleGameOver(data) {
    try {
      // パーティクルエフェクト生成
      this.particleSystem.createEffect('gameOver', {
        position: { x: 5, y: 10 },
        intensity: 3,
      });

      // UI更新
      this.gameUI.setGameState('gameOver');
      this.gameUI.updateGameInfo(this.getGameInfo());

      // ゲーム停止
      this.stop();

      console.log('Game Over:', data);
    } catch (error) {
      this._handleError('_handleGameOver', error);
    }
  }

  /**
   * エフェクト完了ハンドラー
   * @private
   * @param {Object} effect - エフェクトオブジェクト
   */
  _handleEffectComplete(effect) {
    try {
      console.log('Effect completed:', effect.name);
    } catch (error) {
      this._handleError('_handleEffectComplete', error);
    }
  }

  /**
   * イベントハンドラーを削除
   * @private
   */
  _removeEventHandlers() {
    // イベントハンドラーの削除処理
    if (this.keyboardHandler) {
      this.keyboardHandler.removeAllListeners();
    }

    if (this.eventEmitter) {
      this.eventEmitter.removeAllListeners();
    }

    if (this.particleSystem) {
      this.particleSystem.removeAllListeners();
    }
  }

  /**
   * エラーハンドリング
   * @private
   * @param {string} method - メソッド名
   * @param {Error} error - エラーオブジェクト
   */
  _handleError(method, error) {
    console.error(`TetrisGame.${method} error:`, error);

    // ゲームを安全に停止
    if (this.isRunning) {
      this.stop();
    }
  }
}
