/**
 * E2E専用テストサーバー
 * CORS問題を解決し、静的ファイルを提供
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class TestServer {
  constructor(port = 3001) {
    this.port = port;
    this.app = express();
    this.server = null;
    this.setupRoutes();
  }

  setupRoutes() {
    const projectRoot = path.join(__dirname, '../../../');

    // CORS設定（最初に設定）
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      next();
    });

    // Content-Type設定（ES Modules対応）
    this.app.use((req, res, next) => {
      if (req.path.endsWith('.js')) {
        res.type('application/javascript; charset=utf-8');
      }
      next();
    });

    // テストページ専用ルート
    this.app.get('/e2e-test', (req, res) => {
      const testPagePath = path.join(__dirname, '../fixtures/enhanced-test-page.html');
      res.sendFile(testPagePath);
    });

    // ヘルスチェック
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // 静的ファイル配信（最後に設定）
    // Express.staticがファイルパス解決を自動処理
    this.app.use(
      express.static(projectRoot, {
        // セキュリティ設定
        dotfiles: 'deny',
        // キャッシュ無効（開発用）
        maxAge: 0,
        // インデックスファイル無効
        index: false,
        // ES Modules用Content-Type設定
        setHeaders: (res, path) => {
          if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
          }
        },
      })
    );
  }

  async start() {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, err => {
        if (err) {
          reject(err);
        } else {
          console.log(`🌐 E2Eテストサーバー開始: http://localhost:${this.port}`);
          resolve(`http://localhost:${this.port}`);
        }
      });
    });
  }

  async stop() {
    return new Promise(resolve => {
      if (this.server) {
        this.server.close(() => {
          console.log('🔌 E2Eテストサーバー停止');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  getURL() {
    return `http://localhost:${this.port}`;
  }

  getTestPageURL() {
    return `${this.getURL()}/e2e-test`;
  }
}

// 直接実行された場合
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new TestServer();

  server
    .start()
    .then(url => {
      console.log(`テストサーバーが ${url} で実行中です`);
      console.log(`テストページ: ${url}/e2e-test`);
      console.log('Ctrl+C で停止します');
    })
    .catch(error => {
      console.error('サーバー開始エラー:', error);
      process.exit(1);
    });

  // 終了処理
  process.on('SIGINT', async () => {
    console.log('\n終了処理中...');
    await server.stop();
    process.exit(0);
  });
}
