import express from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'Admin';

    // My projects count
    const myProjectsCount = await prisma.project.count({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
    });

    // My tasks
    const myTasks = await prisma.task.findMany({
      where: { assigneeId: userId },
      select: { status: true, dueDate: true },
    });

    const openTasks = myTasks.filter(t => t.status !== 'Done').length;
    const completedTasks = myTasks.filter(t => t.status === 'Done').length;
    const overdueTasks = myTasks.filter(t => {
      if (t.status === 'Done' || !t.dueDate) return false;
      return new Date(t.dueDate) < new Date();
    }).length;

    // Recent activity (recent tasks in my projects)
    const myProjectIds = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
      select: { id: true },
    });

    const recentTasks = await prisma.task.findMany({
      where: { projectId: { in: myProjectIds.map(p => p.id) } },
      include: {
        assignee: { select: { id: true, name: true, avatar: true } },
        project: { select: { id: true, name: true, color: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
    });

    // My projects with progress
    const myProjects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
      include: {
        tasks: { select: { status: true } },
        members: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Team stats (admin only)
    let teamStats = null;
    if (isAdmin) {
      const totalUsers = await prisma.user.count();
      const totalProjects = await prisma.project.count();
      const totalTasks = await prisma.task.count();
      const completedProjects = await prisma.project.count({ where: { status: 'Completed' } });

      teamStats = { totalUsers, totalProjects, totalTasks, completedProjects };
    }

    res.json({
      success: true,
      data: {
        myProjectsCount,
        openTasks,
        completedTasks,
        overdueTasks,
        recentTasks,
        myProjects,
        teamStats,
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' });
  }
});

export default router;
