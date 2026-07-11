# 超级工厂管理模组 · 管理代码可视化 (SFM SFML Visualizer)

把 [Super Factory Manager (SFM)](https://github.com/TeamDman/SuperFactoryManager)（Minecraft 1.20.1）的
「管理代码」**SFML** 可视化的纯静态网站。

- 🧩 **代码生成器**：不用背语法！在表单里下拉 / 填值选择工厂逻辑，实时生成可复制进游戏的 SFML
  代码，并能「一键复制 / 下载 .sfm」，同时联动右侧流程图。
- ⌨️ **代码解析器**：手写 SFML，实时生成工厂流程图（触发器 / 输入·输出流向 / 条件分支）。
- 📚 **官方示例库**：内置模组仓库 `examples/` 下 8 个官方示例，逐个可视化 + 中文讲解。
- 🧱 **模组目录**：方块 / 物品 / 能力类型（物品·流体·能量·化学品）一览。
- 📖 **语法参考**：从源码 `SFML.g4` 提取的完整关键字速查。

> 解析器已对照 `SFML.g4` 完整校验：模组仓库内 8 个官方示例 + VS Code 语法测试文件
> （含 `fluid::` / `fe::`、`except`、`each … slots`、`slots n-m`、裸 `forget` 等高级写法）全部解析通过。

> 数据来源于 `TeamDman/SuperFactoryManager` 的 `1.20.1` 分支（MPL-2.0）。本站点为可视化教学用途。

## 技术说明
- 纯静态站点：**HTML + CSS + 原生 JavaScript**，零构建、零依赖、完全离线。
- 所有资源使用**相对路径**，可直接以 GitHub Pages 发布，也可双击 `index.html` 运行。
- 解析器 `assets/js/sfml-parse.js` 依据 `SFML.g4` 手写实现（递归下降），
  把 SFML 文本解析为 AST，再由 `assets/js/sfml-render.js` 渲染为流程图。
  生成器 `assets/js/sfml-builder.js` 复用同一解析器，做到「表单 → 代码 → 流程图」实时联动。

## 本地运行
任意静态服务器即可，例如：

```bash
# 在项目根目录
python -m http.server 8000
# 浏览器打开 http://localhost:8000
```

或直接用浏览器打开 `index.html`。

## 发布到 GitHub Pages
1. 把整个项目推送到 GitHub 仓库。
2. 仓库 **Settings → Pages → Build and deployment → Source：Deploy from a branch**。
3. 选择你的分支（如 `main`），目录选 **/(root)**，保存。
4. 稍候片刻，访问 `https://<用户名>.github.io/<仓库名>/` 即可。

> 因为全部使用相对路径，放在根目录或子路径都能正常加载，无需任何额外配置。

## 目录结构
```
index.html            首页 / 概览
visualizer.html       可视化编辑器（核心）
examples.html         官方示例库
reference.html        SFML 语法参考
catalog.html          模组目录（方块/物品/能力）
assets/
  css/style.css       样式（浅色主题）
  js/sfml-parse.js    SFML 解析器
  js/sfml-builder.js  可视化代码生成器（表单 → SFML 文本）
  js/sfml-render.js   流程图渲染 + 语法高亮
  js/sfm-data.js      示例 / 目录 / 参考数据（由仓库提取生成）
  js/nav.js           公共导航
sfm-source/           （已 gitignore）克隆的模组源码，仅用于数据提取
```
