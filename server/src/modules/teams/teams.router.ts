import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth-context';
import { validateRequest } from '../../middleware/validate-request';
import {
  teamCustomizationSchema,
  teamParamsSchema,
  type TeamCustomizationPayload,
} from './teams.schemas';

export const teamsRouter = Router();

teamsRouter.use(requireAuth);

teamsRouter.get('/:id', validateRequest({ params: teamParamsSchema }), (req, res) => {
  const { id } = req.params as { id: string };

  return res.json({
    id,
    name: 'Gridiron Lions',
    level: 'High School Varsity',
    organization: 'Gridiron High School',
    createdBy: 'coach-demo-1',
    rosterCounts: {
      coaches: 5,
      players: 48,
    },
    customization: {
      heroTitle: 'Finish Every Rep',
      heroMessage: 'Discipline, execution, and heart define the Gridiron Lions.',
      highlightIds: ['highlight-1', 'highlight-2'],
      announcements: [
        {
          id: 'announcement-1',
          title: 'Week 3 Game Tape',
          body: 'Upload your positional notes before Friday 6 PM.',
          publishedAt: '2025-09-14T09:00:00.000Z',
        },
      ],
      resources: [{ label: 'Offensive Playbook', url: 'https://example.com/playbook.pdf' }],
    },
  });
});

teamsRouter.patch(
  '/:id/customization',
  requireRole('coach'),
  validateRequest({ params: teamParamsSchema, body: teamCustomizationSchema }),
  (req, res) => {
    const { id } = req.params as { id: string };
    const payload = req.body as TeamCustomizationPayload;

    return res.json({
      id,
      updatedAt: new Date().toISOString(),
      customization: payload,
    });
  },
);

teamsRouter.get('/:id/trainings', validateRequest({ params: teamParamsSchema }), (req, res) => {
  const { id } = req.params as { id: string };

  return res.json({
    teamId: id,
    trainings: [
      {
        id: 'training-1',
        title: 'Speed & Agility',
        description: 'Acceleration ladders and shuttle drills.',
        startAt: '2025-09-16T14:00:00.000Z',
        endAt: '2025-09-16T16:00:00.000Z',
        location: 'Practice Field A',
        status: 'scheduled',
        drills: [
          { drillId: 'drill-1', title: '3-Cone Drill', sequence: 1 },
          { drillId: 'drill-2', title: 'Sled Push', sequence: 2 },
        ],
      },
    ],
  });
});

teamsRouter.get('/:id/highlights', validateRequest({ params: teamParamsSchema }), (req, res) => {
  const { id } = req.params as { id: string };

  return res.json({
    teamId: id,
    highlights: [
      {
        id: 'highlight-1',
        title: 'Week 2 Defensive Highlights',
        description: 'Key stops and turnovers against Rivals HS.',
        storagePath: 'highlights/week2-defense.mp4',
        tags: ['Week2', 'Defense'],
        publishedAt: '2025-09-11T20:15:00.000Z',
      },
    ],
  });
});
