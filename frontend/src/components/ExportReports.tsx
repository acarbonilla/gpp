import React, { useState } from 'react';
import { DocumentArrowDownIcon, TableCellsIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

interface ExportReportsProps {
  visitors: any[];
  stats: any;
}

const ExportReports: React.FC<ExportReportsProps> = ({ visitors, stats }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<'pdf' | 'excel' | null>(null);

  const exportToCSV = () => {
    setIsExporting(true);
    
    // Prepare CSV data
    const headers = [
      'Visitor Name',
      'Employee Name',
      'Purpose',
      'Scheduled Time',
      'Check-in Time',
      'Check-out Time',
      'Status',
      'Notes'
    ];

    const csvData = visitors.map(visitor => [
      visitor.visitor_name || '',
      visitor.employee_name || '',
      visitor.purpose || '',
      new Date(visitor.scheduled_time).toLocaleString(),
      visitor.check_in_time ? new Date(visitor.check_in_time).toLocaleString() : '',
      visitor.check_out_time ? new Date(visitor.check_out_time).toLocaleString() : '',
      visitor.is_checked_in && !visitor.is_checked_out ? 'Checked In' :
      visitor.is_checked_out ? 'Checked Out' :
      visitor.status === 'no_show' ? 'No Show' : 'Pending',
      visitor.notes || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `visitor_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setIsExporting(false);
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    setExportType('pdf');

    try {
      // Create a simple HTML report
      const reportHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Visitor Report - ${new Date().toLocaleDateString()}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .stats { display: flex; justify-content: space-around; margin-bottom: 30px; }
            .stat { text-align: center; }
            .stat-number { font-size: 24px; font-weight: bold; color: #2563eb; }
            .stat-label { color: #6b7280; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
            th { background-color: #f3f4f6; font-weight: bold; }
            .status-checked-in { color: #059669; }
            .status-checked-out { color: #6b7280; }
            .status-no-show { color: #d97706; }
            .status-pending { color: #d97706; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Visitor Management Report</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
          </div>
          
          <div class="stats">
            <div class="stat">
              <div class="stat-number">${stats.totalVisitors}</div>
              <div class="stat-label">Total Visitors</div>
            </div>
            <div class="stat">
              <div class="stat-number">${stats.checkedInVisitors}</div>
              <div class="stat-label">Checked In</div>
            </div>
            <div class="stat">
              <div class="stat-number">${stats.pendingCheckIns}</div>
              <div class="stat-label">Pending</div>
            </div>
            <div class="stat">
              <div class="stat-number">${stats.noShowVisitors}</div>
              <div class="stat-label">No Show</div>
            </div>
          </div>

          <h2>Visitor Details</h2>
          <table>
            <thead>
              <tr>
                <th>Visitor Name</th>
                <th>Employee</th>
                <th>Scheduled Time</th>
                <th>Check-in Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${visitors.map(visitor => `
                <tr>
                  <td>${visitor.visitor_name || ''}</td>
                  <td>${visitor.employee_name || ''}</td>
                  <td>${new Date(visitor.scheduled_time).toLocaleString()}</td>
                  <td>${visitor.check_in_time ? new Date(visitor.check_in_time).toLocaleString() : '-'}</td>
                  <td class="status-${visitor.is_checked_in && !visitor.is_checked_out ? 'checked-in' : 
                                      visitor.is_checked_out ? 'checked-out' : 
                                      visitor.status === 'no_show' ? 'no-show' : 'pending'}">
                    ${visitor.is_checked_in && !visitor.is_checked_out ? 'Checked In' :
                      visitor.is_checked_out ? 'Checked Out' :
                      visitor.status === 'no_show' ? 'No Show' : 'Pending'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;

      // Use browser's print functionality to save as PDF
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(reportHTML);
        printWindow.document.close();
        printWindow.print();
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF report');
    }

    setIsExporting(false);
    setExportType(null);
  };

  return (
    <div className="relative">
      <div className="flex items-center space-x-2">
        <button
          onClick={exportToCSV}
          disabled={isExporting}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <TableCellsIcon className="h-4 w-4 mr-2" />
          {isExporting && exportType === 'excel' ? 'Exporting...' : 'Export CSV'}
        </button>
        
        <button
          onClick={exportToPDF}
          disabled={isExporting}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <DocumentTextIcon className="h-4 w-4 mr-2" />
          {isExporting && exportType === 'pdf' ? 'Generating...' : 'Export PDF'}
        </button>
      </div>
    </div>
  );
};

export default ExportReports; 