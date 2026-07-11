/*
 * SFM site data — generated from the cloned SuperFactoryManager repo.
 * Provides: SFM_EXAMPLES, SFM_CATALOG, SFM_REFERENCE (browser globals).
 */
window.SFM_EXAMPLES = [
  {
    "id": "01",
    "file": "01-moveitems.sfm",
    "title": "搬运物品",
    "summary": "最基础的搬运：把贴了标签 a 的方块里的物品搬到贴了标签 b 的方块。",
    "points": [
      "EVERY 20 TICKS DO … END 是最常用的定时触发器",
      "INPUT FROM <标签> 抽取，OUTPUT TO <标签> 放入",
      "EACH 关键字：作用于每个同名标签方块，而非“总共”",
      "可在 INPUT/OUTPUT 后加物品 ID 做过滤，如 iron_ingot"
    ],
    "code": "name \"move items\" -- name declaration is optional\n\n-- use two dashes for a comment\n-- keywords are case insensitive\n\n-- more than one trigger can be used in a program\nevery 20 ticks do\n    -- each trigger block can contain multiple statements\n    INPUT FROM a\n    OUTPUT TO b\n    -- \"a\" and \"b\" are inventory labels\n    -- use a label gun to identify them in world\nend\n\n\n\n-- The previous trigger will move all items, but for instructional\n-- purposes, more triggers will be included here\nevery 20 ticks do\n    INPUT 1 from a -- only extract 1 item at a time\n    OUTPUT to b\nend\n\n\n\nevery 20 ticks do\n    input from a\n    output 1 to b   -- only insert 1 item at a time\n                    -- if multiple inventories are labelled \"b\",\n                    -- only one will receive an item\nend\n\n\nevery 20 ticks do\n    input from a\n    output 1 to each b -- every \"b\" inventory will receive 1 item\nend\n\n\n\nevery 20 ticks do\n    input 1 from each a -- each \"a\" inventory will only have 1 item removed,\n                        -- instead of 1 item total being moved\n    output to b\nend\n\nevery 20 ticks do\n    input iron_ingot from a -- only move iron ingots, \"minecraft:\" namespace is assumed\n    output to b\nend\n\nevery 20 ticks do\n    input thaumcraft:iron_nugget from a -- only move thaumcraft iron nuggets\n    output to b\nend\n\nevery 20 ticks do\n    input \"redstone\" from a -- redstone is a keyword for future use, so must be surrounded in quotes\n    output to b\nend\n\nevery 20 ticks do\n    input \"minecraft:redstone\" from a -- redstone is a keyword, so must be surrounded in quotes\n    output to b\nend\n\nevery 20 ticks do\n    if a has gt 0 \"redstone\" then -- again, redstone must be in quotes\n        input from a\n        output to b\n    end\nend\n\n"
  },
  {
    "id": "02",
    "file": "02-retention.sfm",
    "title": "保留数量 (Retention)",
    "summary": "演示 retain：在搬运时给来源/目标“留一手”，而不是搬空。",
    "points": [
      "retain N：来源至少保留 N 个该物品（只搬走多余部分）",
      "OUTPUT … retain N：目标最多保留 N 个",
      "数量与保留可组合：input 25 retain 1 一次搬 25 但留 1",
      "多行资源列表：一次性列出多个资源限制"
    ],
    "code": "name \"retention\"\n\nevery 20 ticks do\n    -- move all items except 1 from \"a\" to \"b\"\n    input retain 1 from a\n    output to b\nend\n\n\nevery 20 ticks do\n    -- move 25 items except 1 from \"a\" to \"b\"\n    input 25 retain 1 from a\n    output to b\nend\n\n\nevery 20 ticks do\n    -- move 25 red_sand items except 1 from \"a\" to \"b\"\n    input 25 retain 1 red_sand from a\n    output to b\nend\n\n\nevery 20 ticks do\n    -- move 20 red sand and all coal\n    -- but leave 1 red sand\n    input\n        20 retain 1 red_sand,\n        retain 1 coal\n    from a\n\n    output to b\nend\n\n\nevery 20 ticks do\n    input from a\n    output retain 1 to b\n    -- only output until \"b\" has 1 item\nend\n\nevery 20 ticks do\n    input from a\n    output 5 retain 20 red_sand to b\n    -- accept 5 red sand at once, with \"a\" max of 20 in \"b\"\nend\n\n\nevery 20 ticks do\n    input\n        15 retain 5 iron_ingot,\n        12 retain 3 stone\n    from \"a\" top side\n\n    output\n        2 iron_ingot,\n        64 retain 10 stone\n    to b\n\n    -- moves all but 5 iron ingots to \"b\", 15 at a time\n    -- moves up to 10 stone to \"b\", ensuring \"a\" keeps 3 stone\n    -- \"b\" can accept up to 64 stone but \"a\" can only provide 12 at a time\nend"
  },
  {
    "id": "03",
    "file": "03-conditions.sfm",
    "title": "条件判断 (IF)",
    "summary": "用 IF 根据方块里物品的数量决定是否搬运，含 AND / OR / ELSE IF。",
    "points": [
      "IF <标签> HAS <比较符> <数量> <物品> THEN … END",
      "量词：overall(默认)/every/some/one/lone 决定“几个方块满足”",
      "布尔：and / or / not，括号控制优先级",
      "ELSE IF / ELSE 形成分支；forget 清空本轮输入缓存"
    ],
    "code": "name \"condition\"\n\nevery 20 ticks do\n    INPUT FROM a\n    -- since more than one inventory can have the same label, it might be useful\n    -- to be able to be specific for conditionals.\n\n    -- if every a has gt 10 iron_ingot then -- all inventories must match\n    -- if some a has gt 10 iron_ingot then -- at least one inventory must match\n    -- if one a has gt 10 iron_ingot then -- exactly one inventory must match\n    -- if lone a has gt 10 iron_ingot then -- exactly zero or one inventory must match\n    -- if overall a has gt 10 iron_ingot then -- counting items from all inventories instead of individually, must match\n    if a has gt 10 minecraft:iron_ingot then\n        -- defaults to \"overall\" if set qualifier not specified\n        -- \"minecraft:\" namespace prefix is default and can be omitted\n        OUTPUT TO b\n    end\n\n    if not d has gt 20 stone and a has ge 20 stone then\n        output 20 to d\n    end\n\n    -- this will resolve to \"true\" and will always run\n    if (false and true) or (false or true) or not true then\n        -- \"not\", \"and\", and \"or\" operators all have same precidence\n        -- use parentheses to ensure things work as you expect\n        output to c\n    end\nend\n\n-- if this program were running while \"a\" had 9*iron_ingot:\n-- \"b\" would receive 0*iron_ingot\n-- \"d\" would receive 9*iron_ingot\n\n-- if this program were running while \"a\" had 30*iron_ingot:\n-- \"b\" would receive 30*iron_ingot\n-- \"d\" would receive 0*iron_ingot\n\n-- if this program were running while \"a\" had 64*stone:\n-- \"d\" would receive 20*stone\n-- \"c\" would receive 44*stone\n\n-- if this program were running while \"a\" had 16*stone:\n-- \"d\" would receive 0*stone\n-- \"c\" would receive 16*stone\n\n-- if this program were running while \"a\" had (2*64)*stone:\n-- \"d\" would receive 20*stone\n-- \"c\" would receive (64+44)*stone\n\n\n--------------------\n\nevery 20 ticks do\n    if a has ge 32 iron_ingot then\n        input 1 cobblestone from a\n    else if a has ge 16 iron_ingot then\n        input 1 stone from a\n    else\n        input 1 red_sandstone from a\n    end\n\n    output to b\nend\n\n--------------------\n\n-- Complex conditionals, AND and OR\n\nevery 20 ticks do\n    if a has >= 10 iron_ingot and a has >= 5 coal then\n        input 1 redstone_block from a\n        output to b\n        forget\n    end\n\n    if a has >= 1 sand or a has > 1 red_sand then\n        input 1 glass from a\n        output to b\n    end\nend\n"
  },
  {
    "id": "04",
    "file": "04-smelting.sfm",
    "title": "熔炼自动化",
    "summary": "把原木送进熔炉顶部、燃料送底部，再把产物搬回箱子。",
    "points": [
      "方块面：top / bottom / side 指定从方块的哪一面交互",
      "一次 OUTPUT 可列出多个资源限制（如 coal, 1 retain 1 oak_log, charcoal）",
      "熔炉顶面对应物品输入、底面对应燃料"
    ],
    "code": "name \"smelting\"\n\nevery 20 ticks do\n    input from chest\n    \n    output\n        minecraft:oak_log -- items can be specified\n    to furnace top side\n\n    output\n        coal,               -- namespace defaults to \"minecraft:\"\n        1 retain 1 oak_log, -- limits are per-item\n        charcoal\n    to furnace bottom side \nend\n\nevery 20 ticks do\n    input from furnace bottom side\n    output to chest\nend"
  },
  {
    "id": "05",
    "file": "05-each.sfm",
    "title": "每个标签 (EACH)",
    "summary": "对比“总共搬 N 个”和“每个标签方块各搬 N 个”的区别。",
    "points": [
      "input 5 from c：所有名为 c 的方块合计搬 5 个",
      "input 5 from each a：每个名为 a 的方块各搬 5 个（共 |a|×5）"
    ],
    "code": "name \"each\"\n\n-- using every inventory labelled \"c\", move 5 items total\n-- \"b\" will receive 5 items, or whatever is available if less than 5.\nevery 20 ticks do\n    input 5 from c\n    output to b\nend\n\n-- for every inventory labelled \"a\", 5 items will be moved\n-- \"b\" will receive |a| * 5 items\nevery 20 ticks do\n    input 5 from each a -- note the \"each\" keyword\n    output to b\nend\n"
  },
  {
    "id": "06",
    "file": "06-slots.sfm",
    "title": "指定槽位 (Slots)",
    "summary": "只操作方块里特定的槽位，支持逗号分隔与范围。",
    "points": [
      "slots 0,1,3-4,5：操作第 0、1、3 到 4、5 号槽",
      "可配合 top side 等方块面一起使用"
    ],
    "code": "name \"slots\"\n\nevery 20 ticks do\n    -- multiple slots can be specified, comma separated, also supporting ranges\n    input from a top side slots 0,1,3-4, 5\n    output to a slots 2\nend"
  },
  {
    "id": "07",
    "file": "07-redstone.sfm",
    "title": "红石触发",
    "summary": "用红石信号而非定时器来驱动程序。",
    "points": [
      "EVERY REDSTONE PULSE DO … END：红石脉冲触发一次",
      "IF REDSTONE >= 2 THEN …：根据红石信号强度做条件"
    ],
    "code": "every redstone pulse do\n    input from a\n    output to b\nend\n\nevery 20 ticks do\n    if redstone ge 2 then\n        input from a\n        output to b\n    end\nend\n"
  },
  {
    "id": "08",
    "file": "08-fluids.sfm",
    "title": "流体搬运",
    "summary": "用 fluid: 类型前缀搬运液体，如把水从 a 抽到 b。",
    "points": [
      "fluid:minecraft:water：流体资源标识，minecraft: 可省略",
      "fluid:*:* / energy:* / chemical:*：通配某类型的任意资源",
      "底部/顶部 side 常用于流体输入输出"
    ],
    "code": "EVERY 20 TICKS DO\n    INPUT fluid:minecraft:water from a BOTTOM SIDE\n    OUTPUT fluid:*:* to b TOP SIDE\nEND"
  }
];

window.SFM_CATALOG = {
  "capabilities": [
    {
      "key": "ITEM",
      "name": "物品",
      "color": "#c8915a",
      "desc": "方块/物品栏里的普通物品，最常见的资源类型。"
    },
    {
      "key": "FLUID",
      "name": "流体",
      "color": "#4a90d9",
      "desc": "液体（水、岩浆、模组流体），用 fluid: 前缀标识。"
    },
    {
      "key": "ENERGY",
      "name": "能量",
      "color": "#e0a91b",
      "desc": "Forge 能量（FE），用 energy: 前缀，如 energy:*。"
    },
    {
      "key": "CHEMICAL",
      "name": "化学品",
      "color": "#9b59b6",
      "desc": "Mekanism 等模组的化学物质，用 chemical: 前缀（需对应兼容）。"
    }
  ],
  "blocks": [
    {
      "name": "管理器 Manager",
      "cls": "ManagerBlock",
      "essential": true,
      "desc": "核心方块。装载磁盘、运行 SFML 程序，并作为线缆网络的接入点。"
    },
    {
      "name": "隧道管理器 Tunnelled Manager",
      "cls": "TunnelledManagerBlock",
      "essential": false,
      "desc": "管理器变体，可穿过自身让线缆从背面接入。"
    },
    {
      "name": "线缆 Cable",
      "cls": "CableBlock",
      "essential": true,
      "desc": "连接管理器与各个方块，构成线缆网络（capability network）。"
    },
    {
      "name": "强化线缆 Tough Cable",
      "cls": "ToughCableBlock",
      "essential": false,
      "desc": "更坚固的线缆变体。"
    },
    {
      "name": "华丽线缆 Fancy Cable",
      "cls": "FancyCableBlock",
      "essential": false,
      "desc": "外观更精致（可染色）的线缆。"
    },
    {
      "name": "隧道线缆 Tunnelled Cable",
      "cls": "TunnelledCableBlock",
      "essential": false,
      "desc": "可穿过的线缆变体。"
    },
    {
      "name": "线缆外观 Facade",
      "cls": "CableFacadeBlock",
      "essential": false,
      "desc": "把线缆伪装成其他方块外观。"
    },
    {
      "name": "缓冲方块 Buffer",
      "cls": "BufferBlock",
      "essential": false,
      "desc": "在程序间暂存物品/流体/能量的缓冲存储。"
    },
    {
      "name": "水箱 Water Tank",
      "cls": "WaterTankBlock",
      "essential": false,
      "desc": "储存流体的方块。"
    },
    {
      "name": "印刷机 Printing Press",
      "cls": "PrintingPressBlock",
      "essential": false,
      "desc": "用于批量烧写磁盘/标签的机器。"
    },
    {
      "name": "测试桶 Test Barrel",
      "cls": "TestBarrelBlock",
      "essential": false,
      "desc": "开发/测试用方块（桶 / 流体桶）。"
    }
  ],
  "items": [
    {
      "name": "标签枪 Label Gun",
      "cls": "LabelGunItem",
      "essential": true,
      "desc": "给世界中的方块贴/撕标签（如 a、b、chest）。程序通过标签引用方块。"
    },
    {
      "name": "磁盘 Disk",
      "cls": "DiskItem",
      "essential": true,
      "desc": "存储 SFML 程序，放入管理器后由管理器执行。"
    },
    {
      "name": "网络工具 Network Tool",
      "cls": "NetworkToolItem",
      "essential": false,
      "desc": "查看/调试线缆网络的工具。"
    },
    {
      "name": "表单 Form",
      "cls": "FormItem",
      "essential": false,
      "desc": "与印刷/批量操作相关的物品。"
    },
    {
      "name": "经验物品 Experience",
      "cls": "ExperienceShardItem",
      "essential": false,
      "desc": "经验碎片 / 经验胶（Experience Shard / Goop）。"
    }
  ]
};

window.SFM_REFERENCE = {
  "structure": {
    "title": "程序结构",
    "items": [
      [
        "name \"示例\"",
        "可选的程序名，写在最前面。"
      ],
      [
        "EVERY <n> TICKS DO … END",
        "每 n 游戏刻（20 刻=1 秒）执行一次。"
      ],
      [
        "EVERY <n> SECONDS DO … END",
        "每 n 秒执行一次。"
      ],
      [
        "EVERY REDSTONE PULSE DO … END",
        "每次红石脉冲触发一次。"
      ],
      [
        "-- 注释",
        "两个短横线到行尾为注释，大小写不敏感。"
      ]
    ]
  },
  "statements": {
    "title": "语句",
    "items": [
      [
        "INPUT … FROM <标签>",
        "从贴标签的方块抽取资源。"
      ],
      [
        "OUTPUT … TO <标签>",
        "把资源放入贴标签的方块。"
      ],
      [
        "IF … THEN … END",
        "条件分支，可加 ELSE IF / ELSE。"
      ],
      [
        "FORGET [标签…]",
        "清空本轮回合的输入缓存（可指定标签）。"
      ]
    ]
  },
  "io": {
    "title": "输入 / 输出细节",
    "items": [
      [
        "FROM / TO",
        "指定资源的来源 / 去向标签。"
      ],
      [
        "EACH",
        "对每个同名标签方块分别操作（而非合计）。"
      ],
      [
        "<数量>",
        "限制每次搬运的数量，如 input 5 from a。"
      ],
      [
        "retain <数量>",
        "来源/目标保留的数量（不搬空）。"
      ],
      [
        "EXCEPT <资源>",
        "排除某些资源。"
      ],
      [
        "EMPTY SLOTS IN",
        "只放入空格槽（配合 TO 使用）。"
      ]
    ]
  },
  "conditions": {
    "title": "条件 (IF)",
    "items": [
      [
        "<标签> HAS <比较> <数量> [<资源>]",
        "判断标签方块里某资源的数量关系。"
      ],
      [
        "AND / OR / NOT",
        "布尔逻辑，括号控制优先级（同级，建议加括号）。"
      ],
      [
        "REDSTONE [<比较> <数量>]",
        "根据红石信号强度判断。"
      ],
      [
        "ELSE IF / ELSE",
        "分支的“否则如果 / 否则”。"
      ]
    ]
  },
  "comparators": {
    "title": "比较符",
    "items": [
      [
        "gt / >",
        "大于"
      ],
      [
        "lt / <",
        "小于"
      ],
      [
        "ge / >=",
        "大于等于"
      ],
      [
        "le / <=",
        "小于等于"
      ],
      [
        "eq / =",
        "等于"
      ]
    ]
  },
  "quantifiers": {
    "title": "集合量词 (HAS 前)",
    "items": [
      [
        "overall（默认）",
        "把所有同名标签的资源加起来算一份。"
      ],
      [
        "every",
        "每个标签方块都要满足条件。"
      ],
      [
        "some",
        "至少有一个标签方块满足。"
      ],
      [
        "one",
        "恰好一个标签方块满足。"
      ],
      [
        "lone",
        "零个或一个标签方块满足。"
      ]
    ]
  },
  "resources": {
    "title": "资源标识",
    "items": [
      [
        "iron_ingot",
        "省略命名空间时默认 minecraft:。"
      ],
      [
        "minecraft:iron_ingot",
        "完整命名空间:路径形式。"
      ],
      [
        "thaumcraft:iron_nugget",
        "其他模组的物品加对应命名空间。"
      ],
      [
        "fluid:minecraft:water",
        "用类型前缀指定流体资源。"
      ],
      [
        "energy:* / chemical:* / fluid:*:*",
        "通配某类型的任意资源。"
      ],
      [
        "\"redstone\"",
        "redstone 是保留字，需加引号当作物件名。"
      ]
    ]
  },
  "sidesSlots": {
    "title": "方块面与槽位",
    "items": [
      [
        "top / bottom / north / east / south / west",
        "方块的六个面。"
      ],
      [
        "left / right / front / back / null",
        "相对/特殊面（null 表示无特定面）。"
      ],
      [
        "<面> SIDE / EACH SIDE",
        "指定交互的方块面。"
      ],
      [
        "slots 0,1,3-4",
        "只操作指定槽位，支持逗号与范围。"
      ]
    ]
  },
  "advanced": {
    "title": "进阶",
    "items": [
      [
        "WITH / WITHOUT TAG #标签",
        "按物品标签（tag）过滤资源。"
      ],
      [
        "ROUND ROBIN BY LABEL / BLOCK",
        "轮询分配，让多个目标轮流接收。"
      ],
      [
        "多行资源列表",
        "INPUT/OUTPUT 后可换行列出多个资源限制，逗号分隔。"
      ]
    ]
  }
};
