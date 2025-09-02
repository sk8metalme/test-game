/**
 * パフォーマンス測定用E2Eテストヘルパー
 * FPS、メモリ、描画性能の測定機能を提供
 */

import { BaseHelper } from './BaseHelper.js';

export class PerformanceHelper extends BaseHelper {
  constructor(page) {
    super(page);
    this.metrics = {
      fps: [],
      memory: [],
      renderTimes: [],
    };
  }

  /**
   * FPS測定
   */
  async measureFPS(duration = this.config.performance.fps.measureDuration) {
    console.log(`📊 FPS測定開始 (${duration}ms)`);

    const result = await this.page.evaluate(measureDuration => {
      return new Promise(resolve => {
        const frames = [];
        const startTime = performance.now();
        let frameCount = 0;

        const measureFrame = timestamp => {
          frameCount++;
          frames.push(timestamp);

          const elapsed = timestamp - startTime;
          if (elapsed < measureDuration) {
            requestAnimationFrame(measureFrame);
          } else {
            // FPS計算
            const fps = frameCount / (elapsed / 1000);

            // フレーム時間計算
            const frameTimes = [];
            for (let i = 1; i < frames.length; i++) {
              frameTimes.push(frames[i] - frames[i - 1]);
            }

            const averageFrameTime =
              frameTimes.reduce((sum, time) => sum + time, 0) / frameTimes.length;
            const maxFrameTime = Math.max(...frameTimes);
            const minFrameTime = Math.min(...frameTimes);

            // フレームドロップ検出（33ms = 30FPS以下）
            const frameDrops = frameTimes.filter(time => time > 33).length;

            resolve({
              average: fps,
              frameCount,
              duration: elapsed,
              frameTime: {
                average: averageFrameTime,
                max: maxFrameTime,
                min: minFrameTime,
              },
              drops: frameDrops,
              stability: 1 - frameDrops / frameCount, // 安定性スコア
            });
          }
        };

        requestAnimationFrame(measureFrame);
      });
    }, duration);

    console.log(`📊 FPS測定完了: 平均${result.average.toFixed(1)}fps, ドロップ${result.drops}回`);
    this.metrics.fps.push(result);

    return result;
  }

  /**
   * メモリ使用量測定
   */
  async measureMemoryUsage() {
    const memoryInfo = await this.page.evaluate(() => {
      if (performance.memory) {
        return {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
          timestamp: performance.now(),
        };
      } else {
        // performance.memory が利用できない場合の代替
        return {
          usedJSHeapSize: 0,
          totalJSHeapSize: 0,
          jsHeapSizeLimit: 0,
          timestamp: performance.now(),
          unavailable: true,
        };
      }
    });

    this.metrics.memory.push(memoryInfo);
    return memoryInfo;
  }

  /**
   * メモリリーク検出
   */
  async detectMemoryLeak(testDuration = 60000, measureInterval = 5000) {
    console.log(`🔍 メモリリーク検出開始 (${testDuration}ms)`);

    const measurements = [];
    const startTime = Date.now();

    // 初期測定
    const initialMemory = await this.measureMemoryUsage();
    measurements.push(initialMemory);

    while (Date.now() - startTime < testDuration) {
      await this.sleep(measureInterval);
      const currentMemory = await this.measureMemoryUsage();
      measurements.push(currentMemory);
    }

    // 最終測定
    const finalMemory = await this.measureMemoryUsage();
    measurements.push(finalMemory);

    // メモリ増加量計算
    const memoryIncrease = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
    const increasePercentage = (memoryIncrease / initialMemory.usedJSHeapSize) * 100;

    // メモリリークの判定
    const leakThreshold = this.config.performance.memory.leakThreshold * 1024 * 1024; // MB to bytes
    const hasLeak = memoryIncrease > leakThreshold;

    const result = {
      initialMemory: initialMemory.usedJSHeapSize,
      finalMemory: finalMemory.usedJSHeapSize,
      memoryIncrease,
      increasePercentage,
      hasLeak,
      measurements,
      duration: testDuration,
    };

    console.log(
      `🔍 メモリリーク検出完了: ${(memoryIncrease / 1024 / 1024).toFixed(1)}MB増加 ${hasLeak ? '⚠️リークあり' : '✅正常'}`
    );

    return result;
  }

  /**
   * 描画パフォーマンス測定
   */
  async measureRenderingPerformance(duration = 5000) {
    console.log(`🎨 描画パフォーマンス測定開始 (${duration}ms)`);

    const result = await this.page.evaluate(measureDuration => {
      return new Promise(resolve => {
        const renderTimes = [];
        const startTime = performance.now();
        let frameCount = 0;

        const observer = new PerformanceObserver(list => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            if (entry.entryType === 'measure' || entry.entryType === 'paint') {
              renderTimes.push(entry.duration);
            }
          });
        });

        observer.observe({ entryTypes: ['measure', 'paint'] });

        const measureFrame = timestamp => {
          const now = performance.now();
          const frameTime = now - (renderTimes[renderTimes.length - 1] || startTime);
          renderTimes.push(frameTime);
          frameCount++;

          if (timestamp - startTime < measureDuration) {
            requestAnimationFrame(measureFrame);
          } else {
            observer.disconnect();

            const avgRenderTime =
              renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length;
            const maxRenderTime = Math.max(...renderTimes);
            const minRenderTime = Math.min(...renderTimes);

            // パーティクル数取得
            const particleCount = window.tetrisGame?.effectManager?.getActiveParticleCount?.() || 0;

            resolve({
              averageFrameTime: avgRenderTime,
              maxFrameTime: maxRenderTime,
              minFrameTime: minRenderTime,
              frameCount,
              particleCount,
              renderTimes: renderTimes.slice(0, 100), // 最初の100フレームのみ保存
            });
          }
        };

        requestAnimationFrame(measureFrame);
      });
    }, duration);

    console.log(`🎨 描画パフォーマンス測定完了: 平均${result.averageFrameTime.toFixed(2)}ms/frame`);
    this.metrics.renderTimes.push(result);

    return result;
  }

  /**
   * パーティクルシステムパフォーマンス測定
   */
  async measureParticlePerformance() {
    return await this.page.evaluate(() => {
      const game = window.tetrisGame || window.game;
      if (!game || !game.effectManager) {
        return null;
      }

      const effectManager = game.effectManager;

      return {
        activeParticles: effectManager.getActiveParticleCount?.() || 0,
        activeEffects: effectManager.getActiveEffects?.()?.length || 0,
        poolSize: effectManager.particleSystem?.particlePool?.getPoolSize?.() || 0,
        poolUsage: effectManager.particleSystem?.particlePool?.getUsagePercentage?.() || 0,
        renderCalls: effectManager.particleSystem?.renderer?.getRenderCalls?.() || 0,
      };
    });
  }

  /**
   * パフォーマンス統計を取得
   */
  getPerformanceStats() {
    const fpsData = this.metrics.fps;
    const memoryData = this.metrics.memory;
    const renderData = this.metrics.renderTimes;

    return {
      fps: {
        measurements: fpsData.length,
        average:
          fpsData.length > 0
            ? fpsData.reduce((sum, data) => sum + data.average, 0) / fpsData.length
            : 0,
        min: fpsData.length > 0 ? Math.min(...fpsData.map(data => data.average)) : 0,
        max: fpsData.length > 0 ? Math.max(...fpsData.map(data => data.average)) : 0,
        totalDrops: fpsData.reduce((sum, data) => sum + data.drops, 0),
      },
      memory: {
        measurements: memoryData.length,
        current: memoryData.length > 0 ? memoryData[memoryData.length - 1].usedJSHeapSize : 0,
        peak: memoryData.length > 0 ? Math.max(...memoryData.map(data => data.usedJSHeapSize)) : 0,
        growth:
          memoryData.length > 1
            ? memoryData[memoryData.length - 1].usedJSHeapSize - memoryData[0].usedJSHeapSize
            : 0,
      },
      rendering: {
        measurements: renderData.length,
        averageFrameTime:
          renderData.length > 0
            ? renderData.reduce((sum, data) => sum + data.averageFrameTime, 0) / renderData.length
            : 0,
        maxFrameTime:
          renderData.length > 0 ? Math.max(...renderData.map(data => data.maxFrameTime)) : 0,
      },
    };
  }

  /**
   * パフォーマンスレポート生成
   */
  generateReport() {
    const stats = this.getPerformanceStats();
    const config = this.config.performance;

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        fpsTarget: config.fps.target,
        fpsActual: stats.fps.average,
        fpsStatus: stats.fps.average >= config.fps.minimum ? 'PASS' : 'FAIL',
        memoryUsage: `${(stats.memory.current / 1024 / 1024).toFixed(1)}MB`,
        memoryGrowth: `${(stats.memory.growth / 1024 / 1024).toFixed(1)}MB`,
        memoryStatus:
          stats.memory.growth <= config.memory.leakThreshold * 1024 * 1024 ? 'PASS' : 'FAIL',
      },
      details: stats,
      recommendations: this._generateRecommendations(stats, config),
    };

    return report;
  }

  /**
   * パフォーマンス改善提案生成
   */
  _generateRecommendations(stats, config) {
    const recommendations = [];

    // FPS関連の提案
    if (stats.fps.average < config.fps.target) {
      recommendations.push({
        category: 'FPS',
        issue: `平均FPS ${stats.fps.average.toFixed(1)} が目標 ${config.fps.target} を下回っています`,
        suggestion: 'パーティクル数の削減、LODシステムの調整、描画最適化を検討してください',
      });
    }

    if (stats.fps.totalDrops > 0) {
      recommendations.push({
        category: 'FPS',
        issue: `${stats.fps.totalDrops} 回のフレームドロップが発生しました`,
        suggestion: 'ガベージコレクションの最適化、重い処理の分散を検討してください',
      });
    }

    // メモリ関連の提案
    const memoryGrowthMB = stats.memory.growth / 1024 / 1024;
    if (memoryGrowthMB > config.memory.leakThreshold) {
      recommendations.push({
        category: 'Memory',
        issue: `メモリ使用量が ${memoryGrowthMB.toFixed(1)}MB 増加しました`,
        suggestion: 'メモリリークの調査、オブジェクトプールの調整を検討してください',
      });
    }

    // 描画関連の提案
    if (stats.rendering.averageFrameTime > 16.7) {
      recommendations.push({
        category: 'Rendering',
        issue: `平均フレーム時間 ${stats.rendering.averageFrameTime.toFixed(2)}ms が60FPS(16.7ms)を超えています`,
        suggestion: 'バッチ描画の最適化、描画コールの削減を検討してください',
      });
    }

    return recommendations;
  }

  /**
   * メトリクスをリセット
   */
  resetMetrics() {
    this.metrics = {
      fps: [],
      memory: [],
      renderTimes: [],
    };
  }
}
