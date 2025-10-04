// Mock for rehype-raw ESM module to avoid Jest parsing issues

function rehypeRaw() {
  return function transformer(tree) {
    // Simple pass-through transformer for testing
    return tree
  }
}

module.exports = rehypeRaw
module.exports.default = rehypeRaw