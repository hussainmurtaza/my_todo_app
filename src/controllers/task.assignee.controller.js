const TaskAssigneeRepository = require("../repositories/task.assignee.repository");
const ApiResponse = require("../helpers/response.helper");

const createTaskAssignee = async (req, res) => {
    try {
        const { taskId, userIds } = req.body;
        if (!taskId || !Array.isArray(userIds) || userIds.length === 0) {
            return ApiResponse.validationError(res, "Missing required fields");
        }
        const taskAssignee = await TaskAssigneeRepository.createTaskAssignees(taskId, userIds);
        if (!taskAssignee) {
            return ApiResponse.error(res, "Failed to create task assignees");
        }
        return ApiResponse.success(res, "Task assignee created successfully", taskAssignee);
    } catch (error) {
        return ApiResponse.error(res, "Internal server error", 500, error.message);
    }
}

module.exports = {
    createTaskAssignee,
}

