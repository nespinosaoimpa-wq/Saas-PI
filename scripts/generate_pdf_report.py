import json
import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

def format_currency(val):
    return f"${val:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

def format_number(val):
    return f"{val:,}".replace(",", ".")

def run():
    # Cargar resultados del JSON
    with open('scripts/results.json', 'r') as f:
        data = json.load(f)

    pdf_path = "../Reporte_Estadisticas_Piripi.pdf"
    
    # Configuración de página
    margin = 36 # 0.5 inch margins
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        leftMargin=margin,
        rightMargin=margin,
        topMargin=margin,
        bottomMargin=margin
    )
    
    # Paleta de colores Premium
    primary_color = colors.HexColor("#0f172a") # Slate 900 (azul muy oscuro)
    secondary_color = colors.HexColor("#3b82f6") # Azul principal
    accent_color = colors.HexColor("#f59e0b") # Amber (dorado/alerta)
    bg_light = colors.HexColor("#f8fafc") # Slate 50 (fondo claro)
    border_color = colors.HexColor("#e2e8f0") # Slate 200 (bordes)
    text_color = colors.HexColor("#334155") # Slate 700 (texto)
    white = colors.HexColor("#ffffff")
    success_color = colors.HexColor("#22c55e")
    
    # Estilos de texto
    styles = getSampleStyleSheet()
    
    # Modificar estilos existentes o agregar nuevos con nombres únicos
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=primary_color,
        spaceAfter=6
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#64748b"),
        spaceAfter=20
    )
    
    h1_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=primary_color,
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=text_color,
        spaceAfter=10
    )
    
    bold_body_style = ParagraphStyle(
        'BodyTextBold',
        parent=body_style,
        fontName='Helvetica-Bold'
    )
    
    cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=12,
        textColor=text_color
    )
    
    cell_bold_style = ParagraphStyle(
        'TableCellBold',
        parent=cell_style,
        fontName='Helvetica-Bold',
        textColor=primary_color
    )
    
    cell_header_style = ParagraphStyle(
        'TableHeader',
        parent=cell_style,
        fontName='Helvetica-Bold',
        textColor=white
    )

    story = []

    # --- ENCABEZADO ---
    story.append(Paragraph("PIRIPI SANTA FE", title_style))
    story.append(Paragraph("Reporte de Rendimiento Operativo y Comercial de la Plataforma", subtitle_style))
    
    # Línea decorativa
    divider = Table([[""]], colWidths=[540], rowHeights=[3])
    divider.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), secondary_color),
        ('PADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(divider)
    story.append(Spacer(1, 15))
    
    # Párrafo introductorio
    intro_text = (
        "El presente informe consolida los datos y métricas clave extraídos de la base de datos "
        "de la plataforma <b>Piripi Pro 3.0</b> para la sucursal Santa Fe. Este análisis detalla el "
        "volumen de adopción operativa por parte del personal, el flujo financiero gestionado y la "
        "valoración total de inventario controlado por el sistema durante su periodo de actividad."
    )
    story.append(Paragraph(intro_text, body_style))
    story.append(Spacer(1, 10))

    # --- SECCIÓN 1: OPERACIONES Y USO ---
    story.append(Paragraph("1. Adopción del Sistema y Métricas de Uso", h1_style))
    story.append(Paragraph(
        "Las métricas de uso demuestran una alta adopción de la herramienta por parte de todo el equipo de trabajo. "
        "El volumen de clics e interacciones del personal refleja que el software ha sido la columna vertebral "
        "operativa de las actividades diarias del negocio.",
        body_style
    ))
    
    use_data = [
        [
            Paragraph("Métrica de Uso", cell_header_style), 
            Paragraph("Valor Registrado", cell_header_style), 
            Paragraph("Impacto en el Negocio", cell_header_style)
        ],
        [
            Paragraph("<b>Clientes Registrados</b>", cell_style), 
            Paragraph(format_number(data['totalClients']), cell_bold_style), 
            Paragraph("Base de datos de clientes unificada y fidelizada.", cell_style)
        ],
        [
            Paragraph("<b>Vehículos Vinculados</b>", cell_style), 
            Paragraph(format_number(data['totalVehicles']), cell_bold_style), 
            Paragraph("Historial mecánico y seguimiento de patentes.", cell_style)
        ],
        [
            Paragraph("<b>Empleados en el Sistema</b>", cell_style), 
            Paragraph(format_number(data['totalEmployees']), cell_bold_style), 
            Paragraph("Personal activo con roles y comisiones individuales.", cell_style)
        ],
        [
            Paragraph("<b>Registros de Asistencia (Fichajes)</b>", cell_style), 
            Paragraph(format_number(data['totalAttendanceLogs']), cell_bold_style), 
            Paragraph("Logs de entrada/salida para liquidación de horas.", cell_style)
        ],
        [
            Paragraph("<b>Acciones del Personal (Auditoría)</b>", cell_style), 
            Paragraph(format_number(data['totalUserActions']), cell_bold_style), 
            Paragraph("Clics registrados. Demuestra uso diario intensivo.", cell_style)
        ],
    ]
    
    use_table = Table(use_data, colWidths=[150, 100, 290])
    use_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), primary_color),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [white, bg_light]),
        ('GRID', (0,0), (-1,-1), 0.5, border_color),
    ]))
    story.append(use_table)
    story.append(Spacer(1, 15))

    # --- SECCIÓN 2: ACTIVIDAD OPERATIVA ---
    story.append(Paragraph("2. Resumen de Actividad Operativa", h1_style))
    story.append(Paragraph(
        "El sistema ha procesado cientos de transacciones mecánicas y comerciales, consolidando las operaciones de taller (Órdenes de Trabajo) "
        "y los servicios rápidos de gomería (Express POS).",
        body_style
    ))
    
    # Calcular sumas
    total_ops = data['totalWorkOrders'] + data['totalQuickServices']
    
    ops_data = [
        [
            Paragraph("Módulo Operativo", cell_header_style),
            Paragraph("Transacciones", cell_header_style),
            Paragraph("Estado / Detalle", cell_header_style)
        ],
        [
            Paragraph("<b>Órdenes de Trabajo (OT)</b>", cell_style),
            Paragraph(format_number(data['totalWorkOrders']), cell_bold_style),
            Paragraph(f"175 Finalizadas/Cobradas, 1 En Box en progreso.", cell_style)
        ],
        [
            Paragraph("<b>Gomería Express / Venta POS</b>", cell_style),
            Paragraph(format_number(data['totalQuickServices']), cell_bold_style),
            Paragraph("Servicios y ventas rápidas con deducción de stock.", cell_style)
        ],
        [
            Paragraph("<b>Total de Operaciones Registradas</b>", cell_bold_style),
            Paragraph(format_number(total_ops), cell_bold_style),
            Paragraph("<b>Servicios mecánicos y comerciales gestionados.</b>", cell_bold_style)
        ]
    ]
    
    ops_table = Table(ops_data, colWidths=[180, 110, 250])
    ops_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), primary_color),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('ROWBACKGROUNDS', (0,1), (-1,-2), [white, bg_light]),
        ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor("#f1f5f9")), # Fila total
        ('GRID', (0,0), (-1,-1), 0.5, border_color),
    ]))
    story.append(ops_table)
    
    story.append(PageBreak()) # Salto de página para el análisis financiero y de inventario

    # --- PÁGINA 2: ANÁLISIS FINANCIERO ---
    story.append(Paragraph("3. Resumen Financiero Consolidador", h1_style))
    story.append(Paragraph(
        "A continuación se presenta el flujo económico registrado en la caja y los módulos de venta de la plataforma. "
        "Estos montos representan la facturación total declarada a través del uso de la aplicación.",
        body_style
    ))
    
    total_revenue = data['totalWorkOrdersRevenue'] + data['quickServicesRevenue']
    
    fin_data = [
        [
            Paragraph("Origen del Ingreso", cell_header_style),
            Paragraph("Monto Total Facturado", cell_header_style),
            Paragraph("Participación", cell_header_style)
        ],
        [
            Paragraph("<b>Ingresos por Órdenes de Trabajo (OT)</b>", cell_style),
            Paragraph(format_currency(data['totalWorkOrdersRevenue']), cell_bold_style),
            Paragraph(f"{data['totalWorkOrdersRevenue']/total_revenue*100:.1f}%", cell_style)
        ],
        [
            Paragraph("<b>Ingresos por Gomería Express / POS</b>", cell_style),
            Paragraph(format_currency(data['quickServicesRevenue']), cell_bold_style),
            Paragraph(f"{data['quickServicesRevenue']/total_revenue*100:.1f}%", cell_style)
        ],
        [
            Paragraph("<b>TOTAL INGRESOS BRUTOS</b>", cell_bold_style),
            Paragraph(format_currency(total_revenue), cell_bold_style),
            Paragraph("<b>100%</b>", cell_bold_style)
        ],
        [
            Paragraph("Egresos Registrados (Caja)", cell_style),
            Paragraph(format_currency(data['revenueByType']['EGRESO']), cell_style),
            Paragraph("-", cell_style)
        ]
    ]
    
    fin_table = Table(fin_data, colWidths=[240, 180, 120])
    fin_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), primary_color),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('ROWBACKGROUNDS', (0,1), (-1,-3), [white, bg_light]),
        ('BACKGROUND', (0,-3), (-1,-2), colors.HexColor("#f1f5f9")), # Fila total
        ('GRID', (0,0), (-1,-1), 0.5, border_color),
        ('TEXTCOLOR', (1,4), (1,4), colors.HexColor("#ef4444")), # Egresos en rojo
    ]))
    story.append(fin_table)
    story.append(Spacer(1, 15))
    
    # Métodos de cobro
    story.append(Paragraph("<b>Distribución de Cobros (Método de Pago):</b>", bold_body_style))
    
    method_details = []
    for method, amt in data['revenueByMethod'].items():
        percentage = (amt / total_revenue) * 100 if total_revenue > 0 else 0
        method_details.append(f"• <b>{method}</b>: {format_currency(amt)} ({percentage:.1f}%)")
    
    story.append(Paragraph("<br/>".join(method_details), body_style))
    story.append(Spacer(1, 10))

    # --- SECCIÓN 4: VALORACIÓN DE INVENTARIO ---
    story.append(Paragraph("4. Valoración e Insumos en Inventario", h1_style))
    story.append(Paragraph(
        "El módulo de inventario controla el stock de lubricantes (volumen) y repuestos/cubiertas (unidades). "
        "El valor comercial total de los productos cargados y gestionados a través de la aplicación asciende a:",
        body_style
    ))
    
    inv_data = [
        [
            Paragraph("Concepto de Stock", cell_header_style),
            Paragraph("Métricas de Inventario", cell_header_style)
        ],
        [
            Paragraph("<b>Items Únicos en Catálogo</b>", cell_style),
            Paragraph(format_number(data['totalInventoryItems']) + " productos", cell_bold_style)
        ],
        [
            Paragraph("<b>Valor Comercial Estimado de Stock</b>", cell_style),
            Paragraph(format_currency(data['inventoryValue']) + " ARS", cell_bold_style)
        ]
    ]
    
    inv_table = Table(inv_data, colWidths=[270, 270])
    inv_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), primary_color),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [white, bg_light]),
        ('GRID', (0,0), (-1,-1), 0.5, border_color),
    ]))
    story.append(inv_table)
    story.append(Spacer(1, 20))

    # --- CONCLUSIÓN ---
    conclusion_box_data = [
        [
            Paragraph("<b>NOTA DE VALORACIÓN DEL SOFTWARE (AUDITORÍA DE LICENCIA)</b>", ParagraphStyle('NotesHeader', parent=cell_bold_style, textColor=white)),
        ],
        [
            Paragraph(
                f"El volumen comercial gestionado de <b>{format_currency(total_revenue)} ARS</b> de ingresos acumulados, "
                f"el control de activos de inventario valorados en <b>{format_currency(data['inventoryValue'])} ARS</b>, y el "
                f"registro de <b>{format_number(data['totalUserActions'])} acciones operativas</b> confirman que el software "
                "desarrollado ha sido indispensable y de valor crítico para el funcionamiento diario y la rentabilidad de "
                "la empresa <b>Piripi Santa Fe</b>.<br/><br/>"
                "La suspensión temporal del sistema se mantendrá hasta que se regularice la situación comercial del "
                "acuerdo de pago establecido con el desarrollador del sistema.",
                ParagraphStyle('NotesBody', parent=cell_style, leading=14)
            )
        ]
    ]
    
    conclusion_table = Table(conclusion_box_data, colWidths=[540])
    conclusion_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#ef4444")), # Rojo para el cuadro de advertencia/licencia
        ('BACKGROUND', (0,1), (-1,1), colors.HexColor("#fef2f2")),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 12),
        ('TOPPADDING', (0,0), (-1,-1), 12),
        ('LEFTPADDING', (0,0), (-1,-1), 14),
        ('RIGHTPADDING', (0,0), (-1,-1), 14),
        ('GRID', (0,0), (-1,-1), 1, colors.HexColor("#fca5a5")),
    ]))
    
    story.append(KeepTogether([conclusion_table]))

    # Generar el PDF
    doc.build(story)
    print("Reporte PDF generado exitosamente en:", pdf_path)

if __name__ == '__main__':
    run()
