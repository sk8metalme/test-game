# コンポーネント詳細設計書

## 1. コアエンティティ詳細設計

### 1.1 Board クラス

#### 責任
- ゲームボードの状態管理
- ピースの配置・削除
- ライン完成の検出と消去
- 衝突判定の支援

#### 詳細仕様

```javascript
class Board {
    constructor(width = 10, height = 20) {
        this.width = width;
        this.height = height;
        this.grid = this.initializeGrid();
        this.placedPieces = new Map(); // 配置済みピース情報
        this.observers = new Set();    // 状態変更監視者
    }

    // グリッド初期化
    initializeGrid() {
        return Array(this.height).fill(null)
            .map(() => Array(this.width).fill(0));
    }

    // セル状態取得
    getCell(row, col) {
        if (this.isOutOfBounds(row, col)) return -1;
        return this.grid[row][col];
    }

    // セル状態設定
    setCell(row, col, value) {
        if (this.isOutOfBounds(row, col)) return false;
        this.grid[row][col] = value;
        this.notifyObservers('cellChanged', { row, col, value });
        return true;
    }

    // 境界チェック
    isOutOfBounds(row, col) {
        return row < 0 || row >= this.height || 
               col < 0 || col >= this.width;
    }

    // 空セルチェック
    isEmpty(row, col) {
        return this.getCell(row, col) === 0;
    }

    // ピース配置可能性チェック
    canPlacePiece(piece, x, y) {
        const cells = piece.getOccupiedCells();
        return cells.every(({dx, dy}) => {
            const newRow = y + dy;
            const newCol = x + dx;
            return !this.isOutOfBounds(newRow, newCol) && 
                   this.isEmpty(newRow, newCol);
        });
    }

    // ピース配置
    placePiece(piece, x, y) {
        if (!this.canPlacePiece(piece, x, y)) return false;
        
        const cells = piece.getOccupiedCells();
        const pieceId = this.generatePieceId();
        
        cells.forEach(({dx, dy}) => {
            const row = y + dy;
            const col = x + dx;
            this.setCell(row, col, piece.type);
            this.placedPieces.set(`${row},${col}`, {
                pieceId,
                type: piece.type,
                color: piece.color
            });
        });
        
        this.notifyObservers('piecePlaced', { piece, x, y, pieceId });
        return true;
    }

    // 完成ライン検出
    getCompleteLines() {
        const completeLines = [];
        
        for (let row = 0; row < this.height; row++) {
            if (this.isLineFull(row)) {
                completeLines.push(row);
            }
        }
        
        return completeLines;
    }

    // ライン満杯チェック
    isLineFull(row) {
        return this.grid[row].every(cell => cell !== 0);
    }

    // ライン消去
    clearLines(lineNumbers) {
        if (lineNumbers.length === 0) return 0;
        
        // 降順ソート（下から消去）
        const sortedLines = [...lineNumbers].sort((a, b) => b - a);
        
        sortedLines.forEach(lineNumber => {
            this.clearLine(lineNumber);
            this.dropLinesAbove(lineNumber);
        });
        
        this.notifyObservers('linesCleared', { 
            lines: lineNumbers, 
            count: lineNumbers.length 
        });
        
        return lineNumbers.length;
    }

    // 単一ライン消去
    clearLine(lineNumber) {
        // ライン上のピース情報削除
        for (let col = 0; col < this.width; col++) {
            this.placedPieces.delete(`${lineNumber},${col}`);
        }
        
        // グリッドから削除
        this.grid.splice(lineNumber, 1);
        this.grid.unshift(Array(this.width).fill(0));
    }

    // 上部ライン落下
    dropLinesAbove(clearedLineNumber) {
        // ピース情報の更新
        const newPlacedPieces = new Map();
        
        for (const [key, value] of this.placedPieces) {
            const [row, col] = key.split(',').map(Number);
            if (row < clearedLineNumber) {
                newPlacedPieces.set(`${row + 1},${col}`, value);
            } else {
                newPlacedPieces.set(key, value);
            }
        }
        
        this.placedPieces = newPlacedPieces;
    }

    // ゲームオーバー判定
    isGameOver() {
        // トップライン（見えない部分）にピースがあるかチェック
        return this.grid[0].some(cell => cell !== 0) || 
               this.grid[1].some(cell => cell !== 0);
    }

    // 観察者パターン実装
    addObserver(observer) {
        this.observers.add(observer);
    }

    removeObserver(observer) {
        this.observers.delete(observer);
    }

    notifyObservers(event, data) {
        this.observers.forEach(observer => {
            if (typeof observer.onBoardChange === 'function') {
                observer.onBoardChange(event, data);
            }
        });
    }

    // ユーティリティメソッド
    generatePieceId() {
        return `piece_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    clone() {
        const cloned = new Board(this.width, this.height);
        cloned.grid = this.grid.map(row => [...row]);
        cloned.placedPieces = new Map(this.placedPieces);
        return cloned;
    }

    serialize() {
        return {
            width: this.width,
            height: this.height,
            grid: this.grid,
            placedPieces: Array.from(this.placedPieces.entries())
        };
    }

    static deserialize(data) {
        const board = new Board(data.width, data.height);
        board.grid = data.grid;
        board.placedPieces = new Map(data.placedPieces);
        return board;
    }

    // デバッグ用
    toString() {
        return this.grid.map(row => 
            row.map(cell => cell === 0 ? '.' : cell).join('')
        ).join('\n');
    }
}
```

### 1.2 Tetromino クラス

#### 責任
- テトロミノピースの状態管理
- 回転・移動の実行
- 衝突判定用データ提供
- ウォールキック処理

#### 詳細仕様

```javascript
class Tetromino {
    static SHAPES = {
        I: {
            shape: [
                [0, 0, 0, 0],
                [1, 1, 1, 1],
                [0, 0, 0, 0],
                [0, 0, 0, 0]
            ],
            color: '#00FFFF',
            kickData: TetrominoKickData.I_PIECE
        },
        O: {
            shape: [
                [1, 1],
                [1, 1]
            ],
            color: '#FFFF00',
            kickData: TetrominoKickData.O_PIECE
        },
        T: {
            shape: [
                [0, 1, 0],
                [1, 1, 1],
                [0, 0, 0]
            ],
            color: '#800080',
            kickData: TetrominoKickData.STANDARD
        },
        S: {
            shape: [
                [0, 1, 1],
                [1, 1, 0],
                [0, 0, 0]
            ],
            color: '#00FF00',
            kickData: TetrominoKickData.STANDARD
        },
        Z: {
            shape: [
                [1, 1, 0],
                [0, 1, 1],
                [0, 0, 0]
            ],
            color: '#FF0000',
            kickData: TetrominoKickData.STANDARD
        },
        J: {
            shape: [
                [1, 0, 0],
                [1, 1, 1],
                [0, 0, 0]
            ],
            color: '#0000FF',
            kickData: TetrominoKickData.STANDARD
        },
        L: {
            shape: [
                [0, 0, 1],
                [1, 1, 1],
                [0, 0, 0]
            ],
            color: '#FFA500',
            kickData: TetrominoKickData.STANDARD
        }
    };

    constructor(type, position = {x: 4, y: 0}) {
        if (!Tetromino.SHAPES[type]) {
            throw new Error(`Invalid tetromino type: ${type}`);
        }

        this.type = type;
        this.position = { ...position };
        this.shape = this.cloneShape(Tetromino.SHAPES[type].shape);
        this.color = Tetromino.SHAPES[type].color;
        this.rotationState = 0;
        this.lockDelay = 0;
        this.dropTime = 0;
        this.hasBeenHeld = false;
        this.kickData = Tetromino.SHAPES[type].kickData;
    }

    // 形状複製
    cloneShape(shape) {
        return shape.map(row => [...row]);
    }

    // 時計回り回転
    rotateClockwise() {
        const newShape = this.rotateMatrixClockwise(this.shape);
        const newRotationState = (this.rotationState + 1) % 4;
        
        return {
            shape: newShape,
            rotationState: newRotationState
        };
    }

    // 反時計回り回転
    rotateCounterClockwise() {
        const newShape = this.rotateMatrixCounterClockwise(this.shape);
        const newRotationState = (this.rotationState + 3) % 4;
        
        return {
            shape: newShape,
            rotationState: newRotationState
        };
    }

    // マトリクス時計回り回転
    rotateMatrixClockwise(matrix) {
        const size = matrix.length;
        const rotated = Array(size).fill(null)
            .map(() => Array(size).fill(0));
        
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                rotated[j][size - 1 - i] = matrix[i][j];
            }
        }
        
        return rotated;
    }

    // マトリクス反時計回り回転
    rotateMatrixCounterClockwise(matrix) {
        const size = matrix.length;
        const rotated = Array(size).fill(null)
            .map(() => Array(size).fill(0));
        
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                rotated[size - 1 - j][i] = matrix[i][j];
            }
        }
        
        return rotated;
    }

    // 移動
    move(dx, dy) {
        this.position.x += dx;
        this.position.y += dy;
    }

    // 位置設定
    setPosition(x, y) {
        this.position.x = x;
        this.position.y = y;
    }

    // 占有セル取得
    getOccupiedCells() {
        const cells = [];
        
        for (let row = 0; row < this.shape.length; row++) {
            for (let col = 0; col < this.shape[row].length; col++) {
                if (this.shape[row][col] !== 0) {
                    cells.push({
                        dx: col,
                        dy: row,
                        x: this.position.x + col,
                        y: this.position.y + row
                    });
                }
            }
        }
        
        return cells;
    }

    // ゴースト位置計算
    getGhostPosition(board) {
        let ghostY = this.position.y;
        
        while (board.canPlacePiece(this, this.position.x, ghostY + 1)) {
            ghostY++;
        }
        
        return {
            x: this.position.x,
            y: ghostY
        };
    }

    // ウォールキック試行
    tryWallKick(board, targetRotation) {
        const kicks = this.getWallKickData(this.rotationState, targetRotation);
        
        for (const kick of kicks) {
            const testX = this.position.x + kick.dx;
            const testY = this.position.y + kick.dy;
            
            if (this.canRotateAt(board, testX, testY, targetRotation)) {
                return {
                    success: true,
                    newX: testX,
                    newY: testY,
                    kick: kick
                };
            }
        }
        
        return { success: false };
    }

    // ウォールキックデータ取得
    getWallKickData(fromRotation, toRotation) {
        const kickKey = `${fromRotation}_${toRotation}`;
        return this.kickData[kickKey] || [{ dx: 0, dy: 0 }];
    }

    // 回転可能性チェック
    canRotateAt(board, x, y, targetRotation) {
        const testPiece = this.clone();
        testPiece.position.x = x;
        testPiece.position.y = y;
        testPiece.rotationState = targetRotation;
        testPiece.shape = this.getShapeForRotation(targetRotation);
        
        return board.canPlacePiece(testPiece, x, y);
    }

    // 回転状態から形状取得
    getShapeForRotation(rotation) {
        let shape = this.cloneShape(Tetromino.SHAPES[this.type].shape);
        
        for (let i = 0; i < rotation; i++) {
            shape = this.rotateMatrixClockwise(shape);
        }
        
        return shape;
    }

    // T-spin判定
    isTSpin(board, lastMove) {
        if (this.type !== 'T') return false;
        if (lastMove.type !== 'rotation') return false;
        
        const corners = this.getTSpinCorners();
        let filledCorners = 0;
        
        corners.forEach(corner => {
            const x = this.position.x + corner.dx;
            const y = this.position.y + corner.dy;
            
            if (board.isOutOfBounds(y, x) || !board.isEmpty(y, x)) {
                filledCorners++;
            }
        });
        
        return filledCorners >= 3;
    }

    // T-spinコーナー取得
    getTSpinCorners() {
        // T字型の4つのコーナー座標
        return [
            { dx: 0, dy: 0 },   // 左上
            { dx: 2, dy: 0 },   // 右上
            { dx: 0, dy: 2 },   // 左下
            { dx: 2, dy: 2 }    // 右下
        ];
    }

    // ロック遅延更新
    updateLockDelay(deltaTime) {
        this.lockDelay += deltaTime;
    }

    // ロック遅延リセット
    resetLockDelay() {
        this.lockDelay = 0;
    }

    // ロック判定
    shouldLock(maxLockDelay = 500) {
        return this.lockDelay >= maxLockDelay;
    }

    // ピース複製
    clone() {
        const cloned = new Tetromino(this.type, this.position);
        cloned.shape = this.cloneShape(this.shape);
        cloned.rotationState = this.rotationState;
        cloned.lockDelay = this.lockDelay;
        cloned.dropTime = this.dropTime;
        cloned.hasBeenHeld = this.hasBeenHeld;
        return cloned;
    }

    // シリアライズ
    serialize() {
        return {
            type: this.type,
            position: { ...this.position },
            rotationState: this.rotationState,
            lockDelay: this.lockDelay,
            dropTime: this.dropTime,
            hasBeenHeld: this.hasBeenHeld
        };
    }

    // デシリアライズ
    static deserialize(data) {
        const piece = new Tetromino(data.type, data.position);
        piece.rotationState = data.rotationState;
        piece.lockDelay = data.lockDelay;
        piece.dropTime = data.dropTime;
        piece.hasBeenHeld = data.hasBeenHeld;
        piece.shape = piece.getShapeForRotation(data.rotationState);
        return piece;
    }
}
```

### 1.3 GameState クラス

#### 責任
- ゲーム全体の状態管理
- 状態遷移の制御
- ゲームセッション情報の保持

#### 詳細仕様

```javascript
class GameState {
    static STATES = {
        MENU: 'MENU',
        PLAYING: 'PLAYING',
        PAUSED: 'PAUSED',
        GAME_OVER: 'GAME_OVER',
        LOADING: 'LOADING',
        SETTINGS: 'SETTINGS'
    };

    static VALID_TRANSITIONS = {
        MENU: ['PLAYING', 'SETTINGS', 'LOADING'],
        PLAYING: ['PAUSED', 'GAME_OVER', 'MENU'],
        PAUSED: ['PLAYING', 'MENU'],
        GAME_OVER: ['MENU', 'PLAYING'],
        LOADING: ['MENU', 'PLAYING'],
        SETTINGS: ['MENU']
    };

    constructor() {
        this.status = GameState.STATES.MENU;
        this.board = new Board();
        this.currentPiece = null;
        this.nextPieces = [];
        this.holdPiece = null;
        this.canHold = true;
        
        // スコア関連
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.totalPieces = 0;
        
        // 時間関連
        this.startTime = null;
        this.gameTime = 0;
        this.pausedTime = 0;
        this.lastUpdate = 0;
        
        // ゲーム設定
        this.dropInterval = 1000; // ms
        this.lockDelay = 500;     // ms
        this.lineClearDelay = 300; // ms
        
        // 統計
        this.statistics = {
            pieceCounts: { I: 0, O: 0, T: 0, S: 0, Z: 0, J: 0, L: 0 },
            lineClears: { single: 0, double: 0, triple: 0, tetris: 0 },
            tSpins: { mini: 0, single: 0, double: 0, triple: 0 },
            maxCombo: 0,
            currentCombo: 0
        };
        
        // 観察者
        this.observers = new Set();
        
        // バッグランダマイザー
        this.pieceBag = [];
        this.bagIndex = 0;
    }

    // 状態遷移
    changeState(newState) {
        if (!this.isValidTransition(this.status, newState)) {
            throw new Error(`Invalid state transition: ${this.status} -> ${newState}`);
        }
        
        const oldState = this.status;
        this.status = newState;
        
        this.onStateChanged(oldState, newState);
        this.notifyObservers('stateChanged', { from: oldState, to: newState });
    }

    // 状態遷移有効性チェック
    isValidTransition(from, to) {
        return GameState.VALID_TRANSITIONS[from]?.includes(to) ?? false;
    }

    // 状態変更時の処理
    onStateChanged(from, to) {
        switch (to) {
            case GameState.STATES.PLAYING:
                if (from === GameState.STATES.MENU) {
                    this.initializeGame();
                }
                this.resumeTimer();
                break;
                
            case GameState.STATES.PAUSED:
                this.pauseTimer();
                break;
                
            case GameState.STATES.GAME_OVER:
                this.pauseTimer();
                this.finalizeGame();
                break;
        }
    }

    // ゲーム初期化
    initializeGame() {
        this.board = new Board();
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.totalPieces = 0;
        this.startTime = Date.now();
        this.gameTime = 0;
        this.pausedTime = 0;
        this.lastUpdate = 0;
        
        // 統計リセット
        this.resetStatistics();
        
        // 初期ピース生成
        this.generateInitialPieces();
        this.spawnNextPiece();
    }

    // 統計リセット
    resetStatistics() {
        this.statistics = {
            pieceCounts: { I: 0, O: 0, T: 0, S: 0, Z: 0, J: 0, L: 0 },
            lineClears: { single: 0, double: 0, triple: 0, tetris: 0 },
            tSpins: { mini: 0, single: 0, double: 0, triple: 0 },
            maxCombo: 0,
            currentCombo: 0
        };
    }

    // 初期ピース生成
    generateInitialPieces() {
        this.nextPieces = [];
        for (let i = 0; i < 5; i++) {
            this.nextPieces.push(this.getNextPieceFromBag());
        }
    }

    // バッグからピース取得
    getNextPieceFromBag() {
        if (this.bagIndex >= this.pieceBag.length) {
            this.shuffleBag();
            this.bagIndex = 0;
        }
        
        return this.pieceBag[this.bagIndex++];
    }

    // バッグシャッフル
    shuffleBag() {
        this.pieceBag = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
        
        // Fisher-Yates シャッフル
        for (let i = this.pieceBag.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.pieceBag[i], this.pieceBag[j]] = [this.pieceBag[j], this.pieceBag[i]];
        }
    }

    // 次ピース生成
    spawnNextPiece() {
        if (this.nextPieces.length === 0) {
            throw new Error('No next pieces available');
        }
        
        const pieceType = this.nextPieces.shift();
        this.currentPiece = new Tetromino(pieceType);
        this.nextPieces.push(this.getNextPieceFromBag());
        this.canHold = true;
        this.totalPieces++;
        this.statistics.pieceCounts[pieceType]++;
        
        // ゲームオーバーチェック
        if (!this.board.canPlacePiece(this.currentPiece, 
                                      this.currentPiece.position.x, 
                                      this.currentPiece.position.y)) {
            this.changeState(GameState.STATES.GAME_OVER);
            return false;
        }
        
        this.notifyObservers('pieceSpawned', { piece: this.currentPiece });
        return true;
    }

    // ホールド処理
    holdCurrentPiece() {
        if (!this.canHold || !this.currentPiece) return false;
        
        const heldType = this.holdPiece?.type;
        this.holdPiece = new Tetromino(this.currentPiece.type);
        this.holdPiece.hasBeenHeld = true;
        
        if (heldType) {
            this.currentPiece = new Tetromino(heldType);
        } else {
            this.spawnNextPiece();
        }
        
        this.canHold = false;
        this.notifyObservers('pieceHeld', { 
            held: this.holdPiece, 
            current: this.currentPiece 
        });
        
        return true;
    }

    // ライン消去処理
    clearLines() {
        const completeLines = this.board.getCompleteLines();
        if (completeLines.length === 0) return 0;
        
        const clearedCount = this.board.clearLines(completeLines);
        this.lines += clearedCount;
        
        // スコア計算
        this.updateScore(clearedCount);
        
        // レベル更新
        this.updateLevel();
        
        // 統計更新
        this.updateLineStatistics(clearedCount);
        
        this.notifyObservers('linesCleared', { 
            lines: completeLines, 
            count: clearedCount 
        });
        
        return clearedCount;
    }

    // スコア更新
    updateScore(lineCount) {
        const baseScores = [0, 100, 300, 500, 800]; // 0, 1, 2, 3, 4ライン
        const baseScore = baseScores[lineCount] || 0;
        const levelMultiplier = this.level;
        
        this.score += baseScore * levelMultiplier;
        
        this.notifyObservers('scoreUpdated', { 
            score: this.score, 
            added: baseScore * levelMultiplier 
        });
    }

    // レベル更新
    updateLevel() {
        const newLevel = Math.floor(this.lines / 10) + 1;
        
        if (newLevel > this.level) {
            this.level = newLevel;
            this.updateDropInterval();
            this.notifyObservers('levelUp', { level: this.level });
        }
    }

    // 落下間隔更新
    updateDropInterval() {
        // レベルに応じた落下速度調整
        this.dropInterval = Math.max(50, 1000 - (this.level - 1) * 50);
    }

    // ライン統計更新
    updateLineStatistics(lineCount) {
        switch (lineCount) {
            case 1: this.statistics.lineClears.single++; break;
            case 2: this.statistics.lineClears.double++; break;
            case 3: this.statistics.lineClears.triple++; break;
            case 4: this.statistics.lineClears.tetris++; break;
        }
    }

    // タイマー開始/再開
    resumeTimer() {
        if (this.startTime) {
            this.pausedTime += Date.now() - this.pauseStartTime;
        } else {
            this.startTime = Date.now();
        }
    }

    // タイマー一時停止
    pauseTimer() {
        this.pauseStartTime = Date.now();
    }

    // ゲーム時間取得
    getGameTime() {
        if (!this.startTime) return 0;
        
        const now = Date.now();
        const totalTime = now - this.startTime - this.pausedTime;
        
        if (this.status === GameState.STATES.PAUSED) {
            return totalTime - (now - this.pauseStartTime);
        }
        
        return totalTime;
    }

    // ゲーム完了処理
    finalizeGame() {
        this.gameTime = this.getGameTime();
        this.notifyObservers('gameFinalized', {
            score: this.score,
            level: this.level,
            lines: this.lines,
            gameTime: this.gameTime,
            statistics: { ...this.statistics }
        });
    }

    // 観察者パターン実装
    addObserver(observer) {
        this.observers.add(observer);
    }

    removeObserver(observer) {
        this.observers.delete(observer);
    }

    notifyObservers(event, data) {
        this.observers.forEach(observer => {
            if (typeof observer.onGameStateChange === 'function') {
                observer.onGameStateChange(event, data);
            }
        });
    }

    // シリアライズ
    serialize() {
        return {
            status: this.status,
            board: this.board.serialize(),
            currentPiece: this.currentPiece?.serialize(),
            nextPieces: this.nextPieces,
            holdPiece: this.holdPiece?.serialize(),
            canHold: this.canHold,
            score: this.score,
            level: this.level,
            lines: this.lines,
            totalPieces: this.totalPieces,
            gameTime: this.getGameTime(),
            statistics: { ...this.statistics },
            pieceBag: [...this.pieceBag],
            bagIndex: this.bagIndex
        };
    }

    // デシリアライズ
    static deserialize(data) {
        const gameState = new GameState();
        gameState.status = data.status;
        gameState.board = Board.deserialize(data.board);
        gameState.currentPiece = data.currentPiece ? 
            Tetromino.deserialize(data.currentPiece) : null;
        gameState.nextPieces = data.nextPieces;
        gameState.holdPiece = data.holdPiece ? 
            Tetromino.deserialize(data.holdPiece) : null;
        gameState.canHold = data.canHold;
        gameState.score = data.score;
        gameState.level = data.level;
        gameState.lines = data.lines;
        gameState.totalPieces = data.totalPieces;
        gameState.gameTime = data.gameTime;
        gameState.statistics = data.statistics;
        gameState.pieceBag = data.pieceBag;
        gameState.bagIndex = data.bagIndex;
        return gameState;
    }
}
```

これでコンポーネント設計書の主要なエンティティ部分が完成しました。次にインターフェース設計書を作成いたします。
