# TaiwanSpiritCore

《台灣靈格 Core》— 長期運作的 AI Knowledge OS。

## 專案定位

TaiwanSpiritCore 不是一般網站，也不是一次性 Demo。  
它是一套可持續擴充的知識作業系統，用於整理、連結、演化與交付《台灣靈格》相關的核心知識。

## 第一版原則

- 不追求漂亮畫面
- 不做展示用 Demo
- 先建立可長期運作的專案骨架
- 所有 AI 供應商必須可替換，不寫死任何一家

## 目錄結構

```
TaiwanSpiritCore/
├── docs/           # 系統文件與規格
├── knowledge/      # 知識本體與索引
├── workspace/      # 作業工作區
├── modules/        # 可插拔功能模組
├── assets/         # 靜態資源
├── public/         # 對外可讀內容
├── README.md
├── PROJECT_RULES.md
├── AI_PROTOCOL.md
├── SYSTEM_ARCHITECTURE.md
├── KNOWLEDGE_TREE.md
└── ROADMAP.md
```

## 核心文件

| 文件 | 用途 |
|------|------|
| [PROJECT_RULES.md](./PROJECT_RULES.md) | 專案運作規則與約定 |
| [AI_PROTOCOL.md](./AI_PROTOCOL.md) | AI 可替換協議 |
| [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) | 系統架構說明 |
| [KNOWLEDGE_TREE.md](./KNOWLEDGE_TREE.md) | 知識樹結構 |
| [ROADMAP.md](./ROADMAP.md) | 開發路線圖 |

## 支援的 AI 生態

本系統設計為 AI 中立（AI-Agnostic），可接入：

- ChatGPT（OpenAI）
- Gemini（Google）
- Claude（Anthropic）
- 未來其他 AI 供應商

詳見 [AI_PROTOCOL.md](./AI_PROTOCOL.md)。

## 編碼與語言

- 所有檔案使用 **UTF-8** 編碼
- 所有文件使用 **繁體中文**

## 授權

待定。
