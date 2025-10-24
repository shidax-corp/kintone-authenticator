import crypto from 'crypto';
import * as esbuild from 'esbuild';
import babel from 'esbuild-plugin-babel';
import { copy } from 'esbuild-plugin-copy';
import * as path from 'path';

const NODE_ENV = process.env.NODE_ENV || 'production';
const isDev = NODE_ENV === 'development';
const serve = process.argv.includes('--serve');

// ビルドごとにランダムなキーを生成
// 開発モードでは固定値を使用（デバッグしやすくするため）
const generateRandomKey = () => crypto.randomBytes(32).toString('hex');
const generateRandomStorageKey = () => crypto.randomBytes(16).toString('hex');

const OBFUSCATION_KEY = isDev
  ? 'dev-obfuscation-key-for-debugging'
  : generateRandomKey();

const PASSCODE_STORAGE_KEY = isDev
  ? 'ka_dev_passcode'
  : 'ka_' + generateRandomStorageKey();

const LAST_ACCESS_STORAGE_KEY = isDev
  ? 'ka_dev_last_access'
  : 'ka_' + generateRandomStorageKey();

const options = {
  entryPoints: {
    'kintone/kintone-authenticator-desktop': path.resolve(
      import.meta.dirname,
      'src',
      'kintone',
      'desktop',
      'index.tsx'
    ),
    'kintone/kintone-authenticator-mobile': path.resolve(
      import.meta.dirname,
      'src',
      'kintone',
      'mobile',
      'index.tsx'
    ),
    'chrome/index': path.resolve(
      import.meta.dirname,
      'src',
      'chrome',
      'popup',
      'index.tsx'
    ),
    'chrome/background': path.resolve(
      import.meta.dirname,
      'src',
      'chrome',
      'background',
      'index.ts'
    ),
    'chrome/content': path.resolve(
      import.meta.dirname,
      'src',
      'chrome',
      'contents',
      'index.tsx'
    ),
    'chrome/options/index': path.resolve(
      import.meta.dirname,
      'src',
      'chrome',
      'options',
      'index.tsx'
    ),
    'chrome/offscreen': path.resolve(
      import.meta.dirname,
      'src',
      'chrome',
      'offscreen',
      'index.ts'
    ),
  },
  bundle: true,
  outdir: path.resolve(import.meta.dirname, 'dist'),
  minify: !isDev,
  sourcemap: true,
  platform: 'browser',
  target: ['chrome130'],
  treeShaking: true,
  alias: {
    '@lib': path.resolve(import.meta.dirname, 'src', 'lib'),
    '@components': path.resolve(import.meta.dirname, 'src', 'components'),
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(NODE_ENV),
    'process.env.OBFUSCATION_KEY': JSON.stringify(OBFUSCATION_KEY),
    'process.env.PASSCODE_STORAGE_KEY': JSON.stringify(PASSCODE_STORAGE_KEY),
    'process.env.LAST_ACCESS_STORAGE_KEY': JSON.stringify(
      LAST_ACCESS_STORAGE_KEY
    ),
  },
  plugins: [
    babel({
      filter: /\.(tsx?)$/,
      config: {
        plugins: ['styled-jsx/babel'],
      },
    }),
    copy({
      resolveFrom: 'cwd',
      assets: [
        {
          from: ['./assets/**/*'],
          to: ['./dist'],
        },
      ],
      watch: serve,
    }),
  ],
};

if (serve) {
  esbuild
    .context(options)
    .then((ctx) =>
      ctx.serve({
        servedir: path.resolve(import.meta.dirname, 'dist'),
        onRequest: ({ method, path, remoteAddress, status }) => {
          console.log(
            JSON.stringify({
              method,
              path,
              remoteAddress,
              status,
            })
          );
        },
      })
    )
    .then(({ hosts, port }) => {
      console.log(
        JSON.stringify({
          message: 'Server started',
          listen: hosts.map((host) => `${host}:${port}`),
        })
      );
    })
    .catch((error) => {
      console.log(JSON.stringify({ message: 'Server failed to start', error }));
      process.exit(1);
    });
} else {
  esbuild
    .build(options)
    .then((result) => {
      console.log(
        JSON.stringify({ message: 'Build completed successfully', ...result })
      );
    })
    .catch((error) => {
      console.log(JSON.stringify({ message: 'Build failed', error }));
      process.exit(1);
    });
}
