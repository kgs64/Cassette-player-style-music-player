# Cassette World

微缩复古磁带机网页：机械播放、单层专辑柜、MP3 刻录、放大镜收藏管理与双层歌词。

当前稳定版本 **5.14**，此提交为加入在线点歌终端前的备份。仅维护网页。

## 使用

下载 `cassette-world.html` 后用支持 WebGL 2 的浏览器打开，可离线导入本地音乐。静态托管使用根目录 `index.html`、`sw.js`、`manifest.webmanifest`、`icons/` 与 `third-party/`；完整部署文件在 `cassette-world-web-app.zip`。在线播放或在线补全歌词需要网络。

[使用说明](使用说明.md) · [开发交接](开发交接说明.md) · [第三方许可证](THIRD_PARTY_NOTICES.md)

## 文件安排

- 根目录 HTML 是构建产物与静态部署入口。
- `work/` 保存模块化源码、锁文件与验证脚本；第三方编码器源代码和许可在 `work/vendor/`。
- `legacy/` 保留旧验证文件、旧网页与历史 iOS 包，防止旧测试入口与正式入口混在一起；没有删除历史版本。
- 不上传浏览器收藏、用户音乐、密钥和本机依赖目录。

## 构建

在 `work/` 安装锁定依赖，然后执行 `node build.cjs`。源工程默认向上级 `outputs/` 输出；本仓库仅部署根目录，使用下列方式生成后复制到根目录：

```sh
mkdir -p outputs
cd work
npm install --ignore-scripts
node build.cjs
cp ../outputs/index.html ../index.html
cp ../outputs/cassette-world.html ../cassette-world.html
```

测试脚本使用独立浏览器和合成音乐，旧脚本中的浏览器路径、预览端口需按本机修改。清除网站数据可能移除收藏，保留原音乐或导出的 MP3。
