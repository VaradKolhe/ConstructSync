/**
 * Helper function to log system activities directly to the system_audit_logs collection.
 * 
 * @param {Object} mongoose - The mongoose instance from the calling service
 * @param {Object} data
 * @param {String|Object} data.userId - The user who performed the action
 * @param {String} data.action - Action name (e.g., 'CREATE_LABOUR', 'UPDATE_USER')
 * @param {String} data.module - Module name (e.g., 'AUTH', 'LABOUR', 'DEPLOYMENT', 'ATTENDANCE', 'REPORTING')
 * @param {Object} data.details - Additional details about the action
 * @param {String} data.ipAddress - IP address of the request
 */
exports.logAudit = async (mongoose, data) => {
  try {
    const { userId, action, module, details, ipAddress } = data;
    await mongoose.connection.collection('system_audit_logs').insertOne({
      userId: userId ? new mongoose.Types.ObjectId(userId) : null,
      action,
      module,
      details,
      ipAddress,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Audit Log Error:', error);
  }
};
