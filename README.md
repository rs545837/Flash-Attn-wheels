# Pre-Built Wheels

Pre-built wheels for Flash Attention & vLLM. Skip the compilation.

## Quick Install

Auto-detect your environment and install the right wheel:

```bash
pip install mlwheels

# Install Flash Attention
mlwheels flash-attn

# Install vLLM
mlwheels vllm

# Just detect environment (no install)
mlwheels --detect
```

## Features

- Search and filter by CUDA, Python, PyTorch, and Platform
- One-click copy for `pip` and `uv` install commands
- Direct download links
- Flash Attention 2 & 3 support
- vLLM wheels for multiple CUDA versions

## Supported Configurations

### Flash Attention 2
- CUDA: 11.8, 12.1, 12.2, 12.3, 12.4, 12.6
- PyTorch: 2.0 - 2.10
- Python: 3.8 - 3.12
- Platforms: Linux x86_64, Linux ARM64, Windows

### Flash Attention 3
- CUDA: 12.6, 12.8, 12.9, 13.0
- PyTorch: 2.8 - 2.10
- Python: 3.10 - 3.12
- Platforms: Linux x86_64, Linux ARM64, Windows

### vLLM
- CUDA: 11.8, 12.1, 12.4, 12.6, 12.8, 12.9, 13.0, CPU
- Python: 3.8+
- Platforms: Linux x86_64, Linux ARM64

## Sources

**Flash Attention**
- [flashattn.dev](https://flashattn.dev/)
- [Flash Attention 3 Wheels](https://windreamer.github.io/flash-attention3-wheels/)
- [mjun0812/flash-attention-prebuild-wheels](https://github.com/mjun0812/flash-attention-prebuild-wheels)
- [Dao-AILab/flash-attention](https://github.com/Dao-AILab/flash-attention)

**vLLM**
- [vLLM GitHub Releases](https://github.com/vllm-project/vllm/releases)
- [vLLM Documentation](https://docs.vllm.ai/)

## License

MIT
