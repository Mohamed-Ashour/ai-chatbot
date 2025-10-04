const { TestEnvironment } = require('jest-environment-jsdom')

/**
 * Custom Jest environment that properly supports React 18+ concurrent features
 * This helps resolve act() warnings and provides better React testing support
 */
class ReactTestEnvironment extends TestEnvironment {
  constructor(...args) {
    super(...args)
    
    // Configure global environment for React concurrent mode
    this.global.IS_REACT_ACT_ENVIRONMENT = true
    
    // Set up proper scheduler mocking for React 18+
    this.global.scheduler = {
      unstable_flushAllWithoutAsserting: () => true,
      unstable_flushUntilNextPaint: () => true,
      unstable_flushAll: () => {},
      unstable_clearYields: () => [],
      unstable_flushExpired: () => {},
      unstable_yieldValue: () => {},
      unstable_advanceTime: () => {},
    }
  }

  async setup() {
    await super.setup()
    
    // Additional setup for React concurrent features
    this.global.queueMicrotask = this.global.queueMicrotask || ((fn) => {
      Promise.resolve().then(fn)
    })
  }
}

module.exports = ReactTestEnvironment