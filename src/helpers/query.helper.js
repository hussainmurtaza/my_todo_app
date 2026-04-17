function addSoftDeleteCondition(alias = null) {
  return alias ? `${alias}.deleted_at IS NULL` : `deleted_at IS NULL`;
}

module.exports = { addSoftDeleteCondition };
