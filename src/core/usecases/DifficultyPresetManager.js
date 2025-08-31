/**
 * DifficultyPresetManager - 難易度プリセット管理システム
 *
 * フェーズ3: ゲームプレイ拡張とユーザビリティ向上
 *
 * 責任:
 * - 事前定義された難易度レベルの管理
 * - カスタム難易度設定の作成・保存
 * - プリセットの検証と整合性チェック
 * - プリセット間の変換と調整
 *
 * @author AI Assistant
 * @version 1.0.0
 */

export default class DifficultyPresetManager {
  /**
   * DifficultyPresetManagerのコンストラクタ
   *
   * @param {Object} config - 初期設定
   */
  constructor(config = {}) {
    this.config = {
      enableCustomPresets: config.enableCustomPresets !== false,
      maxCustomPresets: config.maxCustomPresets || 20,
      presetValidation: config.presetValidation !== false,
      autoBackup: config.autoBackup !== false,
      backupInterval: config.backupInterval || 300000, // 5分
      ...config,
    };

    // デフォルトプリセット
    this.defaultPresets = new Map();

    // カスタムプリセット
    this.customPresets = new Map();

    // プリセット履歴
    this.presetHistory = [];

    // バックアップタイマー
    this.backupTimer = null;

    // 初期化
    this.initialize();
  }

  /**
   * 初期化処理
   */
  initialize() {
    this.initializeDefaultPresets();

    // カスタムプリセットの読み込み
    this.loadCustomPresets();

    // 自動バックアップの開始
    if (this.config.autoBackup) {
      this.startAutoBackup();
    }
  }

  /**
   * デフォルトプリセットの初期化
   */
  initializeDefaultPresets() {
    const defaultPresets = {
      Beginner: {
        name: 'Beginner',
        description: '初心者向けの優しい難易度',
        category: 'standard',
        difficulty: 0.2,
        dropSpeed: 1500,
        pieceGeneration: {
          bagSize: 7,
          biasAdjustment: 0.1,
          previewCount: 3,
          holdEnabled: true,
        },
        specialRules: {
          tspinDifficulty: 0.8,
          perfectClearBonus: 1.2,
          comboMultiplier: 1.1,
          backToBackBonus: 1.1,
        },
        bonuses: {
          lineClearBonus: 1.2,
          dropBonus: 1.1,
          levelUpBonus: 1.1,
          survivalBonus: 1.0,
        },
        restrictions: {
          maxLevel: 10,
          timeLimit: null,
          lineLimit: null,
        },
        metadata: {
          createdAt: Date.now(),
          isDefault: true,
          version: '1.0.0',
          tags: ['beginner', 'easy', 'learning'],
        },
      },

      Casual: {
        name: 'Casual',
        description: 'カジュアルプレイヤー向けの標準難易度',
        category: 'standard',
        difficulty: 0.5,
        dropSpeed: 1000,
        pieceGeneration: {
          bagSize: 7,
          biasAdjustment: 0.0,
          previewCount: 3,
          holdEnabled: true,
        },
        specialRules: {
          tspinDifficulty: 1.0,
          perfectClearBonus: 1.0,
          comboMultiplier: 1.0,
          backToBackBonus: 1.0,
        },
        bonuses: {
          lineClearBonus: 1.0,
          dropBonus: 1.0,
          levelUpBonus: 1.0,
          survivalBonus: 1.0,
        },
        restrictions: {
          maxLevel: 20,
          timeLimit: null,
          lineLimit: null,
        },
        metadata: {
          createdAt: Date.now(),
          isDefault: true,
          version: '1.0.0',
          tags: ['casual', 'standard', 'balanced'],
        },
      },

      Advanced: {
        name: 'Advanced',
        description: '上級者向けの高難易度',
        category: 'standard',
        difficulty: 0.8,
        dropSpeed: 500,
        pieceGeneration: {
          bagSize: 7,
          biasAdjustment: -0.1,
          previewCount: 2,
          holdEnabled: true,
        },
        specialRules: {
          tspinDifficulty: 1.2,
          perfectClearBonus: 0.9,
          comboMultiplier: 0.9,
          backToBackBonus: 0.9,
        },
        bonuses: {
          lineClearBonus: 0.9,
          dropBonus: 0.9,
          levelUpBonus: 0.9,
          survivalBonus: 1.1,
        },
        restrictions: {
          maxLevel: 30,
          timeLimit: null,
          lineLimit: null,
        },
        metadata: {
          createdAt: Date.now(),
          isDefault: true,
          version: '1.0.0',
          tags: ['advanced', 'hard', 'challenging'],
        },
      },

      Expert: {
        name: 'Expert',
        description: 'エキスパート向けの極限難易度',
        category: 'standard',
        difficulty: 1.0,
        dropSpeed: 200,
        pieceGeneration: {
          bagSize: 7,
          biasAdjustment: -0.2,
          previewCount: 1,
          holdEnabled: false,
        },
        specialRules: {
          tspinDifficulty: 1.5,
          perfectClearBonus: 0.8,
          comboMultiplier: 0.8,
          backToBackBonus: 0.8,
        },
        bonuses: {
          lineClearBonus: 0.8,
          dropBonus: 0.8,
          levelUpBonus: 0.8,
          survivalBonus: 1.2,
        },
        restrictions: {
          maxLevel: 50,
          timeLimit: null,
          lineLimit: null,
        },
        metadata: {
          createdAt: Date.now(),
          isDefault: true,
          version: '1.0.0',
          tags: ['expert', 'extreme', 'master'],
        },
      },

      Speedrun: {
        name: 'Speedrun',
        description: 'スピードラン向けの特殊難易度',
        category: 'special',
        difficulty: 0.7,
        dropSpeed: 300,
        pieceGeneration: {
          bagSize: 7,
          biasAdjustment: 0.0,
          previewCount: 4,
          holdEnabled: true,
        },
        specialRules: {
          tspinDifficulty: 1.0,
          perfectClearBonus: 1.5,
          comboMultiplier: 1.2,
          backToBackBonus: 1.3,
        },
        bonuses: {
          lineClearBonus: 1.3,
          dropBonus: 1.2,
          levelUpBonus: 1.0,
          survivalBonus: 0.8,
        },
        restrictions: {
          maxLevel: 15,
          timeLimit: 300, // 5分
          lineLimit: 40,
        },
        metadata: {
          createdAt: Date.now(),
          isDefault: true,
          version: '1.0.0',
          tags: ['speedrun', 'fast', 'competitive'],
        },
      },

      Marathon: {
        name: 'Marathon',
        description: '長時間プレイ向けの耐久難易度',
        category: 'special',
        difficulty: 0.6,
        dropSpeed: 800,
        pieceGeneration: {
          bagSize: 7,
          biasAdjustment: 0.05,
          previewCount: 3,
          holdEnabled: true,
        },
        specialRules: {
          tspinDifficulty: 0.9,
          perfectClearBonus: 1.1,
          comboMultiplier: 1.0,
          backToBackBonus: 1.0,
        },
        bonuses: {
          lineClearBonus: 1.0,
          dropBonus: 1.0,
          levelUpBonus: 1.2,
          survivalBonus: 1.3,
        },
        restrictions: {
          maxLevel: 100,
          timeLimit: null,
          lineLimit: 200,
        },
        metadata: {
          createdAt: Date.now(),
          isDefault: true,
          version: '1.0.0',
          tags: ['marathon', 'endurance', 'long'],
        },
      },
    };

    // デフォルトプリセットの登録
    for (const [key, preset] of Object.entries(defaultPresets)) {
      this.defaultPresets.set(key, preset);
    }
  }

  /**
   * カスタムプリセットの読み込み
   */
  loadCustomPresets() {
    try {
      // ローカルストレージからカスタムプリセットを読み込み
      const storedPresets = localStorage.getItem('tetris_custom_presets');
      if (storedPresets) {
        const parsedPresets = JSON.parse(storedPresets);
        for (const [key, preset] of Object.entries(parsedPresets)) {
          if (this.validatePreset(preset)) {
            this.customPresets.set(key, preset);
          }
        }
      }
    } catch (error) {
      console.error(
        'DifficultyPresetManager: カスタムプリセットの読み込みでエラーが発生しました:',
        error
      );
    }
  }

  /**
   * カスタムプリセットの保存
   */
  saveCustomPresets() {
    try {
      const presetsToSave = {};
      for (const [key, preset] of this.customPresets) {
        presetsToSave[key] = preset;
      }
      localStorage.setItem('tetris_custom_presets', JSON.stringify(presetsToSave));
    } catch (error) {
      console.error(
        'DifficultyPresetManager: カスタムプリセットの保存でエラーが発生しました:',
        error
      );
    }
  }

  /**
   * プリセットの読み込み
   *
   * @param {string} presetName - プリセット名
   * @returns {Object} プリセット設定
   */
  loadPreset(presetName) {
    const preset = this.defaultPresets.get(presetName) || this.customPresets.get(presetName);

    if (!preset) {
      throw new Error(`DifficultyPresetManager: プリセット '${presetName}' は見つかりません`);
    }

    // プリセット履歴に追加
    this.addToHistory(presetName, preset);

    return { ...preset };
  }

  /**
   * カスタムプリセットの保存
   *
   * @param {string} name - プリセット名
   * @param {Object} settings - プリセット設定
   * @returns {boolean} 保存結果
   */
  saveCustomPreset(name, settings) {
    if (!this.config.enableCustomPresets) {
      throw new Error('DifficultyPresetManager: カスタムプリセット機能が無効です');
    }

    // 予約名のチェック
    if (this.defaultPresets.has(name)) {
      throw new Error(`DifficultyPresetManager: プリセット名 '${name}' は予約されています`);
    }

    // カスタムプリセット数の制限
    if (this.customPresets.size >= this.config.maxCustomPresets) {
      throw new Error(
        `DifficultyPresetManager: カスタムプリセットの最大数（${this.config.maxCustomPresets}）に達しています`
      );
    }

    // プリセットの検証
    if (this.config.presetValidation && !this.validatePreset(settings)) {
      throw new Error('DifficultyPresetManager: プリセット設定が無効です');
    }

    // カスタムプリセットの作成
    const customPreset = {
      ...settings,
      name,
      description: settings.description || `カスタムプリセット: ${name}`,
      metadata: {
        ...settings.metadata,
        isCustom: true,
        createdAt: Date.now(),
        lastModified: Date.now(),
        version: settings.metadata?.version || '1.0.0',
      },
    };

    this.customPresets.set(name, customPreset);

    // ローカルストレージに保存
    this.saveCustomPresets();

    return true;
  }

  /**
   * カスタムプリセットの更新
   *
   * @param {string} name - プリセット名
   * @param {Object} settings - 新しい設定
   * @returns {boolean} 更新結果
   */
  updateCustomPreset(name, settings) {
    if (!this.customPresets.has(name)) {
      throw new Error(`DifficultyPresetManager: カスタムプリセット '${name}' は見つかりません`);
    }

    // プリセットの検証
    if (this.config.presetValidation && !this.validatePreset(settings)) {
      throw new Error('DifficultyPresetManager: プリセット設定が無効です');
    }

    const existingPreset = this.customPresets.get(name);
    const updatedPreset = {
      ...existingPreset,
      ...settings,
      metadata: {
        ...existingPreset.metadata,
        lastModified: Date.now(),
      },
    };

    this.customPresets.set(name, updatedPreset);

    // ローカルストレージに保存
    this.saveCustomPresets();

    return true;
  }

  /**
   * カスタムプリセットの削除
   *
   * @param {string} name - プリセット名
   * @returns {boolean} 削除結果
   */
  deleteCustomPreset(name) {
    if (!this.customPresets.has(name)) {
      return false;
    }

    this.customPresets.delete(name);

    // ローカルストレージに保存
    this.saveCustomPresets();

    return true;
  }

  /**
   * 利用可能なプリセットを取得
   *
   * @returns {Array} プリセット一覧
   */
  getAvailablePresets() {
    const allPresets = [];

    // デフォルトプリセット
    for (const [key, preset] of this.defaultPresets) {
      allPresets.push({
        ...preset,
        key,
        isDefault: true,
        canDelete: false,
        canEdit: false,
      });
    }

    // カスタムプリセット
    for (const [key, preset] of this.customPresets) {
      allPresets.push({
        ...preset,
        key,
        isDefault: false,
        canDelete: true,
        canEdit: true,
      });
    }

    // 名前順でソート（デフォルトプリセットを優先）
    return allPresets.sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * カテゴリ別プリセットを取得
   *
   * @param {string} category - カテゴリ名
   * @returns {Array} カテゴリ別プリセット一覧
   */
  getPresetsByCategory(category) {
    return this.getAvailablePresets().filter(preset => preset.category === category);
  }

  /**
   * 難易度別プリセットを取得
   *
   * @param {number} minDifficulty - 最小難易度
   * @param {number} maxDifficulty - 最大難易度
   * @returns {Array} 難易度別プリセット一覧
   */
  getPresetsByDifficulty(minDifficulty, maxDifficulty) {
    return this.getAvailablePresets().filter(
      preset => preset.difficulty >= minDifficulty && preset.difficulty <= maxDifficulty
    );
  }

  /**
   * プリセットの検索
   *
   * @param {string} searchTerm - 検索語
   * @returns {Array} 検索結果
   */
  searchPresets(searchTerm) {
    const term = searchTerm.toLowerCase();
    return this.getAvailablePresets().filter(
      preset =>
        preset.name.toLowerCase().includes(term) ||
        preset.description.toLowerCase().includes(term) ||
        preset.metadata.tags.some(tag => tag.toLowerCase().includes(term))
    );
  }

  /**
   * プリセットの検証
   *
   * @param {Object} preset - 検証するプリセット
   * @returns {boolean} 検証結果
   */
  validatePreset(preset) {
    try {
      // 必須フィールドのチェック
      if (!preset.name || !preset.dropSpeed) {
        return false;
      }

      // 数値範囲のチェック
      if (preset.dropSpeed < 50 || preset.dropSpeed > 3000) {
        return false;
      }

      if (preset.difficulty < 0 || preset.difficulty > 1) {
        return false;
      }

      // 特殊ルールの検証
      if (preset.specialRules) {
        const { tspinDifficulty, perfectClearBonus, comboMultiplier, backToBackBonus } =
          preset.specialRules;

        if (tspinDifficulty < 0.1 || tspinDifficulty > 3.0) return false;
        if (perfectClearBonus < 0.1 || perfectClearBonus > 3.0) return false;
        if (comboMultiplier < 0.1 || comboMultiplier > 3.0) return false;
        if (backToBackBonus < 0.1 || backToBackBonus > 3.0) return false;
      }

      // ボーナスの検証
      if (preset.bonuses) {
        const { lineClearBonus, dropBonus, levelUpBonus, survivalBonus } = preset.bonuses;

        if (lineClearBonus < 0.1 || lineClearBonus > 3.0) return false;
        if (dropBonus < 0.1 || dropBonus > 3.0) return false;
        if (levelUpBonus < 0.1 || levelUpBonus > 3.0) return false;
        if (survivalBonus < 0.1 || survivalBonus > 3.0) return false;
      }

      return true;
    } catch (error) {
      console.error('DifficultyPresetManager: プリセット検証でエラーが発生しました:', error);
      return false;
    }
  }

  /**
   * プリセットの複製
   *
   * @param {string} sourceName - 元のプリセット名
   * @param {string} newName - 新しいプリセット名
   * @returns {boolean} 複製結果
   */
  duplicatePreset(sourceName, newName) {
    const sourcePreset = this.loadPreset(sourceName);
    if (!sourcePreset) {
      return false;
    }

    const duplicatedPreset = {
      ...sourcePreset,
      name: newName,
      description: `${sourcePreset.name} のコピー`,
      metadata: {
        ...sourcePreset.metadata,
        isCustom: true,
        createdAt: Date.now(),
        lastModified: Date.now(),
        originalPreset: sourceName,
      },
    };

    return this.saveCustomPreset(newName, duplicatedPreset);
  }

  /**
   * プリセットの変換
   *
   * @param {string} presetName - プリセット名
   * @param {string} targetCategory - 目標カテゴリ
   * @returns {Object} 変換されたプリセット
   */
  convertPreset(presetName, targetCategory) {
    const sourcePreset = this.loadPreset(presetName);
    if (!sourcePreset) {
      throw new Error(`DifficultyPresetManager: プリセット '${presetName}' は見つかりません`);
    }

    const convertedPreset = { ...sourcePreset };

    // カテゴリに応じた調整
    switch (targetCategory) {
      case 'speedrun':
        convertedPreset.dropSpeed = Math.max(200, sourcePreset.dropSpeed * 0.8);
        convertedPreset.restrictions = {
          ...sourcePreset.restrictions,
          timeLimit: 300,
          lineLimit: 40,
        };
        convertedPreset.metadata.tags = ['speedrun', 'fast', 'competitive'];
        break;

      case 'marathon':
        convertedPreset.dropSpeed = Math.min(1000, sourcePreset.dropSpeed * 1.2);
        convertedPreset.bonuses.survivalBonus = Math.min(
          2.0,
          sourcePreset.bonuses.survivalBonus * 1.2
        );
        convertedPreset.metadata.tags = ['marathon', 'endurance', 'long'];
        break;

      default:
        // 標準カテゴリへの変換
        convertedPreset.dropSpeed = Math.max(500, Math.min(1500, sourcePreset.dropSpeed));
        convertedPreset.metadata.tags = ['standard', 'balanced'];
    }

    convertedPreset.category = targetCategory;
    convertedPreset.metadata.lastModified = Date.now();

    return convertedPreset;
  }

  /**
   * プリセット履歴に追加
   *
   * @param {string} presetName - プリセット名
   * @param {Object} preset - プリセット設定
   */
  addToHistory(presetName, preset) {
    const historyEntry = {
      presetName,
      preset: { ...preset },
      timestamp: Date.now(),
    };

    this.presetHistory.push(historyEntry);

    // 履歴サイズの制限
    if (this.presetHistory.length > 50) {
      this.presetHistory.shift();
    }
  }

  /**
   * プリセット履歴を取得
   *
   * @returns {Array} プリセット履歴
   */
  getPresetHistory() {
    return [...this.presetHistory];
  }

  /**
   * プリセット統計を取得
   *
   * @returns {Object} プリセット統計
   */
  getPresetStatistics() {
    const totalPresets = this.defaultPresets.size + this.customPresets.size;
    const categories = new Set();
    const difficulties = [];

    for (const preset of this.getAvailablePresets()) {
      categories.add(preset.category);
      difficulties.push(preset.difficulty);
    }

    return {
      totalPresets,
      defaultPresets: this.defaultPresets.size,
      customPresets: this.customPresets.size,
      categories: Array.from(categories),
      averageDifficulty:
        difficulties.length > 0
          ? difficulties.reduce((sum, diff) => sum + diff, 0) / difficulties.length
          : 0,
      minDifficulty: difficulties.length > 0 ? Math.min(...difficulties) : 0,
      maxDifficulty: difficulties.length > 0 ? Math.max(...difficulties) : 0,
      recentUsage: this.presetHistory.slice(-10),
    };
  }

  /**
   * 自動バックアップの開始
   */
  startAutoBackup() {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
    }

    this.backupTimer = setInterval(() => {
      this.saveCustomPresets();
    }, this.config.backupInterval);
  }

  /**
   * 自動バックアップの停止
   */
  stopAutoBackup() {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
      this.backupTimer = null;
    }
  }

  /**
   * プリセットのエクスポート
   *
   * @param {string} presetName - プリセット名
   * @returns {string} エクスポートデータ（JSON）
   */
  exportPreset(presetName) {
    const preset = this.loadPreset(presetName);
    if (!preset) {
      throw new Error(`DifficultyPresetManager: プリセット '${presetName}' は見つかりません`);
    }

    return JSON.stringify(preset, null, 2);
  }

  /**
   * プリセットのインポート
   *
   * @param {string} presetData - インポートデータ（JSON）
   * @returns {boolean} インポート結果
   */
  importPreset(presetData) {
    try {
      const preset = JSON.parse(presetData);

      if (!this.validatePreset(preset)) {
        throw new Error('DifficultyPresetManager: インポートされたプリセットが無効です');
      }

      // 名前の重複チェック
      if (this.defaultPresets.has(preset.name) || this.customPresets.has(preset.name)) {
        preset.name = `${preset.name}_imported_${Date.now()}`;
      }

      return this.saveCustomPreset(preset.name, preset);
    } catch (error) {
      console.error(
        'DifficultyPresetManager: プリセットのインポートでエラーが発生しました:',
        error
      );
      throw error;
    }
  }

  /**
   * プリセット管理システムの破棄
   */
  destroy() {
    // 自動バックアップの停止
    this.stopAutoBackup();

    // カスタムプリセットの保存
    this.saveCustomPresets();

    // データのクリア
    this.defaultPresets.clear();
    this.customPresets.clear();
    this.presetHistory = [];
  }
}
