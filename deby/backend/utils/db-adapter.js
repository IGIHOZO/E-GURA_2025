// Database Adapter - Makes Sequelize work like Mongoose
const { Op } = require('sequelize');

// Query Builder for chaining
class QueryBuilder {
  constructor(model, where = {}, existingOptions = {}) {
    this.model = model;
    this.options = { ...existingOptions, where };
  }

  limit(n) {
    this.options.limit = n;
    return this;
  }

  skip(n) {
    this.options.offset = n;
    return this;
  }

  sort(sortObj) {
    const order = [];
    for (const [key, value] of Object.entries(sortObj)) {
      order.push([key, value === 1 || value === 'asc' ? 'ASC' : 'DESC']);
    }
    this.options.order = order;
    return this;
  }

  async exec() {
    if (this.model._originalMethods?.findAll) {
      return await this.model._originalMethods.findAll(this.options);
    }
    return await this.model.findAll(this.options);
  }

  // Make it thenable so it can be awaited
  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }

  catch(reject) {
    return this.exec().catch(reject);
  }
}

class ModelAdapter {
  constructor(model) {
    this.model = model;
    this.isSequelize = !!model.sequelize;
  }

  // Convert Mongoose query to Sequelize where clause
  convertQuery(mongoQuery) {
    if (!this.isSequelize) return mongoQuery;

    const where = {};
    
    for (const [key, value] of Object.entries(mongoQuery)) {
      if (key === '$or') {
        where[Op.or] = value.map(v => this.convertQuery(v));
      } else if (typeof value === 'object' && value !== null) {
        if (value.$regex) {
          where[key] = { [Op.iLike]: `%${value.$regex}%` };
        } else if (value.$in) {
          where[key] = { [Op.in]: value.$in };
        } else if (value.$gte || value.$lte) {
          where[key] = {};
          if (value.$gte) where[key][Op.gte] = value.$gte;
          if (value.$lte) where[key][Op.lte] = value.$lte;
        } else {
          where[key] = value;
        }
      } else {
        where[key] = value;
      }
    }
    
    return where;
  }

  // Find with Mongoose-like syntax (returns QueryBuilder for chaining)
  find(query = {}) {
    if (!this.isSequelize) {
      return this.model.find(query);
    }

    // If query has Sequelize options (where, limit, offset, etc.), use directly
    if (query.where || query.limit || query.offset || query.order || query.attributes) {
      // Return a special QueryBuilder that passes through Sequelize options
      return new QueryBuilder(this.model, query.where || {}, query);
    }

    // Otherwise, convert Mongoose-like query to Sequelize
    const where = this.convertQuery(query);
    return new QueryBuilder(this.model, where);
  }

  // Find one
  async findOne(query = {}) {
    if (!this.isSequelize) {
      return this.model.findOne(query);
    }

    // If query already has 'where' property, use it as-is (Sequelize native syntax)
    if (query.where) {
      if (this.model._originalMethods?.findOne) {
        return await this.model._originalMethods.findOne(query);
      }
      return await this.model.findOne(query);
    }

    // Otherwise, convert Mongoose-like query to Sequelize
    const where = this.convertQuery(query);
    // Use the original bound method
    if (this.model._originalMethods?.findOne) {
      return await this.model._originalMethods.findOne({ where });
    }
    // Fallback to direct call
    return await this.model.findOne({ where });
  }

  // Find by ID
  async findById(id) {
    if (!this.isSequelize) {
      return this.model.findById(id);
    }

    console.log('findById called with id:', id, 'type:', typeof id);

    // Extract string ID - handle various input formats
    let actualId = id;
    if (typeof id === 'object' && id !== null) {
      console.log('ID is an object:', JSON.stringify(id));
      // If it's an object with an 'id' property, extract it
      if (id.id) {
        actualId = id.id;
      } else {
        // If it's a params object or similar, try to get the first value
        const keys = Object.keys(id);
        if (keys.length === 1) {
          actualId = id[keys[0]];
        } else if (keys.length > 1) {
          // If multiple keys, throw error for debugging
          throw new Error(`Cannot extract ID from object with multiple keys: ${JSON.stringify(id)}`);
        }
      }
    }
    
    // Final check: if actualId is still an object, try to convert it
    if (typeof actualId === 'object' && actualId !== null) {
      console.error('Failed to extract ID from object:', actualId);
      throw new Error(`Invalid ID format: expected string or number, got object ${JSON.stringify(actualId)}`);
    }
    
    // Ensure we have a valid string ID
    actualId = String(actualId);
    console.log('Extracted actualId:', actualId);
    
    // Use the original findByPk method if available, otherwise use the model's findByPk directly
    if (this.model._originalMethods?.findByPk) {
      return await this.model._originalMethods.findByPk(actualId);
    }
    
    // Fallback to calling findByPk directly on the model
    return await this.model.findByPk(actualId);
  }

  // Count documents
  async countDocuments(query = {}) {
    if (!this.isSequelize) {
      return this.model.countDocuments(query);
    }

    // If query already has 'where' property, use it as-is (Sequelize native syntax)
    if (query.where) {
      if (this.model._originalMethods?.count) {
        return await this.model._originalMethods.count(query);
      }
      return await this.model.count(query);
    }

    // Otherwise, convert Mongoose-like query to Sequelize
    const where = this.convertQuery(query);
    // Use the original bound method
    if (this.model._originalMethods?.count) {
      return await this.model._originalMethods.count({ where });
    }
    // Fallback to direct call
    return await this.model.count({ where });
  }

  // Create
  async create(data) {
    return await this.model.create(data);
  }

  // Update
  async findByIdAndUpdate(id, update, options = {}) {
    if (!this.isSequelize) {
      return this.model.findByIdAndUpdate(id, update, options);
    }

    // Extract string ID - handle various input formats
    let actualId = id;
    if (typeof id === 'object' && id !== null) {
      if (id.id) {
        actualId = id.id;
      } else {
        const keys = Object.keys(id);
        if (keys.length === 1) {
          actualId = id[keys[0]];
        }
      }
    }
    actualId = String(actualId);

    const instance = this.model._originalMethods?.findByPk 
      ? await this.model._originalMethods.findByPk(actualId)
      : await this.model.findByPk(actualId);
    if (!instance) return null;
    
    await instance.update(update);
    return instance;
  }

  // Delete
  async findByIdAndDelete(id) {
    if (!this.isSequelize) {
      return this.model.findByIdAndDelete(id);
    }

    // Extract string ID - handle various input formats
    let actualId = id;
    if (typeof id === 'object' && id !== null) {
      if (id.id) {
        actualId = id.id;
      } else {
        const keys = Object.keys(id);
        if (keys.length === 1) {
          actualId = id[keys[0]];
        }
      }
    }
    actualId = String(actualId);

    const instance = this.model._originalMethods?.findByPk 
      ? await this.model._originalMethods.findByPk(actualId)
      : await this.model.findByPk(actualId);
    if (!instance) return null;
    
    await instance.destroy();
    return instance;
  }

  // Distinct
  async distinct(field) {
    if (!this.isSequelize) {
      return this.model.distinct(field);
    }

    const results = this.model._originalMethods?.findAll
      ? await this.model._originalMethods.findAll({
          attributes: [[this.model.sequelize.fn('DISTINCT', this.model.sequelize.col(field)), field]],
          raw: true
        })
      : await this.model.findAll({
          attributes: [[this.model.sequelize.fn('DISTINCT', this.model.sequelize.col(field)), field]],
          raw: true
        });
    
    return results.map(r => r[field]).filter(v => v != null);
  }
}

// Wrap models to add Mongoose-like methods
function wrapModel(model) {
  // Skip if already wrapped
  if (model._isWrapped) {
    return model;
  }
  
  const adapter = new ModelAdapter(model);
  
  // Add Mongoose-like methods to Sequelize models
  if (model.sequelize) {
    // Save original methods
    model._originalMethods = {
      findAll: model.findAll.bind(model),
      findOne: model.findOne.bind(model),
      findByPk: model.findByPk.bind(model),
      count: model.count.bind(model),
      create: model.create.bind(model)
    };
    
    // Add wrapped methods
    model.find = (query, options) => adapter.find(query, options);
    model.findOne = (query) => adapter.findOne(query);
    model.findById = (id) => adapter.findById(id);
    model.countDocuments = (query) => adapter.countDocuments(query);
    model.findByIdAndUpdate = (id, update, options) => adapter.findByIdAndUpdate(id, update, options);
    model.findByIdAndDelete = (id) => adapter.findByIdAndDelete(id);
    model.distinct = (field) => adapter.distinct(field);
    
    model._isWrapped = true;
  }
  
  return model;
}

module.exports = { ModelAdapter, wrapModel };
