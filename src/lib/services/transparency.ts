export interface GastoHistorico {
	fecha: string;
	concepto: string;
	monto: number;
	comprobante_url: string | null;
	comprobante_label?: string;
}

export interface TransparencySummary {
	ingresos: number;
	gastos: number;
	fondo_reserva: number;
	gastos_historico: GastoHistorico[];
}

export async function getTransparencySummary(): Promise<TransparencySummary> {
	return {
		ingresos: 45000,
		gastos: 12500,
		fondo_reserva: 32500,
		gastos_historico: [
			{
				fecha: '01/05/2026',
				concepto: 'Renovación Dominio .CL',
				monto: 9990,
				comprobante_url: '#',
				comprobante_label: 'Ver Boleta',
			},
			{
				fecha: '15/04/2026',
				concepto: 'Servidor VPS (Mensual)',
				monto: 4500,
				comprobante_url: '#',
				comprobante_label: 'Ver Factura',
			},
			{
				fecha: '10/04/2026',
				concepto: 'Café para el programador ☕',
				monto: 2500,
				comprobante_url: null,
			},
		],
	};
}
