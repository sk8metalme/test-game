# インターフェース設計書

## 1. 概要

本文書では、テトリス生成AIプロジェクトにおける各層間のインターフェース、API仕様、およびデータ構造について詳細に定義します。オニオンアーキテクチャの原則に従い、依存性逆転の原則を適用したインターフェース設計を行います。

## 2. コア・アプリケーション層インターフェース

### 2.1 IRenderer インターフェース

#### 概要
レンダリング層の抽象化インターフェース。Canvas、WebGL、SVGなど異なる描画技術に対応可能。

```javascript
/**
 * レンダラーインターフェース
 * 描画処理の抽象化を提供
 */
class IRenderer {
    /**
     * レンダラー初期化
     * @param {HTMLCanvasElement} canvas - 描画対象のキャンバス
     * @param {Object} config - レンダリング設定
     * @param {number} config.width - キャンバス幅
     * @param {number} config.height - キャンバス高さ
     * @param {number} config.pixelRatio - ピクセル比率
     * @param {Object} config.theme - テーマ設定
     * @returns {Promise<void>}
     */
    async initialize(canvas, config) {
        throw new Error('IRenderer.initialize must be implemented');
    }

    /**
     * フレーム描画開始
     * @param {number} deltaTime - 前フレームからの経過時間（ms）
     */
    beginFrame(deltaTime) {
        throw new Error('IRenderer.beginFrame must be implemented');
    }

    /**
     * フレーム描画終了
     */
    endFrame() {
        throw new Error('IRenderer.endFrame must be implemented');
    }

    /**
     * 画面クリア
     * @param {string} clearColor - クリア色（CSS色文字列）
     */
    clear(clearColor = '#000000') {
        throw new Error('IRenderer.clear must be implemented');
    }

    /**
     * ゲームボード描画
     * @param {Board} board - ゲームボード
     * @param {Object} options - 描画オプション
     * @param {boolean} options.showGrid - グリッド表示
     * @param {boolean} options.showBorder - 境界線表示
     * @param {number} options.opacity - 透明度
     */
    renderBoard(board, options = {}) {
        throw new Error('IRenderer.renderBoard must be implemented');
    }

    /**
     * テトロミノ描画
     * @param {Tetromino} piece - テトロミノピース
     * @param {Object} position - 描画位置
     * @param {number} position.x - X座標
     * @param {number} position.y - Y座標
     * @param {Object} options - 描画オプション
     * @param {number} options.opacity - 透明度
     * @param {boolean} options.shadow - 影の表示
     * @param {string} options.effect - エフェクト種類
     */
    renderPiece(piece, position, options = {}) {
        throw new Error('IRenderer.renderPiece must be implemented');
    }

    /**
     * ゴーストピース描画
     * @param {Tetromino} piece - テトロミノピース
     * @param {Object} position - ゴースト位置
     * @param {Object} options - 描画オプション
     */
    renderGhost(piece, position, options = {}) {
        throw new Error('IRenderer.renderGhost must be implemented');
    }

    /**
     * 次ピース描画
     * @param {Tetromino[]} pieces - 次ピース配列
     * @param {Object} container - 描画領域
     * @param {Object} options - 描画オプション
     */
    renderNextPieces(pieces, container, options = {}) {
        throw new Error('IRenderer.renderNextPieces must be implemented');
    }

    /**
     * ホールドピース描画
     * @param {Tetromino|null} piece - ホールドピース
     * @param {Object} container - 描画領域
     * @param {Object} options - 描画オプション
     */
    renderHoldPiece(piece, container, options = {}) {
        throw new Error('IRenderer.renderHoldPiece must be implemented');
    }

    /**
     * スコア情報描画
     * @param {Object} scoreData - スコアデータ
     * @param {number} scoreData.score - 現在のスコア
     * @param {number} scoreData.level - 現在のレベル
     * @param {number} scoreData.lines - 消去ライン数
     * @param {number} scoreData.time - 経過時間
     * @param {Object} container - 描画領域
     */
    renderScore(scoreData, container) {
        throw new Error('IRenderer.renderScore must be implemented');
    }

    /**
     * ライン消去エフェクト描画
     * @param {number[]} lines - 消去ライン番号配列
     * @param {number} progress - アニメーション進行度（0-1）
     * @param {Object} options - エフェクトオプション
     */
    renderLineClearEffect(lines, progress, options = {}) {
        throw new Error('IRenderer.renderLineClearEffect must be implemented');
    }

    /**
     * ドロップエフェクト描画
     * @param {Tetromino} piece - ドロップピース
     * @param {Object} fromPosition - 開始位置
     * @param {Object} toPosition - 終了位置
     * @param {number} progress - アニメーション進行度（0-1）
     */
    renderDropEffect(piece, fromPosition, toPosition, progress) {
        throw new Error('IRenderer.renderDropEffect must be implemented');
    }

    /**
     * レベルアップエフェクト描画
     * @param {number} level - 新レベル
     * @param {number} progress - アニメーション進行度（0-1）
     */
    renderLevelUpEffect(level, progress) {
        throw new Error('IRenderer.renderLevelUpEffect must be implemented');
    }

    /**
     * 画面サイズ変更
     * @param {number} width - 新しい幅
     * @param {number} height - 新しい高さ
     */
    resize(width, height) {
        throw new Error('IRenderer.resize must be implemented');
    }

    /**
     * テーマ設定
     * @param {Object} theme - テーマデータ
     */
    setTheme(theme) {
        throw new Error('IRenderer.setTheme must be implemented');
    }

    /**
     * リソース解放
     */
    dispose() {
        throw new Error('IRenderer.dispose must be implemented');
    }
}
```

### 2.2 IInputHandler インターフェース

#### 概要
入力処理の抽象化インターフェース。キーボード、タッチ、ゲームパッドなど異なる入力方式に対応。

```javascript
/**
 * 入力ハンドラーインターフェース
 * 各種入力デバイスの抽象化を提供
 */
class IInputHandler {
    /**
     * 入力ハンドラー初期化
     * @param {HTMLElement} element - イベント対象要素
     * @param {Object} config - 入力設定
     */
    initialize(element, config = {}) {
        throw new Error('IInputHandler.initialize must be implemented');
    }

    /**
     * 入力コマンド登録
     * @param {string} command - コマンド名
     * @param {Function} callback - コールバック関数
     * @param {Object} options - オプション設定
     */
    registerCommand(command, callback, options = {}) {
        throw new Error('IInputHandler.registerCommand must be implemented');
    }

    /**
     * 入力コマンド削除
     * @param {string} command - コマンド名
     */
    unregisterCommand(command) {
        throw new Error('IInputHandler.unregisterCommand must be implemented');
    }

    /**
     * 入力の有効化
     */
    enable() {
        throw new Error('IInputHandler.enable must be implemented');
    }

    /**
     * 入力の無効化
     */
    disable() {
        throw new Error('IInputHandler.disable must be implemented');
    }

    /**
     * 入力設定更新
     * @param {Object} config - 新しい設定
     */
    updateConfig(config) {
        throw new Error('IInputHandler.updateConfig must be implemented');
    }

    /**
     * 入力状態取得
     * @param {string} command - コマンド名
     * @returns {boolean} 入力状態
     */
    getInputState(command) {
        throw new Error('IInputHandler.getInputState must be implemented');
    }

    /**
     * リソース解放
     */
    dispose() {
        throw new Error('IInputHandler.dispose must be implemented');
    }
}

/**
 * 入力コマンド定義
 */
const InputCommands = {
    MOVE_LEFT: 'moveLeft',
    MOVE_RIGHT: 'moveRight',
    MOVE_DOWN: 'moveDown',
    ROTATE_CLOCKWISE: 'rotateClockwise',
    ROTATE_COUNTERCLOCKWISE: 'rotateCounterclockwise',
    HARD_DROP: 'hardDrop',
    SOFT_DROP: 'softDrop',
    HOLD: 'hold',
    PAUSE: 'pause',
    MENU: 'menu',
    RESTART: 'restart'
};
```

### 2.3 IStorageAdapter インターフェース

#### 概要
データ永続化の抽象化インターフェース。LocalStorage、IndexedDB、サーバーストレージなどに対応。

```javascript
/**
 * ストレージアダプターインターフェース
 * データ永続化の抽象化を提供
 */
class IStorageAdapter {
    /**
     * ストレージ初期化
     * @param {Object} config - ストレージ設定
     * @returns {Promise<void>}
     */
    async initialize(config = {}) {
        throw new Error('IStorageAdapter.initialize must be implemented');
    }

    /**
     * データ保存
     * @param {string} key - キー
     * @param {*} data - 保存データ
     * @param {Object} options - オプション
     * @returns {Promise<boolean>} 保存成功/失敗
     */
    async save(key, data, options = {}) {
        throw new Error('IStorageAdapter.save must be implemented');
    }

    /**
     * データ読み込み
     * @param {string} key - キー
     * @param {*} defaultValue - デフォルト値
     * @returns {Promise<*>} 読み込みデータ
     */
    async load(key, defaultValue = null) {
        throw new Error('IStorageAdapter.load must be implemented');
    }

    /**
     * データ削除
     * @param {string} key - キー
     * @returns {Promise<boolean>} 削除成功/失敗
     */
    async delete(key) {
        throw new Error('IStorageAdapter.delete must be implemented');
    }

    /**
     * データ存在確認
     * @param {string} key - キー
     * @returns {Promise<boolean>} 存在/非存在
     */
    async exists(key) {
        throw new Error('IStorageAdapter.exists must be implemented');
    }

    /**
     * 全データクリア
     * @returns {Promise<void>}
     */
    async clear() {
        throw new Error('IStorageAdapter.clear must be implemented');
    }

    /**
     * ゲーム状態保存
     * @param {GameState} gameState - ゲーム状態
     * @returns {Promise<boolean>}
     */
    async saveGameState(gameState) {
        return this.save('gameState', gameState.serialize());
    }

    /**
     * ゲーム状態読み込み
     * @returns {Promise<Object|null>} ゲーム状態データ
     */
    async loadGameState() {
        return this.load('gameState');
    }

    /**
     * ハイスコア保存
     * @param {Object[]} scores - スコア配列
     * @returns {Promise<boolean>}
     */
    async saveHighScores(scores) {
        return this.save('highScores', scores);
    }

    /**
     * ハイスコア読み込み
     * @returns {Promise<Object[]>} スコア配列
     */
    async loadHighScores() {
        return this.load('highScores', []);
    }

    /**
     * 設定保存
     * @param {Object} settings - 設定データ
     * @returns {Promise<boolean>}
     */
    async saveSettings(settings) {
        return this.save('settings', settings);
    }

    /**
     * 設定読み込み
     * @returns {Promise<Object>} 設定データ
     */
    async loadSettings() {
        return this.load('settings', {});
    }

    /**
     * 統計データ保存
     * @param {Object} statistics - 統計データ
     * @returns {Promise<boolean>}
     */
    async saveStatistics(statistics) {
        return this.save('statistics', statistics);
    }

    /**
     * 統計データ読み込み
     * @returns {Promise<Object>} 統計データ
     */
    async loadStatistics() {
        return this.load('statistics', {});
    }

    /**
     * ストレージ情報取得
     * @returns {Promise<Object>} ストレージ情報
     */
    async getStorageInfo() {
        throw new Error('IStorageAdapter.getStorageInfo must be implemented');
    }

    /**
     * ストレージ利用可能性確認
     * @returns {boolean} 利用可能/不可能
     */
    isAvailable() {
        throw new Error('IStorageAdapter.isAvailable must be implemented');
    }

    /**
     * リソース解放
     */
    dispose() {
        throw new Error('IStorageAdapter.dispose must be implemented');
    }
}
```

### 2.4 IAudioAdapter インターフェース

#### 概要
オーディオ処理の抽象化インターフェース。効果音、BGM、音声合成などに対応。

```javascript
/**
 * オーディオアダプターインターフェース
 * 音声処理の抽象化を提供
 */
class IAudioAdapter {
    /**
     * オーディオシステム初期化
     * @param {Object} config - オーディオ設定
     * @returns {Promise<void>}
     */
    async initialize(config = {}) {
        throw new Error('IAudioAdapter.initialize must be implemented');
    }

    /**
     * 音声ファイル読み込み
     * @param {string} id - 音声ID
     * @param {string|ArrayBuffer} source - 音声ソース
     * @param {Object} options - 読み込みオプション
     * @returns {Promise<boolean>} 読み込み成功/失敗
     */
    async loadSound(id, source, options = {}) {
        throw new Error('IAudioAdapter.loadSound must be implemented');
    }

    /**
     * 効果音再生
     * @param {string} id - 音声ID
     * @param {Object} options - 再生オプション
     * @param {number} options.volume - 音量（0-1）
     * @param {number} options.pitch - ピッチ
     * @param {boolean} options.loop - ループ再生
     * @returns {Promise<void>}
     */
    async playSound(id, options = {}) {
        throw new Error('IAudioAdapter.playSound must be implemented');
    }

    /**
     * BGM再生
     * @param {string} id - 音声ID
     * @param {Object} options - 再生オプション
     * @returns {Promise<void>}
     */
    async playMusic(id, options = {}) {
        throw new Error('IAudioAdapter.playMusic must be implemented');
    }

    /**
     * 音声停止
     * @param {string} id - 音声ID
     */
    stopSound(id) {
        throw new Error('IAudioAdapter.stopSound must be implemented');
    }

    /**
     * 全音声停止
     */
    stopAll() {
        throw new Error('IAudioAdapter.stopAll must be implemented');
    }

    /**
     * 音量設定
     * @param {string} category - カテゴリ（'master', 'sfx', 'music'）
     * @param {number} volume - 音量（0-1）
     */
    setVolume(category, volume) {
        throw new Error('IAudioAdapter.setVolume must be implemented');
    }

    /**
     * 音量取得
     * @param {string} category - カテゴリ
     * @returns {number} 音量
     */
    getVolume(category) {
        throw new Error('IAudioAdapter.getVolume must be implemented');
    }

    /**
     * ミュート設定
     * @param {boolean} muted - ミュート状態
     */
    setMuted(muted) {
        throw new Error('IAudioAdapter.setMuted must be implemented');
    }

    /**
     * オーディオ利用可能性確認
     * @returns {boolean} 利用可能/不可能
     */
    isAvailable() {
        throw new Error('IAudioAdapter.isAvailable must be implemented');
    }

    /**
     * リソース解放
     */
    dispose() {
        throw new Error('IAudioAdapter.dispose must be implemented');
    }
}

/**
 * 音声効果定義
 */
const SoundEffects = {
    PIECE_MOVE: 'pieceMove',
    PIECE_ROTATE: 'pieceRotate',
    PIECE_DROP: 'pieceDrop',
    PIECE_LOCK: 'pieceLock',
    LINE_CLEAR: 'lineClear',
    TETRIS: 'tetris',
    LEVEL_UP: 'levelUp',
    GAME_OVER: 'gameOver',
    MENU_SELECT: 'menuSelect',
    MENU_CONFIRM: 'menuConfirm',
    MENU_CANCEL: 'menuCancel'
};
```

## 3. アプリケーション層ポート定義

### 3.1 GamePort

```javascript
/**
 * ゲーム操作ポート
 * ゲームロジックへの統一インターフェース
 */
class GamePort {
    constructor(gameState, eventBus) {
        this.gameState = gameState;
        this.eventBus = eventBus;
    }

    /**
     * ゲーム開始
     * @returns {Promise<boolean>} 開始成功/失敗
     */
    async startGame() {
        try {
            this.gameState.changeState(GameState.STATES.PLAYING);
            this.eventBus.emit('game.started');
            return true;
        } catch (error) {
            this.eventBus.emit('game.error', { error });
            return false;
        }
    }

    /**
     * ゲーム一時停止
     */
    pauseGame() {
        if (this.gameState.status === GameState.STATES.PLAYING) {
            this.gameState.changeState(GameState.STATES.PAUSED);
            this.eventBus.emit('game.paused');
        }
    }

    /**
     * ゲーム再開
     */
    resumeGame() {
        if (this.gameState.status === GameState.STATES.PAUSED) {
            this.gameState.changeState(GameState.STATES.PLAYING);
            this.eventBus.emit('game.resumed');
        }
    }

    /**
     * ピース移動
     * @param {string} direction - 移動方向
     * @returns {boolean} 移動成功/失敗
     */
    movePiece(direction) {
        if (!this.canAcceptInput()) return false;

        const moveCommands = {
            left: () => this.gameState.currentPiece.move(-1, 0),
            right: () => this.gameState.currentPiece.move(1, 0),
            down: () => this.gameState.currentPiece.move(0, 1)
        };

        const moveCommand = moveCommands[direction];
        if (!moveCommand) return false;

        const oldPosition = { ...this.gameState.currentPiece.position };
        moveCommand();

        if (!this.gameState.board.canPlacePiece(
            this.gameState.currentPiece,
            this.gameState.currentPiece.position.x,
            this.gameState.currentPiece.position.y
        )) {
            this.gameState.currentPiece.position = oldPosition;
            return false;
        }

        this.eventBus.emit('piece.moved', {
            piece: this.gameState.currentPiece,
            direction,
            oldPosition
        });

        return true;
    }

    /**
     * ピース回転
     * @param {string} direction - 回転方向（'clockwise' or 'counterclockwise'）
     * @returns {boolean} 回転成功/失敗
     */
    rotatePiece(direction = 'clockwise') {
        if (!this.canAcceptInput()) return false;

        const piece = this.gameState.currentPiece;
        const rotation = direction === 'clockwise' 
            ? piece.rotateClockwise() 
            : piece.rotateCounterClockwise();

        // ウォールキック試行
        const kickResult = piece.tryWallKick(
            this.gameState.board, 
            rotation.rotationState
        );

        if (kickResult.success) {
            piece.shape = rotation.shape;
            piece.rotationState = rotation.rotationState;
            piece.position.x = kickResult.newX;
            piece.position.y = kickResult.newY;

            this.eventBus.emit('piece.rotated', {
                piece,
                direction,
                kick: kickResult.kick
            });

            return true;
        }

        return false;
    }

    /**
     * ハードドロップ
     * @returns {number} ドロップした行数
     */
    hardDrop() {
        if (!this.canAcceptInput()) return 0;

        const piece = this.gameState.currentPiece;
        const ghostPosition = piece.getGhostPosition(this.gameState.board);
        const dropDistance = ghostPosition.y - piece.position.y;

        piece.position.y = ghostPosition.y;
        this.lockPiece();

        this.eventBus.emit('piece.hardDropped', {
            piece,
            distance: dropDistance
        });

        return dropDistance;
    }

    /**
     * ホールド
     * @returns {boolean} ホールド成功/失敗
     */
    holdPiece() {
        if (!this.canAcceptInput() || !this.gameState.canHold) {
            return false;
        }

        const success = this.gameState.holdCurrentPiece();
        if (success) {
            this.eventBus.emit('piece.held', {
                held: this.gameState.holdPiece,
                current: this.gameState.currentPiece
            });
        }

        return success;
    }

    /**
     * 入力受付可能性チェック
     */
    canAcceptInput() {
        return this.gameState.status === GameState.STATES.PLAYING &&
               this.gameState.currentPiece !== null;
    }

    /**
     * ピースロック処理
     */
    lockPiece() {
        const board = this.gameState.board;
        const piece = this.gameState.currentPiece;

        board.placePiece(piece, piece.position.x, piece.position.y);
        
        const clearedLines = this.gameState.clearLines();
        this.gameState.spawnNextPiece();

        this.eventBus.emit('piece.locked', {
            piece,
            clearedLines
        });
    }
}
```

## 4. データ構造定義

### 4.1 ゲーム設定データ

```javascript
/**
 * ゲーム設定データ構造
 */
const GameConfigSchema = {
    gameplay: {
        dropInterval: 1000,      // 自動落下間隔（ms）
        lockDelay: 500,          // ロック遅延（ms）
        lineClearDelay: 300,     // ライン消去遅延（ms）
        das: 167,                // Delayed Auto Shift（ms）
        arr: 33,                 // Auto Repeat Rate（ms）
        ghostPiece: true,        // ゴーストピース表示
        holdEnabled: true,       // ホールド機能有効
        sevenBag: true,          // 7-bagランダマイザー使用
        initialLevel: 1,         // 初期レベル
        levelProgression: 'lines' // レベル進行方式
    },
    controls: {
        moveLeft: ['ArrowLeft', 'KeyA'],
        moveRight: ['ArrowRight', 'KeyD'],
        softDrop: ['ArrowDown', 'KeyS'],
        hardDrop: ['Space'],
        rotateClockwise: ['ArrowUp', 'KeyW', 'KeyX'],
        rotateCounterClockwise: ['KeyZ', 'ControlLeft'],
        hold: ['KeyC', 'ShiftLeft'],
        pause: ['Escape', 'KeyP']
    },
    display: {
        theme: 'modern',         // テーマ名
        showGrid: true,          // グリッド表示
        showGhost: true,         // ゴースト表示
        nextPieceCount: 5,       // 次ピース表示数
        animations: true,        // アニメーション有効
        particles: true,         // パーティクル効果
        smoothMovement: true     // 滑らか移動
    },
    audio: {
        masterVolume: 1.0,       // マスター音量
        sfxVolume: 0.8,          // 効果音音量
        musicVolume: 0.6,        // BGM音量
        muted: false             // ミュート状態
    },
    accessibility: {
        highContrast: false,     // ハイコントラスト
        reduceMotion: false,     // アニメーション削減
        largeText: false,        // 大きな文字
        colorBlindFriendly: false // 色覚サポート
    }
};
```

### 4.2 イベントデータ構造

```javascript
/**
 * ゲームイベントデータ構造
 */
const GameEventSchema = {
    // ゲーム状態イベント
    'game.started': {},
    'game.paused': {},
    'game.resumed': {},
    'game.ended': {
        score: Number,
        level: Number,
        lines: Number,
        time: Number,
        statistics: Object
    },

    // ピースイベント
    'piece.spawned': {
        piece: Object,      // Tetromino
        position: Object    // {x, y}
    },
    'piece.moved': {
        piece: Object,
        direction: String,
        oldPosition: Object,
        newPosition: Object
    },
    'piece.rotated': {
        piece: Object,
        direction: String,  // 'clockwise' | 'counterclockwise'
        kick: Object       // ウォールキック情報
    },
    'piece.dropped': {
        piece: Object,
        distance: Number,
        type: String       // 'soft' | 'hard'
    },
    'piece.locked': {
        piece: Object,
        position: Object,
        clearedLines: Array
    },
    'piece.held': {
        held: Object,      // 新しいホールドピース
        current: Object    // 新しいカレントピース
    },

    // ボードイベント
    'lines.cleared': {
        lines: Array,      // 消去ライン番号
        count: Number,     // 消去数
        type: String,      // 'single' | 'double' | 'triple' | 'tetris'
        score: Number,     // 獲得スコア
        tspin: Boolean     // T-spin判定
    },
    'level.up': {
        newLevel: Number,
        oldLevel: Number,
        reason: String     // 'lines' | 'time' | 'score'
    },

    // UIイベント
    'ui.menu.opened': {
        menuType: String   // 'main' | 'pause' | 'settings' | 'gameOver'
    },
    'ui.menu.closed': {
        menuType: String
    },
    'ui.settings.changed': {
        category: String,
        key: String,
        oldValue: Any,
        newValue: Any
    }
};
```

これでインターフェース設計書が完成しました。次にUI/UX設計書を作成いたします。
