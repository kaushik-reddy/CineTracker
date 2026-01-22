import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { FileText, Download, Loader2, Calendar, DollarSign } from "lucide-react";

export default function InvoicesList({ userEmail = null }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvoices();
  }, [userEmail]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const user = userEmail || (await base44.auth.me()).email;
      
      const allInvoices = await base44.entities.Invoice.filter({ 
        user_email: user 
      });
      
      setInvoices(allInvoices.sort((a, b) => 
        new Date(b.created_date) - new Date(a.created_date)
      ));
    } catch (error) {
      console.error('Failed to load invoices:', error);
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (invoice) => {
    if (invoice.pdf_url) {
      window.open(invoice.pdf_url, '_blank');
    } else {
      toast.error('Invoice PDF not available');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardContent className="p-12 text-center">
          <FileText className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-400">No invoices yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-zinc-900/80 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-400" />
          Invoices
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {invoices.map((invoice) => (
            <div 
              key={invoice.id}
              className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg border border-zinc-700 hover:border-purple-500/50 transition-all"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-white font-semibold">
                    {invoice.invoice_number}
                  </span>
                  <Badge className={
                    invoice.status === 'paid' 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-amber-500 text-black'
                  }>
                    {invoice.status}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-sm text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(invoice.created_date).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    {invoice.currency.toUpperCase()} {(invoice.amount / 100).toFixed(2)}
                  </span>
                </div>
              </div>

              <Button
                size="sm"
                onClick={() => handleDownload(invoice)}
                disabled={!invoice.pdf_url}
                className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/50"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}