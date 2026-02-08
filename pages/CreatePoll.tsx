import React, { useState } from 'react';
import { NavigationProps } from '../types';
import { savePoll } from '../services/storage';
import { Button } from '../components/Button';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { toast } from '../components/Toast';

interface CreatePollProps extends NavigationProps {}

export const CreatePoll: React.FC<CreatePollProps> = ({ setView }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddOption = () => setOptions([...options, '']);
  const handleOptionChange = (index: number, value: string) => {
    const newOpts = [...options];
    newOpts[index] = value;
    setOptions(newOpts);
  };
  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleAddTag = (e?: React.KeyboardEvent) => {
    if (e && e.key !== 'Enter') return;
    e?.preventDefault();
    const val = tagInput.trim();
    if (val && !tags.includes(val)) {
        if (tags.length >= 5) { toast("Max 5 tags allowed", "error"); return; }
        setTags([...tags, val]);
        setTagInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOptions = options.filter(o => o.trim() !== '');
    if (!title || cleanOptions.length < 2) {
      toast("Please provide a title and at least 2 options.", "error");
      return;
    }

    setIsSubmitting(true);
    const success = await savePoll({ title, description, tags }, cleanOptions);
    setIsSubmitting(false);

    if (success) {
      toast("Poll submitted for moderation! 🚀", "success");
      setView('HOME');
    } else {
      toast("Error saving poll. Try again.", "error");
    }
  };

  return (
    <div className="max-w-xl mx-auto animate-fade-in pb-20">
      <button onClick={() => setView('HOME')} className="flex items-center text-slate-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft size={20} className="mr-2" /> Cancel
      </button>

      <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 md:p-8 shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-2">Create New Poll</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Topic / Question</label>
            <div className="flex gap-2">
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Best Pizza Toppings" className="flex-grow bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Options</label>
            <div className="space-y-3">
              {options.map((opt, idx) => (
                <div key={idx} className="flex gap-2">
                  <input type="text" value={opt} onChange={(e) => handleOptionChange(idx, e.target.value)} placeholder={`Option ${idx + 1}`} className="flex-grow bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white" />
                  {options.length > 2 && <button type="button" onClick={() => handleRemoveOption(idx)} className="text-slate-500 hover:text-red-400 p-2"><Trash2 size={18} /></button>}
                </div>
              ))}
            </div>
            <button type="button" onClick={handleAddOption} className="mt-3 text-sm text-indigo-400 flex items-center"><Plus size={16} /> Add Option</button>
          </div>
          <Button type="submit" className="w-full py-3" isLoading={isSubmitting}>Submit for Review</Button>
        </form>
      </div>
    </div>
  );
};