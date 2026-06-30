# 今日记账

一款专注于日常收支记录、预算管理与消费回顾的记账应用。产品主张是：**看见每一笔，也看见生活。**

## 动态版本

项目使用浏览器原生 ES Modules，需要通过本地静态服务器预览，无需安装项目依赖：

```bash
python3 -m http.server 8080
```

然后访问 `http://localhost:8080`。

浏览器业务测试位于 `http://localhost:8080/tests/dynamic-ledger.test.html`，覆盖流水增删改、月份筛选、预算计算、本地持久化与远程网关同步。

当前版本已包含：

- 流水新增、编辑、删除与服务端持久化
- 注册、登录、用户数据隔离与安全退出
- 按月份查看真实收支汇总和流水搜索
- 独立的全部流水、收支统计、预算管理和账户管理页面
- 可编辑月度预算、自定义资金账户与金额隐私开关
- 后端不可用时自动切换到浏览器本地模式
- 独立管理员后台，可启停用户并管理角色
- 桌面端、平板与移动端响应式布局

## 后续规划

- 自定义分类与周期账单管理
- 多设备同步与令牌刷新
- 账单导入导出、统计报表与智能消费洞察
- 提醒、主题设置和隐私保护

## 项目结构

```text
.
├── index.html                    # 用户端入口
├── admin.html                    # 独立管理后台入口
├── assets/
│   ├── admin/                    # 管理后台专用样式与交互
│   ├── styles/                   # 用户端样式、页面与响应式规则
│   └── scripts/
│       ├── app.js                # 应用装配入口
│       ├── api/                  # 后端请求与令牌管理
│       ├── core/                 # 格式化、存储与通用反馈
│       ├── data/                 # 静态模拟数据
│       ├── features/             # 按业务功能隔离的交互模块
│       └── stores/               # 账本状态与数据源协调
└── backend/
    ├── app/api/                  # FastAPI 路由与依赖
    ├── app/services/             # 业务服务
    ├── app/repositories/         # 数据访问
    ├── app/models/               # SQLAlchemy 模型
    ├── migrations/               # Alembic 数据库迁移
    └── tests/                    # 后端自动化测试
```

开发时遵循单一职责：业务模块不直接管理其他模块的数据，由 `app.js` 通过明确接口进行组合。

## 后端 API

后端位于 `backend/`，采用 FastAPI、SQLAlchemy、Alembic 和 SQLite，并按 API、业务服务、数据仓库、模型、Schema 分层。

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
alembic upgrade head
uvicorn backend.app.main:app --reload --port 8000
```

也可以使用 `make setup` 一次完成环境安装和数据库迁移。之后分别在两个终端运行 `make backend` 与 `make frontend`，前端会自动连接 `http://127.0.0.1:8000/api/v1`。

启动后可访问：

- API 文档：`http://127.0.0.1:8000/docs`
- 健康检查：`http://127.0.0.1:8000/api/v1/health`
- 流水 API：`/api/v1/transactions`
- 预算 API：`/api/v1/budgets/{YYYY-MM}`
- 统计 API：`/api/v1/analytics/*`
- 管理后台：`http://127.0.0.1:8080/admin.html`

运行后端测试：

```bash
pytest
```

数据库结构变更必须创建 Alembic revision，应用启动过程不会擅自修改数据库表结构。

首次使用管理后台前，通过命令行创建管理员（管理员不能在网页公开注册）：

```bash
make create-admin EMAIL=admin@example.com PASSWORD='your-secure-password' NAME='管理员'
```
