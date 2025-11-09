import { NextRequest, NextResponse } from 'next/server';
import { getOdooClient } from '@/lib/odoo/client';

/**
 * API Route: Import de données comptables
 * POST /api/accounting/import
 *
 * Importe un fichier FEC, XIMPORT ou CSV dans Odoo
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const format = formData.get('format') as string || 'auto';
    const validateBeforeImport = formData.get('validateBeforeImport') === 'true';
    const autoCreateAccounts = formData.get('autoCreateAccounts') === 'true';
    const autoCreatePartners = formData.get('autoCreatePartners') === 'true';

    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      );
    }

    // Convertit le fichier en base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileData = buffer.toString('base64');

    // Récupère le client Odoo depuis les cookies
    const odoo = await getOdooClient(request);

    // Crée le wizard d'import
    const wizardId = await odoo.create({
      model: 'account.import.wizard',
      values: {
        file_data: fileData,
        file_name: file.name,
        file_format: format,
        validate_before_import: validateBeforeImport,
        auto_create_accounts: autoCreateAccounts,
        auto_create_partners: autoCreatePartners,
      },
    });

    // Si validation demandée, valide d'abord
    if (validateBeforeImport) {
      await odoo.call({
        model: 'account.import.wizard',
        method: 'action_validate',
        args: [[wizardId]],
      });

      // Récupère le résultat de la validation
      const wizard = await odoo.read('account.import.wizard', [wizardId], [
        'state',
        'result_message',
        'success_count',
        'error_count',
      ]);

      if (wizard[0].state === 'error' || wizard[0].error_count > 0) {
        return NextResponse.json({
          success: false,
          validated: true,
          message: wizard[0].result_message,
          successCount: wizard[0].success_count,
          errorCount: wizard[0].error_count,
        });
      }
    }

    // Import
    await odoo.call({
      model: 'account.import.wizard',
      method: 'action_import',
      args: [[wizardId]],
    });

    // Récupère le résultat
    const wizard = await odoo.read('account.import.wizard', [wizardId], [
      'state',
      'result_message',
      'success_count',
      'error_count',
    ]);

    return NextResponse.json({
      success: wizard[0].state === 'imported',
      message: wizard[0].result_message,
      successCount: wizard[0].success_count,
      errorCount: wizard[0].error_count,
    });

  } catch (error: any) {
    console.error('Error importing accounting data:', error);
    return NextResponse.json(
      {
        error: 'Erreur lors de l\'import',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * API Route: Validation de fichier comptable
 * POST /api/accounting/import?validate=true
 *
 * Valide un fichier sans l'importer
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');

  if (action === 'formats') {
    // Retourne les formats supportés
    return NextResponse.json({
      formats: [
        {
          id: 'fec',
          name: 'FEC (Fichier des Écritures Comptables)',
          description: 'Format officiel obligatoire en France depuis 2014',
          extensions: ['.txt'],
          icon: '🇫🇷',
        },
        {
          id: 'ximport',
          name: 'XIMPORT (Ciel/EBP/Sage)',
          description: 'Format universel compatible avec Ciel, EBP, Sage',
          extensions: ['.txt'],
          icon: '📊',
        },
        {
          id: 'csv',
          name: 'CSV',
          description: 'Format tableur universel',
          extensions: ['.csv'],
          icon: '📄',
        },
      ],
    });
  }

  return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 });
}
