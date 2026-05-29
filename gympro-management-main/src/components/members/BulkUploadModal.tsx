import React, { useState, useCallback } from 'react';
import { Member, UserRole } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertTriangle,
  X,
  FileSpreadsheet
} from 'lucide-react';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMembersUploaded: (members: Member[]) => void;
}

interface ParsedMember {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth: string;
  address?: string;
  weight?: number;
  weightUnit?: 'kg' | 'lbs';
  height?: number;
  heightUnit?: 'cm' | 'ft';
  membershipType: 'Gym' | 'Gym + Cardio' | 'Gym + Cardio + Crossfit';
  medicalConditions?: string;
  fitnessGoals?: string;
  notes?: string;
  isValid: boolean;
  errors: string[];
}

const BulkUploadModal: React.FC<BulkUploadModalProps> = ({ isOpen, onClose, onMembersUploaded }) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parsedMembers, setParsedMembers] = useState<ParsedMember[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const sampleData = [
    ['John', 'Doe', 'john.doe@email.com', '+1-555-0101', '1990-05-15', '123 Main St', '75', 'kg', '180', 'cm', 'Gym + Cardio', 'None', 'Weight Loss, Muscle Building', 'New member'],
    ['Sarah', 'Smith', 'sarah.smith@email.com', '+1-555-0102', '1985-08-22', '456 Oak Ave', '140', 'lbs', '5.6', 'ft', 'Gym', 'Knee Injury (Previous)', 'General Fitness', 'Returning member']
  ];

  const headers = [
    'First Name', 'Last Name', 'Email', 'Phone', 'Date of Birth', 'Address',
    'Weight', 'Weight Unit', 'Height', 'Height Unit', 'Membership Type',
    'Medical Conditions', 'Fitness Goals', 'Notes'
  ];

  const downloadSampleCSV = () => {
    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'gym_members_sample.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const downloadSampleExcel = () => {
    // For demo purposes, we'll create a simple CSV with .xlsx extension
    // In a real implementation, you'd use a library like xlsx or exceljs
    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'gym_members_sample.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const validateMemberData = (data: string[]): { member: ParsedMember; isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Required fields validation
    if (!data[0] || !data[0].trim()) errors.push('First Name is required');
    if (!data[1] || !data[1].trim()) errors.push('Last Name is required');
    if (!data[2] || !data[2].trim()) errors.push('Email is required');

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (data[2] && !emailRegex.test(data[2])) {
      errors.push('Invalid email format');
    }

    // Date validation
    if (data[4] && isNaN(Date.parse(data[4]))) {
      errors.push('Invalid date format for Date of Birth');
    }

    // Membership type validation
    const validMembershipTypes = ['Gym', 'Gym + Cardio', 'Gym + Cardio + Crossfit'];
    if (data[10] && !validMembershipTypes.includes(data[10])) {
      errors.push('Invalid membership type');
    }

    // Weight unit validation
    if (data[7] && !['kg', 'lbs'].includes(data[7].toLowerCase())) {
      errors.push('Weight unit must be kg or lbs');
    }

    // Height unit validation
    if (data[9] && !['cm', 'ft'].includes(data[9].toLowerCase())) {
      errors.push('Height unit must be cm or ft');
    }

    const member: ParsedMember = {
      firstName: data[0]?.trim() || '',
      lastName: data[1]?.trim() || '',
      email: data[2]?.trim() || '',
      phone: data[3]?.trim() || undefined,
      dateOfBirth: data[4]?.trim() || '',
      address: data[5]?.trim() || undefined,
      weight: data[6] ? parseFloat(data[6]) : undefined,
      weightUnit: (data[7]?.toLowerCase() as 'kg' | 'lbs') || 'kg',
      height: data[8] ? parseFloat(data[8]) : undefined,
      heightUnit: (data[9]?.toLowerCase() as 'cm' | 'ft') || 'cm',
      membershipType: (data[10] as 'Gym' | 'Gym + Cardio' | 'Gym + Cardio + Crossfit') || 'Gym',
      medicalConditions: data[11]?.trim() || undefined,
      fitnessGoals: data[12]?.trim() || undefined,
      notes: data[13]?.trim() || undefined,
      isValid: errors.length === 0,
      errors
    };

    return { member, isValid: errors.length === 0, errors };
  };

  const parseCSV = (text: string): ParsedMember[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const members: ParsedMember[] = [];

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      // Simple CSV parsing (handles quoted fields)
      const fields: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          fields.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      fields.push(current); // Add the last field

      const { member } = validateMemberData(fields);
      members.push(member);
    }

    return members;
  };

  const handleFile = useCallback((selectedFile: File) => {
    if (!selectedFile) return;

    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.csv') && !selectedFile.name.endsWith('.xlsx')) {
      setErrors(['Please upload a CSV or Excel file']);
      return;
    }

    setFile(selectedFile);
    setErrors([]);
    setUploading(true);
    setUploadProgress(0);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;

        // Simulate progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 100);

        setTimeout(() => {
          const parsed = parseCSV(text);
          setParsedMembers(parsed);
          setUploadProgress(100);
          setUploading(false);
          setShowPreview(true);
          clearInterval(progressInterval);
        }, 1000);

      } catch (error) {
        setErrors(['Error parsing file. Please check the format and try again.']);
        setUploading(false);
        setUploadProgress(0);
      }
    };

    reader.readAsText(selectedFile);
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const processImport = () => {
    const validMembers = parsedMembers.filter(m => m.isValid);

    const members: Member[] = validMembers.map((parsedMember, index) => ({
      id: `bulk_${Date.now()}_${index}`,
      email: parsedMember.email,
      firstName: parsedMember.firstName,
      lastName: parsedMember.lastName,
      phone: parsedMember.phone || '',
      dateOfBirth: new Date(parsedMember.dateOfBirth),
      address: parsedMember.address || '',
      weight: parsedMember.weight || 0,
      weightUnit: parsedMember.weightUnit || 'kg',
      height: parsedMember.height || 0,
      heightUnit: parsedMember.heightUnit || 'cm',
      emergencyContact: {
        name: '',
        phone: '',
        relationship: ''
      },
      membershipType: parsedMember.membershipType,
      membershipStartDate: new Date(),
      membershipEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      isActive: true,
      role: UserRole.MEMBER,
      createdAt: new Date(),
      updatedAt: new Date(),
      fitnessGoals: parsedMember.fitnessGoals ? parsedMember.fitnessGoals.split(',').map(g => g.trim()) : [],
      medicalConditions: parsedMember.medicalConditions ? parsedMember.medicalConditions.split(',').map(c => c.trim()) : [],
      notes: parsedMember.notes
    }));

    onMembersUploaded(members);
    handleClose();
  };

  const handleClose = () => {
    setFile(null);
    setParsedMembers([]);
    setShowPreview(false);
    setUploading(false);
    setUploadProgress(0);
    setErrors([]);
    setDragActive(false);
    onClose();
  };

  const validMembers = parsedMembers.filter(m => m.isValid);
  const invalidMembers = parsedMembers.filter(m => !m.isValid);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Upload className="h-6 w-6 text-[#00bc7d]" />
            Bulk Upload Members
          </DialogTitle>
          <DialogDescription>
            Upload multiple members at once using CSV or Excel files
          </DialogDescription>
        </DialogHeader>

        {!showPreview ? (
          <div className="space-y-6">
            {/* Sample Format Download */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Download Sample Format</h3>
              <div className="flex space-x-4">
                <Button variant="outline" onClick={downloadSampleCSV} className="border-gray-200 hover:border-[#00bc7d] hover:text-[#00bc7d]">
                  <FileText className="h-4 w-4 mr-2" />
                  Download CSV Sample
                </Button>
                <Button variant="outline" onClick={downloadSampleExcel} className="border-gray-200 hover:border-[#00bc7d] hover:text-[#00bc7d]">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Download Excel Sample
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Download a sample file to see the required format and column headers
              </p>
            </div>

            {/* File Upload Area */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Upload File</h3>

              {errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {errors.map((error, index) => (
                      <div key={index}>{error}</div>
                    ))}
                  </AlertDescription>
                </Alert>
              )}

              <div
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${dragActive
                    ? 'border-[#00bc7d] bg-[#00bc7d]/5 scale-[1.02]'
                    : 'border-gray-200 hover:border-[#00bc7d]/50 hover:bg-gray-50'
                  }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="w-16 h-16 bg-[#00bc7d]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="h-8 w-8 text-[#00bc7d]" />
                </div>
                <div className="space-y-2">
                  <p className="text-xl font-semibold text-gray-900">
                    {dragActive ? 'Drop your file here' : 'Drag and drop your file here'}
                  </p>
                  <p className="text-sm text-gray-500">
                    or click to browse files
                  </p>
                  <Input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileInput}
                    className="hidden"
                    id="file-upload"
                  />
                  <Label htmlFor="file-upload" className="cursor-pointer inline-block mt-2">
                    <div className="inline-flex h-10 items-center justify-center rounded-xl bg-[#00bc7d] px-8 text-sm font-medium text-white transition-colors hover:bg-[#00bc7d]/90 shadow-lg shadow-[#00bc7d]/20">
                      Choose File
                    </div>
                  </Label>
                </div>
                <p className="text-xs text-gray-400 mt-6">
                  Supported formats: CSV, Excel (.xlsx, .xls)
                </p>
              </div>

              {file && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-[#00bc7d]">Selected file: {file.name}</p>
                  {uploading && (
                    <div className="space-y-2">
                      <Progress value={uploadProgress} className="w-full h-2 bg-gray-100" />
                      <p className="text-sm text-muted-foreground">
                        Processing file... {uploadProgress}%
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="space-y-3 bg-gray-50 p-5 rounded-xl border border-gray-100">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-[#00bc7d]" />
                File Requirements
              </h4>
              <ul className="text-sm text-gray-600 space-y-1.5 ml-1">
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#00bc7d]"></div> First row should contain column headers</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#00bc7d]"></div> Required columns: First Name, Last Name, Email</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#00bc7d]"></div> Date format: YYYY-MM-DD (e.g., 1990-05-15)</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#00bc7d]"></div> Membership types: Gym, Gym + Cardio, Gym + Cardio + Crossfit</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#00bc7d]"></div> Weight units: kg or lbs</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#00bc7d]"></div> Height units: cm or ft</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Import Preview</h3>
              <Button variant="outline" onClick={() => setShowPreview(false)} className="border-gray-200 hover:bg-gray-50">
                <X className="h-4 w-4 mr-2" />
                Back to Upload
              </Button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="border-0 shadow-lg shadow-gray-100/50">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-[#00bc7d]/10 rounded-xl">
                      <CheckCircle className="h-6 w-6 text-[#00bc7d]" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-[#00bc7d]">{validMembers.length}</p>
                      <p className="text-sm text-muted-foreground font-medium">Valid Records</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg shadow-gray-100/50">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-red-50 rounded-xl">
                      <AlertTriangle className="h-6 w-6 text-red-500" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-red-500">{invalidMembers.length}</p>
                      <p className="text-sm text-muted-foreground font-medium">Invalid Records</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg shadow-gray-100/50">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-cyan-50 rounded-xl">
                      <FileText className="h-6 w-6 text-cyan-600" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-cyan-600">{parsedMembers.length}</p>
                      <p className="text-sm text-muted-foreground font-medium">Total Records</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Preview Table */}
            <div className="space-y-4">
              <h4 className="font-medium">Preview Data</h4>
              <div className="max-h-96 overflow-y-auto border border-gray-100 rounded-xl shadow-sm">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Membership</TableHead>
                      <TableHead>Errors</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedMembers.map((member, index) => (
                      <TableRow key={index} className="hover:bg-gray-50/50">
                        <TableCell>
                          {member.isValid ? (
                            <Badge className="bg-[#00bc7d]/10 text-[#00bc7d] hover:bg-[#00bc7d]/20 border-0">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Valid
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="bg-red-50 text-red-600 hover:bg-red-100 border-red-100 shadow-none">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Invalid
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{member.firstName} {member.lastName}</TableCell>
                        <TableCell className="text-gray-500">{member.email}</TableCell>
                        <TableCell>{member.membershipType}</TableCell>
                        <TableCell>
                          {member.errors.length > 0 && (
                            <div className="text-sm text-red-500 font-medium">
                              {member.errors.join(', ')}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
              <Button variant="outline" onClick={handleClose} className="rounded-xl h-11 border-gray-200">
                Cancel
              </Button>
              <Button
                onClick={processImport}
                disabled={validMembers.length === 0}
                className="bg-[#00bc7d] hover:bg-[#00bc7d]/90 text-white rounded-xl h-11 px-8 shadow-lg shadow-[#00bc7d]/20"
              >
                Import {validMembers.length} Valid Members
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BulkUploadModal;
