// Mock for remark-gfm ESM module to avoid Jest parsing issues
// This provides a simple mock that allows tests to run without the ESM complexity

function remarkGfm() {
  return function transformer(tree) {
    // Simple pass-through transformer for testing
    return tree
  }
}

// Support both CommonJS and ES module imports
module.exports = remarkGfm
module.exports.default = remarkGfm