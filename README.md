# 国标麻将计分板 (Mahjong Scoreboard)

微信小程序 — 家庭麻将电子计分板，支持风位自动轮转、得分记录。

## 功能

- 🀀 实时显示场风 & 4人自风
- 📝 手动输入每局得分（4家得分和须为0）
- 🔄 自动风位轮转（庄连庄不动，别人和则轮转）
- 📋 局历史记录 & 累计总分
- ⚡ 快速填分模板（自摸/点炮）
- 💾 断点续玩（本地自动存档）

## 技术栈

微信小程序原生框架（WXML + WXSS + JS），纯前端，零后端。

## 项目结构

```
miniprogram/
├── app.js / app.json / app.wxss    # 全局配置（中国风暗色主题）
├── pages/
│   └── scoreboard/                  # 唯一页面：计分板
│       ├── scoreboard.js            # 核心逻辑
│       ├── scoreboard.wxml          # 页面结构
│       ├── scoreboard.wxss          # 样式
│       └── scoreboard.json          # 页面配置
├── utils/
│   ├── wind.js                      # 风位轮转引擎
│   └── storage.js                   # 本地存储
└── data/                            # (预留) 番种数据
```

## 快速开始

1. 下载 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 打开项目，选择 `miniprogram/` 目录
3. 填入自己的 AppID（或使用测试号）
4. 编译预览

## 计分规则

- 庄家和牌 → 继续坐庄，风位不变
- 别人和牌 → 风位轮转，新庄家 = 原庄下家
- 场风自动推进（庄家转完一圈时 东→南→西→北）
- 4人得分之和必须为 0

## 计划迭代

- [ ] 番种选择算分助手
- [ ] 多人同步（云开发 watch）
- [ ] 对局历史导出/分享
- [ ] 玩家名字自定义弹窗
- [ ] 花牌/杠牌特殊计分
