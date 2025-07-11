import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { 
  DocumentArrowDownIcon,
  CalendarIcon,
  ChartBarIcon,
  FunnelIcon,
  DocumentTextIcon,
  TableCellsIcon,
  DocumentChartBarIcon,
  ClockIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import axiosInstance from '../api/axiosInstance';

interface ReportData {
  totalVisitors: number;
  checkedInVisitors: number;
  checkedOutVisitors: number;
  noShowVisitors: number;
  pendingVisitors: number;
  averageCheckInTime: string;
  peakHours: string;
  topEmployees: Array<{name: string, visitors: number}>;
  topPurposes: Array<{purpose: string, count: number}>;
  visitors: any[];
}

const Reports: React.FC = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportType, setReportType] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [filters, setFilters] = useState({
    status: 'all',
    employee: 'all',
    visitType: 'all'
  });
  const [downloading, setDownloading] = useState<string | null>(null);

  // Get auth token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem('accessToken');
  };

  // Set default date range based on report type
  useEffect(() => {
    const now = new Date();
    let startDate = new Date();
    
    switch (reportType) {
      case 'weekly':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'yearly':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    setDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0]
    });
  }, [reportType]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = getAuthToken();
      if (!token) {
        setError('No authentication token found. Please login.');
        return;
      }

      const response = await axiosInstance.get('/api/generate-reports/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        params: {
          start_date: dateRange.startDate,
          end_date: dateRange.endDate,
          status: filters.status,
          employee: filters.employee,
          visit_type: filters.visitType
        }
      });

      setReportData(response.data);
    } catch (err: any) {
      console.error('Error fetching report data:', err);
      setError(err.response?.data?.error || 'Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async (format: 'csv' | 'pdf' | 'excel') => {
    try {
      setDownloading(format);
      setError(null);
      
      // Check if we have report data first
      if (!reportData || !reportData.visitors) {
        setError('Please generate a report first before downloading.');
        return;
      }

      if (format === 'csv') {
        // Generate CSV client-side using report data
        const headers = [
          'Visitor Name',
          'Employee Name',
          'Scheduled Time',
          'Status',
          'Check-in Time',
          'Check-out Time',
          'Purpose',
          'Visit Type'
        ];

        const csvData = reportData.visitors.map((visitor: any) => [
          visitor.visitor_name || 'Unknown',
          visitor.employee_name || 'Unknown',
          new Date(visitor.scheduled_time).toLocaleString(),
          visitor.status || 'Unknown',
          visitor.check_in_time ? new Date(visitor.check_in_time).toLocaleString() : '',
          visitor.check_out_time ? new Date(visitor.check_out_time).toLocaleString() : '',
          visitor.purpose || '',
          visitor.visit_type || ''
        ]);

        const csvContent = [
          headers.join(','),
          ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = window.URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `visitor_report_${reportType}_${dateRange.startDate}_to_${dateRange.endDate}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

      } else if (format === 'pdf') {
        // Generate PDF using jsPDF
        const doc = new jsPDF();
        
        // Add title
        const title = getReportTitle();
        doc.setFontSize(18);
        doc.text(title, 14, 22);
        
        // Add summary stats
        doc.setFontSize(12);
        doc.text(`Report Summary`, 14, 35);
        doc.setFontSize(10);
        doc.text(`Total Visitors: ${reportData.totalVisitors}`, 14, 45);
        doc.text(`Checked In: ${reportData.checkedInVisitors}`, 14, 52);
        doc.text(`Checked Out: ${reportData.checkedOutVisitors}`, 14, 59);
        doc.text(`No Show: ${reportData.noShowVisitors}`, 14, 66);
        doc.text(`Pending: ${reportData.pendingVisitors}`, 14, 73);
        
        // Add table headers
        const headers = [
          'Visitor Name',
          'Employee',
          'Scheduled Time',
          'Status',
          'Check-in Time',
          'Check-out Time',
          'Purpose'
        ];

        // Prepare table data
        const tableData = reportData.visitors.map((visitor: any) => [
          visitor.visitor_name || 'Unknown',
          visitor.employee_name || 'Unknown',
          new Date(visitor.scheduled_time).toLocaleDateString(),
          visitor.status || 'Unknown',
          visitor.check_in_time ? new Date(visitor.check_in_time).toLocaleDateString() : '',
          visitor.check_out_time ? new Date(visitor.check_out_time).toLocaleDateString() : '',
          visitor.purpose || ''
        ]);

        // Add table to PDF (only if there are visitors)
        if (tableData.length > 0) {
          autoTable(doc, {
            head: [headers],
            body: tableData,
            startY: 85,
            styles: {
              fontSize: 8,
              cellPadding: 2
            },
            headStyles: {
              fillColor: [66, 139, 202],
              textColor: 255
            },
            alternateRowStyles: {
              fillColor: [245, 245, 245]
            }
          });
        } else {
          // Add message if no visitors
          doc.setFontSize(10);
          doc.text('No visitors found for the selected date range.', 14, 85);
        }

        // Save the PDF
        doc.save(`visitor_report_${reportType}_${dateRange.startDate}_to_${dateRange.endDate}.pdf`);

      } else if (format === 'excel') {
        // Generate Excel using XLSX library
        const workbook = XLSX.utils.book_new();
        
        // Create summary sheet
        const summaryData = [
          ['Report Summary'],
          [''],
          ['Total Visitors', reportData.totalVisitors],
          ['Checked In', reportData.checkedInVisitors],
          ['Checked Out', reportData.checkedOutVisitors],
          ['No Show', reportData.noShowVisitors],
          ['Pending', reportData.pendingVisitors],
          [''],
          ['Performance Metrics'],
          [''],
          ['Average Check-in Time', reportData.averageCheckInTime],
          ['Peak Hours', reportData.peakHours],
          [''],
          ['Top Hosting Employees'],
          ['Name', 'Visitors']
        ];
        
        // Add top employees data
        reportData.topEmployees.forEach(employee => {
          summaryData.push([employee.name, employee.visitors]);
        });
        
        summaryData.push(['']);
        summaryData.push(['Top Visit Purposes']);
        summaryData.push(['Purpose', 'Count']);
        
        // Add top purposes data
        reportData.topPurposes.forEach(purpose => {
          summaryData.push([purpose.purpose, purpose.count]);
        });
        
        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
        
        // Create detailed visitors sheet
        const visitorHeaders = [
          'Visitor Name',
          'Employee Name',
          'Scheduled Time',
          'Status',
          'Check-in Time',
          'Check-out Time',
          'Purpose',
          'Visit Type'
        ];
        
        const visitorData = reportData.visitors.map((visitor: any) => [
          visitor.visitor_name || 'Unknown',
          visitor.employee_name || 'Unknown',
          new Date(visitor.scheduled_time).toLocaleString(),
          visitor.status || 'Unknown',
          visitor.check_in_time ? new Date(visitor.check_in_time).toLocaleString() : '',
          visitor.check_out_time ? new Date(visitor.check_out_time).toLocaleString() : '',
          visitor.purpose || '',
          visitor.visit_type || ''
        ]);
        
        const visitorsSheet = XLSX.utils.aoa_to_sheet([visitorHeaders, ...visitorData]);
        XLSX.utils.book_append_sheet(workbook, visitorsSheet, 'Visitors');
        
        // Generate and download Excel file
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `visitor_report_${reportType}_${dateRange.startDate}_to_${dateRange.endDate}.xlsx`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }

    } catch (err: any) {
      console.error('Error downloading report:', err);
      setError('Failed to generate report file');
    } finally {
      setDownloading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getReportTitle = () => {
    const start = formatDate(dateRange.startDate);
    const end = formatDate(dateRange.endDate);
    return `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report (${start} - ${end})`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reports & Files</h1>
              <p className="mt-2 text-gray-600">Generate comprehensive visitor reports for management</p>
            </div>
            <div className="flex items-center space-x-2">
              <DocumentArrowDownIcon className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Report Configuration */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Report Configuration</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Report Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Type
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as 'weekly' | 'monthly' | 'yearly')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="weekly">Weekly Report</option>
                <option value="monthly">Monthly Report</option>
                <option value="yearly">Yearly Report</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Generate Button */}
            <div className="flex items-end">
              <button
                onClick={fetchReportData}
                disabled={loading}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Generating...' : 'Generate Report'}
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="border-t pt-4">
            <h3 className="text-md font-medium text-gray-900 mb-3 flex items-center">
              <FunnelIcon className="h-4 w-4 mr-2" />
              Filters
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="approved">Approved</option>
                  <option value="checked_in">Checked In</option>
                  <option value="checked_out">Checked Out</option>
                  <option value="no_show">No Show</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                <select
                  value={filters.employee}
                  onChange={(e) => setFilters(prev => ({ ...prev, employee: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Employees</option>
                  {/* This would be populated from API */}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Visit Type</label>
                <select
                  value={filters.visitType}
                  onChange={(e) => setFilters(prev => ({ ...prev, visitType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="walkin">Walk-In</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Report Data */}
        {reportData ? (
          <div className="space-y-6">
            {/* Report Header */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">{getReportTitle()}</h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => downloadReport('csv')}
                    disabled={downloading === 'csv'}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <TableCellsIcon className="h-4 w-4 mr-2" />
                    {downloading === 'csv' ? 'Downloading...' : 'CSV'}
                  </button>
                  <button
                    onClick={() => downloadReport('excel')}
                    disabled={downloading === 'excel'}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <DocumentChartBarIcon className="h-4 w-4 mr-2" />
                    {downloading === 'excel' ? 'Downloading...' : 'Excel'}
                  </button>
                  <button
                    onClick={() => downloadReport('pdf')}
                    disabled={downloading === 'pdf'}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <DocumentTextIcon className="h-4 w-4 mr-2" />
                    {downloading === 'pdf' ? 'Downloading...' : 'PDF'}
                  </button>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-900">{reportData.totalVisitors}</div>
                  <div className="text-sm text-blue-700">Total Visitors</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-900">{reportData.checkedInVisitors}</div>
                  <div className="text-sm text-green-700">Checked In</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">{reportData.checkedOutVisitors}</div>
                  <div className="text-sm text-gray-700">Checked Out</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-orange-900">{reportData.noShowVisitors}</div>
                  <div className="text-sm text-orange-700">No Show</div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-900">{reportData.pendingVisitors}</div>
                  <div className="text-sm text-yellow-700">Pending</div>
                </div>
              </div>

              {/* Additional Insights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                    <ClockIcon className="h-4 w-4 mr-2" />
                    Performance Metrics
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Average Check-in Time:</span>
                      <span className="font-medium">{reportData.averageCheckInTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Peak Hours:</span>
                      <span className="font-medium">{reportData.peakHours}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                    <UserGroupIcon className="h-4 w-4 mr-2" />
                    Top Hosting Employees
                  </h3>
                  <div className="space-y-2">
                    {reportData.topEmployees.map((employee, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600">{employee.name}</span>
                        <span className="font-medium">{employee.visitors} visitors</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Visitor List */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Detailed Visitor List</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Visitor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Scheduled Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Check-in Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Check-out Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.visitors.slice(0, 10).map((visitor: any) => (
                      <tr key={visitor.visit_id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {visitor.visitor_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {visitor.employee_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(visitor.scheduled_time).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            visitor.status === 'approved' ? 'bg-green-100 text-green-800' :
                            visitor.status === 'checked_in' ? 'bg-blue-100 text-blue-800' :
                            visitor.status === 'checked_out' ? 'bg-gray-100 text-gray-800' :
                            visitor.status === 'no_show' ? 'bg-orange-100 text-orange-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {visitor.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {visitor.check_in_time ? new Date(visitor.check_in_time).toLocaleString() : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {visitor.check_out_time ? new Date(visitor.check_out_time).toLocaleString() : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="max-w-md mx-auto">
              <DocumentChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Report Generated</h3>
              <p className="text-gray-600 mb-4">
                Configure your report parameters above and click "Generate Report" to view your data.
              </p>
              <button
                onClick={fetchReportData}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Generating...' : 'Generate Report'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports; 