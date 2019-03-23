const { findStyleModels } = require('../models/style')

module.exports = {
  Query: {
    styleModels: async (root, variables, context) => {
      return findStyleModels()
    }
  }
}
