'use client';

import { useState } from 'react';
import { 
  Search, 
  Eye, 
  Mail, 
  Phone, 
  Building2, 
  FileText, 
  Globe, 
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  X
} from 'lucide-react';
import Dropdown from '@/components/UI/Dropdown';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/UI/Table';

interface VendorEnquiry {
  id: string;
  name: string;
  companyName: string;
  gstNumber: string;
  email: string;
  phone: string;
  website: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

// Mock data - replace with actual API call
const mockEnquiries: VendorEnquiry[] = [
  {
    id: '1',
    name: 'John Doe',
    companyName: 'ABC Textiles Pvt Ltd',
    gstNumber: '29ABCDE1234F1Z5',
    email: 'john@abctextiles.com',
    phone: '+91 98765 43210',
    website: 'https://www.abctextiles.com',
    submittedAt: '2024-02-10T10:30:00',
    status: 'pending'
  },
  {
    id: '2',
    name: 'Jane Smith',
    companyName: 'XYZ Fabrics Ltd',
    gstNumber: '27XYZAB5678G2H6',
    email: 'jane@xyzfabrics.com',
    phone: '+91 87654 32109',
    website: 'https://www.xyzfabrics.com',
    submittedAt: '2024-02-09T14:20:00',
    status: 'approved'
  },
  {
    id: '3',
    name: 'Robert Johnson',
    companyName: 'Premium Textiles Inc',
    gstNumber: '19PQRST9012K3L4',
    email: 'robert@premiumtextiles.com',
    phone: '+91 76543 21098',
    website: '',
    submittedAt: '2024-02-08T09:15:00',
    status: 'rejected'
  }
];

const EnquiryForm = () => {
  const [enquiries, setEnquiries] = useState<VendorEnquiry[]>(mockEnquiries);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedEnquiry, setSelectedEnquiry] = useState<VendorEnquiry | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredEnquiries = enquiries.filter(enquiry => {
    const matchesSearch = 
      enquiry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enquiry.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enquiry.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enquiry.gstNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || enquiry.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleViewDetails = (enquiry: VendorEnquiry) => {
    setSelectedEnquiry(enquiry);
    setShowDetailModal(true);
  };

  const handleStatusChange = (id: string, newStatus: 'approved' | 'rejected') => {
    setEnquiries(prev => 
      prev.map(enq => 
        enq.id === id ? { ...enq, status: newStatus } : enq
      )
    );
    setShowDetailModal(false);
  };

  const stats = {
    total: enquiries.length,
    pending: enquiries.filter(e => e.status === 'pending').length,
    approved: enquiries.filter(e => e.status === 'approved').length,
    rejected: enquiries.filter(e => e.status === 'rejected').length
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Vendor Enquiry Forms</h1>
        <p className="text-gray-600">Manage vendor applications submitted through the website</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Enquiries</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <FileText className="w-6 h-6 text-gray-700" />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Pending</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Approved</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.approved}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Rejected</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{stats.rejected}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, company, email, or GST number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-48">
            <Dropdown
              value={statusFilter}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'pending', label: 'Pending' },
                { value: 'approved', label: 'Approved' },
                { value: 'rejected', label: 'Rejected' }
              ]}
              onChange={(value) => setStatusFilter(value as any)}
              placeholder="Filter by status"
            />
          </div>
        </div>
      </div>

      {/* Enquiries Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendor Details</TableHead>
              <TableHead>Company Info</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEnquiries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                  No enquiries found
                </TableCell>
              </TableRow>
            ) : (
              filteredEnquiries.map((enquiry) => (
                <TableRow key={enquiry.id}>
                  <TableCell>
                    <div className="font-medium text-gray-900">{enquiry.name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">{enquiry.companyName}</div>
                      <div className="text-gray-500 text-xs mt-1">GST: {enquiry.gstNumber}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="flex items-center gap-1 text-gray-700">
                        <Mail className="w-3 h-3" />
                        <span className="text-xs">{enquiry.email}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-700 mt-1">
                        <Phone className="w-3 h-3" />
                        <span className="text-xs">{enquiry.phone}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-600">
                      {formatDate(enquiry.submittedAt)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(enquiry.status)}
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => handleViewDetails(enquiry)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedEnquiry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Vendor Enquiry Details</h2>
                <p className="text-sm text-gray-600 mt-1">Review and manage vendor application</p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="space-y-6">
                {/* Status */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Current Status</label>
                  {getStatusBadge(selectedEnquiry.status)}
                </div>

                {/* Personal Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                    <div className="text-gray-900">{selectedEnquiry.name}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Company Name</label>
                    <div className="flex items-center gap-2 text-gray-900">
                      <Building2 className="w-4 h-4 text-gray-500" />
                      {selectedEnquiry.companyName}
                    </div>
                  </div>
                </div>

                {/* GST and Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">GST Number</label>
                    <div className="flex items-center gap-2 text-gray-900">
                      <FileText className="w-4 h-4 text-gray-500" />
                      {selectedEnquiry.gstNumber}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                    <div className="flex items-center gap-2 text-gray-900">
                      <Mail className="w-4 h-4 text-gray-500" />
                      {selectedEnquiry.email}
                    </div>
                  </div>
                </div>

                {/* Phone and Website */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                    <div className="flex items-center gap-2 text-gray-900">
                      <Phone className="w-4 h-4 text-gray-500" />
                      {selectedEnquiry.phone}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Website</label>
                    {selectedEnquiry.website ? (
                      <a 
                        href={selectedEnquiry.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                      >
                        <Globe className="w-4 h-4" />
                        {selectedEnquiry.website}
                      </a>
                    ) : (
                      <div className="text-gray-500">Not provided</div>
                    )}
                  </div>
                </div>

                {/* Submission Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Submitted On</label>
                  <div className="flex items-center gap-2 text-gray-900">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    {formatDate(selectedEnquiry.submittedAt)}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Close
              </button>
              {selectedEnquiry.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleStatusChange(selectedEnquiry.id, 'rejected')}
                    className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedEnquiry.id, 'approved')}
                    className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnquiryForm;
