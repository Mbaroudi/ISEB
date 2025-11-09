import { NextRequest, NextResponse } from 'next/server';
import { getOdooClient } from '@/lib/odoo/client';

/**
 * API Route: Liste et création de questions
 * GET  /api/collaboration/questions - Liste des questions
 * POST /api/collaboration/questions - Créer une question
 */

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Paramètres de filtrage
    const state = searchParams.get('state');
    const type = searchParams.get('type');
    const assignedToMe = searchParams.get('assignedToMe') === 'true';
    const myQuestions = searchParams.get('myQuestions') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const odoo = await getOdooClient(request);

    // Construction du domaine de recherche
    const domain: any[] = [];

    if (state) {
      domain.push(['state', '=', state]);
    }

    if (type) {
      domain.push(['question_type', '=', type]);
    }

    if (assignedToMe) {
      const uid = odoo.uid;
      domain.push(['assigned_to_id', '=', uid]);
    }

    if (myQuestions) {
      const uid = odoo.uid;
      domain.push(['user_id', '=', uid]);
    }

    // Récupération des questions
    const questions = await odoo.searchRead({
      model: 'accounting.question',
      domain,
      fields: [
        'name',
        'description',
        'question_type',
        'state',
        'priority',
        'user_id',
        'assigned_to_id',
        'partner_id',
        'message_count',
        'has_attachment',
        'create_date',
        'resolved_date',
        'response_time_hours',
        'move_id',
        'document_id',
      ],
      limit,
      offset,
      order: 'priority desc, create_date desc',
    });

    // Compte total pour pagination
    const total = await odoo.searchCount({
      model: 'accounting.question',
      domain,
    });

    return NextResponse.json({
      questions,
      total,
      limit,
      offset,
    });

  } catch (error: any) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des questions', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      question_type,
      priority,
      move_id,
      document_id,
      expense_note_id,
    } = body;

    // Validation
    if (!name || !question_type) {
      return NextResponse.json(
        { error: 'Le titre et le type de question sont obligatoires' },
        { status: 400 }
      );
    }

    const odoo = await getOdooClient(request);

    // Création de la question
    const questionId = await odoo.create({
      model: 'accounting.question',
      values: {
        name,
        description: description || '',
        question_type,
        priority: priority || '1',
        move_id: move_id || false,
        document_id: document_id || false,
        expense_note_id: expense_note_id || false,
        state: 'draft',
      },
    });

    // Soumettre automatiquement
    await odoo.call({
      model: 'accounting.question',
      method: 'action_submit',
      args: [[questionId]],
    });

    // Récupération de la question créée
    const question = await odoo.read('accounting.question', [questionId], [
      'name',
      'description',
      'question_type',
      'state',
      'priority',
      'user_id',
      'assigned_to_id',
      'create_date',
    ]);

    return NextResponse.json({
      success: true,
      question: question[0],
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating question:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de la question', details: error.message },
      { status: 500 }
    );
  }
}
