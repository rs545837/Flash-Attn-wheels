"""Environment detection and wheel matching."""

import subprocess
import sys
import re


def get_python_version():
    """Get Python version as string (e.g., '3.10')."""
    return f"{sys.version_info.major}.{sys.version_info.minor}"


def get_torch_version():
    """Get PyTorch version if installed."""
    try:
        import torch
        # Extract major.minor (e.g., "2.5" from "2.5.1+cu124")
        version = torch.__version__
        match = re.match(r"(\d+\.\d+)", version)
        return match.group(1) if match else None
    except ImportError:
        return None


def get_cuda_version():
    """Get CUDA version from PyTorch or nvidia-smi."""
    # Try PyTorch first
    try:
        import torch
        if torch.cuda.is_available():
            # Get CUDA version from PyTorch build
            cuda_version = torch.version.cuda
            if cuda_version:
                # Extract major.minor (e.g., "12.4" from "12.4")
                match = re.match(r"(\d+\.\d+)", cuda_version)
                return match.group(1) if match else None
    except ImportError:
        pass

    # Fallback to nvidia-smi
    try:
        result = subprocess.run(
            ["nvidia-smi", "--query-gpu=driver_version", "--format=csv,noheader"],
            capture_output=True, text=True, timeout=5
        )
        if result.returncode == 0:
            # nvidia-smi doesn't directly give CUDA version, try nvcc
            nvcc_result = subprocess.run(
                ["nvcc", "--version"],
                capture_output=True, text=True, timeout=5
            )
            if nvcc_result.returncode == 0:
                match = re.search(r"release (\d+\.\d+)", nvcc_result.stdout)
                if match:
                    return match.group(1)
    except (FileNotFoundError, subprocess.TimeoutExpired):
        pass

    return None


def detect_environment():
    """Detect current environment."""
    return {
        "python": get_python_version(),
        "torch": get_torch_version(),
        "cuda": get_cuda_version(),
    }


def get_platform():
    """Get platform identifier."""
    import platform
    system = platform.system().lower()
    machine = platform.machine().lower()

    if system == "linux":
        if machine in ("x86_64", "amd64"):
            return "linux_x86_64"
        elif machine in ("aarch64", "arm64"):
            return "linux_aarch64"
    elif system == "windows":
        return "win_amd64"
    elif system == "darwin":
        return "macos"

    return None


# Base URLs for wheels
WHEEL_SOURCES = {
    "flash-attn": {
        "base": "https://github.com/Dao-AILab/flash-attention/releases/download",
        "alt": "https://github.com/mjun0812/flash-attention-prebuild-wheels/releases/download",
    },
    "vllm": {
        "base": "https://github.com/vllm-project/vllm/releases/download",
    }
}

# Known wheel configurations (subset - full list at flashattn.dev)
FLASH_ATTN_WHEELS = {
    # Format: (cuda, torch, python, platform): version
    ("12.4", "2.5", "3.10", "linux_x86_64"): "2.7.4",
    ("12.4", "2.5", "3.11", "linux_x86_64"): "2.7.4",
    ("12.4", "2.5", "3.12", "linux_x86_64"): "2.7.4",
    ("12.6", "2.6", "3.10", "linux_x86_64"): "2.7.4",
    ("12.6", "2.6", "3.11", "linux_x86_64"): "2.7.4",
    ("12.6", "2.6", "3.12", "linux_x86_64"): "2.7.4",
    ("12.1", "2.4", "3.10", "linux_x86_64"): "2.6.3",
    ("12.1", "2.4", "3.11", "linux_x86_64"): "2.6.3",
    ("11.8", "2.3", "3.10", "linux_x86_64"): "2.6.3",
    ("11.8", "2.3", "3.11", "linux_x86_64"): "2.6.3",
}

VLLM_WHEELS = {
    # Format: (cuda, python, platform): (version, url)
    ("12.6", "3.10", "linux_x86_64"): ("0.15.0", "https://github.com/vllm-project/vllm/releases/download/v0.15.0/vllm-0.15.0-cp38-abi3-manylinux1_x86_64.whl"),
    ("12.6", "3.11", "linux_x86_64"): ("0.15.0", "https://github.com/vllm-project/vllm/releases/download/v0.15.0/vllm-0.15.0-cp38-abi3-manylinux1_x86_64.whl"),
    ("12.6", "3.12", "linux_x86_64"): ("0.15.0", "https://github.com/vllm-project/vllm/releases/download/v0.15.0/vllm-0.15.0-cp38-abi3-manylinux1_x86_64.whl"),
    ("12.4", "3.10", "linux_x86_64"): ("0.15.0", "https://github.com/vllm-project/vllm/releases/download/v0.15.0/vllm-0.15.0+cu124-cp38-abi3-manylinux1_x86_64.whl"),
    ("12.4", "3.11", "linux_x86_64"): ("0.15.0", "https://github.com/vllm-project/vllm/releases/download/v0.15.0/vllm-0.15.0+cu124-cp38-abi3-manylinux1_x86_64.whl"),
    ("12.1", "3.10", "linux_x86_64"): ("0.15.0", "https://github.com/vllm-project/vllm/releases/download/v0.15.0/vllm-0.15.0+cu121-cp38-abi3-manylinux1_x86_64.whl"),
    ("12.1", "3.11", "linux_x86_64"): ("0.15.0", "https://github.com/vllm-project/vllm/releases/download/v0.15.0/vllm-0.15.0+cu121-cp38-abi3-manylinux1_x86_64.whl"),
    ("11.8", "3.10", "linux_x86_64"): ("0.15.0", "https://github.com/vllm-project/vllm/releases/download/v0.15.0/vllm-0.15.0+cu118-cp38-abi3-manylinux1_x86_64.whl"),
}


def find_closest_cuda(target_cuda, available_versions):
    """Find the closest CUDA version that's <= target."""
    if not target_cuda:
        return None

    target = float(target_cuda)
    available = sorted([float(v) for v in available_versions], reverse=True)

    for v in available:
        if v <= target:
            return str(v) if v == int(v) else f"{v:.1f}"

    return None


def get_wheel_url(library="flash-attn", env=None):
    """Get the best matching wheel URL for the current environment."""
    if env is None:
        env = detect_environment()

    platform = get_platform()
    python = env.get("python")
    torch = env.get("torch")
    cuda = env.get("cuda")

    if library == "vllm":
        # Find matching vLLM wheel
        available_cuda = list(set(k[0] for k in VLLM_WHEELS.keys()))
        matched_cuda = find_closest_cuda(cuda, available_cuda) or "12.6"

        for py in [python, "3.11", "3.10"]:
            key = (matched_cuda, py, platform)
            if key in VLLM_WHEELS:
                version, url = VLLM_WHEELS[key]
                return {"url": url, "version": version, "cuda": matched_cuda, "python": py}

        return None

    else:  # flash-attn
        available_cuda = list(set(k[0] for k in FLASH_ATTN_WHEELS.keys()))
        matched_cuda = find_closest_cuda(cuda, available_cuda)

        if not matched_cuda or not torch:
            return None

        for py in [python, "3.11", "3.10"]:
            key = (matched_cuda, torch, py, platform)
            if key in FLASH_ATTN_WHEELS:
                version = FLASH_ATTN_WHEELS[key]
                # Construct URL
                url = f"https://github.com/Dao-AILab/flash-attention/releases/download/v{version}/flash_attn-{version}+cu{matched_cuda.replace('.', '')}torch{torch}-cp{py.replace('.', '')}-cp{py.replace('.', '')}-{platform}.whl"
                return {"url": url, "version": version, "cuda": matched_cuda, "torch": torch, "python": py}

        return None


def install_wheel(library="flash-attn", dry_run=False):
    """Install the matching wheel."""
    env = detect_environment()
    wheel = get_wheel_url(library, env)

    if not wheel:
        print(f"No matching {library} wheel found for your environment:")
        print(f"  Python: {env.get('python')}")
        print(f"  PyTorch: {env.get('torch') or 'not installed'}")
        print(f"  CUDA: {env.get('cuda') or 'not detected'}")
        print(f"\nVisit https://rs545837.github.io/Flash-Attn-wheels/ to find a compatible wheel.")
        return False

    cmd = f"pip install {wheel['url']}"

    if dry_run:
        print(f"Would install {library} {wheel['version']}:")
        print(f"  {cmd}")
        return True

    print(f"Installing {library} {wheel['version']}...")
    result = subprocess.run(cmd.split(), capture_output=False)
    return result.returncode == 0
