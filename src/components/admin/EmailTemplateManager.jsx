import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Mail, Plus, Edit2, Trash2, Eye, Code, Loader2, Copy } from "lucide-react";
import { toast } from "sonner";
import { useAction } from '../feedback/useAction';

export default function EmailTemplateManager() {
  const queryClient = useQueryClient();
  const { executeAction } = useAction();
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    html_body: '',
    variables: [],
    category: 'custom',
    preview_text: '',
    is_active: true
  });
  const [variableInput, setVariableInput] = useState('');

  // Fetch templates
  const { data: templates = [] } = useQuery({
    queryKey: ['email-templates'],
    queryFn: () => base44.entities.EmailTemplate.list('-created_date')
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.EmailTemplate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success('Template created!');
      handleCloseForm();
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.EmailTemplate.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success('Template updated!');
      handleCloseForm();
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.EmailTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success('Template deleted!');
    }
  });

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      html_body: template.html_body,
      variables: template.variables || [],
      category: template.category,
      preview_text: template.preview_text || '',
      is_active: template.is_active !== false
    });
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTemplate(null);
    setFormData({
      name: '',
      subject: '',
      html_body: '',
      variables: [],
      category: 'custom',
      preview_text: '',
      is_active: true
    });
    setVariableInput('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const actionName = editingTemplate ? 'Updating Template' : 'Creating Template';
    executeAction(actionName, async () => {
      if (editingTemplate) {
        await updateMutation.mutateAsync({ id: editingTemplate.id, data: formData });
      } else {
        await createMutation.mutateAsync(formData);
      }
      handleCloseForm();
    }, {
      successTitle: editingTemplate ? 'Template Updated' : 'Template Created',
      successSubtitle: 'Email template has been saved'
    });
  };

  const handleAddVariable = () => {
    if (variableInput.trim()) {
      const variable = variableInput.trim();
      if (!formData.variables.includes(variable)) {
        setFormData({ ...formData, variables: [...formData.variables, variable] });
      }
      setVariableInput('');
    }
  };

  const handleRemoveVariable = (variable) => {
    setFormData({
      ...formData,
      variables: formData.variables.filter(v => v !== variable)
    });
  };

  const handleDuplicate = async (template) => {
    await createMutation.mutateAsync({
      ...template,
      name: `${template.name} (Copy)`,
      id: undefined,
      created_date: undefined,
      updated_date: undefined
    });
  };

  const renderPreview = (template) => {
    let html = template?.html_body || '';
    // Replace variables with sample data
    (template?.variables || []).forEach(variable => {
      const sampleData = {
        user_name: 'John Doe',
        plan_name: 'Premium Plan',
        amount: '₹999',
        date: '2026-01-05'
      };
      html = html.replace(new RegExp(`{{${variable}}}`, 'g'), sampleData[variable] || `[${variable}]`);
    });
    return html;
  };

  return (
    <div className="space-y-6">
      <Card className="bg-zinc-900/80 border-zinc-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Mail className="w-5 h-5 text-purple-400" />
                Email Templates
              </CardTitle>
              <p className="text-xs text-zinc-400 mt-2">
                Create and manage HTML email templates for notifications
              </p>
            </div>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {templates.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <Mail className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No templates yet. Create your first email template!</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {templates.map(template => (
                <Card key={template.id} className="bg-zinc-950 border-zinc-800 hover:border-zinc-700 transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-white font-medium">{template.name}</h3>
                          <span className="px-2 py-0.5 text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded">
                            {template.category}
                          </span>
                          {!template.is_active && (
                            <span className="px-2 py-0.5 text-xs bg-zinc-700 text-zinc-400 rounded">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-zinc-400 mb-2">Subject: {template.subject}</p>
                        {template.variables && template.variables.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {template.variables.map(v => (
                              <span key={v} className="px-2 py-0.5 text-xs bg-zinc-800 text-zinc-300 rounded font-mono">
                                {`{{${v}}}`}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setPreviewTemplate(template)}
                          className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDuplicate(template)}
                          className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(template)}
                          className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            executeAction('Deleting Template', async () => {
                              await deleteMutation.mutateAsync(template.id);
                            }, {
                              successTitle: 'Template Deleted',
                              successSubtitle: 'Email template has been removed'
                            });
                          }}
                          className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* How to Use Guide */}
          <Card className="bg-blue-500/10 border-blue-500/30 mt-6">
            <CardContent className="p-4">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Code className="w-4 h-4" />
                📘 How to Create Email Templates
              </h3>
              <div className="space-y-3 text-sm text-zinc-300">
                <div>
                  <p className="font-semibold text-white mb-1">Step 1: Create Template</p>
                  <p>• Click "New Template" button</p>
                  <p>• Enter template name (e.g., "Welcome Email", "Payment Reminder")</p>
                  <p>• Select category: Welcome, Subscription, Reminder, Marketing, System, or Custom</p>
                </div>
                
                <div>
                  <p className="font-semibold text-white mb-1">Step 2: Write Subject & Body</p>
                  <p>• Subject: Write email subject line (supports variables)</p>
                  <p>• HTML Body: Write your email content in HTML format</p>
                  <p>• Use standard HTML tags: &lt;h1&gt;, &lt;p&gt;, &lt;a&gt;, &lt;strong&gt;, etc.</p>
                </div>
                
                <div>
                  <p className="font-semibold text-white mb-1">Step 3: Add Variables</p>
                  <p>• Click "+ Add Variable" to add dynamic fields</p>
                  <p>• Common variables: user_name, plan_name, amount, date</p>
                  <p>• Use in template with double curly braces: <code className="bg-zinc-800 px-1 rounded">{'{{user_name}}'}</code></p>
                  <p>• Example: "Hello {'{{user_name}}'}, welcome to {'{{plan_name}}'}!"</p>
                </div>

                <div>
                  <p className="font-semibold text-white mb-1">Step 4: Preview & Save</p>
                  <p>• Click the eye icon to preview how email looks</p>
                  <p>• Variables will show sample data in preview</p>
                  <p>• Click "Create" to save template</p>
                </div>

                <div className="pt-2 border-t border-blue-500/20">
                  <p className="font-semibold text-white mb-1">💡 Tips:</p>
                  <p>• Use "Duplicate" icon to copy existing templates</p>
                  <p>• Inactive templates won't appear in notification dropdown</p>
                  <p>• Test templates before sending to all users</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Template Form Dialog */}
      <Dialog open={showForm} onOpenChange={handleCloseForm}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Edit Template' : 'New Template'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-white">Template Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-zinc-800 border-zinc-700 text-white"
                required
              />
            </div>

            <div>
              <Label className="text-white">Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue className="text-white" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  <SelectItem value="welcome" className="text-white">Welcome</SelectItem>
                  <SelectItem value="subscription" className="text-white">Subscription</SelectItem>
                  <SelectItem value="reminder" className="text-white">Reminder</SelectItem>
                  <SelectItem value="marketing" className="text-white">Marketing</SelectItem>
                  <SelectItem value="system" className="text-white">System</SelectItem>
                  <SelectItem value="custom" className="text-white">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-white">Subject Line</Label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="bg-zinc-800 border-zinc-700 text-white"
                required
              />
            </div>

            <div>
              <Label className="text-white">Preview Text (optional)</Label>
              <Input
                value={formData.preview_text}
                onChange={(e) => setFormData({ ...formData, preview_text: e.target.value })}
                className="bg-zinc-800 border-zinc-700 text-white"
                placeholder="This shows in inbox preview..."
              />
            </div>

            <div>
              <Label className="text-white flex items-center gap-2">
                <Code className="w-4 h-4" />
                HTML Body
              </Label>
              <Textarea
                value={formData.html_body}
                onChange={(e) => setFormData({ ...formData, html_body: e.target.value })}
                className="bg-zinc-800 border-zinc-700 text-white font-mono text-sm"
                rows={12}
                required
                placeholder="<html>&#10;  <body>&#10;    <h1>Hello {{user_name}}!</h1>&#10;    <p>Welcome to our platform.</p>&#10;  </body>&#10;</html>"
              />
            </div>

            <div>
              <Label className="text-white">Variables</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={variableInput}
                  onChange={(e) => setVariableInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddVariable())}
                  className="bg-zinc-800 border-zinc-700 text-white flex-1"
                  placeholder="e.g., user_name, plan_name, amount"
                />
                <Button type="button" onClick={handleAddVariable} variant="outline" className="border-zinc-700">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.variables.map(v => (
                  <span key={v} className="px-2 py-1 bg-zinc-800 text-zinc-300 rounded flex items-center gap-2 text-sm">
                    <code>{`{{${v}}}`}</code>
                    <button type="button" onClick={() => handleRemoveVariable(v)} className="text-red-400 hover:text-red-300">
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" onClick={handleCloseForm} variant="outline" className="flex-1 border-zinc-700">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500">
                {createMutation.isPending || updateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  editingTemplate ? 'Update' : 'Create'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview: {previewTemplate?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="bg-zinc-950 p-3 rounded border border-zinc-800">
              <p className="text-xs text-zinc-400">Subject:</p>
              <p className="text-white">{previewTemplate?.subject}</p>
            </div>
            <div className="bg-white p-6 rounded">
              <div dangerouslySetInnerHTML={{ __html: renderPreview(previewTemplate || {}) }} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}