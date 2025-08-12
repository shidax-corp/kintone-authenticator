import * as path from 'path';
import * as esbuild from 'esbuild';
import { copy } from 'esbuild-plugin-copy';

const NODE_ENV = process.env.NODE_ENV || 'production';
const isDev = NODE_ENV === 'development';
const serve = process.argv.includes('--serve');

const options = {
  entryPoints: {
    'kintone/kintone-authenticator': path.resolve(import.meta.dirname, 'src', 'kintone', 'index.tsx'),
    'chrome/index': path.resolve(import.meta.dirname, 'src', 'chrome', 'index.tsx'),
  },
  bundle: true,
  outdir: path.resolve(import.meta.dirname, 'dist'),
  minify: !isDev,
  sourcemap: true,
  platform: 'browser',
  target: ['chrome130'],
  treeShaking: true,
  plugins: [
    copy({
      assets: [
        {
          from: [path.resolve(import.meta.dirname, 'assets', '**', '*')],
          to: [path.resolve(import.meta.dirname, 'dist')],
        },
      ],
    }),
  ],
};

if (serve) {
  esbuild.context(options)
    .then((ctx) => ctx.serve({
      servedir: path.resolve(import.meta.dirname, 'dist'),
      onRequest: ({ method, path, remoteAddress, status }) => {
        console.log(JSON.stringify({
          method,
          path,
          remoteAddress,
          status,
        }));
      },
    }))
    .then(({ hosts, port }) => {
      console.log(JSON.stringify({ message: 'Server started', listen: hosts.map(host => `${host}:${port}`) }));
    })
    .catch((error) => {
      console.log(JSON.stringify({ message: 'Server failed to start', error }));
      process.exit(1);
    });
} else {
  esbuild.build(options).then((result) => {
    console.log(JSON.stringify({ message: 'Build completed successfully', ...result }));
  }).catch((error) => {
    console.log(JSON.stringify({ message: 'Build failed', error }));
    process.exit(1);
  });
}
