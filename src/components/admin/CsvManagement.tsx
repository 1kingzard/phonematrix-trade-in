import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  getCsvUrl, setCsvUrl, getDefaultCsvUrl, getColumnMapping, setColumnMapping,
  CANONICAL_FIELDS, CanonicalField, ColumnMapping
} from '@/services/deviceDataService';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, Save, Database, RotateCcw } from 'lucide-react';

const AUTO = '__auto__';

const fetchHeaders = async (url: string): Promise<string[]> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Could not fetch CSV');
  const text = await res.text();
  const firstLine = text.split('\n')[0] || '';
  return firstLine.split(',').map(h => h.trim()).filter(Boolean);
};

const CsvManagement: React.FC = () => {
  const { toast } = useToast();
  const [url, setUrl] = useState(getCsvUrl());
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>(getColumnMapping());
  const [loading, setLoading] = useState(false);

  const loadHeaders = async (csvUrl: string) => {
    setLoading(true);
    try {
      const h = await fetchHeaders(csvUrl);
      setHeaders(h);
    } catch (e: any) {
      toast({ title: 'Failed to read CSV', description: e.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  useEffect(() => { loadHeaders(url); /* eslint-disable-next-line */ }, []);

  const saveUrl = async () => {
    setCsvUrl(url);
    await loadHeaders(url);
    window.dispatchEvent(new Event('pm-csv-config-changed'));
    toast({ title: 'CSV URL updated', description: 'Data will reload across the site.' });
  };

  const reload = () => {
    window.dispatchEvent(new Event('pm-csv-config-changed'));
    toast({ title: 'Reloading data', description: 'Fetching latest from sheet…' });
  };

  const resetUrl = () => {
    const def = getDefaultCsvUrl();
    setUrl(def);
    setCsvUrl(def);
    loadHeaders(def);
    window.dispatchEvent(new Event('pm-csv-config-changed'));
  };

  const updateMapping = (field: CanonicalField, header: string) => {
    const next = { ...mapping };
    if (header === AUTO) delete next[field];
    else next[field] = header;
    setMapping(next);
  };

  const saveMapping = () => {
    setColumnMapping(mapping);
    window.dispatchEvent(new Event('pm-csv-config-changed'));
    toast({ title: 'Column mapping saved', description: 'Data is being re-parsed.' });
  };

  const clearMapping = () => {
    setMapping({});
    setColumnMapping({});
    window.dispatchEvent(new Event('pm-csv-config-changed'));
    toast({ title: 'Mapping cleared', description: 'Using auto-detect from canonical names.' });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" /> CSV Source</CardTitle>
          <CardDescription>The Google Sheets CSV powering all device pricing.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Current CSV URL</Label>
            <div className="flex gap-2">
              <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://docs.google.com/…" />
              <Button onClick={saveUrl} disabled={loading}><Save className="h-4 w-4 mr-1" /> Save</Button>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={reload} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Reload data
            </Button>
            <Button variant="ghost" onClick={resetUrl}><RotateCcw className="h-4 w-4 mr-1" /> Reset to default</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Column Mapping</CardTitle>
          <CardDescription>
            If your CSV uses different column names, map each app field to the matching CSV header.
            Leave on "Auto-detect" to use the canonical name.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {headers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No headers detected. Check the CSV URL.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {CANONICAL_FIELDS.map(field => (
                <div key={field} className="space-y-1">
                  <Label className="text-xs">{field}</Label>
                  <Select value={mapping[field] || AUTO} onValueChange={v => updateMapping(field, v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={AUTO}>Auto-detect</SelectItem>
                      {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button onClick={saveMapping} disabled={headers.length === 0}><Save className="h-4 w-4 mr-1" /> Save mapping</Button>
            <Button variant="ghost" onClick={clearMapping}>Clear all</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CsvManagement;
