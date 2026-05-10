import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireAdmin, requireProjectAccess } from '../middleware/auth.js';

const router = express.Router();

// Apply auth to all routes
router.use(authenticate);

// Get all projects (user's projects)
router.get('/', async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: req.user.id },
          { members: { some: { userId: req.user.id } } },
        ],
      },
      include: {
        owner: { select: { id: true, name: true, email: true, avatar: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true, avatar: true, role: true } } },
        },
        tasks: {
          select: { id: true, status: true, dueDate: true, priority: true, assigneeId: true },
        },
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: projects });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch projects' });
  }
});

// Get single project
router.get('/:projectId', requireProjectAccess, async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.projectId },
      include: {
        owner: { select: { id: true, name: true, email: true, avatar: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true, avatar: true, role: true } } },
        },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, avatar: true } },
            creator: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    res.json({ success: true, data: project });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch project' });
  }
});

// Create project
router.post('/',
  [
    body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Project name is required (max 100 chars)'),
    body('description').optional().trim().isLength({ max: 500 }),
    body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Invalid color format'),
    body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
    body('status').optional().isIn(['Active', 'OnHold', 'Completed']),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      // Only Admin can create projects
      if (req.user.role !== 'Admin') {
        return res.status(403).json({ success: false, message: 'Only admins can create projects' });
      }

      const { name, description, color, dueDate, status = 'Active' } = req.body;

      const project = await prisma.project.create({
        data: {
          name,
          description,
          color: color || '#22c55e',
          status,
          dueDate: dueDate ? new Date(dueDate) : null,
          ownerId: req.user.id,
          members: {
            create: { userId: req.user.id },
          },
        },
        include: {
          owner: { select: { id: true, name: true, email: true, avatar: true } },
          members: {
            include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
          },
          tasks: true,
        },
      });

      res.status(201).json({ success: true, data: project });
    } catch (error) {
      console.error('Create project error:', error);
      res.status(500).json({ success: false, message: 'Failed to create project' });
    }
  }
);

// Update project
router.put('/:projectId',
  [
    param('projectId').isUUID().withMessage('Invalid project ID'),
    body('name').optional().trim().isLength({ min: 1, max: 100 }),
    body('description').optional().trim(),
    body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/),
    body('status').optional().isIn(['Active', 'OnHold', 'Completed']),
    body('dueDate').optional().isISO8601(),
  ],
  requireProjectAccess,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const project = req.project;
      const isAdmin = req.user.role === 'Admin';
      const isOwner = project.ownerId === req.user.id;

      if (!isAdmin && !isOwner) {
        return res.status(403).json({ success: false, message: 'Only admins or project owners can update' });
      }

      const { name, description, color, status, dueDate } = req.body;

      const updated = await prisma.project.update({
        where: { id: req.params.projectId },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(color && { color }),
          ...(status && { status }),
          ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        },
        include: {
          owner: { select: { id: true, name: true, email: true, avatar: true } },
          members: {
            include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
          },
          tasks: true,
        },
      });

      res.json({ success: true, data: updated });
    } catch (error) {
      console.error('Update project error:', error);
      res.status(500).json({ success: false, message: 'Failed to update project' });
    }
  }
);

// Delete project
router.delete('/:projectId', requireProjectAccess, async (req, res) => {
  try {
    const project = req.project;
    const isAdmin = req.user.role === 'Admin';
    const isOwner = project.ownerId === req.user.id;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: 'Only admins or project owners can delete' });
    }

    await prisma.project.delete({ where: { id: req.params.projectId } });
    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete project' });
  }
});

// Add member to project
router.post('/:projectId/members',
  [body('userId').isUUID().withMessage('Valid user ID required')],
  requireProjectAccess,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const isAdmin = req.user.role === 'Admin';
      const isOwner = req.project.ownerId === req.user.id;

      if (!isAdmin && !isOwner) {
        return res.status(403).json({ success: false, message: 'Only admins or project owners can add members' });
      }

      const { userId } = req.body;

      const existingMember = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: req.params.projectId, userId } },
      });

      if (existingMember) {
        return res.status(409).json({ success: false, message: 'User is already a member' });
      }

      const member = await prisma.projectMember.create({
        data: {
          projectId: req.params.projectId,
          userId,
        },
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true, role: true } },
        },
      });

      res.status(201).json({ success: true, data: member });
    } catch (error) {
      console.error('Add member error:', error);
      res.status(500).json({ success: false, message: 'Failed to add member' });
    }
  }
);

// Remove member from project
router.delete('/:projectId/members/:userId', requireProjectAccess, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'Admin';
    const isOwner = req.project.ownerId === req.user.id;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: 'Only admins or project owners can remove members' });
    }

    // Cannot remove owner
    if (req.params.userId === req.project.ownerId) {
      return res.status(400).json({ success: false, message: 'Cannot remove project owner' });
    }

    await prisma.projectMember.delete({
      where: { projectId_userId: { projectId: req.params.projectId, userId: req.params.userId } },
    });

    res.json({ success: true, message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove member' });
  }
});

export default router;
