import { NextRequest, NextResponse } from 'next/server';
import { getOdooClient } from '@/lib/odoo/client';

/**
 * API Route: Dashboard collaboration
 * GET /api/collaboration/dashboard - Statistiques et activité récente
 */

export async function GET(request: NextRequest) {
  try {
    const odoo = await getOdooClient(request);
    const uid = odoo.uid;

    // Statistiques globales
    const [
      totalPending,
      totalAnswered,
      totalResolved,
      totalClosed,
      myQuestions,
      assignedToMe,
      urgentQuestions,
    ] = await Promise.all([
      // Questions en attente
      odoo.searchCount({
        model: 'accounting.question',
        domain: [['state', '=', 'pending']],
      }),

      // Questions répondues
      odoo.searchCount({
        model: 'accounting.question',
        domain: [['state', '=', 'answered']],
      }),

      // Questions résolues
      odoo.searchCount({
        model: 'accounting.question',
        domain: [['state', '=', 'resolved']],
      }),

      // Questions fermées
      odoo.searchCount({
        model: 'accounting.question',
        domain: [['state', '=', 'closed']],
      }),

      // Mes questions
      odoo.searchCount({
        model: 'accounting.question',
        domain: [['user_id', '=', uid]],
      }),

      // Assignées à moi
      odoo.searchCount({
        model: 'accounting.question',
        domain: [['assigned_to_id', '=', uid]],
      }),

      // Questions urgentes en attente
      odoo.searchCount({
        model: 'accounting.question',
        domain: [['priority', '=', '3'], ['state', 'in', ['pending', 'answered']]],
      }),
    ]);

    // Temps moyen de réponse (questions résolues ce mois)
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const monthStart = thisMonth.toISOString().split('T')[0];

    const resolvedThisMonth = await odoo.searchRead({
      model: 'accounting.question',
      domain: [
        ['state', 'in', ['resolved', 'closed']],
        ['resolved_date', '>=', monthStart],
      ],
      fields: ['response_time_hours', 'resolution_time_hours'],
    });

    let avgResponseTime = 0;
    let avgResolutionTime = 0;

    if (resolvedThisMonth.length > 0) {
      const totalResponseTime = resolvedThisMonth.reduce(
        (sum: number, q: any) => sum + (q.response_time_hours || 0),
        0
      );
      const totalResolutionTime = resolvedThisMonth.reduce(
        (sum: number, q: any) => sum + (q.resolution_time_hours || 0),
        0
      );

      avgResponseTime = totalResponseTime / resolvedThisMonth.length;
      avgResolutionTime = totalResolutionTime / resolvedThisMonth.length;
    }

    // Questions par type (ce mois)
    const questionsByType = await odoo.searchRead({
      model: 'accounting.question',
      domain: [['create_date', '>=', monthStart]],
      fields: ['question_type'],
    });

    const typeCount: Record<string, number> = {};
    questionsByType.forEach((q: any) => {
      const type = q.question_type || 'general';
      typeCount[type] = (typeCount[type] || 0) + 1;
    });

    // Activité récente (10 dernières questions)
    const recentActivity = await odoo.searchRead({
      model: 'accounting.question',
      domain: [],
      fields: [
        'name',
        'question_type',
        'state',
        'priority',
        'create_date',
        'user_id',
        'assigned_to_id',
      ],
      limit: 10,
      order: 'create_date desc',
    });

    // Questions nécessitant attention (urgentes ou >48h sans réponse)
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];

    const needsAttention = await odoo.searchRead({
      model: 'accounting.question',
      domain: [
        '|',
        ['priority', '=', '3'],
        '&',
        ['state', '=', 'pending'],
        ['create_date', '<=', twoDaysAgoStr],
      ],
      fields: [
        'name',
        'question_type',
        'priority',
        'create_date',
        'user_id',
        'assigned_to_id',
      ],
      limit: 5,
    });

    return NextResponse.json({
      stats: {
        totalPending,
        totalAnswered,
        totalResolved,
        totalClosed,
        myQuestions,
        assignedToMe,
        urgentQuestions,
        avgResponseTime: Math.round(avgResponseTime * 10) / 10,
        avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
        resolvedThisMonth: resolvedThisMonth.length,
      },
      questionsByType,
      recentActivity,
      needsAttention,
    });

  } catch (error: any) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des statistiques', details: error.message },
      { status: 500 }
    );
  }
}
