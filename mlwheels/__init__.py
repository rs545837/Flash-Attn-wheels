"""ML Wheels - Auto-detect and install pre-built wheels for Flash Attention & vLLM."""

__version__ = "0.1.0"

from .detector import detect_environment, get_wheel_url, install_wheel

__all__ = ["detect_environment", "get_wheel_url", "install_wheel"]
