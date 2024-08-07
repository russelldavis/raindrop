const path = require('path')

const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const TerserJSPlugin = require('terser-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')
const SentryCliPlugin = require('@sentry/webpack-plugin')

//defaults
process.env.SENTRY_RELEASE = String(new Date().getTime())

module.exports = ({ production, filename='[name].[contenthash]', sentry={} }, { profile }) => ({
	mode:		production ? 'production' : 'development',
	context:	path.resolve(__dirname, '../src'),
	devtool:	production ? 'source-map' : 'eval-cheap-module-source-map',

	entry: {
		app: './index.js'
	},

	output: {
		filename:	`assets/${filename}.js`,
		clean:		true
	},

	devServer: {
		compress: false,
		allowedHosts: 'all',
		historyApiFallback: true,
		//hot: true,inline: true,
		client: {
			overlay: true,
		},
		port: 2000
	},

	performance: {
		hints: production ? 'warning' : false,
		maxEntrypointSize: 2000000,
		maxAssetSize: 2000000
	},

	optimization: {
		minimize: production,
		minimizer: [
			new TerserJSPlugin({
				parallel: true,
				extractComments: false,
				terserOptions: {
					output: {
						comments: false
					}
				}
			}),
			new CssMinimizerPlugin({
				minimizerOptions: {
					preset: [
						'advanced',
						{ autoprefixer: { add: true } }
					]
				}
			})
		],
		runtimeChunk: false
	},

	resolve: {
		symlinks: true,
		extensions: ['.js'],
		modules: [
			path.resolve(__dirname, '../node_modules')
		],
		alias: {
			lodash: 'lodash-es',
			'~assets': path.resolve(__dirname, '../src/assets'),
			'~co': path.resolve(__dirname, '../src/co'),
			'~config': path.resolve(__dirname, '../src/config'),
			'~data': path.resolve(__dirname, '../src/data'),
			'~local': path.resolve(__dirname, '../src/local'),
			'~modules': path.resolve(__dirname, '../src/modules'),
			'~routes': path.resolve(__dirname, '../src/routes'),
			'~t': path.resolve(__dirname, '../src/modules/translate'),
			'~target': path.resolve(__dirname, '../src/target'),
		}
	},

	plugins: [
		//pre plugins
		...(production ? [
		] : [
		]),

		//Sentry
		// ...(production && !sentry?.disabled ? [
		// 	new SentryCliPlugin({
		// 		org: 'oblako-corp',
		// 		project: 'app',
		// 		authToken: process.env.SENTRY_AUTH_TOKEN, //required in CI environment
		// 		release: process.env.SENTRY_RELEASE,

		// 		include: './src',
		// 		ignore: [ 'node_modules', 'build', 'dist' ],
		// 		configFile: path.resolve(__dirname, 'sentry.properties'),
		// 		...sentry
		// 	})
		// ]: []),

		new webpack.DefinePlugin({
			'process.env.NODE_ENV': JSON.stringify(production?'production':'development'),
			RAINDROP_ENVIRONMENT: JSON.stringify('browser'),
			'process.env.SENTRY_RELEASE': JSON.stringify(production && !sentry?.disabled? process.env.SENTRY_RELEASE : undefined)
		}),

		//HTML
		new HtmlWebpackPlugin({
			title: 'Raindrop.io',
			template: './index.ejs',
			scriptLoading: 'blocking',
			inject: 'body',
			excludeChunks: ['manifest', 'background']
		}),

		//CSS
		new MiniCssExtractPlugin({
			filename: `assets/${filename}.css`,
			chunkFilename: `assets/${filename}.css`
		})
	],

	module: { rules: [
		{
			test: /\.js$/,
			exclude: /node_modules/,
			oneOf: [
				{
					resourceQuery: /asis/,
					loader: 'file-loader',
					options: {
						outputPath: 'assets',
						name: `${filename}.[ext]`
					}
				},
				{
					resourceQuery: /raw/,
					loader: 'raw-loader'
				},
				{
					loader: 'babel-loader',
					options: {
						envName: production ? 'production' : 'development'
					}
				}
			]
		},

		{
			test: /\.(styl|css)$/,
			sideEffects: true,
			use: [
				...(production ? [{
					loader: MiniCssExtractPlugin.loader
				}] : ['style-loader']),
				{
					loader: 'css-loader',
					options: {
						modules: {
							auto: true,
							localIdentName: '[local]-[hash:base64:4]'
						}
					}
				}
			]
		},

		{
			test: /\.(styl)$/,
			sideEffects: true,
			use: [
				'stylus-loader',
			]
		},

		{
			test: /\.svg$/,
			oneOf: [
				{
					resourceQuery: /asis/,
					loader: 'file-loader',
					options: {
						outputPath: 'assets',
						name: `${filename}.[ext]`
					}
				},
				{
					resourceQuery: /component/,
					use: ['@svgr/webpack']
				},
				{
					use: [
						{
							loader: 'svg-sprite-loader',
							options: {
								name: '[name]',
								prefixize: false
							}
						},
						{
							loader: 'svgo-loader',
							options: {
								multipass: true,
								plugins: [
									{ name: 'preset-default', params: { overrides: {
										removeViewBox: false
									} } },
									{ name: 'removeAttrs', params: { attrs: '(stroke|fill)' } },
								]
							},
						}
					]
				}
			]
		},

		{
			test: /.*\.(gif|png|jpe?g|ico)$/i,
			use: [
				{
					loader: 'file-loader',
					options: {
						outputPath: 'assets',
						name: `${filename}.[ext]`
					}
				}
			],
		},

		{
			test: /.*\.(woff2)$/i,
			use: [
				{
					loader: 'file-loader',
					options: {
						outputPath: 'assets',
						name: `${filename}.[ext]`
					}
				}
			],
		}
	] }
})
