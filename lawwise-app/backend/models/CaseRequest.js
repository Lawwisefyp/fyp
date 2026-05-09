const mongoose = require('mongoose');

const CaseRequestSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  caseId: { type: String, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['civil', 'criminal', 'family', 'corporate', 'labor', 'intellectual'],
    default: 'civil' 
  },
  urgency: { 
    type: String, 
    enum: ['low', 'medium', 'high'],
    default: 'medium' 
  },
  opponentDetails: String,
  location: String,
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  clientInfo: {
    name: String,
    email: String,
    phone: String
  },
  evidence: [
    {
      filename: String,
      originalName: String,
      filepath: String,
      uploadDate: { type: Date, default: Date.now },
      fileSize: Number,
      fileType: String
    }
  ],
  status: {
    type: String,
    enum: ['pending_analysis', 'analyzed', 'sent_to_lawyer', 'pending_review', 'accepted', 'rejected'],
    default: 'pending_analysis'
  },
  aiAnalysis: {
    summary: String,
    complexity: String,
    predictedCategory: String,
    predictedPriority: String,
    keywords: [String],
    recommendedAction: String,
    analyzedAt: Date
  },
  assignedLawyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lawyer' },
  budget: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CaseRequest', CaseRequestSchema);
