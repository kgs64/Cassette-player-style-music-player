# Cassette World · Mac 桌面版

适用当前 Apple Silicon（M 系列）Mac。应用内置网页、Chromium 和模型，无浏览器地址栏；联网点歌与在线补全歌词仍需要网络。

## 使用

1. 解压 `dist/Cassette-World-Mac-Apple-Silicon.zip`，双击 `Cassette World.app`，也可手动拖入“应用程序”。
2. 点击左侧螺丝盒进入设置。原有导入、刻录、搜索、歌词、环境和偏好卡继续使用。
3. 从网页设置的“收藏与保存”导出收藏备份，再在桌面版同一区域恢复；浏览器收藏不会自动迁移。
4. 使用 macOS“显示”菜单进入全屏；Command+Q 退出，Command+M 最小化。窗口上沿可以拖动。窗口尺寸会记住。

收藏与偏好保存在 `~/Library/Application Support/Cassette World/`，更新应用时保留该目录。下载文件会出现系统保存对话框。关闭窗口后应用保留在 Dock，点击 Dock 图标可重开；退出应用会停止播放。

当前构建为本机 ad-hoc 签名，未做 Apple Developer ID 公证，适合本机试用。面向其他 Mac 分发前应使用自己的 Developer ID 签名并公证；不要关闭 Gatekeeper 或系统安全功能。

## 开发与重建

`main.cjs` 为独立外壳，`build.py` 从 `../outputs/` 复制网页与资源，不运行旧的完整网页构建。先完成网页补丁，再运行 `python3 desktop/build.py`。运行时固定 Electron 44.9.0，来源为官方 GitHub Releases；构建前核对官方 SHASUMS256。`runtime/` 是下载缓存，`dist/` 是产物，不应提交到源码仓库。

主页面使用固定安全来源 `cassette://world`，便于稳定保存 IndexedDB；renderer 禁用 Node、开启 sandbox 和 contextIsolation，不暴露文件系统桥接。文件选择和下载使用 Chromium / Electron 系统交互，远程网页导航与弹出窗口默认拒绝。第三方许可证随应用保存在 Resources 中；网页依赖见内置 THIRD_PARTY_NOTICES.md。分发前核对这些许可证。

不提供自动更新，更新时重新打包并替换 .app。当前仅构建 Apple Silicon 版本。
