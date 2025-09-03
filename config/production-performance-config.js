/**
 * production-performance-config.js
 * 
 * PerformanceOptimizer Phase 2-3 本格運用設定
 * 世界クラス自動パフォーマンス最適化システム 本番環境構成
 */

/**
 * 本格運用パフォーマンス設定
 */
export const ProductionPerformanceConfig = {
  // システム全体設定
  system: {
    version: '2.3.0',
    environment: 'production',
    enableAdvancedOptimization: true,
    enableRealTimeMonitoring: true,
    enablePredictiveAnalysis: true,
    enableReporting: true,
    
    // 本格運用ロギング
    logging: {
      level: 'info',  // production では info レベル
      enablePerformanceLogging: true,
      enableOptimizationLogging: true,
      enableErrorReporting: true,
      logRetention: 7 * 24 * 60 * 60 * 1000  // 7日間
    }
  },

  // RealtimePerformanceMonitor 設定
  performanceMonitor: {
    monitoring: {
      interval: 16,          // 60FPS対応
      historySize: 120,      // 2秒分の履歴（本格運用）
      bufferSize: 200,       // 大きなバッファサイズ
      enableHistory: true,
      maxHistorySize: 1000   // 本格運用での長期履歴
    },
    
    thresholds: {
      fps: {
        warning: 45,         // 45fps以下で警告
        critical: 30,        // 30fps以下でクリティカル
        target: 60           // 目標60fps
      },
      memory: {
        warning: 80,         // 80MB以上で警告
        critical: 120,       // 120MB以上でクリティカル
        optimal: 60          // 最適値60MB
      },
      cpu: {
        warning: 70,         // 70%以上で警告
        critical: 85,        // 85%以上でクリティカル
        optimal: 50          // 最適値50%
      },
      frameTime: {
        warning: 20,         // 20ms以上で警告
        critical: 33.33,     // 30fps相当でクリティカル
        optimal: 16.67       // 60fps相当が最適
      }
    },
    
    alerts: {
      enableWarnings: true,
      enableCritical: true,
      cooldownPeriod: 3000,  // 3秒のクールダウン
      maxAlertsPerMinute: 10 // 1分間に最大10アラート
    }
  },

  // PerformanceController 設定
  performanceController: {
    distribution: {
      interval: 250,                    // 250ms間隔での配信
      enableAdaptiveUI: true,
      enablePerformanceMonitorUI: true,
      enableSubscribers: true,
      filterHeavyData: true,
      batchSize: 50                     // バッチサイズ
    },
    
    monitoring: {
      autoStart: true,         // 自動開始
      autoSync: true,          // 自動同期
      syncInterval: 1000,      // 1秒間隔同期
      healthCheckInterval: 5000 // 5秒間隔ヘルスチェック
    },
    
    optimization: {
      autoTrigger: true,       // 自動最適化トリガー
      priorityQueue: true,     // 優先度キューイング
      maxQueueSize: 20,        // 最大キューサイズ
      maxConcurrentOptimizations: 3 // 同時最適化数
    }
  },

  // AutoOptimizer 設定
  autoOptimizer: {
    optimization: {
      level: 'moderate',       // 本格運用は中程度から開始
      enableAggressive: true,  // 必要時の積極的最適化
      enableConservative: true, // 保守的最適化も利用可能
      enableReporting: true,   // 本格運用レポート
      reportingInterval: 30000 // 30秒間隔レポート
    },
    
    thresholds: {
      fps: {
        trigger: 50,           // 50fps以下で最適化発動
        target: 58,            // 58fps目標
        emergency: 25          // 25fps以下で緊急最適化
      },
      memory: {
        trigger: 75,           // 75MB以上で最適化発動
        target: 65,            // 65MB目標
        emergency: 100         // 100MB以上で緊急最適化
      },
      cpu: {
        trigger: 75,           // 75%以上で最適化発動
        target: 65,            // 65%目標
        emergency: 90          // 90%以上で緊急最適化
      }
    },
    
    strategies: {
      enableParticleOptimization: true,
      enableRenderingOptimization: true,
      enableMemoryOptimization: true,
      enableQualityAdjustment: true,
      enablePredictiveOptimization: true
    }
  },

  // MemoryManager 設定
  memoryManager: {
    monitoring: {
      enableLeakDetection: true,    // リーク検出有効
      enableAutoGC: true,           // 自動GC有効
      enablePoolOptimization: true, // プール最適化有効
      monitoringInterval: 1000,     // 1秒間隔監視
      reportingInterval: 30000      // 30秒間隔レポート
    },
    
    thresholds: {
      gcThreshold: 80,              // 80MB以上でGC検討
      leakThreshold: 50,            // 50MB以上のリーク検出
      poolOptimizationThreshold: 70, // 70%使用率で最適化
      emergencyCleanupThreshold: 110 // 110MB以上で緊急クリーンアップ
    },
    
    optimization: {
      enableAutoCleanup: true,      // 自動クリーンアップ
      enablePoolResize: true,       // プールサイズ自動調整
      enableWeakReferences: true,   // 弱参照利用
      gcInterval: 60000,            // 60秒間隔でGC検討
      maxPoolSize: 1000            // 最大プールサイズ
    }
  },

  // QualityController 設定
  qualityController: {
    quality: {
      enableDynamicAdjustment: true,  // 動的品質調整有効
      enableDeviceProfiling: true,    // デバイスプロファイリング有効
      defaultQuality: 'medium',       // 本格運用は中品質から開始
      adaptiveQuality: true,          // 適応的品質調整
      reportingEnabled: true          // 本格運用レポート
    },
    
    adjustment: {
      sensitivity: 0.7,               // 調整感度
      hysteresisMargin: 5,            // ヒステリシス余裕
      adjustmentInterval: 2000,       // 2秒間隔調整
      maxAdjustmentsPerMinute: 15,    // 1分間に最大15回調整
      emergencyAdjustmentThreshold: 25 // 25fps以下で緊急調整
    },
    
    levels: {
      high: {
        particles: 1000,
        effects: 'full',
        quality: 1.0,
        description: '最高品質（高性能デバイス向け）'
      },
      medium: {
        particles: 500,
        effects: 'reduced',
        quality: 0.7,
        description: '中品質（標準デバイス向け）'
      },
      low: {
        particles: 200,
        effects: 'minimal',
        quality: 0.4,
        description: '低品質（低性能デバイス向け）'
      },
      emergency: {
        particles: 50,
        effects: 'none',
        quality: 0.2,
        description: '緊急品質（極低性能デバイス向け）'
      }
    }
  },

  // PredictiveAnalyzer 設定
  predictiveAnalyzer: {
    analysis: {
      enableContinuousAnalysis: true,     // 継続分析有効
      enablePredictiveOptimization: true, // 予測的最適化有効
      predictionAccuracy: 0.85,           // 高精度予測要求
      analysisInterval: 2000,             // 2秒間隔分析
      reportingInterval: 30000,           // 30秒間隔レポート
      reportingEnabled: true              // 本格運用レポート
    },
    
    prediction: {
      historyDepth: 100,                  // 履歴深度
      minSamplesForPrediction: 20,        // 予測に必要な最小サンプル数
      predictionHorizon: 5000,            // 5秒先の予測
      confidenceThreshold: 0.8,           // 80%以上の信頼度で行動
      enableEnsemblePrediction: true      // アンサンブル予測有効
    },
    
    algorithms: {
      movingAverage: {
        enabled: true,
        windowSize: 20,
        weight: 0.3
      },
      linearRegression: {
        enabled: true,
        minSamples: 10,
        weight: 0.4
      },
      exponentialSmoothing: {
        enabled: true,
        alpha: 0.3,
        weight: 0.3
      }
    }
  },

  // 本格運用監視設定
  monitoring: {
    healthCheck: {
      enabled: true,
      interval: 5000,           // 5秒間隔
      timeout: 2000,            // 2秒タイムアウト
      retryCount: 3,            // 3回リトライ
      alertOnFailure: true      // 失敗時アラート
    },
    
    metrics: {
      enableContinuousCollection: true,
      enableRealTimeReporting: true,
      enablePerformanceLogging: true,
      enableUserExperienceTracking: true,
      metricsRetention: 24 * 60 * 60 * 1000  // 24時間保持
    },
    
    alerts: {
      enableSlackNotification: false,      // 本格運用時に有効化検討
      enableEmailNotification: false,      // 本格運用時に有効化検討
      enableWebhookNotification: false,    // 本格運用時に有効化検討
      criticalAlertThreshold: 5,            // 5回連続でクリティカル時通知
      escalationInterval: 300000            // 5分間隔でエスカレーション
    }
  },

  // 本格運用レポート設定
  reporting: {
    performance: {
      enabled: true,
      interval: 'hourly',       // 1時間間隔
      includeOptimizations: true,
      includeMemoryStats: true,
      includeQualityAdjustments: true,
      includePredictions: true
    },
    
    optimization: {
      enabled: true,
      interval: 'daily',        // 日次レポート
      includeTrends: true,
      includeEffectiveness: true,
      includeRecommendations: true
    },
    
    export: {
      enableJSONExport: true,
      enableCSVExport: true,
      enableHTMLReport: true,
      reportRetention: 30 * 24 * 60 * 60 * 1000  // 30日間保持
    }
  },

  // セキュリティ・プライバシー設定
  security: {
    enableDataEncryption: false,         // 必要に応じて有効化
    enableAuditLogging: true,           // 監査ログ有効
    enablePrivacyMode: false,           // プライバシーモード
    dataRetentionPolicy: 'moderate',    // 中程度のデータ保持
    enableAnonymization: false          // 匿名化（必要に応じて）
  },

  // 開発・デバッグ設定（本格運用では無効）
  development: {
    enableDebugMode: false,             // 本格運用では無効
    enableVerboseLogging: false,        // 詳細ログ無効
    enableTestMode: false,              // テストモード無効
    enableMockData: false,              // モックデータ無効
    enablePerformanceProfiling: false   // パフォーマンスプロファイリング無効
  }
};

/**
 * デバイス別設定プロファイル
 */
export const DeviceProfiles = {
  // 高性能デバイス
  highPerformance: {
    autoOptimizer: { level: 'conservative' },
    qualityController: { defaultQuality: 'high' },
    performanceMonitor: { interval: 16 }
  },
  
  // 中性能デバイス
  mediumPerformance: {
    autoOptimizer: { level: 'moderate' },
    qualityController: { defaultQuality: 'medium' },
    performanceMonitor: { interval: 16 }
  },
  
  // 低性能デバイス
  lowPerformance: {
    autoOptimizer: { level: 'aggressive' },
    qualityController: { defaultQuality: 'low' },
    performanceMonitor: { interval: 33 }
  },
  
  // モバイルデバイス
  mobile: {
    autoOptimizer: { level: 'moderate', enableAggressive: true },
    qualityController: { defaultQuality: 'medium', sensitivity: 0.8 },
    performanceMonitor: { interval: 20, historySize: 60 },
    memoryManager: { gcThreshold: 60, enableAutoCleanup: true }
  }
};

/**
 * 運用環境別設定
 */
export const EnvironmentConfigs = {
  // 本格運用環境
  production: {
    system: { logging: { level: 'info' } },
    monitoring: { healthCheck: { interval: 5000 } },
    reporting: { performance: { interval: 'hourly' } }
  },
  
  // ステージング環境
  staging: {
    system: { logging: { level: 'debug' } },
    monitoring: { healthCheck: { interval: 3000 } },
    reporting: { performance: { interval: 'every10minutes' } }
  },
  
  // 開発環境
  development: {
    system: { logging: { level: 'debug' } },
    development: { enableDebugMode: true, enableVerboseLogging: true },
    monitoring: { healthCheck: { interval: 1000 } }
  }
};

/**
 * 設定マージ関数
 */
export function mergeConfig(baseConfig, overrideConfig) {
  function deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }
  
  return deepMerge(baseConfig, overrideConfig);
}

/**
 * デバイスプロファイル検出
 */
export function detectDeviceProfile() {
  // 簡易的なデバイス性能検出
  const cores = navigator.hardwareConcurrency || 4;
  const memory = (navigator as any).deviceMemory || 4; // GB
  const connection = (navigator as any).connection;
  
  const performanceScore = cores * 10 + memory * 5 + (connection?.downlink || 10);
  
  if (performanceScore > 60) return 'highPerformance';
  if (performanceScore > 30) return 'mediumPerformance';
  return 'lowPerformance';
}

/**
 * 本格運用設定取得
 */
export function getProductionConfig(deviceProfile = null, environment = 'production') {
  let config = ProductionPerformanceConfig;
  
  // 環境設定適用
  if (EnvironmentConfigs[environment]) {
    config = mergeConfig(config, EnvironmentConfigs[environment]);
  }
  
  // デバイスプロファイル適用
  const profile = deviceProfile || detectDeviceProfile();
  if (DeviceProfiles[profile]) {
    config = mergeConfig(config, DeviceProfiles[profile]);
  }
  
  return config;
}

export default ProductionPerformanceConfig;
