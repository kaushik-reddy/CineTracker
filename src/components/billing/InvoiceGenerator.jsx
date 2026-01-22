import { base44 } from "@/api/base44Client";
import jsPDF from 'jspdf';

export async function generateInvoicePDF(invoiceData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header with Logo placeholder
  doc.setFontSize(26);
  doc.setTextColor(139, 92, 246);
  doc.text('🎬 CineTracker', 20, 25);
  
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Your Personal Media Tracker', 20, 32);
  doc.text('By Kaushik', 20, 38);
  
  // Invoice Title
  doc.setFontSize(22);
  doc.setTextColor(0, 0, 0);
  doc.text('INVOICE', pageWidth - 65, 25);
  
  // Invoice Details - Right side
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(`Invoice #: ${invoiceData.invoice_number}`, pageWidth - 65, 35);
  doc.text(`Invoice Date: ${new Date(invoiceData.created_date || Date.now()).toLocaleDateString()}`, pageWidth - 65, 42);
  doc.setTextColor(16, 185, 129);
  doc.setFont(undefined, 'bold');
  doc.text(`Status: ${invoiceData.status.toUpperCase()}`, pageWidth - 65, 49);
  doc.setFont(undefined, 'normal');
  
  // Line separator
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 55, pageWidth - 20, 55);
  
  // Bill To Section
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, 'bold');
  doc.text('Bill To:', 20, 65);
  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  doc.text(invoiceData.user_name || 'Customer', 20, 73);
  doc.text(invoiceData.user_email, 20, 80);
  
  // Subscription Details (right side)
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, 'bold');
  doc.text('Subscription Details:', pageWidth - 95, 65);
  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  doc.text(`Plan: ${invoiceData.plan_name || 'N/A'}`, pageWidth - 95, 73);
  doc.text(`Billing: ${invoiceData.billing_period || 'N/A'}`, pageWidth - 95, 80);
  doc.text(`Method: ${invoiceData.payment_method || 'Manual'}`, pageWidth - 95, 87);
  if (invoiceData.transaction_id) {
    doc.setFontSize(9);
    doc.text(`Ref: ${invoiceData.transaction_id}`, pageWidth - 95, 94);
  }
  
  // Items Table Header
  const tableTop = 100;
  doc.setFillColor(139, 92, 246); // Purple background
  doc.rect(20, tableTop, pageWidth - 40, 10, 'F');
  
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('Description', 25, tableTop + 7);
  doc.text('Qty', pageWidth - 90, tableTop + 7);
  doc.text('Unit Price', pageWidth - 70, tableTop + 7);
  doc.text('Total', pageWidth - 40, tableTop + 7);
  
  // Items
  let yPos = tableTop + 20;
  doc.setTextColor(0, 0, 0);
  
  if (invoiceData.items && invoiceData.items.length > 0) {
    invoiceData.items.forEach((item, index) => {
      if (yPos > 250) { // New page if needed
        doc.addPage();
        yPos = 30;
      }
      
      doc.setFontSize(10);
      doc.text(item.description || 'Item', 25, yPos);
      doc.text((item.quantity || 1).toString(), pageWidth - 90, yPos);
      doc.text(`${invoiceData.currency.toUpperCase()} ${((item.unit_price || 0) / 100).toFixed(2)}`, pageWidth - 70, yPos);
      doc.text(`${invoiceData.currency.toUpperCase()} ${((item.total || 0) / 100).toFixed(2)}`, pageWidth - 40, yPos);
      
      yPos += 10;
    });
  } else {
    // Default item if none provided
    doc.text(invoiceData.description || 'Subscription Payment', 25, yPos);
    doc.text('1', pageWidth - 90, yPos);
    doc.text(`${invoiceData.currency.toUpperCase()} ${(invoiceData.amount / 100).toFixed(2)}`, pageWidth - 70, yPos);
    doc.text(`${invoiceData.currency.toUpperCase()} ${(invoiceData.amount / 100).toFixed(2)}`, pageWidth - 40, yPos);
    yPos += 10;
  }
  
  // Separator before totals
  yPos += 5;
  doc.setDrawColor(200, 200, 200);
  doc.line(20, yPos, pageWidth - 20, yPos);
  yPos += 10;
  
  // Subtotal
  const subtotal = invoiceData.amount - (invoiceData.tax || 0);
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text('Subtotal:', pageWidth - 80, yPos);
  doc.text(`${invoiceData.currency.toUpperCase()} ${(subtotal / 100).toFixed(2)}`, pageWidth - 40, yPos);
  yPos += 10;
  
  // Tax
  if (invoiceData.tax && invoiceData.tax > 0) {
    doc.text('Tax:', pageWidth - 80, yPos);
    doc.text(`${invoiceData.currency.toUpperCase()} ${(invoiceData.tax / 100).toFixed(2)}`, pageWidth - 40, yPos);
    yPos += 10;
  }
  
  // Total
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, 'bold');
  doc.text('Total:', pageWidth - 80, yPos);
  doc.text(`${invoiceData.currency.toUpperCase()} ${(invoiceData.amount / 100).toFixed(2)}`, pageWidth - 40, yPos);
  
  // Legal Footer
  const footerY = doc.internal.pageSize.getHeight() - 40;
  doc.setDrawColor(200, 200, 200);
  doc.line(20, footerY - 5, pageWidth - 20, footerY - 5);
  
  doc.setFontSize(8);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Thank you for your business!', pageWidth / 2, footerY, { align: 'center' });
  doc.setTextColor(120, 120, 120);
  doc.text('CineTracker - Premium Media Tracking Platform', pageWidth / 2, footerY + 6, { align: 'center' });
  doc.text('For support, contact: support@cinetracker.com', pageWidth / 2, footerY + 12, { align: 'center' });
  doc.text('Terms: https://cinetracker.com/terms | Privacy: https://cinetracker.com/privacy', pageWidth / 2, footerY + 18, { align: 'center' });
  
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(7);
  doc.text(`© ${new Date().getFullYear()} CineTracker. All rights reserved.`, pageWidth / 2, footerY + 26, { align: 'center' });
  
  // Convert to blob
  const pdfBlob = doc.output('blob');
  return pdfBlob;
}

export async function createAndSendInvoice(subscriptionData, planData, paymentData = null) {
  try {
    console.log('Creating invoice for:', subscriptionData.user_email);
    
    // Fetch the target user's details
    const allUsers = await base44.entities.User.list();
    const targetUser = allUsers.find(u => u.email === subscriptionData.user_email);
    
    if (!targetUser) {
      throw new Error(`User not found: ${subscriptionData.user_email}`);
    }
    
    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    // Determine if trial
    const isTrial = planData.is_trial || subscriptionData.status === 'trial';
    
    // Calculate amounts (trial = 0)
    const amount = isTrial ? 0 : (planData.price || 0);
    const tax = amount > 0 ? Math.round(amount * 0.18) : 0; // 18% tax example
    const totalAmount = amount + tax;
    
    // Prepare invoice items
    const items = [{
      description: `${planData.name} - ${planData.billing_cycle} subscription${isTrial ? ' (Trial)' : ''}`,
      quantity: 1,
      unit_price: amount,
      total: amount
    }];
    
    // Determine billing period
    const billingStart = subscriptionData.start_date || new Date().toISOString();
    const billingEnd = subscriptionData.end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    
    // Create invoice data
    const invoiceData = {
      user_email: subscriptionData.user_email,
      user_name: targetUser.full_name,
      payment_id: paymentData?.id || null,
      invoice_number: invoiceNumber,
      amount: totalAmount,
      currency: planData.currency || 'inr',
      tax: tax,
      status: isTrial ? 'issued' : (paymentData ? 'paid' : 'issued'),
      due_date: isTrial ? null : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: items,
      description: `${planData.name} subscription${isTrial ? ' (Trial)' : ''}`,
      plan_name: planData.name,
      billing_period: `${new Date(billingStart).toLocaleDateString()} - ${new Date(billingEnd).toLocaleDateString()}`,
      payment_method: paymentData?.payment_method || 'Admin Verified',
      transaction_id: paymentData?.transaction_id || invoiceNumber
    };
    
    // Generate PDF
    console.log('Generating PDF...');
    const pdfBlob = await generateInvoicePDF(invoiceData);
    console.log('PDF generated, size:', pdfBlob.size);
    
    if (!pdfBlob || pdfBlob.size === 0) {
      throw new Error('Failed to generate PDF blob');
    }
    
    // Convert blob to File object with proper name
    const pdfFile = new File([pdfBlob], `invoice-${invoiceNumber}.pdf`, { type: 'application/pdf' });
    console.log('Uploading PDF file...');
    
    // Upload PDF to storage
    const uploadResult = await base44.integrations.Core.UploadFile({ file: pdfFile });
    console.log('PDF uploaded, URL:', uploadResult.file_url);
    
    if (!uploadResult || !uploadResult.file_url) {
      throw new Error('Failed to upload PDF - no URL returned');
    }
    
    const pdfUrl = uploadResult.file_url;
    
    // Add PDF URL to invoice data
    invoiceData.pdf_url = pdfUrl;
    
    // Save invoice to database
    const savedInvoice = await base44.entities.Invoice.create(invoiceData);
    
    console.log('Invoice saved, sending email to:', targetUser.email);
    
    // Send email with invoice
    await base44.integrations.Core.SendEmail({
      from_name: 'CineTracker Billing',
      to: targetUser.email,
      subject: isTrial 
        ? `Welcome to CineTracker ${planData.name} Trial!` 
        : `Your CineTracker Invoice - ${invoiceNumber}`,
      body: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 650px; margin: 0 auto; background-color: #f9fafb;">
          <!-- Logo & Header -->
          <div style="background: linear-gradient(135deg, #8b5cf6 0%, #10b981 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <div style="font-size: 42px; margin-bottom: 8px;">🎬</div>
            <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">CineTracker</h1>
            <p style="color: rgba(255,255,255,0.95); margin: 12px 0 0 0; font-size: 16px;">${isTrial ? '✨ Welcome to Your Free Trial!' : '✅ Payment Successful'}</p>
          </div>
          
          <div style="background-color: white; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
            <!-- Greeting -->
            <h2 style="color: #1f2937; margin-top: 0; font-size: 22px; font-weight: 600;">Hello ${targetUser.full_name || subscriptionData.user_email}! 👋</h2>
            
            ${isTrial ? `
              <p style="color: #4b5563; line-height: 1.8; font-size: 15px;">
                🎉 Welcome to your <strong style="color: #8b5cf6;">${planData.trial_days || 30}-day free trial</strong> of CineTracker ${planData.name}!
              </p>
              <p style="color: #4b5563; line-height: 1.8; font-size: 15px;">
                Your trial includes all premium features. Start tracking your favorite movies, series, and books today!
              </p>
            ` : `
              <p style="color: #10b981; font-size: 16px; font-weight: 600; margin-bottom: 16px;">✓ Payment confirmed! Your subscription is now active.</p>
              <p style="color: #4b5563; line-height: 1.8; font-size: 15px;">
                Thank you for choosing <strong style="color: #8b5cf6;">${planData.name}</strong>. Your subscription has been successfully activated and you now have full access to all features.
              </p>
            `}
            
            <!-- Invoice Details Card -->
            <div style="background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); padding: 24px; border-radius: 10px; margin: 24px 0; border: 1px solid #d1d5db;">
              <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 18px; font-weight: 700; display: flex; align-items: center;">
                📄 Invoice Details
              </h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Invoice Number:</td>
                  <td style="padding: 10px 0; color: #1f2937; font-weight: 600; text-align: right; font-family: monospace;">${invoiceNumber}</td>
                </tr>
                <tr style="border-top: 1px solid #d1d5db;">
                  <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Invoice Date:</td>
                  <td style="padding: 10px 0; color: #1f2937; text-align: right;">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                </tr>
                <tr style="border-top: 1px solid #d1d5db;">
                  <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Customer:</td>
                  <td style="padding: 10px 0; color: #1f2937; text-align: right;">${targetUser.full_name}<br/><span style="font-size: 12px; color: #6b7280;">${subscriptionData.user_email}</span></td>
                </tr>
                <tr style="border-top: 1px solid #d1d5db;">
                  <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Plan Name:</td>
                  <td style="padding: 10px 0; color: #8b5cf6; font-weight: 600; text-align: right;">${planData.name}</td>
                </tr>
                <tr style="border-top: 1px solid #d1d5db;">
                  <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Billing Period:</td>
                  <td style="padding: 10px 0; color: #1f2937; text-align: right;">${new Date(subscriptionData.start_date || Date.now()).toLocaleDateString()} - ${new Date(subscriptionData.end_date || Date.now()).toLocaleDateString()}</td>
                </tr>
                <tr style="border-top: 1px solid #d1d5db;">
                  <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Payment Method:</td>
                  <td style="padding: 10px 0; color: #1f2937; text-align: right;">${paymentData?.payment_method || 'Manual / UPI'}</td>
                </tr>
                ${paymentData?.transaction_id ? `
                <tr style="border-top: 1px solid #d1d5db;">
                  <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Transaction ID:</td>
                  <td style="padding: 10px 0; color: #1f2937; text-align: right; font-family: monospace; font-size: 12px;">${paymentData.transaction_id}</td>
                </tr>
                ` : ''}
                <tr style="border-top: 1px solid #d1d5db;">
                  <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Payment Status:</td>
                  <td style="padding: 10px 0; text-align: right;">
                    <span style="background: ${isTrial || paymentData ? '#10b981' : '#f59e0b'}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">
                      ${isTrial ? 'TRIAL' : (paymentData ? 'PAID ✓' : 'PENDING')}
                    </span>
                  </td>
                </tr>
                <tr style="border-top: 2px solid #8b5cf6;">
                  <td style="padding: 16px 0 0 0; color: #1f2937; font-weight: 700; font-size: 18px;">Total Amount:</td>
                  <td style="padding: 16px 0 0 0; color: #8b5cf6; font-weight: 700; font-size: 22px; text-align: right;">
                    ${isTrial ? '₹0 (FREE)' : `${(invoiceData.currency || 'INR').toUpperCase()} ${(totalAmount / 100).toFixed(2)}`}
                  </td>
                </tr>
              </table>
            </div>
            
            <!-- Subscription Status -->
            ${!isTrial ? `
            <div style="background-color: #ecfdf5; border: 2px solid #10b981; padding: 20px; border-radius: 10px; margin: 24px 0;">
              <h3 style="color: #065f46; margin: 0 0 12px 0; font-size: 16px; font-weight: 700;">🎉 Subscription Active</h3>
              <p style="color: #047857; margin: 0; line-height: 1.6; font-size: 14px;">
                Your <strong>${planData.name}</strong> subscription is now active and ready to use. Enjoy unlimited access to all features!
              </p>
            </div>
            ` : ''}

            <p style="color: #4b5563; line-height: 1.7; margin-top: 24px; font-size: 14px;">
              📎 Your invoice is attached to this email as a PDF. You can also download it below or access it anytime from your account dashboard.
            </p>
            
            ${isTrial ? `
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                <p style="color: #92400e; margin: 0; line-height: 1.6;">
                  <strong>Note:</strong> Your trial will automatically end after ${planData.trial_days || 30} days. 
                  No charges will be made unless you choose to upgrade.
                </p>
              </div>
            ` : ''}
            
            <!-- Payment Reference (if not trial) -->
            ${!isTrial && paymentData?.transaction_id ? `
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;">
              <p style="color: #92400e; margin: 0; font-size: 13px; line-height: 1.6;">
                <strong>Payment Reference:</strong> ${paymentData.transaction_id}
              </p>
            </div>
            ` : ''}

            <!-- Download Button -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="${pdfUrl}" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #10b981 100%); color: white; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);">
                📥 Download Invoice PDF
              </a>
            </div>
            
            <!-- Support Section -->
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-top: 32px; border: 1px solid #e5e7eb;">
              <h4 style="color: #1f2937; margin: 0 0 12px 0; font-size: 15px; font-weight: 600;">Need Help?</h4>
              <p style="color: #6b7280; margin: 0; font-size: 14px; line-height: 1.6;">
                If you have any questions or concerns, our support team is here to help:<br/>
                📧 Email: <a href="mailto:support@cinetracker.com" style="color: #8b5cf6; text-decoration: none; font-weight: 500;">support@cinetracker.com</a><br/>
                🌐 Visit: <a href="https://cinetracker.com/support" style="color: #8b5cf6; text-decoration: none; font-weight: 500;">cinetracker.com/support</a>
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="text-align: center; padding: 24px 20px; background-color: #18181b; border-radius: 0 0 12px 12px;">
            <p style="color: #a1a1aa; font-size: 11px; margin: 0 0 8px 0;">
              This is an automated email. Please do not reply to this message.
            </p>
            <p style="color: #71717a; font-size: 12px; margin: 8px 0;">
              <a href="https://cinetracker.com/terms" style="color: #8b5cf6; text-decoration: none; margin: 0 8px;">Terms</a> | 
              <a href="https://cinetracker.com/privacy" style="color: #8b5cf6; text-decoration: none; margin: 0 8px;">Privacy</a> | 
              <a href="https://cinetracker.com/disclaimer" style="color: #8b5cf6; text-decoration: none; margin: 0 8px;">Disclaimer</a>
            </p>
            <p style="color: #52525b; font-size: 11px; margin: 12px 0 0 0;">
              © ${new Date().getFullYear()} CineTracker. All rights reserved.
            </p>
          </div>
        </div>
      `
    });
    
    console.log('Invoice email sent successfully');
    return savedInvoice;
  } catch (error) {
    console.error('Failed to create and send invoice:', error);
    console.error('Error details:', error.message, error.stack);
    throw error;
  }
}