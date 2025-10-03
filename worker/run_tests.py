#!/usr/bin/env python3
"""
Test runner script for the worker component tests.
"""
import sys
import subprocess
import os

def run_tests():
    """Run the test suite with appropriate options."""
    
    # Ensure we're in the worker directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Basic test command
    cmd = ["python", "-m", "pytest", "tests/", "-v"]
    
    # Add coverage if requested
    if "--coverage" in sys.argv:
        cmd.extend(["--cov=src", "--cov-report=html", "--cov-report=term"])
    
    # Add specific test file if provided
    if len(sys.argv) > 1 and sys.argv[1].startswith("test_"):
        cmd = ["python", "-m", "pytest", f"tests/{sys.argv[1]}", "-v"]
    
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