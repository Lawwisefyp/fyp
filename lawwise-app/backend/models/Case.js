const mongoose = require('mongoose');

const CaseSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: String,
  client: String,
  clientEmail: String,
  clientPhone: String,
  opposingParty: String,
  lawyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lawyer' },
  court: String,
  judge: String,
  jurisdiction: String,
  caseType: {
    type: String,
    enum: ['civil', 'criminal', 'family', 'corporate', 'labor', 'intellectual'],
    default: 'civil'
  },
  filingDate: String,
  nextHearingDate: String,
  description: String,
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  currentStage: { type: Number, default: 0 },
  completedStages: [Number],
  stageHistory: [
    {
      stageId: Number,
      completedDate: String,
      actualDuration: Number
    }
  ],
  documents: [
    {
      filename: String,
      originalName: String,
      filepath: String,
      uploadDate: { type: Date, default: Date.now },
      fileSize: Number,
      documentType: String
    }
  ],
  status: {
    type: String,
    enum: ['pending', 'active', 'completed'],
    default: 'pending'
  },
  deadlines: [
    {
      title: String,
      dueDate: String,
      description: String,
      isCompleted: { type: Boolean, default: false },
      documents: [
        {
          filename: String,
          originalName: String,
          filepath: String
        }
      ]
    }
  ],
  createdDate: { type: Date, default: Date.now },
  lastUpdateDate: String,
  budget: { type: Number, default: 0 },
  consultation: {
    requested: { type: Boolean, default: false },
    date: String,
    time: String
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});


// ---------------------------------------------------------------------------
// Case model exported
// ---------------------------------------------------------------------------
module.exports = mongoose.models.Case || mongoose.model('Case', CaseSchema);
