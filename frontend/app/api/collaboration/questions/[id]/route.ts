import { NextRequest, NextResponse } from 'next/server';
import { getOdooClient } from '@/lib/odoo/client';

/**
 * API Route: Détail d'une question
 * GET    /api/collaboration/questions/[id] - Détails question
 * PATCH  /api/collaboration/questions/[id] - Modifier question
 * DELETE /api/collaboration/questions/[id] - Supprimer question
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const questionId = parseInt(params.id);

    if (isNaN(questionId)) {
      return NextResponse.json(
        { error: 'ID de question invalide' },
        { status: 400 }
      );
    }

    const odoo = await getOdooClient(request);

    // Récupération de la question
    const questions = await odoo.read('accounting.question', [questionId], [
      'name',
      'description',
      'question_type',
      'state',
      'priority',
      'user_id',
      'assigned_to_id',
      'partner_id',
      'move_id',
      'document_id',
      'expense_note_id',
      'message_ids',
      'message_count',
      'has_attachment',
      'create_date',
      'resolved_date',
      'closed_date',
      'response_time_hours',
      'resolution_time_hours',
    ]);

    if (!questions || questions.length === 0) {
      return NextResponse.json(
        { error: 'Question non trouvée' },
        { status: 404 }
      );
    }

    const question = questions[0];

    // Récupération des messages si présents
    if (question.message_ids && question.message_ids.length > 0) {
      const messages = await odoo.read('accounting.message', question.message_ids, [
        'user_id',
        'author_name',
        'content',
        'attachment_ids',
        'create_date',
        'is_internal',
        'is_solution',
      ]);
      question.messages = messages;
    } else {
      question.messages = [];
    }

    return NextResponse.json({
      question,
    });

  } catch (error: any) {
    console.error('Error fetching question:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la question', details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const questionId = parseInt(params.id);
    const body = await request.json();
    const { action, ...updates } = body;

    if (isNaN(questionId)) {
      return NextResponse.json(
        { error: 'ID de question invalide' },
        { status: 400 }
      );
    }

    const odoo = await getOdooClient(request);

    // Si c'est une action (resolve, close, reopen)
    if (action) {
      let method = '';
      switch (action) {
        case 'resolve':
          method = 'action_resolve';
          break;
        case 'close':
          method = 'action_close';
          break;
        case 'reopen':
          method = 'action_reopen';
          break;
        case 'mark_answered':
          method = 'action_mark_answered';
          break;
        default:
          return NextResponse.json(
            { error: 'Action invalide' },
            { status: 400 }
          );
      }

      await odoo.call({
        model: 'accounting.question',
        method,
        args: [[questionId]],
      });

      // Récupération de la question mise à jour
      const question = await odoo.read('accounting.question', [questionId], [
        'name',
        'state',
        'resolved_date',
        'closed_date',
      ]);

      return NextResponse.json({
        success: true,
        question: question[0],
      });
    }

    // Sinon, mise à jour des champs
    if (Object.keys(updates).length > 0) {
      await odoo.write({
        model: 'accounting.question',
        ids: [questionId],
        values: updates,
      });

      return NextResponse.json({
        success: true,
      });
    }

    return NextResponse.json(
      { error: 'Aucune modification fournie' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Error updating question:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la question', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const questionId = parseInt(params.id);

    if (isNaN(questionId)) {
      return NextResponse.json(
        { error: 'ID de question invalide' },
        { status: 400 }
      );
    }

    const odoo = await getOdooClient(request);

    await odoo.unlink('accounting.question', [questionId]);

    return NextResponse.json({
      success: true,
      message: 'Question supprimée avec succès',
    });

  } catch (error: any) {
    console.error('Error deleting question:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la question', details: error.message },
      { status: 500 }
    );
  }
}
