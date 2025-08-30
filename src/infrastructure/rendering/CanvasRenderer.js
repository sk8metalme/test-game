/**
 * CanvasRenderer.js - Canvas描画エンジン
 *
 * オニオンアーキテクチャ: Infrastructure Layer
 *
 * 責任:
 * - ゲームボードの描画
 * - テトロミノピースの描画
 * - UI要素の描画
 * - アニメーション効果
 * - パフォーマンス最適化
 *
 * @tdd-development-expert との協力実装
 */

export default class CanvasRenderer {
  /**
   * コンストラクタ
   * @param {HTMLCanvasElement} canvas - Canvas要素
   */
  constructor(canvas) {
    if (!canvas) {
      throw new Error('Invalid canvas element');
    }

    this.canvas = canvas;
    this.context = canvas.getContext('2d');

    this._initializeConfig();
    this._initializeTheme();
    this._initializeState();
    this._setupEventListeners();
  }

  // === パブリックメソッド ===

  /**
   * ゲームボードを描画
   * @param {Array<Array<number>>} board - ボードデータ（20x10）
   */
  drawBoard(board) {
    try {
      if (this.state.doubleBuffering && this.state.offscreenCanvas) {
        // ダブルバッファリングを使用
        this._drawBoardToOffscreen(board);
        this._copyToMainCanvas();
      } else {
        // 通常の描画
        this._clearCanvas();
        this._drawBoardBackground();
        this._drawBoardGrid();
        this._drawBoardCells(board);
        this._drawBoardBorder();
      }
    } catch (error) {
      this._handleError('drawBoard', error);
    }
  }

  /**
   * テトロミノピースを描画
   * @param {Object} piece - ピースオブジェクト
   */
  drawPiece(piece) {
    try {
      if (!piece || !piece.shape) return;

      this.context.save();

      // ピースの色を設定
      this._setPieceColor(piece.type);

      // ピースの位置と回転を適用
      const centerX = this.config.boardOffsetX + piece.x * this.config.cellSize;
      const centerY = this.config.boardOffsetY + piece.y * this.config.cellSize;

      this.context.translate(
        centerX + (piece.shape[0].length * this.config.cellSize) / 2,
        centerY + (piece.shape.length * this.config.cellSize) / 2
      );
      this.context.rotate((piece.rotation * Math.PI) / 2);

      // ピースの形状を描画
      this._drawPieceShape(piece.shape);

      this.context.restore();
    } catch (error) {
      this._handleError('drawPiece', error);
    }
  }

  /**
   * ゴーストピースを描画
   * @param {Object} piece - ゴーストピースオブジェクト
   */
  drawGhostPiece(piece) {
    try {
      if (!piece || !piece.shape) return;

      this.context.save();

      // ゴーストピース用のスタイル設定
      this.context.strokeStyle = this.theme.ghostPieceColor;
      this.context.lineWidth = 2;
      this.context.setLineDash([5, 5]);

      const centerX = this.config.boardOffsetX + piece.x * this.config.cellSize;
      const centerY = this.config.boardOffsetY + piece.y * this.config.cellSize;

      this.context.translate(
        centerX + (piece.shape[0].length * this.config.cellSize) / 2,
        centerY + (piece.shape.length * this.config.cellSize) / 2
      );
      this.context.rotate((piece.rotation * Math.PI) / 2);

      // ゴーストピースの形状を描画（枠線のみ）
      this._drawPieceOutline(piece.shape);

      this.context.restore();
      this.context.setLineDash([]);
    } catch (error) {
      this._handleError('drawGhostPiece', error);
    }
  }

  /**
   * スコア情報を描画
   * @param {number} score - スコア
   * @param {number} level - レベル
   * @param {number} lines - ライン数
   */
  drawScore(score, level, lines) {
    try {
      const x = this.config.boardOffsetX + this.config.boardWidth + 20;
      const y = 100;

      // スコア
      this.context.fillStyle = this.theme.textColor;
      this.context.font = '24px Arial';
      this.context.fillText(`Score: ${score.toLocaleString()}`, x, y);

      // レベル
      this.context.font = '20px Arial';
      this.context.fillText(`Level: ${level}`, x, y + 40);

      // ライン数
      this.context.fillText(`Lines: ${lines}`, x, y + 80);

      // アウトライン
      this.context.strokeStyle = this.theme.textOutlineColor;
      this.context.lineWidth = 2;
      this.context.strokeText(`Score: ${score.toLocaleString()}`, x, y);
      this.context.strokeText(`Level: ${level}`, x, y + 40);
      this.context.strokeText(`Lines: ${lines}`, x, y + 80);
    } catch (error) {
      this._handleError('drawScore', error);
    }
  }

  /**
   * レベル情報を描画
   * @param {number} level - レベル
   */
  drawLevel(level) {
    try {
      const x = this.config.boardOffsetX + this.config.boardWidth + 20;
      const y = 200;

      this.context.fillStyle = this.theme.levelColor;
      this.context.font = '28px Arial';
      this.context.fillText(`LEVEL ${level}`, x, y);
    } catch (error) {
      this._handleError('drawLevel', error);
    }
  }

  /**
   * ライン数を描画
   * @param {number} lines - ライン数
   */
  drawLines(lines) {
    try {
      const x = this.config.boardOffsetX + this.config.boardWidth + 20;
      const y = 250;

      this.context.fillStyle = this.theme.textColor;
      this.context.font = '20px Arial';
      this.context.fillText(`Lines: ${lines}`, x, y);
    } catch (error) {
      this._handleError('drawLines', error);
    }
  }

  /**
   * 次のピースを描画
   * @param {Object} nextPiece - 次のピース
   */
  drawNextPiece(nextPiece) {
    try {
      if (!nextPiece || !nextPiece.shape) return;

      const x = this.config.boardOffsetX + this.config.boardWidth + 20;
      const y = 300;

      // タイトル
      this.context.fillStyle = this.theme.textColor;
      this.context.font = '18px Arial';
      this.context.fillText('Next:', x, y);

      // ピース描画
      this.context.save();
      this.context.translate(x + 50, y + 30);

      this._setPieceColor(nextPiece.type);
      this._drawPieceShape(nextPiece.shape);

      this.context.restore();
    } catch (error) {
      this._handleError('drawNextPiece', error);
    }
  }

  /**
   * ゲームオーバー画面を描画
   * @param {number} finalScore - 最終スコア
   */
  drawGameOver(finalScore) {
    try {
      // 半透明の背景
      this.context.fillStyle = 'rgba(0, 0, 0, 0.8)';
      this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // ゲームオーバーテキスト
      this.context.fillStyle = this.theme.gameOverColor;
      this.context.font = '48px Arial';
      this.context.textAlign = 'center';

      const centerX = this.canvas.width / 2;
      const centerY = this.canvas.height / 2;

      this.context.fillText('GAME OVER', centerX, centerY - 50);

      // 最終スコア
      this.context.font = '24px Arial';
      this.context.fillText(`Final Score: ${finalScore.toLocaleString()}`, centerX, centerY + 20);

      // アウトライン描画
      this.context.strokeStyle = this.theme.textOutlineColor;
      this.context.lineWidth = 2;
      this.context.strokeText('GAME OVER', centerX, centerY - 50);
      this.context.strokeText(`Final Score: ${finalScore.toLocaleString()}`, centerX, centerY + 20);

      // リセット
      this.context.textAlign = 'left';
    } catch (error) {
      this._handleError('drawGameOver', error);
    }
  }

  /**
   * 一時停止画面を描画
   */
  drawPause() {
    try {
      // 半透明の背景
      this.context.fillStyle = 'rgba(0, 0, 0, 0.6)';
      this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // 一時停止テキスト
      this.context.fillStyle = this.theme.pauseColor;
      this.context.font = '36px Arial';
      this.context.textAlign = 'center';

      const centerX = this.canvas.width / 2;
      const centerY = this.canvas.height / 2;

      this.context.fillText('PAUSED', centerX, centerY);

      // リセット
      this.context.textAlign = 'left';
    } catch (error) {
      this._handleError('drawPause', error);
    }
  }

  /**
   * ラインクリアアニメーションを描画
   * @param {Array<number>} lines - クリアされるライン番号
   */
  drawLineClearAnimation(lines) {
    try {
      lines.forEach(lineY => {
        const y = this.config.boardOffsetY + lineY * this.config.cellSize;

        // フラッシュ効果
        this.context.fillStyle = this.theme.lineClearColor;
        this.context.fillRect(
          this.config.boardOffsetX,
          y,
          this.config.boardWidth,
          this.config.cellSize
        );

        // 枠線
        this.context.strokeStyle = this.theme.lineClearBorderColor;
        this.context.lineWidth = 3;
        this.context.strokeRect(
          this.config.boardOffsetX,
          y,
          this.config.boardWidth,
          this.config.cellSize
        );
      });
    } catch (error) {
      this._handleError('drawLineClearAnimation', error);
    }
  }

  /**
   * ピース落下アニメーションを描画
   * @param {Object} piece - ピースオブジェクト
   * @param {number} progress - 落下進行度（0-1）
   */
  drawDropAnimation(piece, progress) {
    try {
      if (!piece || !piece.shape) return;

      this.context.save();

      // 透明度を設定
      this.context.globalAlpha = 0.7;

      // ピースの色を設定
      this._setPieceColor(piece.type);

      // 落下位置を計算
      const centerX = this.config.boardOffsetX + piece.x * this.config.cellSize;
      const centerY = this.config.boardOffsetY + piece.y * this.config.cellSize;
      const dropOffset = progress * this.config.cellSize;

      this.context.translate(
        centerX + (piece.shape[0].length * this.config.cellSize) / 2,
        centerY + dropOffset + (piece.shape.length * this.config.cellSize) / 2
      );
      this.context.rotate((piece.rotation * Math.PI) / 2);

      // ピースの形状を描画
      this._drawPieceShape(piece.shape);

      this.context.restore();
    } catch (error) {
      this._handleError('drawDropAnimation', error);
    }
  }

  /**
   * パーティクルエフェクトを描画
   * @param {Array<Object>} particles - パーティクル配列
   */
  drawParticles(particles) {
    try {
      particles.forEach(particle => {
        this.context.save();

        // パーティクルの透明度
        this.context.globalAlpha = particle.life;

        // パーティクルの色
        this.context.fillStyle = this.theme.particleColor;

        // パーティクルを描画
        this.context.beginPath();
        this.context.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
        this.context.fill();

        this.context.restore();
      });
    } catch (error) {
      this._handleError('drawParticles', error);
    }
  }

  /**
   * ダブルバッファリングを有効化
   */
  enableDoubleBuffering() {
    try {
      this.state.doubleBuffering = true;
      this._createOffscreenCanvas();
    } catch (error) {
      this._handleError('enableDoubleBuffering', error);
    }
  }

  /**
   * 最適化されたボード描画
   * @param {Array<Array<number>>} board - ボードデータ
   * @param {Array<Array<number>>} changedCells - 変更されたセルの座標
   */
  drawBoardOptimized(board, changedCells) {
    try {
      if (!changedCells || changedCells.length === 0) return;

      changedCells.forEach(([y, x]) => {
        if (y >= 0 && y < board.length && x >= 0 && x < board[0].length) {
          const cellX = this.config.boardOffsetX + x * this.config.cellSize;
          const cellY = this.config.boardOffsetY + y * this.config.cellSize;

          if (board[y][x] > 0) {
            // ピースセルを描画
            this._setPieceColor(board[y][x]);
            this.context.fillRect(cellX, cellY, this.config.cellSize, this.config.cellSize);
            this.context.strokeRect(cellX, cellY, this.config.cellSize, this.config.cellSize);
          } else {
            // 空セルを描画
            this.context.fillStyle = this.theme.backgroundColor;
            this.context.fillRect(cellX, cellY, this.config.cellSize, this.config.cellSize);
          }
        }
      });
    } catch (error) {
      this._handleError('drawBoardOptimized', error);
    }
  }

  /**
   * フレームレート制限を設定
   * @param {number} fps - フレームレート
   */
  setFrameRateLimit(fps) {
    this.state.frameRateLimit = fps;
    this.state.frameInterval = 1000 / fps;
  }

  /**
   * フレームを描画
   */
  drawFrame() {
    try {
      const now = performance.now();

      if (this.state.frameRateLimit && now - this.state.lastFrameTime < this.state.frameInterval) {
        return;
      }

      this.state.lastFrameTime = now;

      // フレーム描画処理
      if (this.state.doubleBuffering && this.state.offscreenCanvas) {
        this._drawToOffscreen();
        this._copyToMainCanvas();
      }
    } catch (error) {
      this._handleError('drawFrame', error);
    }
  }

  /**
   * 設定を更新
   * @param {Object} newConfig - 新しい設定
   */
  updateConfig(newConfig) {
    try {
      this.config = { ...this.config, ...newConfig };
      this._updateBoardDimensions();
    } catch (error) {
      this._handleError('updateConfig', error);
    }
  }

  /**
   * テーマを設定
   * @param {Object} theme - 新しいテーマ
   */
  setTheme(theme) {
    try {
      this.theme = { ...this.theme, ...theme };
    } catch (error) {
      this._handleError('setTheme', error);
    }
  }

  /**
   * 設定を取得
   * @returns {Object} 現在の設定
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * テーマを取得
   * @returns {Object} 現在のテーマ
   */
  getTheme() {
    return { ...this.theme };
  }

  /**
   * スクリーン座標をボード座標に変換
   * @param {number} screenX - スクリーンX座標
   * @param {number} screenY - スクリーンY座標
   * @returns {Object} ボード座標
   */
  screenToBoard(screenX, screenY) {
    try {
      const boardX = Math.floor((screenX - this.config.boardOffsetX) / this.config.cellSize);
      const boardY = Math.floor((screenY - this.config.boardOffsetY) / this.config.cellSize);

      return { x: boardX, y: boardY };
    } catch (error) {
      this._handleError('screenToBoard', error);
      return { x: -1, y: -1 };
    }
  }

  /**
   * 16進色をRGBAに変換
   * @param {string} hex - 16進色コード
   * @param {number} alpha - アルファ値
   * @returns {string} RGBA色文字列
   */
  hexToRgba(hex, alpha = 1) {
    try {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);

      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    } catch (error) {
      this._handleError('hexToRgba', error);
      return 'rgba(0, 0, 0, 1)';
    }
  }

  /**
   * テキストの寸法を測定
   * @param {string} text - 測定対象テキスト
   * @returns {Object} テキスト寸法
   */
  measureText(text) {
    try {
      return this.context.measureText(text);
    } catch (error) {
      this._handleError('measureText', error);
      return { width: 0, height: 0 };
    }
  }

  /**
   * リソース解放
   */
  destroy() {
    try {
      this._removeEventListeners();
      this._cleanupOffscreenCanvas();
      this.canvas = null;
      this.context = null;
    } catch (error) {
      this._handleError('destroy', error);
    }
  }

  // === プライベートメソッド ===

  /**
   * 設定を初期化
   * @private
   */
  _initializeConfig() {
    this.config = {
      cellSize: 30,
      boardOffsetX: 50,
      boardOffsetY: 50,
      boardWidth: 300,
      boardHeight: 600,
    };

    this._updateBoardDimensions();
  }

  /**
   * テーマを初期化
   * @private
   */
  _initializeTheme() {
    this.theme = {
      backgroundColor: '#1a1a1a',
      gridColor: '#333333',
      borderColor: '#666666',
      textColor: '#ffffff',
      textOutlineColor: '#000000',
      levelColor: '#00ff00',
      gameOverColor: '#ff0000',
      pauseColor: '#ffff00',
      lineClearColor: '#ffffff',
      lineClearBorderColor: '#ff0000',
      particleColor: '#ffff00',
      ghostPieceColor: '#888888',
      pieceColors: {
        0: '#1a1a1a', // 空セル
        1: '#00f0f0', // Iピース
        2: '#f0f000', // Oピース
        3: '#a000f0', // Tピース
        4: '#f00000', // Sピース
        5: '#00f000', // Zピース
        6: '#f0a000', // Jピース
        7: '#0000f0', // Lピース
      },
    };
  }

  /**
   * 状態を初期化
   * @private
   */
  _initializeState() {
    this.state = {
      doubleBuffering: false,
      frameRateLimit: null,
      frameInterval: null,
      lastFrameTime: 0,
      offscreenCanvas: null,
      offscreenContext: null,
    };
  }

  /**
   * イベントリスナーを設定
   * @private
   */
  _setupEventListeners() {
    // 必要に応じてイベントリスナーを追加
  }

  /**
   * ボード寸法を更新
   * @private
   */
  _updateBoardDimensions() {
    this.config.boardWidth = 10 * this.config.cellSize;
    this.config.boardHeight = 20 * this.config.cellSize;
  }

  /**
   * キャンバスをクリア
   * @private
   */
  _clearCanvas() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * ボード背景を描画
   * @private
   */
  _drawBoardBackground() {
    this.context.fillStyle = this.theme.backgroundColor;
    this.context.fillRect(
      this.config.boardOffsetX,
      this.config.boardOffsetY,
      this.config.boardWidth,
      this.config.boardHeight
    );
  }

  /**
   * ボードグリッドを描画
   * @private
   */
  _drawBoardGrid() {
    this.context.strokeStyle = this.theme.gridColor;
    this.context.lineWidth = 1;

    // 縦線
    for (let x = 0; x <= 10; x++) {
      const screenX = this.config.boardOffsetX + x * this.config.cellSize;
      this.context.beginPath();
      this.context.moveTo(screenX, this.config.boardOffsetY);
      this.context.lineTo(screenX, this.config.boardOffsetY + this.config.boardHeight);
      this.context.stroke();
    }

    // 横線
    for (let y = 0; y <= 20; y++) {
      const screenY = this.config.boardOffsetY + y * this.config.cellSize;
      this.context.beginPath();
      this.context.moveTo(this.config.boardOffsetX, screenY);
      this.context.lineTo(this.config.boardOffsetX + this.config.boardWidth, screenY);
      this.context.stroke();
    }
  }

  /**
   * ボードセルを描画
   * @private
   * @param {Array<Array<number>>} board - ボードデータ
   */
  _drawBoardCells(board) {
    for (let y = 0; y < board.length; y++) {
      for (let x = 0; x < board[y].length; x++) {
        if (board[y][x] > 0) {
          const cellX = this.config.boardOffsetX + x * this.config.cellSize;
          const cellY = this.config.boardOffsetY + y * this.config.cellSize;

          this._setPieceColor(board[y][x]);
          this.context.fillRect(cellX, cellY, this.config.cellSize, this.config.cellSize);
          this.context.strokeRect(cellX, cellY, this.config.cellSize, this.config.cellSize);
        }
      }
    }
  }

  /**
   * ボード境界線を描画
   * @private
   */
  _drawBoardBorder() {
    this.context.strokeStyle = this.theme.borderColor;
    this.context.lineWidth = 3;
    this.context.strokeRect(
      this.config.boardOffsetX,
      this.config.boardOffsetY,
      this.config.boardWidth,
      this.config.boardHeight
    );
  }

  /**
   * ピースの色を設定
   * @private
   * @param {number|string} pieceType - ピースタイプ
   */
  _setPieceColor(pieceType) {
    const color = this.theme.pieceColors[pieceType] || this.theme.pieceColors[1];
    this.context.fillStyle = color;
    this.context.strokeStyle = this.theme.borderColor;
    this.context.lineWidth = 2;
  }

  /**
   * ピースの形状を描画
   * @private
   * @param {Array<Array<number>>} shape - ピース形状
   */
  _drawPieceShape(shape) {
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const cellX = (x - shape[y].length / 2) * this.config.cellSize;
          const cellY = (y - shape.length / 2) * this.config.cellSize;

          this.context.fillRect(cellX, cellY, this.config.cellSize, this.config.cellSize);
          this.context.strokeRect(cellX, cellY, this.config.cellSize, this.config.cellSize);
        }
      }
    }
  }

  /**
   * ピースのアウトラインを描画
   * @private
   * @param {Array<Array<number>>} shape - ピース形状
   */
  _drawPieceOutline(shape) {
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const cellX = (x - shape[y].length / 2) * this.config.cellSize;
          const cellY = (y - shape.length / 2) * this.config.cellSize;

          this.context.strokeRect(cellX, cellY, this.config.cellSize, this.config.cellSize);
        }
      }
    }
  }

  /**
   * オフスクリーンキャンバスを作成
   * @private
   */
  _createOffscreenCanvas() {
    try {
      this.state.offscreenCanvas = document.createElement('canvas');
      this.state.offscreenCanvas.width = this.canvas.width;
      this.state.offscreenCanvas.height = this.canvas.height;
      this.state.offscreenContext = this.state.offscreenCanvas.getContext('2d');
    } catch (error) {
      this._handleError('_createOffscreenCanvas', error);
    }
  }

  /**
   * オフスクリーンキャンバスに描画
   * @private
   */
  _drawToOffscreen() {
    try {
      if (this.state.offscreenContext) {
        // オフスクリーンキャンバスに描画処理を実行
        this.state.offscreenContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // 必要に応じて追加の描画処理
      }
    } catch (error) {
      this._handleError('_drawToOffscreen', error);
    }
  }

  /**
   * オフスクリーンキャンバスにボードを描画
   * @private
   * @param {Array<Array<number>>} board - ボードデータ
   */
  _drawBoardToOffscreen(board) {
    try {
      if (this.state.offscreenContext) {
        this.state.offscreenContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this._drawBoardBackgroundToOffscreen();
        this._drawBoardGridToOffscreen();
        this._drawBoardCellsToOffscreen(board);
        this._drawBoardBorderToOffscreen();
      }
    } catch (error) {
      this._handleError('_drawBoardToOffscreen', error);
    }
  }

  /**
   * オフスクリーンキャンバスにボード背景を描画
   * @private
   */
  _drawBoardBackgroundToOffscreen() {
    this.state.offscreenContext.fillStyle = this.theme.backgroundColor;
    this.state.offscreenContext.fillRect(
      this.config.boardOffsetX,
      this.config.boardOffsetY,
      this.config.boardWidth,
      this.config.boardHeight
    );
  }

  /**
   * オフスクリーンキャンバスにボードグリッドを描画
   * @private
   */
  _drawBoardGridToOffscreen() {
    this.state.offscreenContext.strokeStyle = this.theme.gridColor;
    this.state.offscreenContext.lineWidth = 1;

    // 縦線
    for (let x = 0; x <= 10; x++) {
      const screenX = this.config.boardOffsetX + x * this.config.cellSize;
      this.state.offscreenContext.beginPath();
      this.state.offscreenContext.moveTo(screenX, this.config.boardOffsetY);
      this.state.offscreenContext.lineTo(
        screenX,
        this.config.boardOffsetY + this.config.boardHeight
      );
      this.state.offscreenContext.stroke();
    }

    // 横線
    for (let y = 0; y <= 20; y++) {
      const screenY = this.config.boardOffsetY + y * this.config.cellSize;
      this.state.offscreenContext.beginPath();
      this.state.offscreenContext.moveTo(this.config.boardOffsetX, screenY);
      this.state.offscreenContext.lineTo(
        this.config.boardOffsetX + this.config.boardWidth,
        screenY
      );
      this.state.offscreenContext.stroke();
    }
  }

  /**
   * オフスクリーンキャンバスにボードセルを描画
   * @private
   * @param {Array<Array<number>>} board - ボードデータ
   */
  _drawBoardCellsToOffscreen(board) {
    for (let y = 0; y < board.length; y++) {
      for (let x = 0; x < board[y].length; x++) {
        if (board[y][x] > 0) {
          const cellX = this.config.boardOffsetX + x * this.config.cellSize;
          const cellY = this.config.boardOffsetY + y * this.config.cellSize;

          this._setPieceColorToOffscreen(board[y][x]);
          this.state.offscreenContext.fillRect(
            cellX,
            cellY,
            this.config.cellSize,
            this.config.cellSize
          );
          this.state.offscreenContext.strokeRect(
            cellX,
            cellY,
            this.config.cellSize,
            this.config.cellSize
          );
        }
      }
    }
  }

  /**
   * オフスクリーンキャンバスにボード境界線を描画
   * @private
   */
  _drawBoardBorderToOffscreen() {
    this.state.offscreenContext.strokeStyle = this.theme.borderColor;
    this.state.offscreenContext.lineWidth = 3;
    this.state.offscreenContext.strokeRect(
      this.config.boardOffsetX,
      this.config.boardOffsetY,
      this.config.boardWidth,
      this.config.boardHeight
    );
  }

  /**
   * オフスクリーンキャンバスにピースの色を設定
   * @private
   * @param {number|string} pieceType - ピースタイプ
   */
  _setPieceColorToOffscreen(pieceType) {
    const color = this.theme.pieceColors[pieceType] || this.theme.pieceColors[1];
    this.state.offscreenContext.fillStyle = color;
    this.state.offscreenContext.strokeStyle = this.theme.borderColor;
    this.state.offscreenContext.lineWidth = 2;
  }

  /**
   * メインキャンバスにコピー
   * @private
   */
  _copyToMainCanvas() {
    try {
      if (this.state.offscreenCanvas) {
        // オフスクリーンキャンバスの内容をメインキャンバスにコピー
        const imageData = this.state.offscreenContext.getImageData(
          0,
          0,
          this.canvas.width,
          this.canvas.height
        );
        this.context.putImageData(imageData, 0, 0);
      }
    } catch (error) {
      this._handleError('_copyToMainCanvas', error);
    }
  }

  /**
   * イベントリスナーを削除
   * @private
   */
  _removeEventListeners() {
    try {
      if (this.canvas && this.canvas.removeEventListener) {
        // 必要に応じてイベントリスナーの削除処理
        this.canvas.removeEventListener('resize', this._handleResize);
      }
    } catch (error) {
      this._handleError('_removeEventListeners', error);
    }
  }

  /**
   * オフスクリーンキャンバスをクリーンアップ
   * @private
   */
  _cleanupOffscreenCanvas() {
    if (this.state.offscreenCanvas) {
      this.state.offscreenCanvas = null;
      this.state.offscreenContext = null;
    }
  }

  /**
   * エラーハンドリング
   * @private
   * @param {string} method - メソッド名
   * @param {Error} error - エラーオブジェクト
   */
  _handleError(method, error) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error(`CanvasRenderer.${method} error:`, error);
    }
  }
}
