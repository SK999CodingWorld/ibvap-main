// Simplified table for now
export const Table = ({ children }: any) => <table className="w-full text-sm text-left text-slate-300">{children}</table>;
export const TableHeader = ({ children }: any) => <thead className="text-xs uppercase bg-slate-800 text-slate-400">{children}</thead>;
export const TableBody = ({ children }: any) => <tbody>{children}</tbody>;
export const TableRow = ({ children }: any) => <tr className="border-b border-slate-800 hover:bg-slate-800/50">{children}</tr>;
export const TableHead = ({ children }: any) => <th className="px-4 py-3">{children}</th>;
export const TableCell = ({ children }: any) => <td className="px-4 py-3">{children}</td>;
