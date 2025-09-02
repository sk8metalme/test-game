/**
 * GameModeManager - ゲームモード管理システム
 *
 * フェーズ3: ゲームプレイ拡張とユーザビリティ向上
 *
 * 責任:
 * - 複数ゲームモードの管理
 * - モード間の切り替え
 * - モード固有の設定管理
 * - ゲーム状態の管理
 *
 * @author AI Assistant
 * @version 1.0.0
 */

export default class GameModeManager {
  /**
   * GameModeManagerのコンストラクタ
   *
   * @param {Object} config - 初期設定
   */
  constructor(config = {}) {
    this.config = {
      defaultMode: config.defaultMode || 'classic',
      enableTransitions: config.enableTransitions !== false,
      saveProgress: config.saveProgress !== false,
      ...config,
    };

    // ゲームモードの登録
    this.modes = new Map();

    // 現在のゲームモード
    this.currentMode = null;

    // モード固有の設定
    this.modeConfig = new Map();

    // ゲーム状態の履歴
    this.gameHistory = new Map();

    // イベントリスナー
    this.listeners = new Map();

    // 初期化
    this.initialize();
  }

  /**
   * 初期化処理
   */
  initialize() {
    this.registerDefaultModes();
    if (this.config.defaultMode) {
      this.switchMode(this.config.defaultMode);
    }
    this.emit('initialized');
  }

  /**
   * デフォルトゲームモードの登録
   */
  registerDefaultModes() {
    // クラシックモード
    this.registerMode('classic', {
      name: 'Classic Mode',
      description: '従来のテトリスゲーム',
      rules: {
        enableHold: true,
        enableGhost: true,
        enableWallKick: true,
        enableTSpin: true,
        enablePerfectClear: true,
        enableCombo: true,
        enableBackToBack: true,
      },
      scoring: {
        linePoints: [40, 100, 300, 1200],
        comboMultiplier: 1.5,
        tSpinBonus: 1.5,
        perfectClearBonus: 2.0,
        backToBackBonus: 1.5,
      },
      difficulty: {
        startLevel: 1,
        maxLevel: 15,
        levelUpLines: 10,
        speedIncrease: 0.8,
      },
    });

    // タイムアタックモード
    this.registerMode('timeAttack', {
      name: 'Time Attack Mode',
      description: '制限時間内でのスコア競争',
      rules: {
        enableHold: true,
        enableGhost: true,
        enableWallKick: true,
        enableTSpin: true,
        enablePerfectClear: true,
        enableCombo: true,
        enableBackToBack: true,
      },
      scoring: {
        linePoints: [50, 125, 375, 1500],
        comboMultiplier: 2.0,
        tSpinBonus: 2.0,
        perfectClearBonus: 3.0,
        backToBackBonus: 2.0,
        timeBonus: 100,
      },
      difficulty: {
        startLevel: 5,
        maxLevel: 20,
        levelUpLines: 8,
        speedIncrease: 0.9,
        timeLimit: 120, // 2分
      },
    });

    // エンドレスモード
    this.registerMode('endless', {
      name: 'Endless Mode',
      description: '無限に続くゲーム',
      rules: {
        enableHold: true,
        enableGhost: true,
        enableWallKick: true,
        enableTSpin: true,
        enablePerfectClear: true,
        enableCombo: true,
        enableBackToBack: true,
      },
      scoring: {
        linePoints: [60, 150, 450, 1800],
        comboMultiplier: 2.5,
        tSpinBonus: 2.5,
        perfectClearBonus: 4.0,
        backToBackBonus: 2.5,
        survivalBonus: 10,
      },
      difficulty: {
        startLevel: 1,
        maxLevel: 999,
        levelUpLines: 15,
        speedIncrease: 0.95,
      },
    });

    // パズルモード
    this.registerMode('puzzle', {
      name: 'Puzzle Mode',
      description: '特定の目標を達成するパズル',
      rules: {
        enableHold: false,
        enableGhost: true,
        enableWallKick: true,
        enableTSpin: false,
        enablePerfectClear: false,
        enableCombo: false,
        enableBackToBack: false,
      },
      scoring: {
        linePoints: [100, 250, 750, 3000],
        comboMultiplier: 1.0,
        tSpinBonus: 1.0,
        perfectClearBonus: 1.0,
        backToBackBonus: 1.0,
        puzzleBonus: 500,
      },
      difficulty: {
        startLevel: 1,
        maxLevel: 10,
        levelUpLines: 20,
        speedIncrease: 0.7,
      },
    });

    // プラクティスモード
    this.registerMode('practice', {
      name: 'Practice Mode',
      description: '特定の技術を練習',
      rules: {
        enableHold: true,
        enableGhost: true,
        enableWallKick: true,
        enableTSpin: true,
        enablePerfectClear: true,
        enableCombo: true,
        enableBackToBack: true,
      },
      scoring: {
        linePoints: [20, 50, 150, 600],
        comboMultiplier: 1.0,
        tSpinBonus: 1.0,
        perfectClearBonus: 1.0,
        backToBackBonus: 1.0,
      },
      difficulty: {
        startLevel: 1,
        maxLevel: 5,
        levelUpLines: 25,
        speedIncrease: 0.5,
      },
    });
  }

  /**
   * ゲームモードの登録
   *
   * @param {string} name - モード名
   * @param {Object} config - モード設定
   */
  registerMode(name, config) {
    if (this.modes.has(name)) {
      throw new Error(`GameModeManager: モード '${name}' は既に登録されています`);
    }

    // 設定の検証
    this.validateModeConfig(config);

    // モードの登録
    this.modes.set(name, {
      name: config.name,
      description: config.description,
      rules: { ...config.rules },
      scoring: { ...config.scoring },
      difficulty: { ...config.difficulty },
    });

    // モード固有の設定を初期化
    this.modeConfig.set(name, new Map());

    this.emit('modeRegistered', { name, config });
  }

  /**
   * モード設定の検証
   *
   * @param {Object} config - モード設定
   */
  validateModeConfig(config) {
    const requiredFields = ['name', 'description', 'rules', 'scoring', 'difficulty'];

    for (const field of requiredFields) {
      if (!config[field]) {
        throw new Error(`GameModeManager: モード設定に必須フィールド '${field}' が不足しています`);
      }
    }

    // ルール設定の検証
    const requiredRules = [
      'enableHold',
      'enableGhost',
      'enableWallKick',
      'enableTSpin',
      'enablePerfectClear',
      'enableCombo',
      'enableBackToBack',
    ];

    for (const rule of requiredRules) {
      if (typeof config.rules[rule] !== 'boolean') {
        throw new Error(`GameModeManager: ルール設定 '${rule}' はboolean型である必要があります`);
      }
    }

    // スコア設定の検証
    if (!Array.isArray(config.scoring.linePoints) || config.scoring.linePoints.length !== 4) {
      throw new Error('GameModeManager: linePointsは4要素の配列である必要があります');
    }

    // 難易度設定の検証
    const requiredDifficulty = ['startLevel', 'maxLevel', 'levelUpLines', 'speedIncrease'];

    for (const field of requiredDifficulty) {
      if (typeof config.difficulty[field] !== 'number') {
        throw new Error(`GameModeManager: 難易度設定 '${field}' は数値型である必要があります`);
      }
    }
  }

  /**
   * ゲームモードの切り替え
   *
   * @param {string} name - モード名
   * @param {Object} options - 切り替えオプション
   */
  switchMode(name, options = {}) {
    if (!this.modes.has(name)) {
      throw new Error(`GameModeManager: モード '${name}' は登録されていません`);
    }

    const previousMode = this.currentMode;

    // 現在のモードの状態を保存
    if (this.currentMode) {
      this.saveModeState(this.currentMode);
    }

    // 新しいモードに切り替え
    this.currentMode = name;

    // モード固有の設定を復元
    this.restoreModeState(name);

    // イベントの発火
    this.emit('modeSwitched', {
      previousMode,
      currentMode: name,
      options,
    });

    return this.getCurrentMode();
  }

  /**
   * 現在のゲームモードの取得
   *
   * @returns {Object} 現在のゲームモード
   */
  getCurrentMode() {
    if (!this.currentMode) {
      return null;
    }

    const mode = this.modes.get(this.currentMode);
    return {
      name: this.currentMode,
      displayName: mode.name,
      description: mode.description,
      rules: mode.rules,
      scoring: mode.scoring,
      difficulty: mode.difficulty,
    };
  }

  /**
   * モード固有の設定の取得
   *
   * @param {string} name - モード名
   * @param {string} key - 設定キー
   * @returns {*} 設定値
   */
  getModeConfig(name, key) {
    if (!this.modeConfig.has(name)) {
      return null;
    }

    const config = this.modeConfig.get(name);

    if (key) {
      return config.get(key);
    }

    return Object.fromEntries(config);
  }

  /**
   * モード固有の設定の設定
   *
   * @param {string} name - モード名
   * @param {string} key - 設定キー
   * @param {*} value - 設定値
   */
  setModeConfig(name, key, value) {
    if (!this.modeConfig.has(name)) {
      throw new Error(`GameModeManager: モード '${name}' は登録されていません`);
    }

    const config = this.modeConfig.get(name);
    config.set(key, value);

    this.emit('modeConfigChanged', { name, key, value });
  }

  /**
   * モード状態の保存
   *
   * @param {string} name - モード名
   */
  saveModeState(name) {
    if (!this.currentMode || this.currentMode !== name) {
      return;
    }

    const state = {
      timestamp: Date.now(),
      score: 0,
      level: 1,
      lines: 0,
      pieces: 0,
      time: 0,
    };

    this.gameHistory.set(name, state);
  }

  /**
   * モード状態の復元
   *
   * @param {string} name - モード名
   */
  restoreModeState(name) {
    if (!this.gameHistory.has(name)) {
      return;
    }

    const state = this.gameHistory.get(name);

    // 状態の復元処理
    this.emit('modeStateRestored', { name, state });
  }

  /**
   * 利用可能なゲームモードの一覧取得
   *
   * @returns {Array} ゲームモード一覧
   */
  getAvailableModes() {
    return Array.from(this.modes.entries()).map(([name, config]) => ({
      name,
      displayName: config.name,
      description: config.description,
    }));
  }

  /**
   * モードの有効化/無効化
   *
   * @param {string} name - モード名
   * @param {boolean} enabled - 有効化フラグ
   */
  setModeEnabled(name, enabled) {
    if (!this.modes.has(name)) {
      throw new Error(`GameModeManager: モード '${name}' は登録されていません`);
    }

    const mode = this.modes.get(name);
    mode.enabled = enabled;

    this.emit('modeEnabledChanged', { name, enabled });
  }

  /**
   * モードの削除
   *
   * @param {string} name - モード名
   */
  removeMode(name) {
    if (this.currentMode === name) {
      throw new Error(`GameModeManager: 現在アクティブなモード '${name}' は削除できません`);
    }

    if (!this.modes.has(name)) {
      return;
    }

    // モードの削除
    this.modes.delete(name);
    this.modeConfig.delete(name);
    this.gameHistory.delete(name);

    this.emit('modeRemoved', { name });
  }

  /**
   * モードの統計情報取得
   *
   * @param {string} name - モード名
   * @returns {Object} 統計情報
   */
  getModeStats(name) {
    if (!this.gameHistory.has(name)) {
      return {
        totalGames: 0,
        totalScore: 0,
        totalTime: 0,
        bestScore: 0,
        bestTime: 0,
        averageScore: 0,
      };
    }

    const history = this.gameHistory.get(name);

    return {
      totalGames: 1,
      totalScore: history.score,
      totalTime: history.time,
      bestScore: history.score,
      bestTime: history.time,
      averageScore: history.score,
    };
  }

  /**
   * 全モードの統計情報取得
   *
   * @returns {Object} 全モードの統計情報
   */
  getAllModeStats() {
    const stats = {};

    for (const [name] of this.modes) {
      stats[name] = this.getModeStats(name);
    }

    return stats;
  }

  /**
   * イベントリスナーの追加
   *
   * @param {string} event - イベント名
   * @param {Function} listener - リスナー関数
   */
  on(event, listener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(listener);
  }

  /**
   * イベントの発生
   *
   * @param {string} event - イベント名
   * @param {*} data - イベントデータ
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          // console.error(`GameModeManager event error:`, error);
        }
      });
    }
  }

  /**
   * ゲームモードマネージャーの破棄
   */
  destroy() {
    // 現在のモードの状態を保存
    if (this.currentMode) {
      this.saveModeState(this.currentMode);
    }

    // 破棄イベントを先に発火
    this.emit('destroyed');

    // イベントリスナーの削除
    this.listeners.clear();

    // モードの削除
    this.modes.clear();
    this.modeConfig.clear();
    this.gameHistory.clear();

    this.currentMode = null;
  }
}
