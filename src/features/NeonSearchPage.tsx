import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Loader2, Search, User, CreditCard, Calendar, Database, Wifi, WifiOff } from 'lucide-react';
import { searchClaimant, testConnection, ClaimantData } from '@/api/neon';

export default function NeonSearchPage(): React.ReactElement {
  const [claimantNumber, setClaimantNumber] = useState('');
  const [data, setData] = useState<ClaimantData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  // Test connection on component mount
  React.useEffect(() => {
    const checkConnection = async () => {
      try {
        const isConnected = await testConnection();
        setConnectionStatus(isConnected ? 'connected' : 'disconnected');
      } catch (err) {
        setConnectionStatus('disconnected');
      }
    };
    
    checkConnection();
  }, []);

  const fetchData = async () => {
    if (!claimantNumber.trim()) {
      setError('Please enter a claimant number');
      return;
    }

    setIsLoading(true);
    setError(null);
    setData([]);

    try {
      console.log(`🔍 Searching for claimant: ${claimantNumber}`);
      const result = await searchClaimant(claimantNumber);
      setData(result);
      
      if (result.length === 0) {
        setError('No claimant found with this number');
      } else {
        console.log(`✅ Found ${result.length} records for claimant ${claimantNumber}`);
      }
    } catch (err) {
      console.error('❌ Error fetching claimant data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch claimant data. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      fetchData();
    }
  };

  // Group data by claimant (in case there are multiple claimants with same number)
  const groupedData = data.reduce((acc, item) => {
    const key = item.claimant_number;
    if (!acc[key]) {
      acc[key] = {
        claimant: item,
        payments: []
      };
    }
    acc[key].payments.push(item);
    return acc;
  }, {} as Record<string, { claimant: ClaimantData; payments: ClaimantData[] }>);

  const claimantGroups = Object.values(groupedData);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Search className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">NEON Claimant Search</h1>
            <p className="text-muted-foreground">Search for claimant payment information</p>
          </div>
        </div>
        
        {/* Connection Status */}
        <div className="flex items-center gap-2">
          {connectionStatus === 'checking' && (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Checking connection...</span>
            </>
          )}
          {connectionStatus === 'connected' && (
            <>
              <Wifi className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-600">Connected to database</span>
            </>
          )}
          {connectionStatus === 'disconnected' && (
            <>
              <WifiOff className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-600">Database disconnected</span>
            </>
          )}
        </div>
      </div>

      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Search Claimant
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Input
              placeholder="Enter Claimant Number"
              value={claimantNumber}
              onChange={(e) => setClaimantNumber(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
              disabled={isLoading}
            />
            <Button 
              onClick={fetchData} 
              disabled={isLoading || !claimantNumber.trim()}
              className="min-w-[120px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </>
              )}
            </Button>
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {claimantGroups.length > 0 && (
        <div className="space-y-6">
          {claimantGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="space-y-4">
              {/* Claimant Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Claimant Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Number</label>
                      <p className="text-sm font-mono">{group.claimant.claimant_number}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Name</label>
                      <p className="text-sm">{group.claimant.claimant_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Type</label>
                      <p className="text-sm">{group.claimant.claimant_type}</p>
                    </div>
                    <div className="md:col-span-2 lg:col-span-3">
                      <label className="text-sm font-medium text-muted-foreground">Address</label>
                      <p className="text-sm">{group.claimant.claimant_address}</p>
                    </div>
                    {group.claimant.claimant_phone && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Phone</label>
                        <p className="text-sm">{group.claimant.claimant_phone}</p>
                      </div>
                    )}
                    {group.claimant.claim_received && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Claim Received</label>
                        <p className="text-sm">{group.claimant.claim_received}</p>
                      </div>
                    )}
                    {group.claimant.claim_admitted && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Claim Admitted</label>
                        <p className="text-sm">{group.claimant.claim_admitted}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Payment Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Details ({group.payments.length} transactions)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Sr No</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Bank From</TableHead>
                          <TableHead>Bank To</TableHead>
                          <TableHead>Account</TableHead>
                          <TableHead className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Date
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.payments.map((payment, paymentIndex) => (
                          <TableRow key={paymentIndex}>
                            <TableCell className="font-mono text-sm">
                              {payment.payment_sr_no}
                            </TableCell>
                            <TableCell className="font-medium">
                              ₹{payment.payment_amount}
                            </TableCell>
                            <TableCell>{payment.bank_from}</TableCell>
                            <TableCell>{payment.bank_to}</TableCell>
                            <TableCell className="font-mono text-sm">
                              {payment.account_number}
                            </TableCell>
                            <TableCell className="text-sm">
                              {new Date(payment.date_transfer).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && data.length === 0 && !error && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Search Results</h3>
            <p className="text-muted-foreground text-center">
              Enter a claimant number above to search for payment information.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
