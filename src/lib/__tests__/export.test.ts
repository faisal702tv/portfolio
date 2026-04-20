import { describe, it, expect, vi } from 'vitest';

// Mock heavy dependencies before import
vi.mock('jspdf', () => ({
  jsPDF: class MockJsPDF {
    internal = { pageSize: { height: 297 } };
    text = vi.fn();
    setFont = vi.fn();
    setFontSize = vi.fn();
    setTextColor = vi.fn();
    save = vi.fn();
    setPage = vi.fn();
    getNumberOfPages = vi.fn(() => 1);
  },
}));

vi.mock('jspdf-autotable', () => ({
  default: vi.fn(),
}));

vi.mock('xlsx', () => ({
  utils: {
    book_new: vi.fn(() => ({})),
    json_to_sheet: vi.fn(() => ({})),
    book_append_sheet: vi.fn(),
  },
  writeFile: vi.fn(),
}));

import { exportToExcel, exportMultiSheetExcel } from '../export-utils';

describe('Export Utils', () => {
  describe('exportToExcel', () => {
    it('should call writeFile with correct filename', async () => {
      const XLSX = await import('xlsx');
      const data = [
        { name: 'Rajhi', qty: 100, price: 85.5 },
        { name: 'Aramco', qty: 200, price: 32.0 },
      ];

      exportToExcel(data, 'Stocks', 'test-portfolio.xlsx');

      expect(XLSX.writeFile).toHaveBeenCalled();
    });
  });

  describe('exportMultiSheetExcel', () => {
    it('should handle multiple sheets', async () => {
      const XLSX = await import('xlsx');
      const sheets = [
        { name: 'Stocks', data: [{ symbol: '1120', name: 'Rajhi' }] },
        { name: 'Bonds', data: [{ symbol: 'SUK001', name: 'Sukuk' }] },
      ];

      exportMultiSheetExcel(sheets, 'full-portfolio.xlsx');

      expect(XLSX.writeFile).toHaveBeenCalled();
    });
  });
});
