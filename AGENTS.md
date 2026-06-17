# AGENTS.md

These instructions apply to the whole `projects/backend/TradingAgents` repository.

## Project Overview

TradingAgents is a Python package and Typer CLI for a LangGraph-based multi-agent financial research and trading-analysis workflow. The installed console command is `tradingagents`, backed by `projects/backend/TradingAgents/cli/main.py`.

Key entry points:
- `projects/backend/TradingAgents/tradingagents/graph/trading_graph.py`: main `TradingAgentsGraph` orchestration class.
- `projects/backend/TradingAgents/tradingagents/graph/`: LangGraph setup, propagation, checkpointing, reflection, conditional routing, and signal processing.
- `projects/backend/TradingAgents/tradingagents/agents/`: analyst, researcher, trader, risk, and portfolio-manager prompt/tool logic.
- `projects/backend/TradingAgents/tradingagents/dataflows/`: market, news, macro, social, vendor-routing, symbol, and validation data access.
- `projects/backend/TradingAgents/tradingagents/llm_clients/`: provider factory, model catalog, API-key mapping, and provider-specific client wrappers.
- `projects/backend/TradingAgents/tradingagents/default_config.py`: default runtime configuration and `TRADINGAGENTS_*` environment overrides.
- `projects/backend/TradingAgents/tests/`: pytest coverage for provider behavior, dataflow routing, symbol handling, CLI env behavior, checkpointing, and safety hardening.

## Environment And Secrets

Do not commit secrets or local runtime state. `.env`, `.env.enterprise`, reports, caches, virtualenvs, and generated runtime logs are intentionally ignored.

Use `projects/backend/TradingAgents/.env.example` and `projects/backend/TradingAgents/.env.enterprise.example` only as templates. If you add or change supported environment variables, update the matching example file, `projects/backend/TradingAgents/tradingagents/default_config.py`, and tests when behavior changes.

Runtime state defaults to user-home locations such as `.tradingagents`; tests should avoid depending on a real user home by using `tmp_path`, `monkeypatch`, or explicit config overrides.

## Development Workflow

Run commands from the workspace root unless stated otherwise:

```bash
cd projects/backend/TradingAgents
python -m pip install -e ".[dev]"
pytest -q
ruff check .
```

For a clean runtime-dependency smoke test:

```bash
cd projects/backend/TradingAgents
python -m pip install .
python -c "import tradingagents, cli.main; print('clean-install import OK')"
```

The CLI can be launched with:

```bash
cd projects/backend/TradingAgents
tradingagents analyze
python -m cli.main analyze
```

Use `tradingagents analyze --checkpoint` for LangGraph checkpoint/resume behavior and `tradingagents analyze --clear-checkpoints` to remove saved checkpoints before a run.

## Testing Guidance

Prefer fast unit tests that mock network, data vendors, and LLM clients. `projects/backend/TradingAgents/tests/conftest.py` injects placeholder API keys and resets dataflow config between tests to avoid order-dependent behavior.

Use existing pytest markers from `projects/backend/TradingAgents/pyproject.toml`: `unit`, `integration`, and `smoke`. Live-provider tests must be marked `integration` and skipped when the required credential is missing or still a placeholder.

When touching provider selection, API-key resolution, model compatibility, or base URLs, check the focused tests in:
- `projects/backend/TradingAgents/tests/test_provider_registry.py`
- `projects/backend/TradingAgents/tests/test_api_key_env.py`
- `projects/backend/TradingAgents/tests/test_openai_compatible_provider.py`
- `projects/backend/TradingAgents/tests/test_ollama_base_url.py`
- `projects/backend/TradingAgents/tests/test_bedrock_provider.py`

When touching market data, symbols, vendor routing, or path safety, check the focused tests in:
- `projects/backend/TradingAgents/tests/test_vendor_routing.py`
- `projects/backend/TradingAgents/tests/test_vendor_errors.py`
- `projects/backend/TradingAgents/tests/test_symbol_utils.py`
- `projects/backend/TradingAgents/tests/test_safe_ticker_component.py`
- `projects/backend/TradingAgents/tests/test_market_data_validator.py`

## Implementation Notes

Preserve the config flow: `DEFAULT_CONFIG` applies `TRADINGAGENTS_*` overrides, the CLI can skip prompts from env vars, and `TradingAgentsGraph` passes config into dataflows through `set_config`.

Keep provider-specific code behind `projects/backend/TradingAgents/tradingagents/llm_clients/factory.py` and related provider modules. Avoid importing heavy provider SDKs at test collection time unless a test explicitly covers that provider.

Data-vendor routing should respect the configured vendor chain. Do not silently route to an unconfigured vendor unless the config says `default` or lists the vendor explicitly.

Ticker and symbol handling is security-sensitive because generated paths can be affected by user input. Use existing helpers such as `safe_ticker_component` and symbol normalization utilities instead of open-coded path or ticker transformations.

LLM outputs and live data are not deterministic. Tests for analysis behavior should assert contracts, routing, state shape, and safety behavior rather than exact full-text model output.

## AI Readiness Assets

This repo currently has no repo-local MCP server, Codex skill, CodeGraph config, or generated-agent output directory. If one is added later, keep it under `projects/backend/TradingAgents` and document the invocation here and in `projects/backend/TradingAgents/AGENTS.zh-cn.md`.
