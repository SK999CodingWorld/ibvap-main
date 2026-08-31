import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Download, Camera, Car, Calendar, Activity } from 'lucide-react';

const MOCK_ANPR = [
  { id: '1', plate: 'DL 01 AB 1234', type: 'Car', camera: 'CAM-05', confidence: 98, time: '10:45:12' },
  { id: '2', plate: 'UP 32 CD 5678', type: 'Truck', camera: 'CAM-06', confidence: 95, time: '10:42:30' },
  { id: '3', plate: 'RJ 14 EF 9012', type: 'Motorcycle', camera: 'CAM-05', confidence: 88, time: '10:35:15' },
  { id: '4', plate: 'MH 12 GH 3456', type: 'Car', camera: 'CAM-06', confidence: 99, time: '10:30:05' },
  { id: '5', plate: 'KA 05 IJ 7890', type: 'Bus', camera: 'CAM-05', confidence: 92, time: '10:15:40' },
  { id: '6', plate: 'DL 03 KL 1234', type: 'Van', camera: 'CAM-06', confidence: 85, time: '10:10:20' },
  { id: '7', plate: 'HR 26 MN 5678', type: 'Car', camera: 'CAM-05', confidence: 97, time: '10:05:10' },
  { id: '8', plate: 'UP 16 OP 9012', type: 'Motorcycle', camera: 'CAM-06', confidence: 91, time: '09:55:45' },
  { id: '9', plate: 'DL 04 QR 3456', type: 'Car', camera: 'CAM-05', confidence: 96, time: '09:45:30' },
  { id: '10', plate: 'RJ 19 ST 7890', type: 'Truck', camera: 'CAM-06', confidence: 89, time: '09:30:15' },
  { id: '11', plate: 'MH 14 UV 1234', type: 'Car', camera: 'CAM-05', confidence: 94, time: '09:20:00' },
  { id: '12', plate: 'KA 03 WX 5678', type: 'Bus', camera: 'CAM-06', confidence: 98, time: '09:10:45' },
  { id: '13', plate: 'DL 02 YZ 9012', type: 'Van', camera: 'CAM-05', confidence: 90, time: '09:00:30' },
  { id: '14', plate: 'HR 29 AB 3456', type: 'Car', camera: 'CAM-06', confidence: 95, time: '08:45:15' },
  { id: '15', plate: 'UP 14 CD 7890', type: 'Motorcycle', camera: 'CAM-05', confidence: 87, time: '08:30:00' }
];

export const ANPRPage = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = MOCK_ANPR.filter(item => 
    item.plate.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">ANPR System</h1>
          <p className="text-slate-400">Automatic Number Plate Recognition</p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
            SIMULATION MODE
          </Badge>
          <Button variant="outline" className="bg-slate-900 border-slate-700 hover:bg-slate-800" onClick={() => alert('Feature available in production')}>
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Reads</CardTitle>
            <Camera className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">1,284</div>
            <p className="text-xs text-slate-500">Last 24 hours</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Unique Plates</CardTitle>
            <Car className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">856</div>
            <p className="text-xs text-slate-500">Last 24 hours</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Avg Confidence</CardTitle>
            <Activity className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">94.2%</div>
            <p className="text-xs text-slate-500">System accuracy</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Alerts Generated</CardTitle>
            <Activity className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">3</div>
            <p className="text-xs text-slate-500">Hotlist matches</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium text-white">Recent Reads</CardTitle>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search plates..."
                className="pl-9 w-[300px] bg-slate-950 border-slate-800"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead>Plate Number</TableHead>
                <TableHead>Vehicle Type</TableHead>
                <TableHead>Camera</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item) => (
                <TableRow key={item.id} className="border-slate-800 hover:bg-slate-800/50">
                  <TableCell className="font-mono text-lg font-bold text-white">{item.plate}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-slate-800 text-slate-300 border-slate-700">
                      {item.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.camera}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${item.confidence > 90 ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                          style={{ width: `${item.confidence}%` }} 
                        />
                      </div>
                      <span className="text-xs text-slate-400">{item.confidence}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-400">{item.time}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => alert(`Details for ${item.plate}`)}>View</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
