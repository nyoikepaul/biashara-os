const PAYE_BANDS = [
  { max: 24000, rate: 0.10 }, { max: 32333, rate: 0.25 },
  { max: 500000, rate: 0.30 }, { max: 800000, rate: 0.325 }, { max: Infinity, rate: 0.35 }
];
const PERSONAL_RELIEF = 2400;
function calculatePAYE(taxable) {
  let tax = 0, prev = 0;
  for (const band of PAYE_BANDS) {
    if (taxable <= prev) break;
    tax += (Math.min(taxable, band.max) - prev) * band.rate;
    prev = band.max;
    if (taxable <= band.max) break;
  }
  return parseFloat(Math.max(0, tax - PERSONAL_RELIEF).toFixed(2));
}
function calculateNHIF(gross) { return parseFloat((gross * 0.0275).toFixed(2)); }
function calculateNSSF(gross) {
  const tier1 = 7000 * 0.06;
  const tier2 = Math.max(0, Math.min(gross, 36000) - 7000) * 0.06;
  return parseFloat((tier1 + tier2).toFixed(2));
}
function calculatePayslip(employee) {
  const { basicSalary, allowances = {} } = employee;
  const totalAllowances = Object.values(allowances).reduce((s, v) => s + (Number(v) || 0), 0);
  const grossSalary = basicSalary + totalAllowances;
  const nssf = calculateNSSF(grossSalary);
  const nhif = calculateNHIF(grossSalary);
  const commuterExempt = Math.min(allowances.commuter || 0, 5000);
  const taxable = grossSalary - nssf - commuterExempt;
  const paye = calculatePAYE(taxable);
  const netSalary = parseFloat((grossSalary - paye - nhif - nssf).toFixed(2));
  return { basicSalary, allowances: totalAllowances, grossSalary: parseFloat(grossSalary.toFixed(2)), paye, nhif, nssf, otherDeductions: 0, netSalary };
}
function generateP9(payslips, employee) {
  const totals = payslips.reduce((a, p) => ({ grossSalary: a.grossSalary+p.grossSalary, paye: a.paye+p.paye, nhif: a.nhif+p.nhif, nssf: a.nssf+p.nssf, netSalary: a.netSalary+p.netSalary }), { grossSalary:0, paye:0, nhif:0, nssf:0, netSalary:0 });
  return { employeeName: employee.name, kraPin: employee.kraPin, months: payslips.length, ...totals, personalRelief: PERSONAL_RELIEF * payslips.length };
}
module.exports = { calculatePayslip, calculatePAYE, calculateNHIF, calculateNSSF, generateP9 };
