"""CLI for mlwheels."""

import argparse
import sys
from .detector import detect_environment, get_wheel_url, install_wheel, get_platform


def main():
    parser = argparse.ArgumentParser(
        description="Auto-detect and install pre-built wheels for Flash Attention & vLLM"
    )
    parser.add_argument(
        "library",
        nargs="?",
        choices=["flash-attn", "vllm"],
        help="Library to install (flash-attn or vllm)"
    )
    parser.add_argument(
        "--detect", "-d",
        action="store_true",
        help="Only detect environment, don't install"
    )
    parser.add_argument(
        "--dry-run", "-n",
        action="store_true",
        help="Show what would be installed without installing"
    )
    parser.add_argument(
        "--url", "-u",
        action="store_true",
        help="Only print the wheel URL"
    )

    args = parser.parse_args()

    env = detect_environment()
    platform = get_platform()

    if args.detect or not args.library:
        print("Detected environment:")
        print(f"  Python:   {env['python']}")
        print(f"  PyTorch:  {env['torch'] or 'not installed'}")
        print(f"  CUDA:     {env['cuda'] or 'not detected'}")
        print(f"  Platform: {platform or 'unknown'}")

        if not args.library:
            print("\nRecommended wheels:")
            for lib in ["flash-attn", "vllm"]:
                wheel = get_wheel_url(lib, env)
                if wheel:
                    print(f"\n  {lib} {wheel['version']}:")
                    print(f"    pip install {wheel['url']}")
                else:
                    print(f"\n  {lib}: no matching wheel found")

            print("\nTo install, run:")
            print("  mlwheels flash-attn")
            print("  mlwheels vllm")
            return 0

    if args.library:
        wheel = get_wheel_url(args.library, env)

        if args.url:
            if wheel:
                print(wheel["url"])
                return 0
            else:
                print(f"No matching wheel found", file=sys.stderr)
                return 1

        if args.dry_run:
            return 0 if install_wheel(args.library, dry_run=True) else 1

        return 0 if install_wheel(args.library) else 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
