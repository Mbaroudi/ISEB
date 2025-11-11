import { NextRequest, NextResponse } from 'next/server';
import { getOdooClient } from '@/lib/odoo/client';

/**
 * API Route: Export de données comptables
 * POST /api/accounting/export
 *
 * Génère un fichier FEC ou XIMPORT pour une période donnée
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dateFrom, dateTo, format, companyId } = body;

    if (!dateFrom || !dateTo) {
      return NextResponse.json(
        { error: 'Dates de début et de fin requises' },
        { status: 400 }
      );
    }

    if (!format || !['fec', 'ximport', 'both'].includes(format)) {
      return NextResponse.json(
        { error: 'Format invalide. Utilisez: fec, ximport ou both' },
        { status: 400 }
      );
    }

    // Récupère le client Odoo
    const odoo = getOdooClient();

    // Crée le wizard d'export
    const wizardId = await odoo.create({
      model: 'account.export.wizard',
      values: {
        date_from: dateFrom,
        date_to: dateTo,
        export_format: format,
        company_id: companyId || false,
      },
    });

    // Génère l'export
    await odoo.call({
      model: 'account.export.wizard',
      method: 'action_generate',
      args: [[wizardId]],
    });

    // Récupère les fichiers générés
    const wizard = await odoo.read('account.export.wizard', [wizardId], [
      'state',
      'fec_file',
      'fec_filename',
      'ximport_file',
      'ximport_filename',
    ]);

    const result: any = {
      success: wizard[0].state === 'done',
    };

    // Ajoute les fichiers FEC si généré
    if (wizard[0].fec_file) {
      result.fec = {
        filename: wizard[0].fec_filename,
        content: wizard[0].fec_file, // Base64
      };
    }

    // Ajoute les fichiers XIMPORT si généré
    if (wizard[0].ximport_file) {
      result.ximport = {
        filename: wizard[0].ximport_filename,
        content: wizard[0].ximport_file, // Base64
      };
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Error exporting accounting data:', error);
    return NextResponse.json(
      {
        error: 'Erreur lors de l\'export',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * API Route: Informations sur l'export
 * GET /api/accounting/export?info=true
 *
 * Retourne les informations sur les exports disponibles
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');

  if (action === 'info') {
    return NextResponse.json({
      formats: [
        {
          id: 'fec',
          name: 'FEC (Fichier des Écritures Comptables)',
          description: 'Format officiel obligatoire en France depuis 2014. Requis pour les contrôles fiscaux.',
          filename: 'SIRENFECAAAAMMJJ.txt',
          icon: '🇫🇷',
          required: true,
        },
        {
          id: 'ximport',
          name: 'XIMPORT',
          description: 'Format universel compatible avec Ciel, EBP, Sage. Idéal pour la migration.',
          filename: 'XIMPORT.TXT',
          icon: '📊',
          required: false,
        },
        {
          id: 'both',
          name: 'Les deux formats',
          description: 'Génère à la fois le FEC et le XIMPORT',
          icon: '📦',
          required: false,
        },
      ],
      notes: [
        'L\'export inclut toutes les écritures comptables validées (état "Comptabilisé")',
        'Le fichier FEC est nommé selon le format officiel : SIRENFECAAAAMMJJ.txt',
        'Les fichiers sont générés au format texte avec encodage UTF-8',
        'Vous pouvez vérifier la conformité du FEC avec l\'outil "Test Compta Demat" de la DGFIP',
      ],
    });
  }

  return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 });
}
