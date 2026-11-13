const path = require("path");
const glob = require("glob");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

const INCLUDE_PATTERN =
  /<include\s+src=["'](.+?)["']\s*\/?>\s*(?:<\/include>)?/gis;

const processNestedHtml = (content, loaderContext, dir = null) =>
  !INCLUDE_PATTERN.test(content)
    ? content
    : content.replace(INCLUDE_PATTERN, (m, src) => {
        const filePath = path.resolve(dir || loaderContext.context, src);
        loaderContext.dependency(filePath);
        return processNestedHtml(
          loaderContext.fs.readFileSync(filePath, "utf8"),
          loaderContext,
          path.dirname(filePath),
        );
      });

// HTML generation
const paths = [];
const generateHTMLPlugins = () =>
  glob.sync("./src/*.html").map((dir) => {
    const filename = path.basename(dir);

    if (filename !== "404.html") {
      paths.push(filename);
    }

    return new HtmlWebpackPlugin({
      filename,
      template: `./src/${filename}`,
      favicon: `./src/images/favicon-target.png`,
      inject: "body",
    });
  });

const isProduction = process.env.NODE_ENV === "production";
const publicPath = isProduction ? "/target-darts/" : "/";

module.exports = {
  mode: isProduction ? "production" : "development",
  entry: "./src/js/index.js",
  devServer: {
    static: {
      directory: path.join(__dirname, "./build"),
      // Don't watch the output dir, otherwise every compile triggers a reload
      watch: false,
    },
    compress: true,
    port: 3000,
    hot: true,
    client: {
      overlay: false,
    },
  },
  // Tailwind v4 registers directories as dependencies; without this the build/
  // folder is watched and the dev server recompiles forever.
  watchOptions: {
    ignored: ["**/build/**", "**/node_modules/**"],
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: [/node_modules/, /catalog.js$/],
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
          },
        },
      },
      {
        test: /\.css$/i,
        use: [
          MiniCssExtractPlugin.loader,
          "css-loader",
          {
            loader: "postcss-loader",
            options: {
              postcssOptions: {
                plugins: [
                  require("autoprefixer")({
                    overrideBrowserslist: ["last 2 versions"],
                  }),
                ],
              },
            },
          },
        ],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif|webp)$/i,
        type: "asset/resource",
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: "asset/resource",
      },
      {
        test: /\.html$/,
        loader: "html-loader",
        options: {
          preprocessor: processNestedHtml,
        },
      },
    ],
  },
  plugins: [
    ...generateHTMLPlugins(),
    new MiniCssExtractPlugin({
      filename: "style.css",
      chunkFilename: "style.css",
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: "src/images",
          to: "images",
        },
      ],
    }),
    // Create .nojekyll file for GitHub Pages
    {
      apply: (compiler) => {
        compiler.hooks.afterEmit.tap("CreateNojekyll", () => {
          const fs = require("fs");
          const dir = path.resolve(__dirname, "build");
          fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(path.join(dir, ".nojekyll"), "");
        });
      },
    },
  ],
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "build"),
    clean: true,
    publicPath: publicPath,
    assetModuleFilename: "[path][name][ext]",
  },
  target: "web", // fix for "browserslist" error message
  stats: "errors-only", // suppress irrelevant log messages
};
