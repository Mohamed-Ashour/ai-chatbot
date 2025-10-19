#!/usr/bin/env python3
"""
Test runner script for the worker component tests.
"""
import os
import subprocess
import sys


def run_tests():
    """Run the test suite with appropriate options."""

    # Ensure we're in the worker directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    # Basic test command
    cmd = ["python", "-m", "pytest", "tests/", "-v"]

    # Parse arguments
    cov_args = []
    test_file = None
    
    for arg in sys.argv[1:]:
        if arg == "--coverage" or arg.startswith("--cov"):
            cov_args.append(arg)
        elif arg.startswith("--cov="):
            cov_args.append(arg)
        elif arg.startswith("test_") or arg.endswith(".py"):
            test_file = arg

    # Add coverage options
    if cov_args:
        cmd.extend(["--cov=src", "--cov-report=term-missing"])
        # Add any additional coverage reports if specified
        for arg in cov_args:
            if arg.startswith("--cov-report="):
                cmd.append(arg)
    
    # Add xml report if --cov is present (for CI)
    if any("--cov" in arg for arg in sys.argv[1:]):
        cmd.append("--cov-report=xml")

    # Add specific test file if provided
    if test_file:
        # Replace tests/ at the end
        cmd = cmd[:-1]  # Remove "tests/"
        cmd.append(f"tests/{test_file}" if not test_file.startswith("tests/") else test_file)

    # Run the tests
    try:
        result = subprocess.run(cmd, check=False)
        return result.returncode
    except KeyboardInterrupt:
        print("\nTests interrupted by user")
        return 1
    except Exception as e:
        print(f"Error running tests: {e}")
        return 1


if __name__ == "__main__":
    exit_code = run_tests()
    sys.exit(exit_code)
