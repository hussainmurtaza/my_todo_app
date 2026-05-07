const TaskAssigneeRepository = require("../repositories/task.assignee.repository");
const ApiResponse = require("../helpers/response.helper");
const UserRepository = require("../repositories/user.repository");
const TaskRepository = require("../repositories/task.repository");
const emailQueue = require("../queues/emailQueue");
const ProjectMembersRepository = require("../repositories/project.members.repository");

const createTaskAssignee = async (req, res) => {
    try {
        const { taskId, userIds } = req.body;
        const { userId } = req.user;
        if (!taskId || !Array.isArray(userIds) || userIds.length === 0) {
            return ApiResponse.validationError(res, "Missing required fields");
        }
        if (userIds.length > 50) {
            return ApiResponse.error(res, "You can only assign up to 50 users to a task at a time");
        }
        const task = await TaskRepository.getTaskById(taskId);
        if (!task) {
            return ApiResponse.error(res, "Task not found");
        }
        if (+task.createdBy.id !== +userId) {
            return ApiResponse.error(res, "You are not the owner of the task");
        }
        const uniqueUserIds = [...new Set(userIds)];
        const projectMembers = await ProjectMembersRepository.getProjectMembers(task.projectId);
        if (!projectMembers.length) {
            return ApiResponse.error(res, "No project members found");
        }
        const projectMemberIds = new Set(
            projectMembers.map(member => +member.userDetails.id)
        );
        const invalidUserIds = uniqueUserIds.filter(
            id => !projectMemberIds.has(+id)
        );
        if (invalidUserIds.length) {
            return ApiResponse.error(res, "Some users are not project members");
        }
        const taskAssignee = await TaskAssigneeRepository.createTaskAssignees(taskId, uniqueUserIds);
        if (!taskAssignee) {
            return ApiResponse.error(res, "Failed to create task assignees");
        }
        const users = await UserRepository.getUserByIds(uniqueUserIds);
        if (!users.length) {
            return ApiResponse.error(res, "Failed to get users");
        }
        const jobs = users.map(user => ({
            name: "task-assigned",
            data: {
                to: user.email,
                taskName: task.title
            }
        }));
        await emailQueue.addBulk(jobs);
        return ApiResponse.success(res, "Task assignee created successfully", taskAssignee);
    } catch (error) {
        return ApiResponse.error(res, "Internal server error", 500, error.message);
    }
}

module.exports = {
    createTaskAssignee,
}

