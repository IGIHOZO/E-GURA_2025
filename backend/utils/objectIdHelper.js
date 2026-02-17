const isMongoObjectId = (value) => {
  if (!value) return false;
  return /^[a-fA-F0-9]{24}$/.test(value);
};

const isUUID = (value) => {
  if (!value) return false;
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  return uuidRegex.test(value);
};

/**
 * Normalize IDs coming from different storages (Mongo ObjectId, UUID, wrapped ObjectId)
 * so Sequelize can query them consistently.
 */
const convertObjectId = (value) => {
  if (value == null) return value;
  const id = String(value).trim();

  if (isUUID(id) || isMongoObjectId(id)) {
    return id;
  }

  const objectIdMatch = id.match(/^ObjectId\("([a-fA-F0-9]{24})"\)$/);
  if (objectIdMatch) {
    return objectIdMatch[1];
  }

  return id;
};

module.exports = { convertObjectId };
