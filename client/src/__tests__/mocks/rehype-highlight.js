// Mock for rehype-highlight ESM module to avoid Jest parsing issues

function rehypeHighlight() {
  return function transformer(tree) {
    // Simple pass-through transformer for testing
    return tree
  }
}

module.exports = rehypeHighlight
module.exports.default = rehypeHighlight