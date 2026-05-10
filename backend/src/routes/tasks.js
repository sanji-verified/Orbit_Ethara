import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireProjectAccess } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

// Create task
router.post('/',
  [
    body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title is required (max 200 chars)'),
    body('description').optional().trim(),
    body('projectId').isUUID().withMessage('Valid project ID required'),
    body('assigneeId').optional().isUUID(),
    body('priority').optional().isIn(['Low', 'Medium', 'High', 'Critical']),
    body('status').optional().isIn(['Todo', 'InProgress', 'Review', 'Done']),
    body('dueDate').optional().isISO8601(),
    body('tags').optional().isArray(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { title, description, projectId, assigneeId, priority = 'Medium', status = 'Todo', dueDate, tags = [] } = req.body;

      // Check project access
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { members: true },
      });

      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }

      const isMember = project.members.some(m => m.userId === req.user.id);
      const isAdmin = req.user.role === 'Admin';

      if (!isMember && !isAdmin) {
        return res.status(403).json({ success: false, message: 'Project access denied' });
      }

      // Validate assignee is a project member
      if (assigneeId) {
        const isAssigneeMember = project.members.some(m => m.userId === assigneeId);
        if (!isAssigneeMember) {
          return res.status(400).json({ success: false, message: 'Assignee must be a project member' });
        }
      }

      const task = await prisma.task.create({
        data: {
          title,
          description,
          projectId,
          assigneeId: assigneeId || null,
          priority,
          status,
          dueDate: dueDate ? new Date(dueDate) : null,
          tags,
          createdBy: req.user.id,
        },
        include: {
          assignee: { select: { id: true, name: true, avatar: true } },
          creator: { select: { id: true, name: true, avatar: true } },
          project: { select: { id: true, name: true, color: true } },
        },
      });

      res.status(201).json({ success: true, data: task });
    } catch (error) {
      console.error('Create task error:', error);
      res.status(500).json({ success: false, message: 'Failed to create task' });
    }
  }
);

// Get all tasks for current user
router.get('/my-tasks', async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { assigneeId: req.user.id },
      include: {
        assignee: { select: { id: true, name: true, avatar: true } },
        creator: { select: { id: true, name: true, avatar: true } },
        project: { select: { id: true, name: true, color: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: tasks });
  } catch (error) {
    console.error('Get my tasks error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tasks' });
  }
});

// Update task
router.put('/:taskId',
  [
    param('taskId').isUUID(),
    body('title').optional().trim().isLength({ min: 1, max: 200 }),
    body('description').optional().trim(),
    body('assigneeId').optional().isUUID(),
    body('priority').optional().isIn(['Low', 'Medium', 'High', 'Critical']),
    body('status').optional().isIn(['Todo', 'InProgress', 'Review', 'Done']),
    body('dueDate').optional().isISO8601(),
    body('tags').optional().isArray(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const task = await prisma.task.findUnique({
        where: { id: req.params.taskId },
        include: { project: { include: { members: true } } },
      });

      if (!task) {
        return res.status(404).json({ success: false, message: 'Task not found' });
      }

      const isAdmin = req.user.role === 'Admin';
      const isAssignee = task.assigneeId === req.user.id;
      const isCreator = task.createdBy === req.user.id;
      const isProjectMember = task.project.members.some(m => m.userId === req.user.id);

      if (!isAdmin && !isAssignee && !isCreator && !isProjectMember) {
        return res.status(403).json({ success: false, message: 'Not authorized to edit this task' });
      }

      const { title, description, assigneeId, priority, status, dueDate, tags } = req.body;

      const updated = await prisma.task.update({
        where: { id: req.params.taskId },
        data: {
          ...(title && { title }),
          ...(description !== undefined && { description }),
          ...(assigneeId !== undefined && { assigneeId: assigneeId || null }),
          ...(priority && { priority }),
          ...(status && { status }),
          ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
          ...(tags && { tags }),
        },
        include: {
          assignee: { select: { id: true, name: true, avatar: true } },
          creator: { select: { id: true, name: true, avatar: true } },
          project: { select: { id: true, name: true, color: true } },
        },
      });

      res.json({ success: true, data: updated });
    } catch (error) {
      console.error('Update task error:', error);
      res.status(500).json({ success: false, message: 'Failed to update task' });
    }
  }
);

// Delete task
router.delete('/:taskId', async (req, res) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.taskId },
      include: { project: true },
    });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const isAdmin = req.user.role === 'Admin';
    const isCreator = task.createdBy === req.user.id;
    const isOwner = task.project.ownerId === req.user.id;

    if (!isAdmin && !isCreator && !isOwner) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this task' });
    }

    await prisma.task.delete({ where: { id: req.params.taskId } });
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete task' });
  }
});

export default router;
