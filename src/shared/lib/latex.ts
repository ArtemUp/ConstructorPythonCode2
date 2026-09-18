const LATEX_COMMANDS = [
  'log', 'ln', 'lg', 'sin', 'cos', 'tan', 'cot', 'sec', 'csc',
  'lim', 'sum', 'int', 'frac', 'sqrt', 'cdot', 'times', 'div',
  'pm', 'mp', 'le', 'ge', 'ne', 'neq', 'approx', 'infty', 'to',
  'Rightarrow', 'Leftarrow', 'Leftrightarrow', 'rightarrow', 'leftarrow',
  'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta',
  'theta', 'iota', 'kappa', 'lambda', 'mu', 'nu', 'xi', 'pi',
  'rho', 'sigma', 'tau', 'upsilon', 'phi', 'chi', 'psi', 'omega',
  'left', 'right', 'text', 'mathbb', 'mathcal', 'mathrm', 'operatorname',
];

// Добавляем слэши к известным LaTeX-командам, если их нет
export function normalizeLatex(input: string): string {
  let s = input;
  LATEX_COMMANDS.forEach(cmd => {
    const re = new RegExp(`(^|[^\\\\a-zA-Z])${cmd}(?![a-zA-Z])`, 'g');
    s = s.replace(re, `$1\\${cmd}`);
  });
  return s;
}

// Приводим строку к "чистому LaTeX": убираем $ и лишние \\\\
export function cleanLatex(input: string): string {
  let s = input;
  s = s.replace(/\$/g, '');           // убираем все $ (и одинарные, и двойные)
  s = s.replace(/\\\\\\\\/g, '\\\\'); // \\\\ → \\
  return normalizeLatex(s);
}