/**
 * Database Helper - Works with both MongoDB and PostgreSQL
 * Provides unified methods that work across database types
 */

const isPostgres = process.env.DATABASE_TYPE === 'postgres';

/**
 * Count documents/records - works with both MongoDB and PostgreSQL
 */
async function countRecords(Model, query = {}) {
  try {
    if (isPostgres) {
      // PostgreSQL/Sequelize
      const where = convertMongoQueryToSequelize(query);
      return await Model.count({ where });
    } else {
      // MongoDB/Mongoose
      return await Model.countDocuments(query);
    }
  } catch (error) {
    console.error('Count error:', error);
    return 0;
  }
}

/**
 * Convert MongoDB query to Sequelize where clause
 */
function convertMongoQueryToSequelize(mongoQuery) {
  const { Op } = require('sequelize');
  const where = {};

  for (const [key, value] of Object.entries(mongoQuery)) {
    if (typeof value === 'object' && value !== null) {
      // Handle operators like $gte, $lte, $in, etc.
      const converted = {};
      for (const [op, val] of Object.entries(value)) {
        switch (op) {
          case '$gte':
            converted[Op.gte] = val;
            break;
          case '$lte':
            converted[Op.lte] = val;
            break;
          case '$gt':
            converted[Op.gt] = val;
            break;
          case '$lt':
            converted[Op.lt] = val;
            break;
          case '$in':
            converted[Op.in] = val;
            break;
          case '$ne':
            converted[Op.ne] = val;
            break;
          case '$like':
          case '$regex':
            converted[Op.like] = `%${val}%`;
            break;
          default:
            converted[op] = val;
        }
      }
      where[key] = converted;
    } else {
      where[key] = value;
    }
  }

  return where;
}

/**
 * Find records with pagination
 */
async function findWithPagination(Model, query = {}, options = {}) {
  const { page = 1, limit = 10, sort = {}, populate = [] } = options;
  
  try {
    if (isPostgres) {
      // PostgreSQL/Sequelize
      const where = convertMongoQueryToSequelize(query);
      const offset = (page - 1) * limit;
      
      const result = await Model.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset,
        order: convertSortToSequelize(sort)
      });
      
      return {
        data: result.rows,
        total: result.count,
        page: parseInt(page),
        totalPages: Math.ceil(result.count / limit)
      };
    } else {
      // MongoDB/Mongoose
      const total = await Model.countDocuments(query);
      const skip = (page - 1) * limit;
      
      let queryBuilder = Model.find(query)
        .limit(parseInt(limit))
        .skip(skip);
      
      if (Object.keys(sort).length > 0) {
        queryBuilder = queryBuilder.sort(sort);
      }
      
      if (populate.length > 0) {
        populate.forEach(field => {
          queryBuilder = queryBuilder.populate(field);
        });
      }
      
      const data = await queryBuilder;
      
      return {
        data,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit)
      };
    }
  } catch (error) {
    console.error('Find with pagination error:', error);
    throw error;
  }
}

/**
 * Convert MongoDB sort to Sequelize order
 */
function convertSortToSequelize(sort) {
  const order = [];
  for (const [key, direction] of Object.entries(sort)) {
    order.push([key, direction === 1 || direction === 'asc' ? 'ASC' : 'DESC']);
  }
  return order;
}

/**
 * Check if using PostgreSQL
 */
function isUsingPostgres() {
  return isPostgres;
}

module.exports = {
  countRecords,
  findWithPagination,
  convertMongoQueryToSequelize,
  convertSortToSequelize,
  isUsingPostgres
};
