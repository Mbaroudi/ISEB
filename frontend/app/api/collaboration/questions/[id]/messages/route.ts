import { NextRequest, NextResponse } from 'next/server';
import { getOdooClient } from '@/lib/odoo/client';

/**
 * API Route: Messages d'une question
 * GET  /api/collaboration/questions/[id]/messages - Liste messages
 * POST /api/collaboration/questions/[id]/messages - Poster message
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

    const odoo = getOdooClient();

    // Récupération des messages de la question
    const messages = await odoo.searchRead({
      model: 'accounting.message',
      domain: [['question_id', '=', questionId]],
      fields: [
        'user_id',
        'author_name',
        'content',
        'attachment_ids',
        'create_date',
        'is_internal',
        'is_solution',
      ],
      order: 'create_date asc',
    });

    return NextResponse.json({
      messages,
    });

  } catch (error: any) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des messages', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const questionId = parseInt(params.id);
    const body = await request.json();
    const { content, is_internal, attachments } = body;

    if (isNaN(questionId)) {
      return NextResponse.json(
        { error: 'ID de question invalide' },
        { status: 400 }
      );
    }

    if (!content || content.trim() === '') {
      return NextResponse.json(
        { error: 'Le message ne peut pas être vide' },
        { status: 400 }
      );
    }

    const odoo = getOdooClient();

    // Création du message
    const values: any = {
      question_id: questionId,
      content,
      is_internal: is_internal || false,
    };

    // Gestion des pièces jointes (si fournies)
    if (attachments && attachments.length > 0) {
      // Les attachments devraient être des IDs d'attachments déjà créés
      // ou créés via une route séparée
      values.attachment_ids = [[6, 0, attachments]];
    }

    const messageId = await odoo.create({
      model: 'accounting.message',
      values,
    });

    // Récupération du message créé
    const message = await odoo.read('accounting.message', [messageId], [
      'user_id',
      'author_name',
      'content',
      'attachment_ids',
      'create_date',
      'is_internal',
      'is_solution',
    ]);

    return NextResponse.json({
      success: true,
      message: message[0],
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating message:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du message', details: error.message },
      { status: 500 }
    );
  }
}
