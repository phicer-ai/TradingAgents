# AGENTS.zh-cn.md

这些说明适用于整个 `projects/backend/TradingAgents` 仓库。

## 项目概览

TradingAgents 是一个 Python 包和 Typer CLI，用于基于 LangGraph 的多智能体金融研究与交易分析流程。安装后的控制台命令是 `tradingagents`，入口位于 `projects/backend/TradingAgents/cli/main.py`。

关键入口：
- `projects/backend/TradingAgents/tradingagents/graph/trading_graph.py`：主要的 `TradingAgentsGraph` 编排类。
- `projects/backend/TradingAgents/tradingagents/graph/`：LangGraph 设置、传播、检查点、反思、条件路由和信号处理。
- `projects/backend/TradingAgents/tradingagents/agents/`：分析师、研究员、交易员、风险管理和投资组合经理的提示词与工具逻辑。
- `projects/backend/TradingAgents/tradingagents/dataflows/`：市场、新闻、宏观、社交、供应商路由、符号处理和验证类数据访问。
- `projects/backend/TradingAgents/tradingagents/llm_clients/`：供应商工厂、模型目录、API key 映射和供应商专用客户端封装。
- `projects/backend/TradingAgents/tradingagents/default_config.py`：默认运行配置和 `TRADINGAGENTS_*` 环境变量覆盖。
- `projects/backend/TradingAgents/tests/`：覆盖供应商行为、dataflow 路由、符号处理、CLI 环境变量行为、检查点和安全加固的 pytest 测试。

## 环境与密钥

不要提交密钥或本地运行状态。`.env`、`.env.enterprise`、报告、缓存、虚拟环境和生成的运行日志都应保持忽略状态。

只把 `projects/backend/TradingAgents/.env.example` 和 `projects/backend/TradingAgents/.env.enterprise.example` 当作模板使用。如果新增或修改受支持的环境变量，请同步更新对应示例文件、`projects/backend/TradingAgents/tradingagents/default_config.py`，并在行为变化时更新测试。

运行状态默认写入用户 home 下的 `.tradingagents` 等位置；测试不应依赖真实用户 home，应使用 `tmp_path`、`monkeypatch` 或显式配置覆盖。

## 开发流程

除非另有说明，从工作区根目录运行命令：

```bash
cd projects/backend/TradingAgents
python -m pip install -e ".[dev]"
pytest -q
ruff check .
```

干净运行依赖的冒烟测试：

```bash
cd projects/backend/TradingAgents
python -m pip install .
python -c "import tradingagents, cli.main; print('clean-install import OK')"
```

CLI 启动方式：

```bash
cd projects/backend/TradingAgents
tradingagents analyze
python -m cli.main analyze
```

使用 `tradingagents analyze --checkpoint` 启用 LangGraph 检查点/恢复；使用 `tradingagents analyze --clear-checkpoints` 在运行前删除保存的检查点。

## 测试指引

优先编写快速单元测试，并 mock 网络、数据供应商和 LLM 客户端。`projects/backend/TradingAgents/tests/conftest.py` 会注入占位 API key，并在测试之间重置 dataflow 配置，避免顺序相关行为。

使用 `projects/backend/TradingAgents/pyproject.toml` 中已有的 pytest 标记：`unit`、`integration` 和 `smoke`。真实供应商测试必须标记为 `integration`，并在所需凭证缺失或仍是占位值时跳过。

修改供应商选择、API key 解析、模型兼容性或 base URL 时，优先检查这些聚焦测试：
- `projects/backend/TradingAgents/tests/test_provider_registry.py`
- `projects/backend/TradingAgents/tests/test_api_key_env.py`
- `projects/backend/TradingAgents/tests/test_openai_compatible_provider.py`
- `projects/backend/TradingAgents/tests/test_ollama_base_url.py`
- `projects/backend/TradingAgents/tests/test_bedrock_provider.py`

修改市场数据、符号、供应商路由或路径安全时，优先检查这些聚焦测试：
- `projects/backend/TradingAgents/tests/test_vendor_routing.py`
- `projects/backend/TradingAgents/tests/test_vendor_errors.py`
- `projects/backend/TradingAgents/tests/test_symbol_utils.py`
- `projects/backend/TradingAgents/tests/test_safe_ticker_component.py`
- `projects/backend/TradingAgents/tests/test_market_data_validator.py`

## 实现注意事项

保持配置流不变：`DEFAULT_CONFIG` 会应用 `TRADINGAGENTS_*` 覆盖，CLI 可以根据环境变量跳过提示，`TradingAgentsGraph` 会通过 `set_config` 将配置传入 dataflows。

供应商专用代码应放在 `projects/backend/TradingAgents/tradingagents/llm_clients/factory.py` 和相关供应商模块后面。除非测试明确覆盖某个供应商，否则不要在测试收集阶段导入较重的供应商 SDK。

数据供应商路由应尊重配置的供应商链。除非配置为 `default` 或明确列出某供应商，否则不要静默路由到未配置的供应商。

Ticker 和符号处理涉及安全，因为生成路径可能受用户输入影响。应使用现有辅助函数，例如 `safe_ticker_component` 和符号规范化工具，不要手写路径或 ticker 转换逻辑。

LLM 输出和实时数据不是确定性的。分析行为测试应断言契约、路由、状态形状和安全行为，而不是精确匹配完整模型输出文本。

## AI 就绪资产

此仓库目前没有仓库内 MCP server、Codex skill、CodeGraph 配置或 generated-agent 输出目录。如果以后新增，请放在 `projects/backend/TradingAgents` 下，并在这里和 `projects/backend/TradingAgents/AGENTS.md` 中记录调用方式。
