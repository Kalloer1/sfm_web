/* Shared site header/nav. Each page calls SFMNav.mount('key'). */
window.SFMNav = {
  mount: function (active) {
    var links = [
      { key: "index", href: "index.html", label: "首页" },
      { key: "visualizer", href: "visualizer.html", label: "代码生成器" },
      { key: "examples", href: "examples.html", label: "示例库" },
      { key: "reference", href: "reference.html", label: "语法参考" },
      { key: "catalog", href: "catalog.html", label: "模组目录" }
    ];
    var nav = '<a class="ext" href="https://github.com/TeamDman/SuperFactoryManager" target="_blank" rel="noopener">GitHub ↗</a>';
    var inner = links.map(function (l) {
      var cls = l.key === active ? " active" : "";
      return '<a href="' + l.href + '" class="' + cls + '">' + l.label + "</a>";
    }).join("");
    var header = document.createElement("header");
    header.className = "site-header";
    header.innerHTML =
      '<div class="brand"><span class="logo">⚙️</span> SFM 管理代码可视化</div>' +
      '<nav>' + inner + nav + "</nav>";
    document.body.insertBefore(header, document.body.firstChild);
  }
};
