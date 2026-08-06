import nodeExternals from 'webpack-node-externals';
import path from 'path';
const __dirname = path.resolve();

/*
 * config build for production
 */
const ProductConfig = {
  entry: {
    server: ['./index.mjs'],
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'bundle.production.js',
  },
  mode: 'production',
  target: 'node',
  externals: [nodeExternals()],
  module: {
    rules: [
      {
        test: /\.mjs$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
    ],
  },
};

/*
 * config build for development
 */
const DevConfig = {
  entry: {
    server: ['./index.mjs'],
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'bundle.development.js',
  },
  mode: 'development',
  target: 'node',
  externals: [nodeExternals({})],
  module: {
    rules: [
      {
        test: /\.mjs$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
    ],
  },
};

export default [ProductConfig, DevConfig];
