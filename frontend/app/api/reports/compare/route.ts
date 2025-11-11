import { NextRequest, NextResponse } from "next/server";
import { getOdooClient } from "@/lib/odoo/client";

/**
 * POST /api/reports/compare
 * Compare reports across different periods
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { template_id, partner_id, periods } = body;

    if (!template_id || !partner_id || !periods || !Array.isArray(periods)) {
      return NextResponse.json(
        {
          error:
            "template_id, partner_id et periods (array) sont requis",
        },
        { status: 400 }
      );
    }

    if (periods.length < 2) {
      return NextResponse.json(
        { error: "Au moins 2 périodes sont requises pour comparer" },
        { status: 400 }
      );
    }

    const odoo = getOdooClient();

    // Generate report for each period
    const comparisonData: any[] = [];

    for (const period of periods) {
      if (!period.start_date || !period.end_date) {
        continue;
      }

      // Search for report lines for this period
      const lines = await odoo.searchRead({
        model: "report.line",
        domain: [
          ["template_id", "=", parseInt(template_id)],
          ["partner_id", "=", parseInt(partner_id)],
          ["period_start", "=", period.start_date],
          ["period_end", "=", period.end_date],
        ],
        fields: ["sequence", "name", "code", "value", "period_start", "period_end"],
        order: "sequence asc",
      });

      if (lines.length === 0) {
        // Generate report if doesn't exist
        await odoo.call({
          model: "report.template",
          method: "generate_report",
          args: [[parseInt(template_id)]],
          kwargs: {
            partner_id: parseInt(partner_id),
            period_start: period.start_date,
            period_end: period.end_date,
          },
        });

        // Re-fetch lines
        const newLines = await odoo.searchRead({
          model: "report.line",
          domain: [
            ["template_id", "=", parseInt(template_id)],
            ["partner_id", "=", parseInt(partner_id)],
            ["period_start", "=", period.start_date],
            ["period_end", "=", period.end_date],
          ],
          fields: ["sequence", "name", "code", "value", "period_start", "period_end"],
          order: "sequence asc",
        });

        comparisonData.push({
          period: {
            start: period.start_date,
            end: period.end_date,
            label: period.label || `${period.start_date} - ${period.end_date}`,
          },
          lines: newLines,
        });
      } else {
        comparisonData.push({
          period: {
            start: period.start_date,
            end: period.end_date,
            label: period.label || `${period.start_date} - ${period.end_date}`,
          },
          lines,
        });
      }
    }

    // Calculate variations between periods
    const variations: any[] = [];

    if (comparisonData.length >= 2) {
      const firstPeriod = comparisonData[0];
      const lastPeriod = comparisonData[comparisonData.length - 1];

      firstPeriod.lines.forEach((line: any, index: number) => {
        const correspondingLine = lastPeriod.lines[index];
        if (correspondingLine && correspondingLine.code === line.code) {
          const firstValue = parseFloat(line.value) || 0;
          const lastValue = parseFloat(correspondingLine.value) || 0;
          const variation = lastValue - firstValue;
          const variationPercent =
            firstValue !== 0 ? (variation / Math.abs(firstValue)) * 100 : 0;

          variations.push({
            code: line.code,
            name: line.name,
            first_value: firstValue,
            last_value: lastValue,
            variation,
            variation_percent: variationPercent,
          });
        }
      });
    }

    return NextResponse.json({
      success: true,
      comparison: comparisonData,
      variations,
      periods_count: comparisonData.length,
    });
  } catch (error: any) {
    console.error("Error comparing reports:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la comparaison des rapports",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
