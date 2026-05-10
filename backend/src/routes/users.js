import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

// Get all users (admin only)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        createdAt: true,
        _count: {
          select: {
            tasksAssigned: true,
            ownedProjects: true,
            projectMembers: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

// Update user (admin only)
router.put('/:userId',
  requireAdmin,
  [
    param('userId').isUUID(),
    body('name').optional().trim().isLength({ min: 2 }),
    body('role').optional().isIn(['Admin', 'Member']),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { name, role } = req.body;

      // Prevent self-demotion from Admin
      if (req.params.userId === req.user.id && role && role !== 'Admin') {
        return res.status(400).json({ success: false, message: 'Cannot demote yourself from Admin' });
      }

      const updated = await prisma.user.update({
        where: { id: req.params.userId },
        data: {
          ...(name && { name }),
          ...(role && { role }),
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
          createdAt: true,
        },
      });

      res.json({ success: true, data: updated });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ success: false, message: 'Failed to update user' });
    }
  }
);

// Delete user (admin only)
router.delete('/:userId', requireAdmin, async (req, res) => {
  try {
    if (req.params.userId === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot delete yourself' });
    }

    await prisma.user.delete({ where: { id: req.params.userId } });
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
});

export default router;
