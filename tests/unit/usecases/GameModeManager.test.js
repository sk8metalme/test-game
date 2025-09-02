/**
 * GameModeManager テスト
 *
 * ゲームモード管理システムのテスト
 *
 * @author AI Assistant
 * @version 1.0.0
 */

import GameModeManager from '../../../src/core/usecases/GameModeManager.js';

describe('GameModeManager', () => {
  let gameModeManager;

  beforeEach(() => {
    gameModeManager = new GameModeManager({
      defaultMode: 'classic',
      enableTransitions: true,
      saveProgress: true,
    });
  });

  afterEach(() => {
    if (gameModeManager) {
      gameModeManager.destroy();
    }
  });

  describe('初期化', () => {
    test('デフォルト設定で初期化される', () => {
      const defaultManager = new GameModeManager();

      expect(defaultManager.config.defaultMode).toBe('classic');
      expect(defaultManager.config.enableTransitions).toBe(true);
      expect(defaultManager.config.saveProgress).toBe(true);
    });

    test('カスタム設定で初期化される', () => {
      expect(gameModeManager.config.defaultMode).toBe('classic');
      expect(gameModeManager.config.enableTransitions).toBe(true);
      expect(gameModeManager.config.saveProgress).toBe(true);
    });

    test('初期化時にデフォルトモードが登録される', () => {
      const modes = gameModeManager.getAvailableModes();

      expect(modes).toHaveLength(5);
      expect(modes.some(mode => mode.name === 'classic')).toBe(true);
      expect(modes.some(mode => mode.name === 'timeAttack')).toBe(true);
      expect(modes.some(mode => mode.name === 'endless')).toBe(true);
      expect(modes.some(mode => mode.name === 'puzzle')).toBe(true);
      expect(modes.some(mode => mode.name === 'practice')).toBe(true);
    });

    test('初期化時にデフォルトモードが選択される', () => {
      const currentMode = gameModeManager.getCurrentMode();

      expect(currentMode.name).toBe('classic');
      expect(currentMode.displayName).toBe('Classic Mode');
      expect(currentMode.description).toBe('従来のテトリスゲーム');
    });
  });

  describe('ゲームモードの登録', () => {
    test('新しいゲームモードを登録できる', () => {
      const customMode = {
        name: 'Custom Mode',
        description: 'カスタムゲームモード',
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
          linePoints: [100, 200, 400, 800],
          comboMultiplier: 1.0,
          tSpinBonus: 1.0,
          perfectClearBonus: 1.0,
          backToBackBonus: 1.0,
        },
        difficulty: {
          startLevel: 1,
          maxLevel: 10,
          levelUpLines: 10,
          speedIncrease: 0.8,
        },
      };

      const registerSpy = jest.fn();
      gameModeManager.on('modeRegistered', registerSpy);

      gameModeManager.registerMode('custom', customMode);

      expect(registerSpy).toHaveBeenCalledWith({ name: 'custom', config: customMode });

      const modes = gameModeManager.getAvailableModes();
      expect(modes.some(mode => mode.name === 'custom')).toBe(true);
    });

    test('既存のモード名で登録しようとするとエラーが発生する', () => {
      const customMode = {
        name: 'Custom Mode',
        description: 'カスタムゲームモード',
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
          linePoints: [100, 200, 400, 800],
          comboMultiplier: 1.0,
          tSpinBonus: 1.0,
          perfectClearBonus: 1.0,
          backToBackBonus: 1.0,
        },
        difficulty: {
          startLevel: 1,
          maxLevel: 10,
          levelUpLines: 10,
          speedIncrease: 0.8,
        },
      };

      expect(() => {
        gameModeManager.registerMode('classic', customMode);
      }).toThrow("GameModeManager: モード 'classic' は既に登録されています");
    });

    test('必須フィールドが不足している場合エラーが発生する', () => {
      const invalidMode = {
        name: 'Invalid Mode',
        description: '無効なゲームモード',
        // rules, scoring, difficultyが不足
      };

      expect(() => {
        gameModeManager.registerMode('invalid', invalidMode);
      }).toThrow("GameModeManager: モード設定に必須フィールド 'rules' が不足しています");
    });

    test('ルール設定が無効な場合エラーが発生する', () => {
      const invalidMode = {
        name: 'Invalid Mode',
        description: '無効なゲームモード',
        rules: {
          enableHold: 'true', // boolean型ではない
          enableGhost: true,
          enableWallKick: true,
          enableTSpin: true,
          enablePerfectClear: true,
          enableCombo: true,
          enableBackToBack: true,
        },
        scoring: {
          linePoints: [100, 200, 400, 800],
          comboMultiplier: 1.0,
          tSpinBonus: 1.0,
          perfectClearBonus: 1.0,
          backToBackBonus: 1.0,
        },
        difficulty: {
          startLevel: 1,
          maxLevel: 10,
          levelUpLines: 10,
          speedIncrease: 0.8,
        },
      };

      expect(() => {
        gameModeManager.registerMode('invalid', invalidMode);
      }).toThrow("GameModeManager: ルール設定 'enableHold' はboolean型である必要があります");
    });

    test('スコア設定が無効な場合エラーが発生する', () => {
      const invalidMode = {
        name: 'Invalid Mode',
        description: '無効なゲームモード',
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
          linePoints: [100, 200, 400], // 4要素ではない
          comboMultiplier: 1.0,
          tSpinBonus: 1.0,
          perfectClearBonus: 1.0,
          backToBackBonus: 1.0,
        },
        difficulty: {
          startLevel: 1,
          maxLevel: 10,
          levelUpLines: 10,
          speedIncrease: 0.8,
        },
      };

      expect(() => {
        gameModeManager.registerMode('invalid', invalidMode);
      }).toThrow('GameModeManager: linePointsは4要素の配列である必要があります');
    });

    test('難易度設定が無効な場合エラーが発生する', () => {
      const invalidMode = {
        name: 'Invalid Mode',
        description: '無効なゲームモード',
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
          linePoints: [100, 200, 400, 800],
          comboMultiplier: 1.0,
          tSpinBonus: 1.0,
          perfectClearBonus: 1.0,
          backToBackBonus: 1.0,
        },
        difficulty: {
          startLevel: '1', // 数値型ではない
          maxLevel: 10,
          levelUpLines: 10,
          speedIncrease: 0.8,
        },
      };

      expect(() => {
        gameModeManager.registerMode('invalid', invalidMode);
      }).toThrow("GameModeManager: 難易度設定 'startLevel' は数値型である必要があります");
    });
  });

  describe('ゲームモードの切り替え', () => {
    test('別のゲームモードに切り替えられる', () => {
      const switchSpy = jest.fn();
      gameModeManager.on('modeSwitched', switchSpy);

      const result = gameModeManager.switchMode('timeAttack');

      expect(result.name).toBe('timeAttack');
      expect(switchSpy).toHaveBeenCalledWith({
        previousMode: 'classic',
        currentMode: 'timeAttack',
        options: {},
      });

      const currentMode = gameModeManager.getCurrentMode();
      expect(currentMode.name).toBe('timeAttack');
      expect(currentMode.displayName).toBe('Time Attack Mode');
    });

    test('存在しないモードに切り替えようとするとエラーが発生する', () => {
      expect(() => {
        gameModeManager.switchMode('nonExistent');
      }).toThrow("GameModeManager: モード 'nonExistent' は登録されていません");
    });

    test('切り替えオプションを指定できる', () => {
      const options = { preserveState: true, resetScore: false };
      const switchSpy = jest.fn();
      gameModeManager.on('modeSwitched', switchSpy);

      gameModeManager.switchMode('endless', options);

      expect(switchSpy).toHaveBeenCalledWith({
        previousMode: 'classic',
        currentMode: 'endless',
        options,
      });
    });
  });

  describe('現在のゲームモード', () => {
    test('現在のゲームモードを取得できる', () => {
      const currentMode = gameModeManager.getCurrentMode();

      expect(currentMode).toBeDefined();
      expect(currentMode.name).toBe('classic');
      expect(currentMode.rules).toBeDefined();
      expect(currentMode.scoring).toBeDefined();
      expect(currentMode.difficulty).toBeDefined();
    });

    test('モードが選択されていない場合はnullが返される', () => {
      const emptyManager = new GameModeManager({ defaultMode: null });
      emptyManager.destroy();

      expect(emptyManager.getCurrentMode()).toBeNull();
    });
  });

  describe('モード固有の設定', () => {
    test('モード固有の設定を設定できる', () => {
      const configSpy = jest.fn();
      gameModeManager.on('modeConfigChanged', configSpy);

      gameModeManager.setModeConfig('classic', 'customSetting', 'value');

      expect(configSpy).toHaveBeenCalledWith({
        name: 'classic',
        key: 'customSetting',
        value: 'value',
      });
    });

    test('モード固有の設定を取得できる', () => {
      gameModeManager.setModeConfig('classic', 'customSetting', 'value');

      const value = gameModeManager.getModeConfig('classic', 'customSetting');
      expect(value).toBe('value');
    });

    test('モード固有の設定全体を取得できる', () => {
      gameModeManager.setModeConfig('classic', 'setting1', 'value1');
      gameModeManager.setModeConfig('classic', 'setting2', 'value2');

      const config = gameModeManager.getModeConfig('classic');
      expect(config.setting1).toBe('value1');
      expect(config.setting2).toBe('value2');
    });

    test('存在しないモードの設定を設定しようとするとエラーが発生する', () => {
      expect(() => {
        gameModeManager.setModeConfig('nonExistent', 'key', 'value');
      }).toThrow("GameModeManager: モード 'nonExistent' は登録されていません");
    });
  });

  describe('利用可能なゲームモード', () => {
    test('利用可能なゲームモードの一覧を取得できる', () => {
      const modes = gameModeManager.getAvailableModes();

      expect(Array.isArray(modes)).toBe(true);
      expect(modes.length).toBe(5);

      const classicMode = modes.find(mode => mode.name === 'classic');
      expect(classicMode).toBeDefined();
      expect(classicMode.displayName).toBe('Classic Mode');
      expect(classicMode.description).toBe('従来のテトリスゲーム');
    });
  });

  describe('モードの有効化/無効化', () => {
    test('モードを有効化/無効化できる', () => {
      const enabledSpy = jest.fn();
      gameModeManager.on('modeEnabledChanged', enabledSpy);

      gameModeManager.setModeEnabled('classic', false);

      expect(enabledSpy).toHaveBeenCalledWith({
        name: 'classic',
        enabled: false,
      });
    });

    test('存在しないモードを有効化/無効化しようとするとエラーが発生する', () => {
      expect(() => {
        gameModeManager.setModeEnabled('nonExistent', false);
      }).toThrow("GameModeManager: モード 'nonExistent' は登録されていません");
    });
  });

  describe('モードの削除', () => {
    test('ゲームモードを削除できる', () => {
      const removeSpy = jest.fn();
      gameModeManager.on('modeRemoved', removeSpy);

      gameModeManager.removeMode('practice');

      expect(removeSpy).toHaveBeenCalledWith({ name: 'practice' });

      const modes = gameModeManager.getAvailableModes();
      expect(modes.some(mode => mode.name === 'practice')).toBe(false);
    });

    test('現在アクティブなモードは削除できない', () => {
      expect(() => {
        gameModeManager.removeMode('classic');
      }).toThrow("GameModeManager: 現在アクティブなモード 'classic' は削除できません");
    });

    test('存在しないモードの削除は安全に処理される', () => {
      expect(() => {
        gameModeManager.removeMode('nonExistent');
      }).not.toThrow();
    });
  });

  describe('統計情報', () => {
    test('モードの統計情報を取得できる', () => {
      const stats = gameModeManager.getModeStats('classic');

      expect(stats).toBeDefined();
      expect(stats.totalGames).toBe(0);
      expect(stats.totalScore).toBe(0);
      expect(stats.totalTime).toBe(0);
      expect(stats.bestScore).toBe(0);
      expect(stats.bestTime).toBe(0);
      expect(stats.averageScore).toBe(0);
    });

    test('全モードの統計情報を取得できる', () => {
      const allStats = gameModeManager.getAllModeStats();

      expect(allStats).toBeDefined();
      expect(allStats.classic).toBeDefined();
      expect(allStats.timeAttack).toBeDefined();
      expect(allStats.endless).toBeDefined();
      expect(allStats.puzzle).toBeDefined();
      expect(allStats.practice).toBeDefined();
    });
  });

  describe('イベントシステム', () => {
    test('イベントリスナーを登録できる', () => {
      const listener = jest.fn();

      gameModeManager.on('testEvent', listener);

      expect(gameModeManager.listeners.has('testEvent')).toBe(true);
      expect(gameModeManager.listeners.get('testEvent')).toContain(listener);
    });

    test('イベントが正しく発火される', () => {
      const listener = jest.fn();
      gameModeManager.on('testEvent', listener);

      gameModeManager.emit('testEvent', { data: 'test' });

      expect(listener).toHaveBeenCalledWith({ data: 'test' });
    });

    test('エラーが発生した場合も安全に処理される', () => {
      const errorListener = jest.fn(() => {
        throw new Error('Test error');
      });
      gameModeManager.on('errorEvent', errorListener);
      gameModeManager.emit('errorEvent', {});

      // エラーリスナーが呼び出されることを確認（console出力は期待しない）
      expect(errorListener).toHaveBeenCalled();
    });
  });

  describe('破棄処理', () => {
    test('ゲームモードマネージャーが正しく破棄される', () => {
      const destroySpy = jest.fn();
      gameModeManager.on('destroyed', destroySpy);

      gameModeManager.destroy();

      expect(gameModeManager.currentMode).toBeNull();
      expect(gameModeManager.modes.size).toBe(0);
      expect(gameModeManager.modeConfig.size).toBe(0);
      expect(gameModeManager.gameHistory.size).toBe(0);
      expect(gameModeManager.listeners.size).toBe(0);
      expect(destroySpy).toHaveBeenCalled();
    });
  });

  describe('エッジケース', () => {
    test('空のマネージャーでの操作', () => {
      const emptyManager = new GameModeManager({ defaultMode: null });
      emptyManager.destroy();

      expect(emptyManager.getCurrentMode()).toBeNull();
      expect(emptyManager.getAvailableModes()).toHaveLength(0);
    });

    test('大量のモード登録', () => {
      const customMode = {
        name: 'Custom Mode',
        description: 'カスタムゲームモード',
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
          linePoints: [100, 200, 400, 800],
          comboMultiplier: 1.0,
          tSpinBonus: 1.0,
          perfectClearBonus: 1.0,
          backToBackBonus: 1.0,
        },
        difficulty: {
          startLevel: 1,
          maxLevel: 10,
          levelUpLines: 10,
          speedIncrease: 0.8,
        },
      };

      // 100個のモードを登録
      for (let i = 0; i < 100; i++) {
        gameModeManager.registerMode(`custom${i}`, customMode);
      }

      const modes = gameModeManager.getAvailableModes();
      expect(modes.length).toBe(105); // デフォルト5 + カスタム100
    });
  });
});
