// const UglifyJSPlugin = require('uglifyjs-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const VueLoaderPlugin = require('vue-loader/lib/plugin')
const webpack = require('webpack')
const path = require('path')
const fs = require('fs')

let definePluginObj = {
  '__i18n__': JSON.stringify(Object.keys(JSON.parse(fs.readFileSync('src/_locales/zh_CN/messages.json').toString())))
}

module.exports = {
  mode: process.env.NODE_ENV,
  entry: {
    popup: './src/popup.js',
    option: './src/option.js',
    background: './src/background.js'
  },
  output: {
    path: path.resolve(__dirname, './dist'),
    publicPath: '/dist/',
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'vue-style-loader',
          'css-loader'
        ],
      },      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          loaders: {
          }
          // other vue-loader options go here
        }
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            'presets': ['@babel/preset-env'],
            'plugins': ['@babel/plugin-transform-runtime']
          }
        }
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        loader: 'file-loader',
        options: {
          name: '[name].[ext]?[hash]'
        }
      }
    ]
  },
  resolve: {
    alias: {
      'vue$': 'vue/dist/vue.esm.js'
    },
    extensions: ['*', '.js', '.vue', '.json']
  },
  devServer: {
    historyApiFallback: true,
    noInfo: true,
    overlay: true
  },
  performance: {
    hints: false
  },
  devtool: '#eval-source-map',
  plugins: [
    new webpack.DefinePlugin(definePluginObj),
    new VueLoaderPlugin()
  ]
}

if (process.env.NODE_ENV === 'production') {
  // module.exports.devtool = '#source-map'
  module.exports.devtool = false
  // http://vue-loader.vuejs.org/en/workflow/production.html
  module.exports.plugins = (module.exports.plugins || []).concat([
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"production"'
      }
    }),
    // new UglifyJSPlugin({
    //   sourceMap: false
    // }),
    new webpack.LoaderOptionsPlugin({
      minimize: true
    }),
    new CopyWebpackPlugin([
      {
        from: path.resolve(__dirname, 'src/_locales'),
        to: path.resolve(__dirname, 'dist/_locales'),
        ignore: ['.*']
      },
      {
        from: path.resolve(__dirname, 'src/manifest.json'),
        to: path.resolve(__dirname, 'dist/manifest.json'),
        ignore: ['.*']
      },
      {
        from: path.resolve(__dirname, 'src/assets'),
        to: path.resolve(__dirname, 'dist/assets'),
        ignore: ['.*']
      },
      {
        from: path.resolve(__dirname, 'src/popup.html'),
        to: path.resolve(__dirname, 'dist/popup.html'),
        ignore: ['.*']
      },
      {
        from: path.resolve(__dirname, 'src/option.html'),
        to: path.resolve(__dirname, 'dist/option.html'),
        ignore: ['.*']
      },
      {
        from: path.resolve(__dirname, 'src/background.js'),
        to: path.resolve(__dirname, 'dist/background.js'),
        ignore: ['.*']
      },
      {
        from: path.resolve(__dirname, 'src/background.html'),
        to: path.resolve(__dirname, 'dist/background.html'),
        ignore: ['.*']
      }
    ])
  ])
} else {
  let popup = 'dist/popup.html'
  fs.writeFileSync(popup, fs.readFileSync(popup).toString().replace('"popup.js"', '"http://localhost:8080/dist/popup.js"'))
  let option = 'dist/option.html'
  fs.writeFileSync(option, fs.readFileSync(option).toString().replace('"option.js"', '"http://localhost:8080/dist/option.js"'))
}
